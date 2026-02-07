
'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { doc, onSnapshot, type Timestamp, setDoc } from 'firebase/firestore';
import { useUser } from '@/firebase/auth/use-user';
import { getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  classLevel: string;
  targetYear: number;
  exam: 'NEET' | 'JEE' | null;
  onboardingCompleted: boolean;
  role?: 'admin' | 'subadmin' | 'user';
  isBanned?: boolean;
  banExpiresAt?: Timestamp | null;
  hasPendingUnbanRequest?: boolean;
  isDeleted?: boolean;
  theme?: 'default' | 'rose' | 'violet' | 'green' | 'orange' | 'blue' | 'purple' | 'teal' | 'crimson';
  font?: 'poppins';
  darkMode?: boolean;
  currentStreak?: number;
  longestStreak?: number;
  lastGoalCompletedDate?: string; // YYYY-MM-DD
  totalPoints?: number;
  isPremium?: boolean;
  accessCode?: string;
  accountStatus?: 'pending_approval' | 'active' | 'demo';
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  updateProfileSetting: (key: string, value: any) => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const prevProfileRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    // This effect will run whenever the profile state changes.
    // We compare the previous profile state with the new one to detect the upgrade.
    if (prevProfileRef.current && profile) {
      const wasNotPremium = prevProfileRef.current.isPremium === false;
      const isNowPremium = profile.isPremium === true;

      // If the user was not premium before, and is now premium, show the toast.
      if (wasNotPremium && isNowPremium) {
        toast({
          title: '🎉 Congratulations! You are now a Premium Member!',
          description: 'All features have been unlocked. Enjoy the full experience!',
          duration: 10000,
        });
      }
    }
    // Update the ref to the current profile for the next render.
    prevProfileRef.current = profile;
  }, [profile, toast]);


  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const docRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        const isRoleAdmin = data.role === 'admin';
        const isRoleSubAdmin = data.role === 'subadmin';
        
        // If user is admin or subadmin, default status is 'active'. Otherwise 'demo'.
        const accountStatus = data.accountStatus || (isRoleAdmin || isRoleSubAdmin ? 'active' : 'demo');
        
        let isPremium = data.isPremium ?? false;
        if (isRoleAdmin) {
            // Admin is premium unless they simulate demo mode.
            isPremium = accountStatus !== 'demo';
        } else if (isRoleSubAdmin) {
            // Sub-admin is always premium.
            isPremium = true;
        }
        
        setProfile({
          uid: user.uid,
          displayName: user.displayName || data.displayName || 'Student',
          email: user.email || data.email || '',
          photoURL: user.photoURL || data.photoURL || null,
          classLevel: data.classLevel,
          targetYear: data.targetYear,
          exam: data.exam,
          onboardingCompleted: data.onboardingCompleted,
          role: data.role || 'user',
          isBanned: data.isBanned ?? false,
          banExpiresAt: data.banExpiresAt ?? null,
          hasPendingUnbanRequest: data.hasPendingUnbanRequest ?? false,
          isDeleted: data.isDeleted ?? false,
          theme: data.theme,
          font: data.font,
          darkMode: data.darkMode ?? true,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastGoalCompletedDate: data.lastGoalCompletedDate,
          totalPoints: data.totalPoints || 0,
          isPremium: isPremium,
          accessCode: data.accessCode,
          accountStatus: accountStatus,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setProfile(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, firestore]);
  
  const updateProfileSetting = useCallback(async (key: string, value: any) => {
    if (!user) {
        throw new Error("User must be logged in to update settings.");
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    await setDoc(userDocRef, { [key]: value }, { merge: true });
  }, [user, firestore]);


  const value = useMemo(() => ({ profile, loading, updateProfileSetting }), [profile, loading, updateProfileSetting]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
