import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders, createQueryClient, routes } from './app';
import './app/styles/global.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Élément #root absent de index.html');
}

createRoot(root).render(
  <StrictMode>
    <AppProviders queryClient={createQueryClient()}>
      <RouterProvider router={createBrowserRouter(routes)} />
    </AppProviders>
  </StrictMode>,
);
