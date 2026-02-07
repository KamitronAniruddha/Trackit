
'use client';
import { UnbanRequestsList } from '@/components/admin/unban-requests-list';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';

export default function AdminUnbanRequestsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Unban Requests</CardTitle>
                <CardDescription>
                    Review and act on unban requests from users.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <UnbanRequestsList />
            </CardContent>
        </Card>
    );
}
