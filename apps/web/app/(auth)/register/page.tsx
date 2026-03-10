'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Method = 'credentials' | 'oneid' | 'eri';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    orgName: string;
    inn: string;
    taxRegime: string;
    authMethod: Method;
    oneIdSub: string;
    eriKeyName: string;
    eriKeyData: string;
};

const INITIAL_FORM: RegisterForm = {
    name: '',
    email: '',
    password: '',
    orgName: '',
    inn: '',
    taxRegime: 'USN',
    authMethod: 'credentials',
    oneIdSub: '',
    eriKeyName: '',
    eriKeyData: '',
};

function bytesToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let result = '';
    for (const byte of bytes) {
        result += byte.toString(16).padStart(2, '0');
    }
    return result;
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<RegisterFallback />}>
            <RegisterContent />
        </Suspense>
    );
}

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState<RegisterForm>(INITIAL_FORM);

    const oneIdSub = searchParams.get('oneid_sub');
    const oneIdName = searchParams.get('oneid_name');
    const oneIdEmail = searchParams.get('oneid_email');
    const oneIdError = searchParams.get('error');
    const oneIdAuth = searchParams.get('auth');

    useEffect(() => {
        if (oneIdError) {
            setError(oneIdError);
        }
    }, [oneIdError]);

    useEffect(() => {
        if (!oneIdSub && !oneIdAuth) return;

        setForm((prev) => ({
            ...prev,
            authMethod: 'oneid',
            oneIdSub: oneIdSub || prev.oneIdSub,
            name: oneIdName || prev.name,
            email: oneIdEmail || prev.email,
        }));
    }, [oneIdAuth, oneIdEmail, oneIdName, oneIdSub]);

    const selectedMethodLabel = useMemo(() => {
        if (form.authMethod === 'oneid') return 'OneID Uzbekistan';
        if (form.authMethod === 'eri') return 'ERI / ЭЦП';
        return 'Email + Пароль';
    }, [form.authMethod]);

    const handleEriUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const fileBytes = await file.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', fileBytes);
        const fingerprint = bytesToHex(digest);

        setForm((prev) => ({
            ...prev,
            authMethod: 'eri',
            eriKeyName: file.name,
            eriKeyData: JSON.stringify({
                fileName: file.name,
                size: file.size,
                fingerprint,
                uploadedAt: new Date().toISOString(),
            }),
        }));
    };

    const handleOneIdStart = () => {
        window.location.href = '/api/auth/oneid/start?mode=register';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (step === 1) {
            if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
                setError('Заполните имя, email и пароль CEO');
                return;
            }
            if (form.password.length < 8) {
                setError('Пароль CEO должен быть минимум 8 символов');
                return;
            }
            setStep(2);
            return;
        }

        if (form.authMethod === 'oneid' && !form.oneIdSub) {
            setError('Для OneID требуется пройти авторизацию через портал OneID');
            return;
        }

        if (form.authMethod === 'eri' && !form.eriKeyData) {
            setError('Для ERI требуется загрузить ключ');
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
                    authMethod: form.authMethod,
                    oneIdSub: form.oneIdSub,
                    eriKeyData: form.eriKeyData,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Не удалось создать аккаунт');
                return;
            }

            router.push('/login?registered=1');
        } catch (err) {
            console.error(err);
            setError('Ошибка подключения к серверу. Попробуйте снова.');
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
                                <div className="text-xs text-muted-foreground">AI-бухгалтерия для Узбекистана</div>
                            </div>
                        </div>

                        <h1 className="mt-10 text-4xl font-bold tracking-[-0.05em] text-foreground">Регистрация CEO</h1>
                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                            CEO регистрирует компанию, назначает роли и создает доступ сотрудникам. Сотрудники входят только по логину и паролю, созданным CEO.
                        </p>

                        <div className="mt-8 rounded-2xl bg-white/70 p-4 text-sm">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Выбранный метод</div>
                            <div className="mt-2 font-medium text-foreground">{selectedMethodLabel}</div>
                            {form.authMethod === 'oneid' && form.oneIdSub ? (
                                <div className="mt-1 text-xs text-muted-foreground">OneID SUB: {form.oneIdSub}</div>
                            ) : null}
                            {form.authMethod === 'eri' && form.eriKeyName ? (
                                <div className="mt-1 text-xs text-muted-foreground">Файл ERI: {form.eriKeyName}</div>
                            ) : null}
                        </div>
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

                        {error ? (
                            <div className="mb-5 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">{error}</div>
                        ) : null}

                        {step === 1 ? (
                            <>
                                <div className="mb-6">
                                    <div className="mb-3 text-sm font-medium text-foreground">Способ подтверждения CEO</div>
                                    <div className="grid gap-3">
                                        <button
                                            type="button"
                                            onClick={handleOneIdStart}
                                            className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${
                                                form.authMethod === 'oneid'
                                                    ? 'border-[#1a6dff]/70 bg-[#1a6dff]/10'
                                                    : 'border-[#1a6dff]/30 bg-[#1a6dff]/5 hover:border-[#1a6dff]/60 hover:bg-[#1a6dff]/10'
                                            }`}
                                        >
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#1a6dff] text-sm font-bold text-white">
                                                ID
                                            </span>
                                            <div>
                                                <div className="font-semibold text-foreground">OneID Uzbekistan</div>
                                                <div className="text-xs text-muted-foreground">Подтверждение личности через OneID</div>
                                            </div>
                                        </button>

                                        <label
                                            className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-4 transition ${
                                                form.authMethod === 'eri'
                                                    ? 'border-emerald-500/70 bg-emerald-50'
                                                    : 'border-emerald-300/40 bg-emerald-50/60 hover:border-emerald-400/60'
                                            }`}
                                        >
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold text-white">
                                                ERI
                                            </span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-foreground">ERI / ЭЦП ключ</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {form.eriKeyName ? `Файл загружен: ${form.eriKeyName}` : 'Загрузите ключ для подтверждения'}
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".key,.pfx,.p12,.cer,.pem"
                                                className="hidden"
                                                onChange={handleEriUpload}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, authMethod: 'credentials', oneIdSub: '', eriKeyData: '', eriKeyName: '' }))}
                                            className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition ${
                                                form.authMethod === 'credentials'
                                                    ? 'border-black/20 bg-black/[0.04]'
                                                    : 'border-black/8 bg-white/70 hover:border-black/15'
                                            }`}
                                        >
                                            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-black/80 text-sm font-bold text-white">
                                                PW
                                            </span>
                                            <div>
                                                <div className="font-semibold text-foreground">Email + пароль</div>
                                                <div className="text-xs text-muted-foreground">Базовая регистрация без OneID и ERI</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

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
                                        label="Пароль CEO"
                                        type="password"
                                        value={form.password}
                                        onChange={(v) => setForm((p) => ({ ...p, password: v }))}
                                        placeholder="Минимум 8 символов"
                                    />
                                    <button type="submit" className="pill-button pill-button-primary w-full justify-center py-3">
                                        Продолжить →
                                    </button>
                                </form>
                            </>
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
                                    onChange={(v) => setForm((p) => ({ ...p, inn: v.replace(/\D/g, '').slice(0, 12) }))}
                                    placeholder="302846978"
                                />
                                <label className="block">
                                    <span className="mb-2 block text-sm font-medium text-foreground">Налоговый режим</span>
                                    <select
                                        value={form.taxRegime}
                                        onChange={(e) => setForm((p) => ({ ...p, taxRegime: e.target.value }))}
                                        className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                                    >
                                        <option value="USN">УСН — Упрощенная система</option>
                                        <option value="OSN">ОСН — Общая система</option>
                                        <option value="PATENT">Патент</option>
                                        <option value="ESN">ЕСХН</option>
                                    </select>
                                </label>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <button type="button" onClick={() => setStep(1)} className="pill-button">
                                        ← Назад
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
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    type?: string;
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
