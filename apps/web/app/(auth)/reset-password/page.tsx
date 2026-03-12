'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
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
            setError('Ð¢Ð¾ÐºÐµÐ½ Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²ÑƒÐµÑ‚. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐ¹Ñ‚Ðµ ÑÑÑ‹Ð»ÐºÑƒ Ð¸Ð· Ð¿Ð¸ÑÑŒÐ¼Ð°.');
            return;
        }

        if (password.length < 8) {
            setError('ÐŸÐ°Ñ€Ð¾Ð»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑÐ¾Ð´ÐµÑ€Ð¶Ð°Ñ‚ÑŒ Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð².');
            return;
        }

        if (password !== confirmPassword) {
            setError('ÐŸÐ°Ñ€Ð¾Ð»Ð¸ Ð½Ðµ ÑÐ¾Ð²Ð¿Ð°Ð´Ð°ÑŽÑ‚.');
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
                setError(data.error || 'ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¾Ð±Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ.');
                return;
            }

            setMessage('ÐŸÐ°Ñ€Ð¾Ð»ÑŒ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½. ÐŸÐµÑ€ÐµÐ½Ð°Ð¿Ñ€Ð°Ð²Ð»ÑÐµÐ¼ Ð½Ð° Ð²Ñ…Ð¾Ð´...');
            setTimeout(() => router.push('/login?reset=1'), 1200);
        } catch (requestError) {
            console.error(requestError);
            setError('ÐžÑˆÐ¸Ð±ÐºÐ° Ð¿Ð¾Ð´ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¸Ñ Ðº ÑÐµÑ€Ð²ÐµÑ€Ñƒ.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="duo-auth-shell">
            <div className="duo-auth-grid md:grid-cols-[0.95fr_1.05fr]">
                <section className="duo-hero">
                    <BrandLogo href="/" />
                    <h1 className="duo-headline">ÐÐ¾Ð²Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ</h1>
                    <p className="duo-subline">Ð—Ð°Ð´Ð°Ð¹Ñ‚Ðµ Ð½Ð¾Ð²Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ Ð¸ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°Ð¹Ñ‚ÐµÑÑŒ Ðº Ñ€Ð°Ð±Ð¾Ñ‚Ðµ. Ð­Ñ‚Ð¾ Ð·Ð°Ð¹Ð¼ÐµÑ‚ Ð¼ÐµÐ½ÑŒÑˆÐµ Ð¼Ð¸Ð½ÑƒÑ‚Ñ‹.</p>
                </section>

                <section className="duo-panel">
                    <div className="mb-6 flex items-center justify-between">
                        <span className="duo-badge">Reset Password</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Secure Step</span>
                    </div>

                    {error ? <div className="duo-alert-error">{error}</div> : null}
                    {message ? <div className="duo-alert-success">{message}</div> : null}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="duo-label">ÐÐ¾Ð²Ñ‹Ð¹ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="duo-field"
                                required
                                placeholder="ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð¾Ð²"
                            />
                        </label>
                        <label className="block">
                            <span className="duo-label">ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð´Ð¸Ñ‚Ðµ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ</span>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="duo-field"
                                required
                                placeholder="ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€Ð¸Ñ‚Ðµ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ"
                            />
                        </label>
                        <button type="submit" disabled={loading} className="duo-button duo-button-primary">
                            {loading ? 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÑÐµÐ¼...' : 'Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-muted-foreground">
                        Ð’ÐµÑ€Ð½ÑƒÑ‚ÑŒÑÑ ÐºÐ¾ Ð²Ñ…Ð¾Ð´Ñƒ:{' '}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            Ð¡Ñ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° Ð»Ð¾Ð³Ð¸Ð½Ð°
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

function ResetPasswordFallback() {
    return (
        <main className="duo-auth-shell">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}

