import { Link } from 'react-router';
import { paths } from '@/shared/routes';
import { PageHeader } from '@/shared/ui/page-header';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <p>L’adresse demandée ne correspond à aucune page.</p>
      <Link to={paths.home}>Retour à l’accueil</Link>
    </>
  );
}
