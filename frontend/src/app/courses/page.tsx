import { AppShell } from '@/components/app/shell';
import { RequireAuth } from '@/components/app/guards';
import CoursesClient from './ui';

export default function CoursesPage() {
  return (
    <RequireAuth>
      <AppShell>
        <CoursesClient />
      </AppShell>
    </RequireAuth>
  );
}
