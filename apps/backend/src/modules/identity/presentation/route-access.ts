import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'routeAccess:public';
export const ALLOWS_PENDING_PASSWORD_CHANGE = 'routeAccess:allowsPendingPasswordChange';

/** Route ouverte sans session (inscription, connexion). Toutes les autres l'exigent. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Route permise avec un mot de passe temporaire (D8) : profil, déconnexion, changement de mot de passe. */
export const AllowsPendingPasswordChange = () => SetMetadata(ALLOWS_PENDING_PASSWORD_CHANGE, true);
