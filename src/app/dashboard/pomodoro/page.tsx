
'use client';
import { PomodoroTimer } from '@/components/pomodoro-timer';
import { useUserProfile } from '@/contexts/user-profile-context';
import { PremiumFeatureLock } from '@/components/premium-lock';

export default function PomodoroPage() {
  const { profile } = useUserProfile();

  if (!profile?.isPremium) {
    return <PremiumFeatureLock featureName="Pomodoro Timer" description="Boost your productivity with the Pomodoro technique for focused study sessions." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground -mt-4">
        Focus on your studies with the Pomodoro technique.
      </p>
      <PomodoroTimer />
    </div>
  );
}
