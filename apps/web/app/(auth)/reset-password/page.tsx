'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<ResetPasswordFallback />}>
            <ResetPasswordContent />
        </Suspense>
    );
}

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError('Токен сброса отсутствует. Используйте ссылку из письма.');
            return;
        }

        if (password.length < 8) {
            setError('Пароль должен содержать минимум 8 символов');
            return;
        }

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/password/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не удалось обновить пароль');
                return;
            }

            setMessage('Пароль успешно обновлен. Перенаправляем на страницу входа...');
            setTimeout(() => router.push('/login?reset=1'), 1200);
        } catch (requestError) {
            console.error(requestError);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="surface-panel w-full max-w-[560px] p-8">
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">Новый пароль</h1>
                <p className="mt-3 text-sm text-muted-foreground">Введите новый пароль для вашего аккаунта BuhAI.</p>

                {error ? <div className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div> : null}
                {message ? <div className="mt-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Новый пароль</span>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Минимум 8 символов"
                            className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Повторите пароль</span>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Повторите новый пароль"
                            className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                        />
                    </label>

                    <button type="submit" disabled={loading} className="pill-button pill-button-primary w-full justify-center py-3">
                        {loading ? 'Сохраняем...' : 'Сохранить новый пароль'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground">
                    Вернуться ко входу:{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Страница логина
                    </Link>
                </p>
            </div>
        </main>
    );
}

function ResetPasswordFallback() {
    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}
