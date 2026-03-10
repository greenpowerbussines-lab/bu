'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Bot, FileText, Landmark, TrendingUp, Wallet } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MOCK_DATA = {
    cashflow: { thisWeekRub: 847000, trendPercent: 12 },
    documents: { pendingCount: 7 },
    risks: { highRiskContractors: ['ООО "МегаПоставка"'] },
    aiInsights: [
        'Выявлен рост по статье "Маркетинговые услуги" на 45% относительно обычного уровня.',
        'Семь документов всё ещё ждут обработки. Их лучше закрыть до конца дня.',
        'Авансовый платёж по УСН через 14 дней. Подготовьте резерв заранее.',
    ],
};

const CASHFLOW_DATA = [
    { day: 'Пн', income: 320, expense: 180 },
    { day: 'Вт', income: 145, expense: 90 },
    { day: 'Ср', income: 280, expense: 210 },
    { day: 'Чт', income: 430, expense: 165 },
    { day: 'Пт', income: 390, expense: 240 },
    { day: 'Сб', income: 89, expense: 45 },
    { day: 'Вс', income: 140, expense: 70 },
];

const RECENT_OPERATIONS = [
    { date: '12 мар 2026', counterparty: 'ООО "ТехПром"', purpose: 'Оплата по счёту №45 (оборудование)', amount: 450000, status: 'Проведено', positive: true },
    { date: '11 мар 2026', counterparty: 'ИП Иванов А.В.', purpose: 'Аренда помещения за март', amount: -120000, status: 'Проведено', positive: false },
    { date: '10 мар 2026', counterparty: 'Яндекс Директ', purpose: 'Оплата рекламных услуг', amount: -85500, status: 'В обработке', positive: false },
    { date: '09 мар 2026', counterparty: 'АО "Альфа-Банк"', purpose: 'Комиссия за ведение счёта', amount: -4500, status: 'Проведено', positive: false },
    { date: '08 мар 2026', counterparty: 'ООО "СофтЛайн"', purpose: 'Продление лицензий ПО', amount: -245000, status: 'Отклонено', positive: false },
];

function formatRub(value: number) {
    return `${value.toLocaleString('ru-RU')} ₽`;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as { orgId?: string } | undefined)?.orgId;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchDashboard = useCallback(async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/analysis/dashboard?orgId=${orgId}`);
            if (!res.ok) {
                throw new Error('dashboard_fetch_failed');
            }

            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Dashboard fetch failed:', error);
            toast.error('Не удалось загрузить дашборд, показываем демо-данные');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    const displayData = data || MOCK_DATA;

    const metrics = useMemo(
        () => [
            {
                label: 'Поступления',
                value: formatRub(displayData.cashflow?.thisWeekRub || 0),
                trend: `+${displayData.cashflow?.trendPercent || 0}% к прошлой неделе`,
                icon: Wallet,
                trendUp: true,
                tone: 'bg-primary/10 text-primary',
            },
            {
                label: 'Документы',
                value: `${displayData.documents?.pendingCount || 0}`,
                trend: 'ждут обработки',
                icon: FileText,
                trendUp: false,
                tone: 'bg-amber-500/10 text-amber-600',
            },
            {
                label: 'Налоговые риски',
                value: `${displayData.risks?.highRiskContractors?.length || 0}`,
                trend: 'зоны внимания',
                icon: Landmark,
                trendUp: false,
                tone: 'bg-rose-500/10 text-rose-500',
            },
            {
                label: 'Чистая динамика',
                value: formatRub((displayData.cashflow?.thisWeekRub || 0) - 184050),
                trend: 'прогноз на конец недели',
                icon: TrendingUp,
                trendUp: true,
                tone: 'bg-emerald-500/10 text-emerald-600',
            },
        ],
        [displayData],
    );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="mb-2 text-sm font-medium text-muted-foreground">Среда, 10 марта 2026</p>
                    <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground md:text-4xl">Финансовая сводка</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                        Управленческий обзор в стиле нового макета: движение денег, проблемные зоны и рекомендации AI на одном экране.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button type="button" className="pill-button">
                        Март 2026
                    </button>
                    <Link href="/archive" className="pill-button pill-button-primary">
                        Загрузить документы
                    </Link>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => {
                    const Icon = metric.icon;

                    return (
                        <article key={metric.label} className="metric-card bg-white/85 p-6">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-muted-foreground">{metric.label}</div>
                                    <div className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">{metric.value}</div>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-full ${metric.tone}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>

                            <div
                                className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                                    metric.trendUp ? 'text-emerald-600' : 'text-muted-foreground'
                                }`}
                            >
                                {metric.trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {metric.trend}
                            </div>
                        </article>
                    );
                })}
            </section>

            <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_0.9fr]">
                <article className="glass-card p-6">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Движение денежных средств</h2>
                            <p className="mt-1 text-sm text-muted-foreground">Поступления и списания за неделю, тыс. ₽</p>
                        </div>
                        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Обновлено сейчас</div>
                    </div>

                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CASHFLOW_DATA} margin={{ top: 20, right: 12, left: -24, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0071e3" stopOpacity={0.24} />
                                        <stop offset="95%" stopColor="#0071e3" stopOpacity={0.02} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff3b30" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(29,29,31,0.08)" vertical={false} />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#86868b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(0, 113, 227, 0.12)', strokeWidth: 1 }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.7)',
                                        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
                                        background: 'rgba(255,255,255,0.96)',
                                    }}
                                />
                                <Area type="monotone" dataKey="income" name="Поступления" stroke="#0071e3" strokeWidth={3} fill="url(#incomeGradient)" />
                                <Area type="monotone" dataKey="expense" name="Списания" stroke="#ff3b30" strokeWidth={2.5} fill="url(#expenseGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                <article className="glass-card relative overflow-hidden p-6">
                    <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#32C5FF,#B620E0,#F7B500)]" />
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#32C5FF,#B620E0)] text-white">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">Аналитика BuhAI</h2>
                            <p className="text-sm text-muted-foreground">Наблюдения и рекомендации по данным компании</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {displayData.aiInsights?.map((insight: string, index: number) => (
                            <div key={index} className="rounded-2xl bg-[rgba(245,245,247,0.92)] p-4 text-sm leading-6 text-muted-foreground">
                                {insight}
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link href="/reconcile" className="pill-button justify-center">
                            Сверить акт
                        </Link>
                        <Link href="/chat" className="pill-button justify-center text-primary">
                            Спросить AI
                        </Link>
                    </div>
                </article>
            </section>

            <section className="glass-card overflow-hidden p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">Последние банковские операции</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Операции, которые бухгалтерия видит прямо сейчас</p>
                    </div>
                    <Link href="/transactions" className="pill-button w-fit">
                        Все операции
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-black/5">
                                <th className="px-0 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Дата</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Контрагент</th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Назначение</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Сумма</th>
                                <th className="px-0 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(loading ? RECENT_OPERATIONS.slice(0, 3) : RECENT_OPERATIONS).map((item) => (
                                <tr key={`${item.date}-${item.counterparty}`} className="border-b border-black/[0.04] last:border-b-0">
                                    <td className="px-0 py-4 text-sm text-muted-foreground">{item.date}</td>
                                    <td className="px-4 py-4 text-sm font-semibold text-foreground">{item.counterparty}</td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">{item.purpose}</td>
                                    <td
                                        className={`px-4 py-4 text-right text-sm font-semibold ${
                                            item.positive ? 'text-emerald-600' : 'text-foreground'
                                        }`}
                                    >
                                        {item.positive ? '+' : ''}
                                        {formatRub(Math.abs(item.amount))}
                                    </td>
                                    <td className="px-0 py-4 text-right">
                                        <span
                                            className={`status-badge ${
                                                item.status === 'Проведено'
                                                    ? 'bg-emerald-500/10 text-emerald-700'
                                                    : item.status === 'Отклонено'
                                                      ? 'bg-rose-500/10 text-rose-600'
                                                      : 'bg-amber-500/10 text-amber-700'
                                            }`}
                                        >
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
