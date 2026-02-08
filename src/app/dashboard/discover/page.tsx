
'use client';

import { UserSearch } from '@/components/user-search';

export default function DiscoverPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Discover Users</h1>
                <p className="text-muted-foreground">
                    Find and connect with other users on the platform.
                </p>
            </div>
            <UserSearch />
        </div>
    );
}
