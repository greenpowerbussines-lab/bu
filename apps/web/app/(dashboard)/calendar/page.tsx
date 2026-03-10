'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const MOCK_DEADLINES = [
    { id: '1', name: 'Авансовый платёж УСН (Q1)', dueDate: '2024-04-28', description: 'Авансовый платёж за I квартал по УСН', docsRequired: ['КУДиР'], completed: false, daysLeft: 14 },
    { id: '2', name: 'РСВ за I квартал', dueDate: '2024-04-25', description: 'Расчёт по страховым взносам', docsRequired: ['Ведомости', 'Трудовые договоры'], completed: false, daysLeft: 11 },
    { id: '3', name: 'Декларация УСН за 2023', dueDate: '2024-03-25', description: 'Годовая декларация по УСН', docsRequired: ['КУДиР', 'Платёжные поручения'], completed: true, daysLeft: -3 },
    { id: '4', name: 'Авансовый платёж УСН (Q2)', dueDate: '2024-07-28', description: 'Авансовый платёж за II квартал по УСН', docsRequired: ['КУДиР'], completed: false, daysLeft: 105 },
    { id: '5', name: 'РСВ за полугодие', dueDate: '2024-07-25', description: 'Расчёт по страховым взносам (полугодие)', docsRequired: ['Ведомости'], completed: false, daysLeft: 102 },
    { id: '6', name: 'Авансовый платёж УСН (Q3)', dueDate: '2024-10-28', description: 'Авансовый платёж за III квартал по УСН', docsRequired: ['КУДиР'], completed: false, daysLeft: 197 },
];

function urgencyColor(days: number, completed: boolean) {
    if (completed) return 'border-emerald-500/20 bg-emerald-500/5';
    if (days < 0) return 'border-rose-500/20 bg-rose-500/5';
    if (days <= 7) return 'border-rose-400/30 bg-rose-400/5';
    if (days <= 14) return 'border-amber-400/30 bg-amber-400/5';
    return 'border-border/30 bg-muted/20';
}

function daysLabel(days: number, completed: boolean) {
    if (completed) return { text: '✅ Выполнено', cls: 'text-emerald-400' };
    if (days < 0) return { text: `Просрочено (${Math.abs(days)} дн.)`, cls: 'text-rose-400' };
    if (days === 0) return { text: 'Сегодня!', cls: 'text-rose-400' };
    if (days <= 7) return { text: `🔴 ${days} дней`, cls: 'text-rose-400' };
    if (days <= 14) return { text: `🟡 ${days} дней`, cls: 'text-amber-400' };
    return { text: `${days} дней`, cls: 'text-muted-foreground' };
}

export default function CalendarPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [deadlines, setDeadlines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDeadlines = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/deadlines?orgId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                // Map and calculate daysLeft
                const now = new Date();
                now.setHours(0, 0, 0, 0);

                const mapped = data.map((d: any) => {
                    const due = new Date(d.dueDate);
                    due.setHours(0, 0, 0, 0);
                    const diffTime = due.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return { ...d, daysLeft: diffDays };
                });
                setDeadlines(mapped);
            }
        } catch (error) {
            console.error('Failed to fetch deadlines:', error);
            toast.error('Ошибка загрузки календаря');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchDeadlines();
    }, [fetchDeadlines]);

    const toggle = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${API_URL}/api/deadlines/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus }),
            });
            if (res.ok) {
                setDeadlines(prev => prev.map(d => d.id === id ? { ...d, completed: !currentStatus } : d));
                toast.success(!currentStatus ? 'Отмечено как выполнено' : 'Статус изменён');
            }
        } catch (error) {
            toast.error('Ошибка при обновлении статуса');
        }
    };

    const upcoming = deadlines.filter(d => !d.completed && d.daysLeft >= 0).sort((a, b) => a.daysLeft - b.daysLeft);
    const overdue = deadlines.filter(d => !d.completed && d.daysLeft < 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Налоговый календарь</h1>
                    <p className="text-sm text-muted-foreground mt-1">Дедлайны для вашего режима УСН · 2024 год</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Срочно</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Скоро</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Готово</span>
                </div>
            </div>

            {/* Progress */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Прогресс 2024</h2>
                    <span className="text-sm text-muted-foreground">{deadlines.filter(d => d.completed).length} / {deadlines.length} выполнено</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-buhai-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${(deadlines.filter(d => d.completed).length / deadlines.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Overdue */}
            {overdue.length > 0 && (
                <div className="glass-card p-5 border border-rose-500/30">
                    <h2 className="font-semibold text-rose-400 mb-3">🚨 Просроченные дедлайны ({overdue.length})</h2>
                    <div className="space-y-2">
                        {overdue.map((d) => (
                            <DeadlineRow key={d.id} d={d} onToggle={toggle} />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming */}
            <div className="space-y-3">
                <h2 className="font-semibold">Предстоящие дедлайны</h2>
                {upcoming.map((d) => <DeadlineRow key={d.id} d={d} onToggle={toggle} />)}
                {upcoming.length === 0 && <p className="text-muted-foreground text-sm">Нет предстоящих дедлайнов 🎉</p>}
            </div>

            {/* Completed */}
            {deadlines.filter(d => d.completed).length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-semibold text-muted-foreground">Выполненные</h2>
                    {deadlines.filter(d => d.completed).map((d) => <DeadlineRow key={d.id} d={d} onToggle={toggle} />)}
                </div>
            )}
        </div>
    );
}

function DeadlineRow({ d, onToggle }: { d: any; onToggle: (id: string, completed: boolean) => void }) {
    const { text, cls } = daysLabel(d.daysLeft, d.completed);
    return (
        <div className={`glass-card p-4 border ${urgencyColor(d.daysLeft, d.completed)} transition-all`}>
            <div className="flex items-start gap-4">
                <button
                    onClick={() => onToggle(d.id, d.completed)}
                    className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${d.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-border hover:border-primary'
                        }`}
                >
                    {d.completed && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={`font-medium ${d.completed ? 'line-through text-muted-foreground' : ''}`}>{d.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                    {d.docsRequired.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs text-muted-foreground">Документы:</span>
                            {d.docsRequired.map((doc: string) => (
                                <span key={doc} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{doc}</span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 text-right">
                    <div className={`text-sm font-medium ${cls}`}>{text}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{new Date(d.dueDate).toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
        </div>
    );
}
