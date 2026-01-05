import { AppShell } from '@/components/app/shell';
import { RequireAuth } from '@/components/app/guards';
import WatchClient from './ui';

export default function WatchPage({ params }: { params: Promise<{ courseId: string; lectureId: string }> }) {
  return (
    <RequireAuth>
      <AppShell>
        <WatchClient params={params} />
      </AppShell>
    </RequireAuth>
  );
}
