import { AppShell } from '@/components/app/shell';
import { RequireAuth } from '@/components/app/guards';
import CourseClient from './ui';

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
  return (
    <RequireAuth>
      <AppShell>
        <CourseClient params={params} />
      </AppShell>
    </RequireAuth>
  );
}
