
'use client';
import { InterpretationCharts } from '@/components/interpretation-charts';
import { useUserProfile } from '@/contexts/user-profile-context';
import { PremiumFeatureLock } from '@/components/premium-lock';

export default function InterpretationPage() {
  const { profile } = useUserProfile();

  if (!profile?.isPremium) {
    return <PremiumFeatureLock featureName="Performance Analytics" description="Get a deep-dive into your study patterns with advanced data visualization." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground -mt-4">
        Dive deep into your study patterns with advanced data visualization.
      </p>
      <InterpretationCharts />
    </div>
  );
}
