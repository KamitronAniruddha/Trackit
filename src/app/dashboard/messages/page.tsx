
'use client';
import { GroupList } from "@/components/group-list";
import { PremiumFeatureLock } from "@/components/premium-lock";
import { useUserProfile } from "@/contexts/user-profile-context";

export default function MessagesPage() {
    const { profile } = useUserProfile();

    if (!profile?.isPremium) {
        return <PremiumFeatureLock featureName="Group Messages" description="Collaborate with your peers, share doubts, and study together in groups." />;
    }
    
    return (
        <div className="flex flex-col gap-6">
             <div>
                <h1 className="text-3xl font-bold tracking-tight">Group Messages</h1>
                <p className="text-muted-foreground">Your group conversations.</p>
            </div>
            <GroupList />
        </div>
    );
}
