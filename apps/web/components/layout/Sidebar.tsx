'use client';

import type { ComponentType } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    ArrowLeftToLine,
    ArrowRightToLine,
    BellRing,
    Bot,
    BriefcaseBusiness,
    CalendarDays,
    CreditCard,
    FolderOpen,
    Settings2,
    LayoutDashboard,
    LogOut,
    Receipt,
    Scale,
    ShieldAlert,
    UsersRound,
    Users,
} from 'lucide-react';
import { canAccess, normalizeRole, ROLE_LABELS } from '@/lib/roles';

type NavItem = {
    href: string;
    label: string;
    module?: number;
    icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Финансовая сводка', icon: LayoutDashboard },
    { href: '/archive', label: 'Первичные документы', module: 2, icon: FolderOpen },
    { href: '/reconcile', label: 'Сверка актов', module: 1, icon: Scale },
    { href: '/chat', label: 'AI-ассистент', module: 3, icon: Bot },
    { href: '/contractors', label: 'Контрагенты', module: 8, icon: UsersRound },
    { href: '/calendar', label: 'Налоговый календарь', module: 9, icon: CalendarDays },
    { href: '/risks', label: 'Налоговые риски', module: 5, icon: ShieldAlert },
    { href: '/transactions', label: 'Банк и касса', module: 6, icon: Receipt },
    { href: '/expenses', label: 'Командировки', module: 10, icon: BriefcaseBusiness },
    { href: '/notifications', label: 'Напоминания AR', module: 7, icon: BellRing },
];

const BOTTOM_ITEMS: NavItem[] = [
    { href: '/billing', label: 'Тариф и оплата', icon: CreditCard },
    { href: '/settings', label: 'Настройки', icon: Settings2 },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [collapsed, setCollapsed] = useState(false);

    const user = session?.user as
        | {
              name?: string | null;
              email?: string | null;
              role?: string;
          }
        | undefined;

    const role = normalizeRole(user?.role) || user?.role || '';

    const visibleNavItems = NAV_ITEMS.filter((item) => canAccess(role, item.href));
    const visibleBottomItems = BOTTOM_ITEMS.filter((item) => canAccess(role, item.href));

    return (
        <aside
            className={`relative z-20 flex h-full flex-col rounded-[28px] border border-white/70 bg-white/70 p-4 backdrop-blur-2xl transition-all duration-300 ${
                collapsed ? 'w-24' : 'w-[290px]'
            }`}
            style={{ boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)' }}
        >
            <div className="mb-8 flex items-center gap-3 px-2 pt-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc00] text-[#1d1d1f] shadow-[0_10px_24px_rgba(255,204,0,0.35)]">
                    <span className="text-lg font-bold">B</span>
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">BuhAI</div>
                        <div className="text-xs text-muted-foreground">AI Бухгалтерия</div>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => setCollapsed((prev) => !prev)}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-muted-foreground transition hover:text-foreground"
                    aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
                >
                    {collapsed ? <ArrowRightToLine className="h-4 w-4" /> : <ArrowLeftToLine className="h-4 w-4" />}
                </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
                {!collapsed && (
                    <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Рабочие модули
                    </div>
                )}
                {visibleNavItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <span
                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                    isActive ? 'bg-primary/10 text-primary' : 'bg-black/[0.03] text-muted-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            {!collapsed && (
                                <>
                                    <span className="truncate">{item.label}</span>
                                    {item.module ? (
                                        <span className="ml-auto rounded-full bg-black/[0.04] px-2 py-0.5 text-[10px] text-muted-foreground">
                                            M{item.module}
                                        </span>
                                    ) : null}
                                </>
                            )}
                        </Link>
                    );
                })}

                {/* CEO-only: Employee management */}
                {role === 'CEO' && (
                    <>
                        {!collapsed && (
                            <div className="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                Управление
                            </div>
                        )}
                        <Link
                            href="/employees"
                            className={`sidebar-link ${pathname.startsWith('/employees') ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                            title={collapsed ? 'Сотрудники' : undefined}
                        >
                            <span
                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                    pathname.startsWith('/employees') ? 'bg-primary/10 text-primary' : 'bg-black/[0.03] text-muted-foreground'
                                }`}
                            >
                                <Users className="h-4 w-4" />
                            </span>
                            {!collapsed && <span className="truncate">Сотрудники</span>}
                        </Link>
                    </>
                )}
            </nav>

            <div className="mt-4 space-y-1 border-t border-black/5 pt-4">
                {visibleBottomItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <span
                                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${
                                    isActive ? 'bg-primary/10 text-primary' : 'bg-black/[0.03] text-muted-foreground'
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}

                {/* Logout button */}
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className={`sidebar-link w-full text-rose-500 hover:text-rose-600 ${collapsed ? 'justify-center px-0' : ''}`}
                    title={collapsed ? 'Выйти' : undefined}
                >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                        <LogOut className="h-4 w-4" />
                    </span>
                    {!collapsed && <span>Выйти</span>}
                </button>

                <div
                    className={`mt-3 flex items-center gap-3 rounded-2xl border border-black/5 bg-white/80 px-3 py-3 ${
                        collapsed ? 'justify-center px-0' : ''
                    }`}
                >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8eaef] text-sm font-semibold text-foreground">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-foreground">
                                {user?.name || 'Пользователь BuhAI'}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {user?.email || ''}
                            </div>
                            <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                {ROLE_LABELS[role] || role}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
