import { AppShell } from '@/components/app/shell';
import { RequireAdmin } from '@/components/app/guards';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui';

export default function AdminHome() {
  return (
    <RequireAdmin>
      <AppShell>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="font-semibold">Users</div>
            </CardHeader>
            <CardBody>
              <Link className="text-sm underline" href="/admin/users">
                Manage users
              </Link>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <div className="font-semibold">Courses</div>
            </CardHeader>
            <CardBody>
              <Link className="text-sm underline" href="/admin/courses">
                Manage courses
              </Link>
            </CardBody>
          </Card>
        </div>
      </AppShell>
    </RequireAdmin>
  );
}
