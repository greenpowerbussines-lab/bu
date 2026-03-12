'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';

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
                setError(data.error || 'ÐÐµ ÑƒÐ´Ð°Ð»Ð¾ÑÑŒ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ Ð¿Ð¸ÑÑŒÐ¼Ð¾.');
                return;
            }

            setMessage(data.message || 'ÐŸÐ¸ÑÑŒÐ¼Ð¾ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¾.');
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
                    <h1 className="duo-headline">Ð¡Ð±Ñ€Ð¾Ñ Ð¿Ð°Ñ€Ð¾Ð»Ñ</h1>
                    <p className="duo-subline">Ð’Ð²ÐµÐ´Ð¸Ñ‚Ðµ email Ð°ÐºÐºÐ°ÑƒÐ½Ñ‚Ð°. ÐœÑ‹ Ð¾Ñ‚Ð¿Ñ€Ð°Ð²Ð¸Ð¼ Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½ÑƒÑŽ ÑÑÑ‹Ð»ÐºÑƒ Ð´Ð»Ñ ÑƒÑÑ‚Ð°Ð½Ð¾Ð²ÐºÐ¸ Ð½Ð¾Ð²Ð¾Ð³Ð¾ Ð¿Ð°Ñ€Ð¾Ð»Ñ.</p>
                </section>

                <section className="duo-panel">
                    <div className="mb-6 flex items-center justify-between">
                        <span className="duo-badge">Password Reset</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">SaaS Flow</span>
                    </div>

                    {error ? <div className="duo-alert-error">{error}</div> : null}
                    {message ? <div className="duo-alert-success">{message}</div> : null}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="duo-label">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="duo-field"
                                required
                                placeholder="you@company.com"
                            />
                        </label>
                        <button type="submit" disabled={loading} className="duo-button duo-button-primary">
                            {loading ? 'ÐžÑ‚Ð¿Ñ€Ð°Ð²Ð»ÑÐµÐ¼...' : 'ÐžÑ‚Ð¿Ñ€Ð°Ð²Ð¸Ñ‚ÑŒ ÑÑÑ‹Ð»ÐºÑƒ'}
                        </button>
                    </form>

                    <p className="mt-6 text-sm text-muted-foreground">
                        Ð’ÑÐ¿Ð¾Ð¼Ð½Ð¸Ð»Ð¸ Ð¿Ð°Ñ€Ð¾Ð»ÑŒ?{' '}
                        <Link href="/login" className="font-semibold text-primary hover:underline">
                            Ð’ÐµÑ€Ð½ÑƒÑ‚ÑŒÑÑ ÐºÐ¾ Ð²Ñ…Ð¾Ð´Ñƒ
                        </Link>
                    </p>
                </section>
            </div>
        </main>
    );
}

