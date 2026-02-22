import { ProfileClient } from '@/components/profile-client';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings, appearance, security, and more.
        </p>
      </div>
      <ProfileClient />
    </div>
  );
}
