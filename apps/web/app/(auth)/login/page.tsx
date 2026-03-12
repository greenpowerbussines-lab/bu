'use client';

import { Suspense, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, Lock, Mail, MessageCircle } from 'lucide-react';
import { DuoButton, GoogleIcon, TelegramIcon } from '@/components/auth/DuoElements';
import { BrandLogo } from '@/components/layout/BrandLogo';

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
    if (code === 'OAuthSignin') return 'Ошибка входа через Google.';
    if (code === 'OAuthCallback') return 'Ошибка callback от Google.';
    if (code === 'OAuthCreateAccount') return 'Не удалось создать аккаунт через Google.';
    if (code === 'OAuthAccountNotLinked') return 'Этот email уже привязан к другому способу входа.';
    if (code === 'CredentialsSignin') return 'Неверные данные для входа.';

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

    const handleCredentialsLogin = async (e: FormEvent<HTMLFormElement>) => {
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

        setError('Неверный email или пароль.');
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError('');
        setInfo('');
        await signIn('google', { callbackUrl: '/dashboard' });
    };

    const handleSendTelegramCode = async () => {
        if (!telegramForm.telegramId.trim()) {
            setError('Введите Telegram ID.');
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
                setError(data.error || 'Не удалось отправить код в Telegram.');
                return;
            }

            setInfo(data.message || 'Код отправлен в Telegram.');
        } catch (requestError) {
            console.error(requestError);
            setError('Ошибка отправки кода.');
        } finally {
            setTelegramSending(false);
        }
    };

    const handleTelegramLogin = async (e: FormEvent<HTMLFormElement>) => {
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

        setError('Неверный Telegram ID или код.');
    };

    return (
        <main className="duo-auth-shell relative overflow-hidden">
            <div className="duo-blob duo-blob-a" aria-hidden />
            <div className="duo-blob duo-blob-b" aria-hidden />

            <section className="duo-auth-card">
                <div className="mb-6 flex justify-center">
                    <BrandLogo href="/" />
                </div>

                <header className="mb-8 text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">С возвращением</h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">Войдите в аккаунт и продолжайте работу.</p>
                </header>

                {registered ? <div className="duo-alert-success">Аккаунт создан. Теперь войдите в систему.</div> : null}
                {resetDone ? <div className="duo-alert-success">Пароль обновлен. Войдите с новым паролем.</div> : null}
                {finalError ? <div className="duo-alert-error">{finalError}</div> : null}
                {info ? <div className="duo-alert-info">{info}</div> : null}

                <form onSubmit={handleCredentialsLogin} className="mb-6 space-y-4">
                    <label className="block">
                        <span className="sr-only">Email</span>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={credentialsForm.email}
                                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, email: e.target.value }))}
                                className="duo-field pl-11"
                                placeholder="Email"
                                required
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="sr-only">Пароль</span>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={credentialsForm.password}
                                onChange={(e) => setCredentialsForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="duo-field pl-11"
                                placeholder="Пароль"
                                required
                            />
                        </div>
                    </label>

                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-sm font-bold text-[#1cb0f6] transition-colors hover:text-[#1899d6]">
                            Забыли пароль?
                        </Link>
                    </div>

                    <DuoButton type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Входим...' : 'Войти через Email'}
                    </DuoButton>
                </form>

                <div className="duo-divider">
                    <span>ИЛИ</span>
                </div>

                <div className="mb-6 space-y-3">
                    <DuoButton variant="secondary" icon={<GoogleIcon />} onClick={handleGoogleLogin} disabled={googleLoading}>
                        {googleLoading ? 'Переход в Google...' : 'Продолжить с Google'}
                    </DuoButton>
                </div>

                <form onSubmit={handleTelegramLogin} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700">
                        <MessageCircle className="h-4 w-4 text-[#2AABEE]" />
                        Telegram Login
                    </div>

                    <div className="space-y-3">
                        <input
                            type="text"
                            value={telegramForm.telegramId}
                            onChange={(e) => setTelegramForm((prev) => ({ ...prev, telegramId: e.target.value }))}
                            className="duo-field"
                            placeholder="Telegram ID"
                            required
                        />

                        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                            <input
                                type="text"
                                value={telegramForm.code}
                                onChange={(e) => setTelegramForm((prev) => ({ ...prev, code: e.target.value }))}
                                className="duo-field"
                                placeholder="Код из Telegram"
                                required
                            />
                            <DuoButton
                                type="button"
                                variant="secondary"
                                icon={<TelegramIcon />}
                                onClick={handleSendTelegramCode}
                                disabled={telegramSending}
                                className="sm:w-auto sm:px-4"
                            >
                                {telegramSending ? 'Отправка...' : 'Код'}
                            </DuoButton>
                        </div>

                        <DuoButton type="submit" variant="primary" icon={<TelegramIcon />} disabled={telegramLoading}>
                            {telegramLoading ? 'Проверяем...' : 'Войти через Telegram'}
                        </DuoButton>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm font-medium text-gray-500">
                        Нет аккаунта?{' '}
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-1 font-bold text-[#1cb0f6] transition-colors hover:text-[#1899d6]"
                        >
                            Зарегистрироваться
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

function LoginFallback() {
    return (
        <main className="duo-auth-shell">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}
