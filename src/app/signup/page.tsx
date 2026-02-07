'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SignupForm = dynamic(() => import('@/components/signup-form'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-4">
      <Skeleton className="h-[600px] w-full max-w-md" />
    </div>
  ),
});

export default function SignupPage() {
  return <SignupForm />;
}
