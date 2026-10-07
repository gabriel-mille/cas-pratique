import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { StatusBadge } from '@/entities/action';
import { can } from '@/entities/member';
import { type ActionPlan, api, errorMessage, isApiError, queries, type TitledRequest } from '@/shared/api';
import { useMember } from '@/shared/auth';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Loading } from '@/shared/ui/loading';
import { PageHeader } from '@/shared/ui/page-header';
import { TitledForm } from '@/shared/ui/titled-form';
import { useToast } from '@/shared/ui/toast';
import styles from './action-plan-page.module.css';

type Editing = 'plan' | 'new-action' | null;

/** Un plan et ses actions (US7) ; l'Administrateur modifie le plan et ajoute des actions (US3, US3b). */
export function ActionPlanPage() {
  const { planId = '' } = useParams();
  const member = useMember();
  const queryClient = useQueryClient();
  const notify = useToast();
  const plan = useQuery(queries.plan(planId));
  const actions = useQuery(queries.planActions(planId));
  const [editing, setEditing] = useState<Editing>(null);

  const update = useMutation({
    mutationFn: ({ current, body }: { current: ActionPlan; body: TitledRequest }) => api.updatePlan(current, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(queries.plan(planId).queryKey, updated);
      void queryClient.invalidateQueries(queries.plans());
      notify('Plan modifié.');
      setEditing(null);
    },
    onError: (error) => {
      if (isApiError(error, 'stale-version')) void queryClient.invalidateQueries(queries.plan(planId));
    },
  });
  const addAction = useMutation({
    mutationFn: (body: TitledRequest) => api.addAction(planId, body),
    onSuccess: async (action) => {
      await queryClient.invalidateQueries(queries.planActions(planId));
      notify(`Action « ${action.title} » ajoutée.`);
      setEditing(null);
    },
  });

  const open = (dialog: Editing) => {
    update.reset();
    addAction.reset();
    setEditing(dialog);
  };
  const onOpenChange = (isOpen: boolean) => isOpen || setEditing(null);

  if (plan.isPending) return <Loading />;
  if (plan.isError) {
    return isApiError(plan.error, 'not-found') ? (
      <>
        <PageHeader title="Plan introuvable" />
        <p>Ce plan n’existe pas ou n’appartient pas à votre organisation.</p>
        <Link to={paths.actionPlans}>Retour aux plans d’actions</Link>
      </>
    ) : (
      <Alert>{errorMessage(plan.error)}</Alert>
    );
  }

  const canEdit = can(member.role, 'edit-plans');
  return (
    <>
      <p>
        <Link to={paths.actionPlans}>← Plans d’actions</Link>
      </p>
      <PageHeader title={plan.data.title}>
        {canEdit && (
          <>
            <Button onClick={() => open('plan')}>Modifier le plan</Button>
            <Button variant="primary" onClick={() => open('new-action')}>
              Ajouter une action
            </Button>
          </>
        )}
      </PageHeader>
      {plan.data.description && <p className={styles.description}>{plan.data.description}</p>}

      <h2>Actions</h2>
      {actions.isPending && <Loading />}
      {actions.isError && <Alert>{errorMessage(actions.error)}</Alert>}
      {actions.isSuccess &&
        (actions.data.length === 0 ? (
          <p>Aucune action dans ce plan.</p>
        ) : (
          <table className={styles.table}>
            <caption className={styles.caption}>Actions du plan « {plan.data.title} »</caption>
            <thead>
              <tr>
                <th scope="col">Action</th>
                <th scope="col">État</th>
              </tr>
            </thead>
            <tbody>
              {actions.data.map((action) => (
                <tr key={action.id}>
                  <td>
                    <Link to={paths.action(action.id)}>{action.title}</Link>
                  </td>
                  <td>
                    <StatusBadge status={action.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}

      <Dialog title="Modifier le plan" isOpen={editing === 'plan'} onOpenChange={onOpenChange}>
        <TitledForm
          defaultValues={plan.data}
          submitLabel="Enregistrer"
          pending={update.isPending}
          error={update.isError ? errorMessage(update.error) : undefined}
          onSubmit={(body) => update.mutate({ current: plan.data, body })}
          onCancel={() => setEditing(null)}
        />
      </Dialog>
      <Dialog title="Nouvelle action" isOpen={editing === 'new-action'} onOpenChange={onOpenChange}>
        <TitledForm
          submitLabel="Ajouter l’action"
          pending={addAction.isPending}
          error={addAction.isError ? errorMessage(addAction.error) : undefined}
          onSubmit={(body) => addAction.mutate(body)}
          onCancel={() => setEditing(null)}
        />
      </Dialog>
    </>
  );
}
