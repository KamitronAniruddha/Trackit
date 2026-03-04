
'use client';

import { UserSearch } from '@/components/user-search';

export default function DiscoverPage() {
    return (
        <div className="flex flex-col gap-6">
            <p className="text-muted-foreground -mt-4">
                Find and connect with other users on the platform.
            </p>
            <UserSearch />
        </div>
    );
}
