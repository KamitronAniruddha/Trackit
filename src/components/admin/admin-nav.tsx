'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookCopy, Users, ShieldQuestion, Award, Mail } from 'lucide-react';
import { useUserProfile } from '@/contexts/user-profile-context';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export function AdminNav() {
    const pathname = usePathname();
    const { profile } = useUserProfile();

    const allNavItems = [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'subadmin'] },
        { href: '/admin/users', label: 'Users', icon: Users, roles: ['admin', 'subadmin'] },
        { href: '/admin/syllabus', label: 'Syllabus', icon: BookCopy, roles: ['admin'] },
        { href: '/admin/requests', label: 'Unban Requests', icon: ShieldQuestion, roles: ['admin', 'subadmin'] },
        { href: '/admin/contact', label: 'Messages', icon: Mail, roles: ['admin', 'subadmin'] },
        { href: '/admin/premium', label: 'Premium', icon: Award, roles: ['admin', 'subadmin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(profile?.role || ''));
    
    return (
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}
                        tooltip={{ children: item.label, side: 'right' }}
                    >
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}
