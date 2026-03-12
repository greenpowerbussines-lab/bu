'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

type CredentialsForm = {
    email: string;
    password: string;
};

type TelegramForm = {
    telegramId: string;
    code: string;
};

function mapAuthError(code: string | null): string {
    if (!code) return '';
    if (code === 'AccessDenied') return 'Доступ запрещен для выбранного способа входа.';
    if (code === 'OAuthSignin') return 'Ошибка входа через OAuth провайдера.';
    if (code === 'OAuthCallback') return 'Ошибка callback от OAuth провайдера.';
    if (code === 'OAuthCreateAccount') return 'Не удалось создать OAuth аккаунт.';
    if (code === 'OAuthAccountNotLinked') return 'Этот email уже зарегистрирован другим способом входа.';
    if (code === 'CredentialsSignin') return 'Неверный email, пароль или Telegram-код.';
    return 'Не удалось выполнить вход. Попробуйте снова.';
}

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
    const resetDone = searchParams.get('reset');
    const authErrorCode = searchParams.get('error');

    const [credentialsForm, setCredentialsForm] = useState<CredentialsForm>({ email: '', password: '' });
    const [telegramForm, setTelegramForm] = useState<TelegramForm>({ telegramId: '', code: '' });
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [telegramSending, setTelegramSending] = useState(false);
    const [telegramLoading, setTelegramLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const queryError = useMemo(() => mapAuthError(authErrorCode), [authErrorCode]);
    const finalError = error || queryError;

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setInfo('');

        const res = await signIn('credentials', {
            redirect: false,
            email: credentialsForm.email,
            password: credentialsForm.password,
        });

        setLoading(false);

        if (res?.ok && !res.error) {
            router.push('/dashboard');
            return;
        }

        setError('Неверный email или пароль');
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        setInfo('');
        await signIn('google', { callbackUrl: '/dashboard' });
    };

    const handleSendTelegramCode = async () => {
        if (!telegramForm.telegramId.trim()) {
            setError('Введите Telegram ID');
            return;
        }

        setTelegramSending(true);
        setError('');
        setInfo('');

        try {
            const res = await fetch('/api/auth/telegram/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId: telegramForm.telegramId }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не удалось отправить код в Telegram');
                return;
            }

            setInfo(data.message || 'Код отправлен в Telegram.');
        } catch (requestError) {
            console.error(requestError);
            setError('Ошибка отправки кода');
        } finally {
            setTelegramSending(false);
        }
    };

    const handleTelegramLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setTelegramLoading(true);
        setError('');
        setInfo('');

        const res = await signIn('telegram', {
            redirect: false,
            telegramId: telegramForm.telegramId,
            code: telegramForm.code,
        });

        setTelegramLoading(false);

        if (res?.ok && !res.error) {
            router.push('/dashboard');
            return;
        }

        setError('Неверный Telegram ID или код');
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
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc00] text-lg font-bold text-[#1d1d1f]">
                                    B
                                </div>
                                <div>
                                    <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">BuhAI</div>
                                    <div className="text-xs text-muted-foreground">Финансовая платформа</div>
                                </div>
                            </div>
                            <h1 className="mt-10 text-4xl font-bold tracking-[-0.05em] text-foreground">Вход в систему</h1>
                            <p className="mt-4 text-sm leading-7 text-muted-foreground">
                                Доступные способы: Email + пароль, Google, Telegram-код.
                            </p>
                        </div>
                    </section>

                    <section className="glass-card p-8 md:p-10">
                        <div className="mb-8">
                            <div className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Авторизация</div>
                            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-foreground">Войти в BuhAI</h2>
                            <p className="mt-2 text-sm text-muted-foreground">Используйте удобный способ входа.</p>
                        </div>

                        {registered && (
                            <div className="mb-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                                Аккаунт успешно создан. Теперь выполните вход.
                            </div>
                        )}
                        {resetDone && (
                            <div className="mb-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                                Пароль обновлен. Войдите с новым паролем.
                            </div>
                        )}
                        {finalError ? (
                            <div className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{finalError}</div>
                        ) : null}
                        {info ? <div className="mb-5 rounded-2xl bg-sky-500/10 px-4 py-3 text-sm text-sky-700">{info}</div> : null}

                        <form onSubmit={handleCredentialsLogin} className="space-y-4">
                            <Field
                                label="Email"
                                type="email"
                                value={credentialsForm.email}
                                onChange={(value) => setCredentialsForm((prev) => ({ ...prev, email: value }))}
                                placeholder="ceo@company.uz"
                            />
                            <Field
                                label="Пароль"
                                type="password"
                                value={credentialsForm.password}
                                onChange={(value) => setCredentialsForm((prev) => ({ ...prev, password: value }))}
                                placeholder="Ваш пароль"
                            />
                            <button type="submit" disabled={loading} className="pill-button pill-button-primary w-full justify-center py-3">
                                {loading ? 'Входим...' : 'Войти по email'}
                            </button>
                        </form>

                        <div className="my-6 h-px w-full bg-black/10" />

                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading}
                            className="pill-button w-full justify-center border border-black/10 bg-white/80 py-3 hover:bg-white"
                        >
                            {googleLoading ? 'Переход...' : 'Войти через Google'}
                        </button>

                        <div className="my-6 h-px w-full bg-black/10" />

                        <form onSubmit={handleTelegramLogin} className="space-y-4">
                            <Field
                                label="Telegram ID"
                                type="text"
                                value={telegramForm.telegramId}
                                onChange={(value) => setTelegramForm((prev) => ({ ...prev, telegramId: value }))}
                                placeholder="Например: 123456789"
                            />
                            <div className="flex gap-2">
                                <Field
                                    label="Код из Telegram"
                                    type="text"
                                    value={telegramForm.code}
                                    onChange={(value) => setTelegramForm((prev) => ({ ...prev, code: value }))}
                                    placeholder="6-значный код"
                                />
                                <button
                                    type="button"
                                    onClick={handleSendTelegramCode}
                                    disabled={telegramSending}
                                    className="pill-button mt-7 h-[46px] whitespace-nowrap"
                                >
                                    {telegramSending ? 'Отправка...' : 'Отправить код'}
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={telegramLoading}
                                className="pill-button pill-button-primary w-full justify-center py-3"
                            >
                                {telegramLoading ? 'Проверяем...' : 'Войти через Telegram'}
                            </button>
                        </form>

                        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                                Забыли пароль?
                            </Link>
                            <span>
                                Нет аккаунта?{' '}
                                <Link href="/register" className="font-medium text-primary hover:underline">
                                    Регистрация
                                </Link>
                            </span>
                        </div>
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
        <label className="block w-full">
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
