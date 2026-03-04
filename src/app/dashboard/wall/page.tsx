
'use client';

import { BrainDumpWall } from "@/components/brain-dump/brain-dump-wall";
import { PremiumFeatureLock } from "@/components/premium-lock";
import { useUserProfile } from "@/contexts/user-profile-context";

export default function BrainDumpPage() {
    const { profile } = useUserProfile();

    if (!profile?.isPremium) {
        return <PremiumFeatureLock featureName="Brain Dump Wall" description="Unload your thoughts on a real-time, anonymous wall. A safe space for students." />;
    }

    return (
        <div className="flex flex-col gap-6">
            <p className="text-muted-foreground -mt-4">
                An anonymous, real-time space to share what's on your mind. Notes disappear after 24 hours.
            </p>
            <BrainDumpWall />
        </div>
    );
}
