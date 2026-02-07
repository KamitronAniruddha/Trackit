
'use client';
import { PremiumActivator } from '@/components/admin/premium-activator';
import { PremiumCodeGenerator } from '@/components/admin/premium-code-generator';

export default function AdminPremiumPage() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <PremiumActivator />
            <PremiumCodeGenerator />
        </div>
    );
}
