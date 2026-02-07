
'use client';

import { useState } from 'react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow, add } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function SpectatePermissionManager() {
  const { profile, updateProfileSetting } = useUserProfile();
  const { toast } = useToast();
  const [duration, setDuration] = useState('1'); // Default to 1 hour
  const [isLoading, setIsLoading] = useState(false);

  const permission = profile?.spectatePermission;
  const isGranted = permission?.status === 'granted' && permission.expiresAt && permission.expiresAt.toDate() > new Date();

  const handleGrantPermission = async () => {
    setIsLoading(true);
    const now = new Date();
    const expiresAt = add(now, { hours: parseInt(duration, 10) });

    try {
      await updateProfileSetting('spectatePermission', {
        status: 'granted',
        grantedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(expiresAt),
        spectatingAdminId: null, // Ensure this is reset on new grant
      });
      toast({
        title: 'Permission Granted',
        description: `Admins can now view your progress for the next ${duration} hour(s).`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not grant permission. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokePermission = async () => {
    setIsLoading(true);
    try {
      await updateProfileSetting('spectatePermission', {
        status: 'none',
        expiresAt: null,
        grantedAt: null,
        spectatingAdminId: null,
      });
      toast({
        title: 'Permission Revoked',
        description: 'Admins can no longer view your progress.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not revoke permission. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isGranted && permission?.expiresAt) {
    return (
        <Alert>
            <AlertTitle>Permission Active</AlertTitle>
            <AlertDescription>
                An admin can view your profile for the next {formatDistanceToNow(permission.expiresAt.toDate())}.
            </AlertDescription>
             <Button
                variant="destructive"
                className="w-full mt-4"
                onClick={handleRevokePermission}
                disabled={isLoading}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Revoke Permission
            </Button>
        </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={duration} onValueChange={setDuration} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Hour</SelectItem>
            <SelectItem value="24">24 Hours</SelectItem>
            <SelectItem value="168">7 Days</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleGrantPermission} disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Grant Access
        </Button>
      </div>
    </div>
  );
}
