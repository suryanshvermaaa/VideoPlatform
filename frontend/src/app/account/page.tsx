import { AppShell } from '@/components/app/shell';
import { RequireAuth } from '@/components/app/guards';
import AccountClient from './ui';

export default function AccountPage() {
  return (
    <RequireAuth>
      <AppShell>
        <AccountClient />
      </AppShell>
    </RequireAuth>
  );
}
