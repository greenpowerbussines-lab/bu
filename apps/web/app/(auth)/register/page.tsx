'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    orgName: string;
    inn: string;
    taxRegime: string;
    telegramId: string;
};

const INITIAL_FORM: RegisterForm = {
    name: '',
    email: '',
    password: '',
    orgName: '',
    inn: '',
    taxRegime: 'USN',
    telegramId: '',
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
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
                setError('Заполните имя, email и пароль');
                return;
            }
            if (form.password.length < 8) {
                setError('Пароль должен быть минимум 8 символов');
                return;
            }
            setStep(2);
            return;
        }

        if (!form.orgName.trim() || !form.inn.trim()) {
            setError('Заполните название компании и ИНН');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    orgName: form.orgName,
                    inn: form.inn,
                    taxRegime: form.taxRegime,
                    telegramId: form.telegramId || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Не удалось создать аккаунт');
                return;
            }

            router.push('/login?registered=1');
        } catch (requestError) {
            console.error(requestError);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="surface-panel relative w-full max-w-[1180px] overflow-hidden p-4 md:p-6">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-80px] top-[-60px] h-56 w-56 rounded-full bg-[#ffcc00]/20 blur-3xl" />
                    <div className="absolute right-[-60px] bottom-[-60px] h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                </div>

                <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_1.05fr]">
                    <section className="glass-card p-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc00] text-lg font-bold text-[#1d1d1f]">
                                B
                            </div>
                            <div>
                                <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">BuhAI</div>
                                <div className="text-xs text-muted-foreground">Регистрация CEO</div>
                            </div>
                        </div>

                        <h1 className="mt-10 text-4xl font-bold tracking-[-0.05em] text-foreground">Создание компании</h1>
                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            Регистрация выполняется через Email + пароль. После регистрации можно входить через Google и Telegram.
                        </p>
                    </section>

                    <section className="glass-card p-8 md:p-10">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-full border border-black/6 bg-white/80 px-4 py-2 text-sm text-muted-foreground">
                                Шаг {step} из 2
                            </div>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#0071e3,#ffcc00)] transition-all duration-300"
                                    style={{ width: `${step * 50}%` }}
                                />
                            </div>
                        </div>

                        {error ? <div className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div> : null}

                        {step === 1 ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Field
                                    label="Имя CEO"
                                    value={form.name}
                                    onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                                    placeholder="Иван Иванов"
                                />
                                <Field
                                    label="Email CEO"
                                    type="email"
                                    value={form.email}
                                    onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                                    placeholder="ceo@company.uz"
                                />
                                <Field
                                    label="Пароль"
                                    type="password"
                                    value={form.password}
                                    onChange={(v) => setForm((p) => ({ ...p, password: v }))}
                                    placeholder="Минимум 8 символов"
                                />
                                <Field
                                    label="Telegram ID (опционально)"
                                    value={form.telegramId}
                                    onChange={(v) => setForm((p) => ({ ...p, telegramId: v.replace(/^@/, '') }))}
                                    placeholder="Например: 123456789"
                                    required={false}
                                />
                                <button type="submit" className="pill-button pill-button-primary w-full justify-center py-3">
                                    Продолжить
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Field
                                    label="Название компании"
                                    value={form.orgName}
                                    onChange={(v) => setForm((p) => ({ ...p, orgName: v }))}
                                    placeholder='ООО "Ромашка"'
                                />
                                <Field
                                    label="ИНН организации"
                                    value={form.inn}
                                    onChange={(v) => setForm((p) => ({ ...p, inn: v.trim() }))}
                                    placeholder="302846978"
                                />
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-foreground">Налоговый режим</span>
                                    <select
                                        value={form.taxRegime}
                                        onChange={(e) => setForm((p) => ({ ...p, taxRegime: e.target.value }))}
                                        className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                    >
                                        <option value="USN">УСН</option>
                                        <option value="OSN">ОСН</option>
                                        <option value="PATENT">Патент</option>
                                        <option value="ENVD">ЕНВД</option>
                                        <option value="ESN">ЕСХН</option>
                                    </select>
                                </label>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button type="button" onClick={() => setStep(1)} className="pill-button">
                                        Назад
                                    </button>
                                    <button type="submit" disabled={loading} className="pill-button pill-button-primary flex-1 justify-center py-3">
                                        {loading ? 'Создаем аккаунт...' : 'Зарегистрировать компанию'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <p className="mt-6 text-sm text-muted-foreground">
                            Уже есть аккаунт?{' '}
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Войти
                            </Link>
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

function RegisterFallback() {
    return (
        <main className="app-shell flex min-h-screen items-center justify-center px-4 py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </main>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    required = true,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                required={required}
                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
        </label>
    );
}
