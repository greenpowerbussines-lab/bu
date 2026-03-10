'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { canAccess } from '@/lib/roles';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const user = session?.user;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
            return;
        }

        if (status === 'authenticated') {
            const role = user?.role || null;
            if (!canAccess(role, pathname)) {
                router.replace('/dashboard');
            }
        }
    }, [status, pathname, router, user?.role]);

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f5f7]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0071e3] border-t-transparent" />
            </div>
        );
    }

    if (status === 'authenticated' && !canAccess(user?.role || null, pathname)) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f5f7]">
                <div className="rounded-2xl border border-black/10 bg-white/90 px-6 py-4 text-sm text-muted-foreground">
                    Проверяем доступ к модулю...
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <div className="page-shell">
                <div className="surface-panel relative flex h-full w-full overflow-hidden p-3">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-[#ffcc00]/20 blur-3xl" />
                        <div className="absolute right-[-80px] top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                    </div>

                    <Sidebar />

                    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white/40">
                        <header className="flex flex-shrink-0 items-center justify-between gap-4 border-b border-black/5 px-6 py-5 backdrop-blur-sm md:px-8">
                            <div className="flex flex-wrap items-center gap-3">
                                {user?.orgName && (
                                    <div className="rounded-full border border-black/5 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {user.orgName}
                                    </div>
                                )}
                                <div className="rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm text-primary">
                                    Финансовый контур · BuhAI
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button type="button" className="pill-button hidden sm:inline-flex">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                                </button>
                            </div>
                        </header>

                        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8">{children}</main>
                    </div>
                </div>
            </div>
        </div>
    );
}
