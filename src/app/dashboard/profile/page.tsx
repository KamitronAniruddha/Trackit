import { ProfileClient } from '@/components/profile-client';

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground -mt-4">
        Manage your account settings, appearance, security, and more.
      </p>
      <ProfileClient />
    </div>
  );
}
