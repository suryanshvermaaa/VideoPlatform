import { AppShell } from '@/components/app/shell';
import { RequireAdmin } from '@/components/app/guards';
import UsersClient from './ui';

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <AppShell>
        <UsersClient />
      </AppShell>
    </RequireAdmin>
  );
}
