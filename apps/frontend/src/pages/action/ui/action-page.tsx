import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { availableTransitions, canRejectValidation, STATUS_LABELS } from '@/entities/action';
import { can } from '@/entities/member';
import {
  type ActionDetail,
  type ActionStatus,
  api,
  errorMessage,
  isApiError,
  queries,
  type TitledRequest,
} from '@/shared/api';
import { useMember } from '@/shared/auth';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Loading } from '@/shared/ui/loading';
import { PageHeader } from '@/shared/ui/page-header';
import { TitledForm } from '@/shared/ui/titled-form';
import { useToast } from '@/shared/ui/toast';
import styles from './action-page.module.css';
import { RejectionForm } from './rejection-form';
import { StatusHistory } from './status-history';

type Editing = 'action' | 'rejection' | 'deletion' | null;

/** Détail d'une action (US7) : changements d'état (US4, US5, D4), modification (US3b), suppression (US6). */
export function ActionPage() {
  const { actionId = '' } = useParams();
  const member = useMember();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useToast();
  const action = useQuery(queries.action(actionId));
  const [editing, setEditing] = useState<Editing>(null);

  const saved = (detail: ActionDetail, message: string) => {
    queryClient.setQueryData(queries.action(actionId).queryKey, detail);
    void queryClient.invalidateQueries(queries.planActions(detail.planId));
    notify(message);
    setEditing(null);
  };
  // Version périmée (D14) ou transition devenue invalide : on relit l'action pour montrer son état réel.
  const reloadOnConflict = (error: unknown) => {
    if (isApiError(error, 'stale-version') || isApiError(error, 'invalid-transition')) {
      void queryClient.invalidateQueries(queries.action(actionId));
    }
  };

  const changeStatus = useMutation({
    mutationFn: ({ current, to }: { current: ActionDetail; to: ActionStatus }) => api.changeStatus(current, to),
    onSuccess: (detail) => saved(detail, `Action passée à « ${STATUS_LABELS[detail.status]} ».`),
    onError: reloadOnConflict,
  });
  const reject = useMutation({
    mutationFn: ({ current, reason }: { current: ActionDetail; reason: string }) =>
      api.rejectValidation(current, reason),
    onSuccess: (detail) => saved(detail, 'Validation refusée : l’action est repassée « En cours ».'),
    onError: reloadOnConflict,
  });
  const update = useMutation({
    mutationFn: ({ current, body }: { current: ActionDetail; body: TitledRequest }) => api.updateAction(current, body),
    onSuccess: (detail) => saved(detail, 'Action modifiée.'),
    onError: reloadOnConflict,
  });
  const remove = useMutation({
    mutationFn: (current: ActionDetail) => api.deleteAction(current),
    onSuccess: async (_, current) => {
      queryClient.removeQueries(queries.action(actionId));
      await queryClient.invalidateQueries(queries.planActions(current.planId));
      notify(`Action « ${current.title} » supprimée.`);
      navigate(paths.actionPlan(current.planId), { replace: true });
    },
    onError: reloadOnConflict,
  });

  const open = (dialog: Editing) => {
    reject.reset();
    update.reset();
    remove.reset();
    setEditing(dialog);
  };
  const onOpenChange = (isOpen: boolean) => isOpen || setEditing(null);

  if (action.isPending) return <Loading />;
  if (action.isError) {
    return isApiError(action.error, 'not-found') ? (
      <>
        <PageHeader title="Action introuvable" />
        <p>Cette action n’existe pas, a été supprimée ou n’appartient pas à votre organisation.</p>
        <Link to={paths.actionPlans}>Retour aux plans d’actions</Link>
      </>
    ) : (
      <Alert>{errorMessage(action.error)}</Alert>
    );
  }

  const current = action.data;
  const transitions = availableTransitions(current.status, member.role);
  const canReject = canRejectValidation(current.status, member.role);
  return (
    <>
      <p>
        <Link to={paths.actionPlan(current.planId)}>← Retour au plan</Link>
      </p>
      <PageHeader title={current.title}>
        {can(member.role, 'edit-plans') && <Button onClick={() => open('action')}>Modifier l’action</Button>}
        {can(member.role, 'delete-actions') && (
          <Button variant="danger" onClick={() => open('deletion')}>
            Supprimer l’action
          </Button>
        )}
      </PageHeader>
      {current.description && <p className={styles.description}>{current.description}</p>}

      <section aria-labelledby="action-status" className={styles.status}>
        <h2 id="action-status">État</h2>
        {/* Région polie : le nouvel état est annoncé après une transition (WCAG 4.1.3). */}
        <p aria-live="polite">{`État : ${STATUS_LABELS[current.status]}`}</p>
        {changeStatus.isError && <Alert>{errorMessage(changeStatus.error)}</Alert>}
        {(transitions.length > 0 || canReject) && (
          <div className={styles.transitions}>
            {transitions.map((to) => (
              <Button
                key={to}
                variant="primary"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate({ current, to })}
              >
                {`Passer à ${STATUS_LABELS[to]}`}
              </Button>
            ))}
            {canReject && <Button onClick={() => open('rejection')}>Refuser la validation</Button>}
          </div>
        )}
      </section>

      <section aria-labelledby="action-history">
        <h2 id="action-history">Historique</h2>
        <StatusHistory history={current.history} />
      </section>

      <Dialog title="Modifier l’action" isOpen={editing === 'action'} onOpenChange={onOpenChange}>
        <TitledForm
          defaultValues={current}
          submitLabel="Enregistrer"
          pending={update.isPending}
          error={update.isError ? errorMessage(update.error) : undefined}
          onSubmit={(body) => update.mutate({ current, body })}
          onCancel={() => setEditing(null)}
        />
      </Dialog>
      <Dialog title="Refuser la validation" isOpen={editing === 'rejection'} onOpenChange={onOpenChange}>
        <RejectionForm
          pending={reject.isPending}
          error={reject.isError ? errorMessage(reject.error) : undefined}
          onSubmit={(reason) => reject.mutate({ current, reason })}
          onCancel={() => setEditing(null)}
        />
      </Dialog>
      <Dialog title="Supprimer l’action ?" isOpen={editing === 'deletion'} onOpenChange={onOpenChange}>
        {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}
        <p>{`« ${current.title} » n’apparaîtra plus dans le plan. La suppression est tracée.`}</p>
        <div className={styles.dialogActions}>
          <Button onClick={() => setEditing(null)}>Annuler</Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => remove.mutate(current)}>
            Supprimer
          </Button>
        </div>
      </Dialog>
    </>
  );
}
