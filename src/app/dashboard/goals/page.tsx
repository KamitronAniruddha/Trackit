
import { GoalDashboard } from '@/components/goals/goal-dashboard';

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Goals</h1>
        <p className="text-muted-foreground">
          Set a daily goal to build your study streak and stay motivated.
        </p>
      </div>
      <GoalDashboard />
    </div>
  );
}
