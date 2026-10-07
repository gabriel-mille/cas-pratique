import { http, HttpResponse, type JsonBodyType } from 'msw';
import type {
  ActionDetail,
  ActionPlan,
  ActionStatus,
  AddMemberRequest,
  ChangePasswordRequest,
  CurrentMember,
  LoginRequest,
  Member,
  RegisterRequest,
  Role,
  TitledRequest,
} from '@/shared/api';

/**
 * Fausse API en mémoire pour les tests du front (D26) : elle suit le contrat OpenAPI et les règles
 * principales du back (session, rôles, transitions, If-Match, périmètre de l'organisation).
 * Le back reste l'autorité : ses propres `.feature` vérifient les règles en détail.
 */

interface FakeUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  mustChangePassword: boolean;
  removed: boolean;
}
interface FakePlan {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  version: number;
}
interface FakeChange {
  from: ActionStatus;
  to: ActionStatus;
  at: string;
  reason: string | null;
  authorId: string;
}
interface FakeAction extends FakePlan {
  planId: string;
  status: ActionStatus;
  history: FakeChange[];
  deleted: { by: string; at: string } | null;
}

const NOW = '2026-10-07T10:00:00.000Z';
const TRANSITIONS: Record<ActionStatus, readonly ActionStatus[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['TO_VALIDATE'],
  TO_VALIDATE: ['DONE'],
  DONE: [],
};

const state = {
  organizations: new Map<string, string>(),
  users: [] as FakeUser[],
  plans: [] as FakePlan[],
  actions: [] as FakeAction[],
  sessionUserId: null as string | null,
  sequence: 0,
};

const nextId = (prefix: string) => `${prefix}-${++state.sequence}`;

export function resetFakeApi() {
  state.organizations.clear();
  state.users = [];
  state.plans = [];
  state.actions = [];
  state.sessionUserId = null;
  state.sequence = 0;
}

// --- Jeu de données des tests ---------------------------------------------------------------

export const DEFAULT_PASSWORD = 'un mot de passe assez long';

export function seedOrganization(name: string): string {
  const id = nextId('org');
  state.organizations.set(id, name);
  return id;
}

export function seedMember(
  organizationId: string,
  name: string,
  role: Role,
  options: {
    email?: string;
    password?: string;
    mustChangePassword?: boolean;
  } = {}
): string {
  const id = nextId('user');
  state.users.push({
    id,
    organizationId,
    name,
    email: options.email ?? `${name.toLowerCase()}@example.test`,
    password: options.password ?? DEFAULT_PASSWORD,
    role,
    mustChangePassword: options.mustChangePassword ?? false,
    removed: false,
  });
  return id;
}

export function seedPlan(
  organizationId: string,
  title: string,
  description: string | null = null
): string {
  const id = nextId('plan');
  state.plans.push({ id, organizationId, title, description, version: 1 });
  return id;
}

export function seedAction(
  planId: string,
  title: string,
  options: { description?: string | null; status?: ActionStatus } = {}
): string {
  const plan = state.plans.find((candidate) => candidate.id === planId);
  if (!plan) throw new Error(`Plan inconnu : ${planId}`);
  const id = nextId('action');
  state.actions.push({
    id,
    organizationId: plan.organizationId,
    planId,
    title,
    description: options.description ?? null,
    status: options.status ?? 'TODO',
    version: 1,
    history: [],
    deleted: null,
  });
  return id;
}

/** Ouvre une session comme si le membre s'était connecté (cookie côté vrai back). */
export function signIn(userId: string) {
  state.sessionUserId = userId;
}

/** Changement fait par un autre membre, hors de l'écran testé (conflit de version, D14). */
export function changeStatusAs(
  userId: string,
  actionId: string,
  to: ActionStatus
) {
  const action = findAction(actionId);
  action.history.push({
    from: action.status,
    to,
    at: NOW,
    reason: null,
    authorId: userId,
  });
  action.status = to;
  action.version += 1;
}

const findAction = (actionId: string) => {
  const action = state.actions.find((candidate) => candidate.id === actionId);
  if (!action) throw new Error(`Action inconnue : ${actionId}`);
  return action;
};

/** Lecture brute pour vérifier ce que l'écran ne montre pas (trace de suppression, D7). */
export const storedAction = findAction;
export const storedMember = (userId: string) =>
  state.users.find((user) => user.id === userId);
export const organizationNamed = (name: string) =>
  [...state.organizations].find(
    ([, organizationName]) => organizationName === name
  )?.[0];
export const memberByEmail = (email: string) =>
  state.users.find((user) => user.email === email.toLowerCase());

// --- Réponses ---------------------------------------------------------------------------------

function problem(status: number, code: string, detail: string) {
  return HttpResponse.json(
    { type: `/problems/${code}`, title: code, status, detail, code },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  );
}
const ok = (body: JsonBodyType, status = 200) =>
  HttpResponse.json(body, { status });
const noContent = () => new HttpResponse(null, { status: 204 });
const forbidden = () => problem(403, 'forbidden', 'Opération interdite');
const notFound = () => problem(404, 'not-found', 'Introuvable');
const invalid = (detail: string) => problem(400, 'validation-failed', detail);

class Rejection extends Error {
  constructor(readonly response: Response) {
    super('rejection');
  }
}
const reject = (response: Response): never => {
  throw new Rejection(response);
};

function currentUser({ allowTemporaryPassword = false } = {}): FakeUser {
  const user = state.users.find(
    (candidate) => candidate.id === state.sessionUserId
  );
  if (!user || user.removed)
    return reject(
      problem(401, 'authentication-failed', 'Session absente ou expirée')
    );
  if (user.mustChangePassword && !allowTemporaryPassword) {
    return reject(
      problem(
        403,
        'password-change-required',
        'Changez votre mot de passe temporaire'
      )
    );
  }
  return user;
}
const requireAdmin = (user: FakeUser) =>
  user.role === 'ADMIN' ? user : reject(forbidden());

function ifMatch(request: Request, version: number) {
  const header = request.headers.get('If-Match');
  if (!header)
    reject(problem(428, 'precondition-required', 'En-tête If-Match requis'));
  if (header !== `"${version}"`)
    reject(problem(412, 'stale-version', 'Version périmée'));
}

function titled(body: TitledRequest): {
  title: string;
  description: string | null;
} {
  const title = body.title.trim();
  if (!title) reject(invalid('Le titre est obligatoire'));
  return { title, description: body.description?.trim() || null };
}

function checkNewPassword(password: string) {
  if (password.length < 15)
    reject(invalid('Le mot de passe fait moins de 15 caractères'));
}

const scopedPlan = (user: FakeUser, planId: string) =>
  state.plans.find(
    (plan) => plan.id === planId && plan.organizationId === user.organizationId
  ) ?? reject(notFound());
const scopedAction = (user: FakeUser, actionId: string) =>
  state.actions.find(
    (action) =>
      action.id === actionId &&
      action.organizationId === user.organizationId &&
      !action.deleted
  ) ?? reject(notFound());

const toPlan = ({ id, title, description, version }: FakePlan): ActionPlan => ({
  id,
  title,
  description,
  version,
});
const toAction = ({
  id,
  title,
  description,
  version,
  planId,
  status,
}: FakeAction) => ({
  id,
  title,
  description,
  version,
  planId,
  status,
});
const toDetail = (action: FakeAction): ActionDetail => ({
  ...toAction(action),
  history: action.history.map(({ from, to, at, reason, authorId }) => ({
    from,
    to,
    at,
    reason,
    author: {
      userId: authorId,
      name: state.users.find((user) => user.id === authorId)?.name ?? null,
    },
  })),
});
const toMember = ({ id, name, email, role }: FakeUser): Member => ({
  userId: id,
  name,
  email,
  role,
});
const toCurrentMember = (user: FakeUser): CurrentMember => ({
  ...toMember(user),
  organizationId: user.organizationId,
  organizationName: state.organizations.get(user.organizationId) ?? '',
  mustChangePassword: user.mustChangePassword,
});

/** Exécute une route : les refus levés par les contrôles deviennent des réponses RFC 9457. */
const route =
  <P extends Record<string, string>>(
    handler: (context: {
      request: Request;
      params: P;
    }) => Response | Promise<Response>
  ) =>
  async ({
    request,
    params,
  }: {
    request: Request;
    params: Record<string, unknown>;
  }) => {
    try {
      return await handler({ request, params: params as P });
    } catch (error) {
      if (error instanceof Rejection) return error.response;
      throw error;
    }
  };

const body = <T>(request: Request) => request.json() as Promise<T>;

// --- Routes -----------------------------------------------------------------------------------

const API = '*/api';

export const handlers = [
  http.post(
    `${API}/auth/register`,
    route(async ({ request }) => {
      const input = await body<RegisterRequest>(request);
      if (memberByEmail(input.email))
        return problem(409, 'conflict', 'Cet email est déjà utilisé');
      checkNewPassword(input.password);
      const organizationId = seedOrganization(input.organizationName);
      const userId = seedMember(organizationId, input.name, 'ADMIN', {
        email: input.email.toLowerCase(),
        password: input.password,
      });
      signIn(userId);
      return ok({ mustChangePassword: false }, 201);
    })
  ),
  http.post(
    `${API}/auth/login`,
    route(async ({ request }) => {
      const input = await body<LoginRequest>(request);
      const user = memberByEmail(input.email);
      if (!user || user.removed || user.password !== input.password) {
        return problem(
          401,
          'authentication-failed',
          'Email ou mot de passe incorrect'
        );
      }
      signIn(user.id);
      return ok({ mustChangePassword: user.mustChangePassword });
    })
  ),
  http.post(
    `${API}/auth/logout`,
    route(() => {
      state.sessionUserId = null;
      return noContent();
    })
  ),
  http.post(
    `${API}/auth/password`,
    route(async ({ request }) => {
      const user = currentUser({ allowTemporaryPassword: true });
      const input = await body<ChangePasswordRequest>(request);
      if (input.currentPassword !== user.password)
        return invalid('Le mot de passe actuel est incorrect');
      checkNewPassword(input.newPassword);
      user.password = input.newPassword;
      user.mustChangePassword = false;
      return noContent();
    })
  ),
  http.get(
    `${API}/me`,
    route(() =>
      ok(toCurrentMember(currentUser({ allowTemporaryPassword: true })))
    )
  ),

  http.get(
    `${API}/members`,
    route(() => {
      const admin = requireAdmin(currentUser());
      return ok(
        state.users
          .filter(
            (user) =>
              user.organizationId === admin.organizationId && !user.removed
          )
          .map(toMember)
      );
    })
  ),
  http.post(
    `${API}/members`,
    route(async ({ request }) => {
      const admin = requireAdmin(currentUser());
      const input = await body<AddMemberRequest>(request);
      if (memberByEmail(input.email))
        return problem(409, 'conflict', 'Cet email est déjà utilisé');
      const temporaryPassword = `temporaire-${state.sequence + 1}-abcdefghij`;
      const userId = seedMember(admin.organizationId, input.name, input.role, {
        email: input.email.toLowerCase(),
        password: temporaryPassword,
        mustChangePassword: true,
      });
      return ok({ userId, temporaryPassword }, 201);
    })
  ),
  http.patch(
    `${API}/members/:userId`,
    route<{ userId: string }>(async ({ request, params }) => {
      const admin = requireAdmin(currentUser());
      const target = state.users.find(
        (user) =>
          user.id === params.userId &&
          user.organizationId === admin.organizationId &&
          !user.removed
      );
      if (!target) return notFound();
      if (target.id === admin.id)
        return problem(
          403,
          'forbidden',
          'On ne peut pas modifier son propre rôle'
        );
      target.role = (await body<{ role: Role }>(request)).role;
      return noContent();
    })
  ),
  http.delete(
    `${API}/members/:userId`,
    route<{ userId: string }>(({ params }) => {
      const admin = requireAdmin(currentUser());
      const target = state.users.find(
        (user) =>
          user.id === params.userId &&
          user.organizationId === admin.organizationId &&
          !user.removed
      );
      if (!target) return notFound();
      if (target.id === admin.id)
        return problem(403, 'forbidden', 'On ne peut pas se retirer soi-même');
      target.removed = true;
      return noContent();
    })
  ),

  http.get(
    `${API}/action-plans`,
    route(() => {
      const user = currentUser();
      return ok(
        state.plans
          .filter((plan) => plan.organizationId === user.organizationId)
          .map(toPlan)
      );
    })
  ),
  http.post(
    `${API}/action-plans`,
    route(async ({ request }) => {
      const admin = requireAdmin(currentUser());
      const { title, description } = titled(await body<TitledRequest>(request));
      const plan = {
        id: nextId('plan'),
        organizationId: admin.organizationId,
        title,
        description,
        version: 1,
      };
      state.plans.push(plan);
      return ok(toPlan(plan), 201);
    })
  ),
  http.get(
    `${API}/action-plans/:planId`,
    route<{ planId: string }>(({ params }) =>
      ok(toPlan(scopedPlan(currentUser(), params.planId)))
    )
  ),
  http.put(
    `${API}/action-plans/:planId`,
    route<{ planId: string }>(async ({ request, params }) => {
      const plan = scopedPlan(requireAdmin(currentUser()), params.planId);
      ifMatch(request, plan.version);
      Object.assign(plan, titled(await body<TitledRequest>(request)), {
        version: plan.version + 1,
      });
      return ok(toPlan(plan));
    })
  ),
  http.get(
    `${API}/action-plans/:planId/actions`,
    route<{ planId: string }>(({ params }) => {
      const plan = scopedPlan(currentUser(), params.planId);
      return ok(
        state.actions
          .filter((action) => action.planId === plan.id && !action.deleted)
          .map(toAction)
      );
    })
  ),
  http.post(
    `${API}/action-plans/:planId/actions`,
    route<{ planId: string }>(async ({ request, params }) => {
      const plan = scopedPlan(requireAdmin(currentUser()), params.planId);
      const { title, description } = titled(await body<TitledRequest>(request));
      return ok(
        toDetail(findAction(seedAction(plan.id, title, { description }))),
        201
      );
    })
  ),

  http.get(
    `${API}/actions/:actionId`,
    route<{ actionId: string }>(({ params }) =>
      ok(toDetail(scopedAction(currentUser(), params.actionId)))
    )
  ),
  http.put(
    `${API}/actions/:actionId`,
    route<{ actionId: string }>(async ({ request, params }) => {
      const action = scopedAction(requireAdmin(currentUser()), params.actionId);
      ifMatch(request, action.version);
      Object.assign(action, titled(await body<TitledRequest>(request)), {
        version: action.version + 1,
      });
      return ok(toDetail(action));
    })
  ),
  http.post(
    `${API}/actions/:actionId/status`,
    route<{ actionId: string }>(async ({ request, params }) => {
      const user = currentUser();
      const action = scopedAction(user, params.actionId);
      ifMatch(request, action.version);
      const { to } = await body<{ to: ActionStatus }>(request);
      if (user.role === 'MEMBER' || (to === 'DONE' && user.role !== 'ADMIN'))
        return forbidden();
      if (!TRANSITIONS[action.status].includes(to)) {
        return problem(409, 'invalid-transition', 'Transition non autorisée');
      }
      changeStatusAs(user.id, action.id, to);
      return ok(toDetail(action));
    })
  ),
  http.post(
    `${API}/actions/:actionId/rejection`,
    route<{ actionId: string }>(async ({ request, params }) => {
      const admin = requireAdmin(currentUser());
      const action = scopedAction(admin, params.actionId);
      ifMatch(request, action.version);
      const reason = (await body<{ reason: string }>(request)).reason.trim();
      if (!reason) return invalid('Le motif est obligatoire');
      if (action.status !== 'TO_VALIDATE')
        return problem(409, 'invalid-transition', 'Transition non autorisée');
      action.history.push({
        from: 'TO_VALIDATE',
        to: 'IN_PROGRESS',
        at: NOW,
        reason,
        authorId: admin.id,
      });
      action.status = 'IN_PROGRESS';
      action.version += 1;
      return ok(toDetail(action));
    })
  ),
  http.delete(
    `${API}/actions/:actionId`,
    route<{ actionId: string }>(({ request, params }) => {
      const admin = requireAdmin(currentUser());
      const action = scopedAction(admin, params.actionId);
      ifMatch(request, action.version);
      action.deleted = { by: admin.id, at: NOW };
      return noContent();
    })
  ),
];
