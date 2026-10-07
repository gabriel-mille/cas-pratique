import { render, type RenderResult } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders, createQueryClient, routes } from '@/app';

type RenderedApp = RenderResult & {
  router: ReturnType<typeof createMemoryRouter>;
  user: UserEvent;
};

/** Monte l'application complète (routes, cache, toasts) sur une URL, contre la fausse API. */
export function renderApp(url: string): RenderedApp {
  const router = createMemoryRouter(routes, { initialEntries: [url] });
  const user = userEvent.setup();
  const view = render(
    <AppProviders queryClient={createQueryClient({ retry: false })}>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return { ...view, router, user };
}
