'use client';

import { Suspense, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import { DuoButton, GoogleIcon, TelegramIcon } from '@/components/auth/DuoElements';
import { BrandLogo } from '@/components/layout/BrandLogo';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

const INITIAL_FORM: RegisterForm = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterFallback />}>
            <RegisterContent />
        </Suspense>
    );
}

function RegisterContent() {
    const router = useRouter();

    const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!form.email.trim()) {
            setError('Введите email.');
            return;
        }

        if (form.password.length < 8) {
            setError('Пароль должен быть минимум 8 символов.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Пароли не совпадают.');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name || undefined,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не удалось создать аккаунт.');
                return;
            }

            router.push('/login?registered=1');
        } catch (requestError) {
            console.error(requestError);
            setError('Ошибка подключения к серверу.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        setError('');
        await signIn('google', { callbackUrl: '/dashboard' });
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
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-800">Создать аккаунт</h1>
                    <p className="mt-2 text-sm font-medium text-gray-500">Простой старт: email, пароль и сразу вход в систему.</p>
                </header>

                {error ? <div className="duo-alert-error">{error}</div> : null}

                <form onSubmit={handleSubmit} className="mb-6 space-y-4">
                    <label className="block">
                        <span className="sr-only">Имя</span>
                        <div className="relative">
                            <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                className="duo-field pl-11"
                                placeholder="Имя (опционально)"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="sr-only">Email</span>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
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
                                value={form.password}
                                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                                className="duo-field pl-11"
                                placeholder="Пароль"
                                required
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="sr-only">Повторите пароль</span>
                        <div className="relative">
                            <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="password"
                                value={form.confirmPassword}
                                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                className="duo-field pl-11"
                                placeholder="Повторите пароль"
                                required
                            />
                        </div>
                    </label>

                    <DuoButton type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Создаем...' : 'Продолжить с Email'}
                    </DuoButton>
                </form>

                <div className="duo-divider">
                    <span>ИЛИ</span>
                </div>

                <div className="mb-7 space-y-3">
                    <DuoButton variant="secondary" icon={<GoogleIcon />} onClick={handleGoogleRegister} disabled={googleLoading}>
                        {googleLoading ? 'Переход в Google...' : 'Продолжить с Google'}
                    </DuoButton>
                    <DuoButton variant="secondary" icon={<TelegramIcon />} onClick={() => router.push('/login')}>
                        Войти через Telegram
                    </DuoButton>
                </div>

                <div className="text-center">
                    <p className="text-sm font-medium text-gray-500">
                        Уже есть аккаунт?{' '}
                        <Link href="/login" className="inline-flex items-center gap-1 font-bold text-[#1cb0f6] transition-colors hover:text-[#1899d6]">
                            Войти
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

function RegisterFallback() {
    return (
        <main className="duo-auth-shell">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}
