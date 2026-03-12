'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/password/forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Не удалось отправить письмо');
                return;
            }

            setMessage(data.message || 'Письмо отправлено');
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
                <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">Восстановление пароля</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                    Укажите email аккаунта. Мы отправим ссылку для установки нового пароля.
                </p>

                {error ? <div className="mt-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div> : null}
                {message ? <div className="mt-5 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-medium text-foreground">Email</span>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="ceo@company.uz"
                            className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                        />
                    </label>
                    <button type="submit" disabled={loading} className="pill-button pill-button-primary w-full justify-center py-3">
                        {loading ? 'Отправляем...' : 'Отправить ссылку'}
                    </button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground">
                    Вспомнили пароль?{' '}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Вернуться ко входу
                    </Link>
                </p>
            </div>
        </main>
    );
}
