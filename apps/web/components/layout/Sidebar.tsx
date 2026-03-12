'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    BellRing,
    Bot,
    BriefcaseBusiness,
    CalendarDays,
    CreditCard,
    FolderOpen,
    LayoutDashboard,
    LogOut,
    Receipt,
    Scale,
    Settings2,
    ShieldAlert,
    Users,
    UsersRound,
} from 'lucide-react';
import { canAccess, normalizeRole, ROLE_LABELS } from '@/lib/roles';
import { BrandLogo } from '@/components/layout/BrandLogo';

type NavItem = {
    href: string;
    label: string;
    module?: number;
    icon: ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { href: '/dashboard', label: 'Сводка', icon: LayoutDashboard },
    { href: '/archive', label: 'Архив документов', module: 2, icon: FolderOpen },
    { href: '/reconcile', label: 'Сверка актов', module: 1, icon: Scale },
    { href: '/chat', label: 'AI-ассистент', module: 3, icon: Bot },
    { href: '/contractors', label: 'Контрагенты', module: 8, icon: UsersRound },
    { href: '/calendar', label: 'Налоговый календарь', module: 9, icon: CalendarDays },
    { href: '/risks', label: 'Риски', module: 5, icon: ShieldAlert },
    { href: '/transactions', label: 'Транзакции', module: 6, icon: Receipt },
    { href: '/expenses', label: 'Командировочные', module: 10, icon: BriefcaseBusiness },
    { href: '/notifications', label: 'Напоминания', module: 7, icon: BellRing },
];

const BOTTOM_ITEMS: NavItem[] = [
    { href: '/billing', label: 'Тариф и биллинг', icon: CreditCard },
    { href: '/settings', label: 'Настройки', icon: Settings2 },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

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
    const managementItems: NavItem[] = role === 'CEO' ? [{ href: '/employees', label: 'Сотрудники', icon: Users }] : [];

    return (
        <aside
            className="relative z-20 flex h-full w-[346px] flex-col rounded-[26px] border border-white/70 bg-white/82 p-4 backdrop-blur-xl"
            style={{ boxShadow: '0 18px 46px rgba(15, 34, 65, 0.12)' }}
        >
            <div className="mb-4 flex items-center gap-3 px-2 pt-1">
                <BrandLogo href="/dashboard" />
            </div>

            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Рабочие модули</div>
            <nav className="grid flex-1 grid-cols-2 gap-2 content-start">
                {[...visibleNavItems, ...managementItems].map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative flex min-h-[62px] items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${
                                isActive
                                    ? 'border-[#58CC02]/35 bg-[linear-gradient(130deg,rgba(88,204,2,0.14),rgba(28,176,246,0.1))] shadow-[0_8px_18px_rgba(88,204,2,0.12)]'
                                    : 'border-black/7 bg-white/88 hover:border-[#1CB0F6]/32 hover:bg-[#1CB0F6]/6'
                            }`}
                        >
                            <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-primary/15 text-primary' : 'bg-black/[0.04] text-muted-foreground'}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <div className="truncate text-[13px] font-semibold leading-tight text-foreground">{item.label}</div>
                                {item.module ? <div className="mt-0.5 text-[11px] text-muted-foreground">Модуль {item.module}</div> : <div className="mt-0.5 text-[11px] text-muted-foreground">Открыть раздел</div>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-3 space-y-2 border-t border-black/6 pt-3">
                <div className="grid grid-cols-2 gap-2">
                {visibleBottomItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition-all ${
                                isActive
                                    ? 'border-[#58CC02]/35 bg-[#58CC02]/10 text-[#356c06]'
                                    : 'border-black/7 bg-white/88 text-muted-foreground hover:border-[#1CB0F6]/30 hover:text-foreground'
                            }`}
                        >
                            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-black/[0.04]">
                                <Icon className="h-4 w-4" />
                            </span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
                </div>

                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-100"
                >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-rose-600">
                        <LogOut className="h-4 w-4" />
                    </span>
                    <span>Выйти из аккаунта</span>
                </button>

                <div className="mt-1 flex items-center gap-2 rounded-2xl border border-black/7 bg-white/85 px-2.5 py-2.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8edf6] text-sm font-semibold text-foreground">
                        {(user?.name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">{user?.name || 'Пользователь Tartibly'}</div>
                        <div className="truncate text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{ROLE_LABELS[role] || role}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
