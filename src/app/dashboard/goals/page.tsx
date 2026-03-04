
import { GoalDashboard } from '@/components/goals/goal-dashboard';

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
       <p className="text-muted-foreground -mt-4">
          Set a daily goal to build your study streak and stay motivated.
        </p>
      <GoalDashboard />
    </div>
  );
}
