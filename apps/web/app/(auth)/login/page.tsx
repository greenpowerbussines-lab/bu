'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: form.email,
                password: form.password,
            });

            if (res?.ok && !res.error) {
                router.push('/dashboard');
                return;
            }

            setError('Неверный email или пароль');
        } catch (err) {
            console.error(err);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="surface-panel relative w-full max-w-[1080px] overflow-hidden p-4 md:p-6">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-80px] top-[-80px] h-56 w-56 rounded-full bg-[#ffcc00]/20 blur-3xl" />
                    <div className="absolute right-[-80px] bottom-[-80px] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                </div>

                <div className="relative z-10 grid gap-6 md:grid-cols-[0.95fr_1.05fr]">
                    <section className="glass-card flex flex-col justify-between p-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc00] text-lg font-bold text-[#1d1d1f]">B</div>
                                <div>
                                    <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">BuhAI</div>
                                    <div className="text-xs text-muted-foreground">Финансовый контур компании</div>
                                </div>
                            </div>
                            <h1 className="mt-10 text-4xl font-bold tracking-[-0.05em] text-foreground">Вход в рабочее пространство</h1>
                            <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                Дашборд, документы, налоговые риски и AI-ассистент доступны в одном интерфейсе.
                            </p>
                        </div>

                        <div className="mt-8 space-y-3 text-sm text-muted-foreground">
                            <div className="rounded-2xl bg-white/70 p-4">Без кредитной карты на тестовый период</div>
                            <div className="rounded-2xl bg-white/70 p-4">Интерфейс уже синхронизирован с новым дизайном</div>
                        </div>
                    </section>

                    <section className="glass-card p-8 md:p-10">
                        <div className="mb-8">
                            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Авторизация</div>
                            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-foreground">Войти в BuhAI</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Используйте корпоративную учётную запись.</p>
                        </div>

                        {registered && (
                            <div className="mb-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                                ✅ Аккаунт CEO создан! Теперь войдите.
                            </div>
                        )}
                        {error ? (
                            <div className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>
                        ) : null}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field
                                label="Email"
                                type="email"
                                value={form.email}
                                onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                                placeholder="ivan@company.ru"
                            />
                            <Field
                                label="Пароль"
                                type="password"
                                value={form.password}
                                onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
                                placeholder="Ваш пароль"
                            />

                            <button type="submit" disabled={loading} className="pill-button pill-button-primary w-full justify-center py-3">
                                {loading ? 'Входим...' : 'Войти'}
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-muted-foreground">
                            Нет аккаунта?{' '}
                            <Link href="/register" className="font-medium text-primary hover:underline">
                                Зарегистрироваться
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

function LoginFallback() {
    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}

function Field({
    label,
    type,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
        </label>
    );
}
