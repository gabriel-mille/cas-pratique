import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { can } from '@/entities/member';
import { api, errorMessage, queries } from '@/shared/api';
import { useMember } from '@/shared/auth';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Loading } from '@/shared/ui/loading';
import { PageHeader } from '@/shared/ui/page-header';
import { TitledForm } from '@/shared/ui/titled-form';
import { useToast } from '@/shared/ui/toast';

/** US7 : tout membre consulte les plans de son organisation ; seul l'Administrateur en crée (US3). */
export function ActionPlansPage() {
  const member = useMember();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useToast();
  const plans = useQuery(queries.plans());
  const [creating, setCreating] = useState(false);
  const create = useMutation({
    mutationFn: api.createPlan,
    onSuccess: async (plan) => {
      await queryClient.invalidateQueries(queries.plans());
      notify(`Plan « ${plan.title} » créé.`);
      setCreating(false);
      navigate(paths.actionPlan(plan.id));
    },
  });

  return (
    <>
      <PageHeader title="Plans d’actions">
        {can(member.role, 'edit-plans') && (
          <Button
            variant="primary"
            onClick={() => {
              create.reset();
              setCreating(true);
            }}
          >
            Nouveau plan
          </Button>
        )}
      </PageHeader>

      {plans.isPending && <Loading />}
      {plans.isError && <Alert>{errorMessage(plans.error)}</Alert>}
      {plans.isSuccess &&
        (plans.data.length === 0 ? (
          <p>Aucun plan d’actions pour l’instant.</p>
        ) : (
          <ul aria-label="Plans d’actions">
            {plans.data.map((plan) => (
              <li key={plan.id}>
                <Link to={paths.actionPlan(plan.id)}>{plan.title}</Link>
              </li>
            ))}
          </ul>
        ))}

      <Dialog title="Nouveau plan d’actions" isOpen={creating} onOpenChange={setCreating}>
        <TitledForm
          submitLabel="Créer le plan"
          pending={create.isPending}
          error={create.isError ? errorMessage(create.error) : undefined}
          onSubmit={(body) => create.mutate(body)}
          onCancel={() => setCreating(false)}
        />
      </Dialog>
    </>
  );
}
