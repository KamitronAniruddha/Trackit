'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const LoginForm = dynamic(() => import('@/components/login-form'), { 
    ssr: false,
    loading: () => (
        <div className="flex min-h-screen w-full items-center justify-center bg-transparent p-4">
            <Skeleton className="h-[550px] w-full max-w-md" />
        </div>
    ),
});

export default function LoginPage() {
  return <LoginForm />;
}
