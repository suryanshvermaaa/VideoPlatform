import { AppShell } from '@/components/app/shell';
import { RequireAdmin } from '@/components/app/guards';
import CoursesAdminClient from './ui';

export default function AdminCoursesPage() {
  return (
    <RequireAdmin>
      <AppShell>
        <CoursesAdminClient />
      </AppShell>
    </RequireAdmin>
  );
}
