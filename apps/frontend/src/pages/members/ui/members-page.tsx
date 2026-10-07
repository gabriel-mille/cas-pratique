import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { can, ROLE_LABELS, ROLE_OPTIONS } from '@/entities/member';
import { api, errorMessage, type Member, queries, type Role } from '@/shared/api';
import { useMember } from '@/shared/auth';
import { validateForm } from '@/shared/lib/form';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { Dialog } from '@/shared/ui/dialog';
import { Loading } from '@/shared/ui/loading';
import { PageHeader } from '@/shared/ui/page-header';
import { SelectField } from '@/shared/ui/select-field';
import { useToast } from '@/shared/ui/toast';
import { changeRoleSchema } from '../model/schema';
import { AddMemberForm } from './add-member-form';
import styles from './members-page.module.css';

/** US2, US2b : gestion des membres, réservée à l'Administrateur (D9). */
export function MembersPage() {
  const member = useMember();
  if (!can(member.role, 'manage-members')) {
    return (
      <>
        <PageHeader title="Membres" />
        <Alert>Cette page est réservée aux administrateurs.</Alert>
      </>
    );
  }
  return <MembersAdministration currentUserId={member.userId} />;
}

function MembersAdministration({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const notify = useToast();
  const members = useQuery(queries.members());
  const [removing, setRemoving] = useState<Member | null>(null);

  const changeRole = useMutation({
    mutationFn: ({ target, role }: { target: Member; role: Role }) => api.changeRole(target.userId, role),
    onSuccess: async (_, { target, role }) => {
      await queryClient.invalidateQueries(queries.members());
      notify(`Rôle de ${target.name} : ${ROLE_LABELS[role]}.`);
    },
  });
  const remove = useMutation({
    mutationFn: (target: Member) => api.removeMember(target.userId),
    onSuccess: async (_, target) => {
      await queryClient.invalidateQueries(queries.members());
      notify(`${target.name} a été retiré de l’organisation.`);
      setRemoving(null);
    },
  });

  const submitRole = (target: Member) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(changeRoleSchema, event.currentTarget);
    if (result.ok) changeRole.mutate({ target, role: result.data.role });
  };

  return (
    <>
      <PageHeader title="Membres" />
      <AddMemberForm />

      <section aria-labelledby="member-list" className={styles.section}>
        <h2 id="member-list">Membres de l’organisation</h2>
        {changeRole.isError && <Alert>{errorMessage(changeRole.error)}</Alert>}
        {members.isPending && <Loading />}
        {members.isError && <Alert>{errorMessage(members.error)}</Alert>}
        {members.isSuccess && (
          <table className={styles.table}>
            <caption className={styles.caption}>Membres de l’organisation</caption>
            <thead>
              <tr>
                <th scope="col">Nom</th>
                <th scope="col">Email</th>
                <th scope="col">Rôle</th>
                <th scope="col">Retrait</th>
              </tr>
            </thead>
            <tbody>
              {members.data.map((row) =>
                row.userId === currentUserId ? (
                  // D9 : personne ne modifie son propre rôle ni ne se retire.
                  <tr key={row.userId}>
                    <th scope="row">{`${row.name} (vous)`}</th>
                    <td>{row.email}</td>
                    <td>{ROLE_LABELS[row.role]}</td>
                    <td>—</td>
                  </tr>
                ) : (
                  <tr key={row.userId}>
                    <th scope="row">{row.name}</th>
                    <td>{row.email}</td>
                    <td>
                      <form noValidate onSubmit={submitRole(row)} className={styles.roleForm}>
                        <SelectField
                          label={`Rôle de ${row.name}`}
                          name="role"
                          options={ROLE_OPTIONS}
                          defaultValue={row.role}
                          hideLabel
                        />
                        <Button type="submit" aria-label={`Enregistrer le rôle de ${row.name}`}>
                          Enregistrer
                        </Button>
                      </form>
                    </td>
                    <td>
                      <Button
                        variant="danger"
                        aria-label={`Retirer ${row.name}`}
                        onClick={() => {
                          remove.reset();
                          setRemoving(row);
                        }}
                      >
                        Retirer
                      </Button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}
      </section>

      <Dialog
        title={`Retirer ${removing?.name ?? ''} ?`}
        isOpen={removing !== null}
        onOpenChange={(isOpen) => isOpen || setRemoving(null)}
      >
        {remove.isError && <Alert>{errorMessage(remove.error)}</Alert>}
        <p>Ses sessions sont fermées immédiatement et il ne pourra plus se connecter. Son historique est conservé.</p>
        <div className={styles.dialogActions}>
          <Button onClick={() => setRemoving(null)}>Annuler</Button>
          <Button variant="danger" disabled={remove.isPending} onClick={() => removing && remove.mutate(removing)}>
            Confirmer le retrait
          </Button>
        </div>
      </Dialog>
    </>
  );
}
