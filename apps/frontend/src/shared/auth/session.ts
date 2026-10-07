import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, queries } from '@/shared/api';

/** Membre connecté, lu sur `/api/me` : la session vit dans un cookie HttpOnly, invisible du JS (D15). */
export const useCurrentMember = () => useQuery(queries.me());

/** Ouverture ou fermeture de session : l'état du cache appartient à l'ancien compte, on le vide. */
export function useSessionChange() {
  const queryClient = useQueryClient();
  return () => queryClient.clear();
}

export function useLogout(leave: () => void | Promise<void>) {
  const resetSession = useSessionChange();
  return useMutation({
    mutationFn: api.logout,
    onSettled: async () => {
      await leave();
      resetSession();
    },
  });
}
