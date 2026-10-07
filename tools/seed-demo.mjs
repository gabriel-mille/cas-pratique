// Données de démonstration de `dump.sql`, créées par l'API HTTP (pas d'INSERT à la main) :
// mots de passe hachés, versions et historique d'états sont produits par l'application elle-même.
// Usage (base vide, migrations jouées, backend démarré) : node tools/seed-demo.mjs [http://localhost:3000/api]

const API = process.argv[2] ?? 'http://localhost:3000/api';
const ORIGIN = process.env.APP_ORIGIN ?? 'http://localhost:4200';

const DEMO_ACCOUNTS = {
  alice: { name: 'Alice Martin', email: 'alice@lilas.test', password: 'demo alice mot de passe' },
  bob: { name: 'Bob Durand', email: 'bob@lilas.test', password: 'demo bob mot de passe', role: 'MANAGER' },
  chloe: { name: 'Chloé Petit', email: 'chloe@lilas.test', password: 'demo chloe mot de passe', role: 'MEMBER' },
};

/** Client minimal : cookie de session, en-tête Origin (D25), échec explicite sur toute réponse non 2xx. */
function session() {
  let cookie = '';
  async function call(method, path, body, headers = {}) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        Origin: ORIGIN,
        ...(cookie && { Cookie: cookie }),
        ...(body && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body && JSON.stringify(body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await response.text();
    if (!response.ok) throw new Error(`${method} ${path} → ${response.status} ${text}`);
    return { data: text ? JSON.parse(text) : undefined, etag: response.headers.get('etag') };
  }
  /** Écriture conditionnelle : relit la ressource pour son ETag, puis l'envoie en If-Match (D14). */
  async function guarded(method, path, body, resource = path) {
    const { etag } = await call('GET', resource);
    return call(method, path, body, { 'If-Match': etag });
  }
  return { call, guarded };
}

async function signIn(account) {
  const client = session();
  await client.call('POST', '/auth/login', { email: account.email, password: account.password });
  return client;
}

async function main() {
  const alice = session();
  await alice.call('POST', '/auth/register', {
    organizationName: 'Clinique des Lilas',
    ...DEMO_ACCOUNTS.alice,
  });

  const clients = { alice };
  for (const key of ['bob', 'chloe']) {
    const { name, email, password, role } = DEMO_ACCOUNTS[key];
    const { data } = await alice.call('POST', '/members', { email, name, role });
    // Mot de passe temporaire remplacé à la première connexion (D8).
    const client = session();
    await client.call('POST', '/auth/login', { email, password: data.temporaryPassword });
    await client.call('POST', '/auth/password', { currentPassword: data.temporaryPassword, newPassword: password });
    clients[key] = await signIn(DEMO_ACCOUNTS[key]);
  }
  const { bob } = clients;

  async function plan(title, description, actions) {
    const { data } = await alice.call('POST', '/action-plans', { title, description });
    const created = {};
    for (const [key, action] of Object.entries(actions)) {
      created[key] = (await alice.call('POST', `/action-plans/${data.id}/actions`, action)).data.id;
    }
    return created;
  }
  const move = (client, id, to) => client.guarded('POST', `/actions/${id}/status`, { to }, `/actions/${id}`);

  const infections = await plan(
    'Prévention des infections associées aux soins',
    'Suite à l’audit hygiène des mains de mars : taux d’observance de 62 %, objectif 80 %.',
    {
      training: { title: 'Former les nouveaux arrivants à l’hygiène des mains', description: 'Session mensuelle de 30 min avec caisson pédagogique.' },
      dispensers: { title: 'Installer des distributeurs de SHA à l’entrée des chambres' },
      audit: { title: 'Réaliser un audit d’observance trimestriel', description: 'Grille OMS, 100 opportunités par service.' },
      posters: { title: 'Afficher les 5 indications de l’hygiène des mains' },
      duplicate: { title: 'Commander des affiches (doublon)' },
    },
  );
  // Terminé : chemin complet, validé par l'administratrice.
  await move(bob, infections.training, 'IN_PROGRESS');
  await move(bob, infections.training, 'TO_VALIDATE');
  await move(alice, infections.training, 'DONE');
  // Refusé une fois avec motif, repris puis de nouveau à valider.
  await move(bob, infections.dispensers, 'IN_PROGRESS');
  await move(bob, infections.dispensers, 'TO_VALIDATE');
  await alice.guarded('POST', `/actions/${infections.dispensers}/rejection`, {
    reason: 'Il manque les chambres du 3e étage : compléter avant validation.',
  }, `/actions/${infections.dispensers}`);
  await move(bob, infections.dispensers, 'TO_VALIDATE');
  await move(bob, infections.audit, 'IN_PROGRESS');
  // Suppression logique (D7) : absente des écrans, conservée en base.
  await alice.guarded('DELETE', `/actions/${infections.duplicate}`);

  const medication = await plan(
    'Sécurisation du circuit du médicament',
    'Plan issu de la revue des erreurs médicamenteuses (CREX du 2e trimestre).',
    {
      double: { title: 'Mettre en place le double contrôle des médicaments à risque' },
      fridge: { title: 'Tracer la température des réfrigérateurs de service' },
      list: { title: 'Mettre à jour la liste des médicaments à haut risque' },
    },
  );
  await move(bob, medication.double, 'IN_PROGRESS');
  await move(bob, medication.fridge, 'IN_PROGRESS');
  await move(bob, medication.fridge, 'TO_VALIDATE');

  await plan('Identitovigilance', null, {
    bracelets: { title: 'Vérifier le port du bracelet d’identification à l’admission' },
  });

  console.log(`Démo créée sur ${API} : ${Object.keys(DEMO_ACCOUNTS).length} comptes, 3 plans.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
