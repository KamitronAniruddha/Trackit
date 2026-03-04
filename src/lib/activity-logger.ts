
import { collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';

export type ActivityAction = 
  | 'USER_BANNED'
  | 'USER_UNBANNED'
  | 'USER_DELETED'
  | 'PREMIUM_GRANTED'
  | 'PREMIUM_REVOKED'
  | 'ROLE_CHANGED'
  | 'UNBAN_REQUEST_APPROVED'
  | 'UNBAN_REQUEST_REJECTED'
  | 'CONTACT_MESSAGE_DELETED'
  | 'PREMIUM_ACTIVATED_WITH_CODE';

interface LogActivityOptions {
    firestore: Firestore;
    actorId: string;
    actorName: string;
    action: ActivityAction;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any>;
}

export async function logActivity({ firestore, actorId, actorName, action, targetId, targetName, details }: LogActivityOptions) {
    try {
        const activityLogsRef = collection(firestore, 'activityLogs');
        await addDoc(activityLogsRef, {
            timestamp: serverTimestamp(),
            actorId,
            actorName,
            action,
            targetId,
            targetName,
            details
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We probably don't want to show a toast for a failed log, it's a background task.
    }
}
