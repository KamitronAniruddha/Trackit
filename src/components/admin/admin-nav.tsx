'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookCopy, Users, ShieldQuestion, Award, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/contexts/user-profile-context';

export function AdminNav() {
    const pathname = usePathname();
    const { profile } = useUserProfile();

    const allNavItems = [
        { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin', 'subadmin'] },
        { href: '/admin/syllabus', label: 'Syllabus', icon: BookCopy, roles: ['admin'] },
        { href: '/admin/requests', label: 'Unban Requests', icon: ShieldQuestion, roles: ['admin', 'subadmin'] },
        { href: '/admin/contact', label: 'Messages', icon: Mail, roles: ['admin', 'subadmin'] },
        { href: '/admin/premium', label: 'Premium', icon: Award, roles: ['admin', 'subadmin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(profile?.role || ''));
    
    return (
        <nav className="grid items-start gap-1">
            {navItems.map(item => (
                <Button
                    key={item.href}
                    asChild
                    variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                >
                    <Link href={item.href}>
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.label}
                    </Link>
                </Button>
            ))}
        </nav>
    );
}
