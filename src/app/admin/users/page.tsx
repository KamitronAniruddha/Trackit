'use client';
import { UserList } from '@/components/admin/user-list';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { UserPlus } from 'lucide-react';
  
export default function AdminUsersPage() {
    const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl">User Management</CardTitle>
                        <CardDescription>
                            View and manage all users in the system.
                        </CardDescription>
                    </div>
                    <Button onClick={() => setIsAddUserDialogOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </CardHeader>
                <CardContent>
                    <UserList />
                </CardContent>
            </Card>
            <AddUserDialog isOpen={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen} />
        </>
    );
}
