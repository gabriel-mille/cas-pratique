import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { inject } from 'vitest';
import { TEST_JWT_SECRET } from '../shared/testing/integration-database';
import { configureHttp } from './configure-http';

/**
 * E2E (D29) : la vraie application (guards, filtre, pipes, cookies) sur PostgreSQL 16.
 * On y teste ce qui n'existe qu'en HTTP ; les règles métier sont couvertes par les `.feature`.
 */
const ORIGIN = 'http://localhost:4200';
const PASSWORD = 'correct horse battery staple';

let app: INestApplication;

beforeAll(async () => {
  const database = inject('database');
  // `ConfigModule.forRoot` lit l'environnement à l'import d'AppModule : il est fixé avant.
  Object.assign(process.env, {
    DATABASE_HOST: database.host,
    DATABASE_PORT: String(database.port),
    DATABASE_USER: database.username,
    DATABASE_PASSWORD: database.password,
    DATABASE_NAME: database.database,
    JWT_SECRET: TEST_JWT_SECRET,
    APP_ORIGIN: ORIGIN,
    // Un client HTTP ne renvoie pas un cookie Secure en http : préfixe __Host- et Secure sont testés dans session-cookies.spec.
    COOKIE_SECURE: 'false',
    AUTH_RATE_LIMIT_PER_IP: '1000',
  });
  const { AppModule } = await import('./app.module');
  const { Test } = await import('@nestjs/testing');
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = module.createNestApplication();
  configureHttp(app);
  await app.init();
});

afterAll(async () => {
  await app?.close();
});

const uniqueEmail = () => `${randomUUID()}@exemple.fr`;

/** Inscrit une organisation et rend un agent qui garde le cookie de session de son administrateur. */
async function registeredAdmin(email = uniqueEmail()) {
  const agent = request.agent(app.getHttpServer());
  await agent
    .post('/api/auth/register')
    .set('Origin', ORIGIN)
    .send({ organizationName: 'Clinique', name: 'Alice', email, password: PASSWORD })
    .expect(201);
  return agent;
}

async function createPlan(agent: request.Agent, title = 'Plan hygiène') {
  const response = await agent.post('/api/action-plans').set('Origin', ORIGIN).send({ title }).expect(201);
  return response.body.id as string;
}

async function createAction(agent: request.Agent, planId: string) {
  const response = await agent
    .post(`/api/action-plans/${planId}/actions`)
    .set('Origin', ORIGIN)
    .send({ title: 'Former les équipes' })
    .expect(201);
  return response;
}

describe('session (D13, D16)', () => {
  it('pose un cookie de session HttpOnly, SameSite=Strict', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', ORIGIN)
      .send({ organizationName: 'Clinique', name: 'Alice', email: uniqueEmail(), password: PASSWORD })
      .expect(201);
    const cookie = String(response.headers['set-cookie']);
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\//);
  });

  it('refuse une route protégée sans cookie (401, RFC 9457)', async () => {
    const response = await request(app.getHttpServer()).get('/api/action-plans').expect(401);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({ type: '/problems/authentication-failed', status: 401 });
  });

  it('refuse un cookie signé avec un autre secret', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/action-plans')
      .set('Cookie', 'session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.invalide');
    expect(response.status).toBe(401);
  });

  it('révoque la session à la déconnexion, même si le cookie est rejoué', async () => {
    const agent = await registeredAdmin();
    const me = await agent.get('/api/me').expect(200);
    const replayed = String(me.headers['set-cookie']).split(';')[0];
    await agent.post('/api/auth/logout').set('Origin', ORIGIN).expect(204);

    const response = await request(app.getHttpServer()).get('/api/me').set('Cookie', replayed);
    expect(response.status).toBe(401);
  });

  it('rend le profil courant après connexion', async () => {
    const email = uniqueEmail();
    await registeredAdmin(email);
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/auth/login').set('Origin', ORIGIN).send({ email, password: PASSWORD }).expect(200);

    const me = await agent.get('/api/me').expect(200);
    expect(me.body).toMatchObject({ email, role: 'ADMIN', mustChangePassword: false });
  });

  it('donne le même message pour un compte inconnu et un mauvais mot de passe', async () => {
    const email = uniqueEmail();
    await registeredAdmin(email);
    const unknown = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: uniqueEmail(), password: PASSWORD })
      .expect(401);
    const wrong = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email, password: 'mauvais mot de passe long' })
      .expect(401);
    expect(wrong.body.detail).toBe(unknown.body.detail);
  });
});

describe('mot de passe temporaire (D8)', () => {
  it('bloque tout sauf le profil et le changement de mot de passe, puis débloque', async () => {
    const admin = await registeredAdmin();
    const email = uniqueEmail();
    const added = await admin
      .post('/api/members')
      .set('Origin', ORIGIN)
      .send({ email, name: 'Bob', role: 'MANAGER' })
      .expect(201);

    const bob = request.agent(app.getHttpServer());
    await bob
      .post('/api/auth/login')
      .set('Origin', ORIGIN)
      .send({ email, password: added.body.temporaryPassword })
      .expect(200, { mustChangePassword: true });
    const blocked = await bob.get('/api/action-plans').expect(403);
    expect(blocked.body.code).toBe('password-change-required');
    await bob.get('/api/me').expect(200);

    await bob
      .post('/api/auth/password')
      .set('Origin', ORIGIN)
      .send({ currentPassword: added.body.temporaryPassword, newPassword: 'un nouveau mot de passe solide' })
      .expect(204);
    await bob.get('/api/action-plans').expect(200);
  });
});

describe('protection CSRF par Origin (D25)', () => {
  it('refuse une écriture sans en-tête Origin', async () => {
    const agent = await registeredAdmin();
    const response = await agent.post('/api/action-plans').send({ title: 'x' }).expect(403);
    expect(response.body.code).toBe('origin-not-allowed');
  });

  it('refuse une écriture depuis une autre origine', async () => {
    const agent = await registeredAdmin();
    const response = await agent.post('/api/action-plans').set('Origin', 'https://evil.example').send({ title: 'x' });
    expect(response.status).toBe(403);
  });

  it('laisse passer les lectures sans Origin', async () => {
    const agent = await registeredAdmin();
    const response = await agent.get('/api/action-plans');
    expect(response.status).toBe(200);
  });
});

describe('isolation entre organisations (D12)', () => {
  it('rend 404 pour un plan et une action d’une autre organisation', async () => {
    const owner = await registeredAdmin();
    const planId = await createPlan(owner);
    const actionId = (await createAction(owner, planId)).body.id;
    const other = await registeredAdmin();

    await other.get(`/api/action-plans/${planId}`).expect(404);
    await other.get(`/api/actions/${actionId}`).expect(404);
    await other.put(`/api/action-plans/${planId}`).set('Origin', ORIGIN).set('If-Match', '"1"').send({ title: 'x' }).expect(404);
    const plans = await other.get('/api/action-plans').expect(200);
    expect(plans.body).toEqual([]);
  });
});

describe('versions (D14 : ETag / If-Match)', () => {
  it('rend la version en ETag et la Location de la ressource créée', async () => {
    const agent = await registeredAdmin();
    const planId = await createPlan(agent);
    const created = await createAction(agent, planId);
    expect(created.headers['etag']).toBe('"1"');
    expect(created.headers['location']).toBe(`/api/actions/${created.body.id}`);
    expect(created.body).toMatchObject({ status: 'TODO', history: [] });
  });

  it('exige If-Match (428) et refuse une version périmée (412)', async () => {
    const agent = await registeredAdmin();
    const actionId = (await createAction(agent, await createPlan(agent))).body.id;

    const missing = await agent.put(`/api/actions/${actionId}`).set('Origin', ORIGIN).send({ title: 'x' }).expect(428);
    expect(missing.body.code).toBe('precondition-required');
    await agent.put(`/api/actions/${actionId}`).set('Origin', ORIGIN).set('If-Match', '*').send({ title: 'x' }).expect(428);

    const updated = await agent
      .put(`/api/actions/${actionId}`)
      .set('Origin', ORIGIN)
      .set('If-Match', '"1"')
      .send({ title: 'Titre modifié' })
      .expect(200);
    expect(updated.headers['etag']).toBe('"2"');

    const stale = await agent
      .put(`/api/actions/${actionId}`)
      .set('Origin', ORIGIN)
      .set('If-Match', '"1"')
      .send({ title: 'Écrase ?' })
      .expect(412);
    expect(stale.body).toMatchObject({ type: '/problems/stale-version', code: 'stale-version' });
  });

  it('suit le cycle de vie complet avec historique et motif de refus', async () => {
    const agent = await registeredAdmin();
    const actionId = (await createAction(agent, await createPlan(agent))).body.id;
    const transition = (to: string, version: number) =>
      agent
        .post(`/api/actions/${actionId}/status`)
        .set('Origin', ORIGIN)
        .set('If-Match', `"${version}"`)
        .send({ to });

    await transition('IN_PROGRESS', 1).expect(200);
    await transition('TO_VALIDATE', 2).expect(200);
    await agent
      .post(`/api/actions/${actionId}/rejection`)
      .set('Origin', ORIGIN)
      .set('If-Match', '"3"')
      .send({ reason: 'Preuves manquantes' })
      .expect(200);
    const invalid = await transition('DONE', 4).expect(409);
    expect(invalid.body.code).toBe('invalid-transition');

    const detail = await agent.get(`/api/actions/${actionId}`).expect(200);
    expect(detail.body.status).toBe('IN_PROGRESS');
    expect(detail.body.history).toHaveLength(3);
    expect(detail.body.history[2]).toMatchObject({
      from: 'TO_VALIDATE',
      to: 'IN_PROGRESS',
      reason: 'Preuves manquantes',
      author: { name: 'Alice' },
    });
  });

  it('supprime une action (204) qui disparaît ensuite des lectures', async () => {
    const agent = await registeredAdmin();
    const planId = await createPlan(agent);
    const actionId = (await createAction(agent, planId)).body.id;

    await agent.delete(`/api/actions/${actionId}`).set('Origin', ORIGIN).set('If-Match', '"1"').expect(204);
    await agent.get(`/api/actions/${actionId}`).expect(404);
    const actions = await agent.get(`/api/action-plans/${planId}/actions`).expect(200);
    expect(actions.body).toEqual([]);
  });
});

describe('validation des entrées et format des erreurs (RFC 9457)', () => {
  it('refuse un champ inconnu', async () => {
    const agent = await registeredAdmin();
    const response = await agent.post('/api/action-plans').set('Origin', ORIGIN).send({ title: 'x', owner: 'y' }).expect(400);
    expect(response.body).toMatchObject({ code: 'validation-failed', errors: ['property owner should not exist'] });
  });

  it('refuse un JSON mal formé au même format', async () => {
    const agent = await registeredAdmin();
    const response = await agent
      .post('/api/action-plans')
      .set('Origin', ORIGIN)
      .set('Content-Type', 'application/json')
      .send('{"title":')
      .expect(400);
    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body.code).toBe('validation-failed');
  });

  it('refuse un identifiant qui n’est pas un UUID', async () => {
    const agent = await registeredAdmin();
    const response = await agent.get('/api/actions/pas-un-uuid');
    expect(response.status).toBe(400);
  });

  it('pose les en-têtes de sécurité de helmet', async () => {
    const response = await request(app.getHttpServer()).get('/api/action-plans');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });
});

describe('limitation des tentatives de connexion (D17)', () => {
  it('rend 429 après 10 tentatives sur le même compte', async () => {
    const email = uniqueEmail();
    await registeredAdmin(email);
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', ORIGIN)
        .send({ email, password: 'mauvais mot de passe long' });

    for (let i = 0; i < 10; i++) {
      await attempt().expect(401);
    }
    const throttled = await attempt().expect(429);
    expect(throttled.body.code).toBe('too-many-requests');
    expect(throttled.headers['retry-after-account']).toBeDefined();
  });
});
