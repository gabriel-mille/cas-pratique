import { createContext, type ReactNode, useContext } from 'react';
import type { CurrentMember } from '@/shared/api';

const MemberContext = createContext<CurrentMember | null>(null);

/**
 * Membre connecté, fourni par la garde de session une fois `/api/me` chargé.
 * Les pages le lisent ici et non dans le cache : quand le cache est vidé (déconnexion), la garde
 * se rend avant elles et les démonte, au lieu qu'elles se rendent une fois sans membre.
 */
export function MemberProvider({ member, children }: { member: CurrentMember; children: ReactNode }) {
  return <MemberContext.Provider value={member}>{children}</MemberContext.Provider>;
}

/** Membre connecté, sous la garde de session. */
export function useMember(): CurrentMember {
  const member = useContext(MemberContext);
  if (!member) {
    throw new Error('useMember appelé hors de la garde de session');
  }
  return member;
}
