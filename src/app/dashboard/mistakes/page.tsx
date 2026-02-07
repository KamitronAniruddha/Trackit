'use client';

import { PremiumFeatureLock } from "@/components/premium-lock";
import { useUserProfile } from "@/contexts/user-profile-context";
import { MistakeNotebook } from "@/components/mistake-notebook";

export default function MistakesPage() {
    const { profile } = useUserProfile();
    
    if (!profile?.isPremium) {
        return <PremiumFeatureLock featureName="Mistake Notebook" description="Log, tag, and review your mistakes to turn them into learning opportunities." />;
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mistake Notebook</h1>
                <p className="text-muted-foreground">
                    A digital log of your mistakes to help you learn and improve.
                </p>
            </div>
            <MistakeNotebook />
        </div>
    );
}
