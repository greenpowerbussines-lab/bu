'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NotificationsPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [reminders, setReminders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);

    const fetchReminders = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/notifications/ar?orgId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setReminders(data);
            }
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
            toast.error('Ошибка загрузки напоминаний');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchReminders();
    }, [fetchReminders]);

    const sendReminder = async (documentId: string, channel: 'EMAIL' | 'TELEGRAM') => {
        if (!orgId) return;
        setSending(documentId);
        try {
            const res = await fetch(`${API_URL}/api/notifications/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, documentId, channel }),
            });

            if (res.ok) {
                toast.success(`Напоминание отправлено через ${channel}`);
                setReminders(prev => prev.map(r => r.id === documentId ? { ...r, status: 'SENT' } : r));
            }
        } catch (error) {
            toast.error('Ошибка при отправке');
        } finally {
            setSending(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold">Уведомления о дебиторке (AR)</h1>
                <p className="text-sm text-muted-foreground mt-1">Автоматическое отслеживание неоплаченных счетов и напоминания клиентам</p>
            </div>

            <div className="glass-card p-5">
                <h2 className="font-semibold mb-4">Ожидают оплаты</h2>
                <div className="space-y-3">
                    {loading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />)}
                        </div>
                    ) : reminders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Просроченных счетов не найдено 🎉
                        </div>
                    ) : (
                        reminders.map((r) => (
                            <div key={r.id} className="flex items-center gap-4 p-4 border border-border/40 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-rose-400/10 flex items-center justify-center text-rose-400">
                                    ⏳
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{r.clientName}</h3>
                                    <p className="text-xs text-muted-foreground">Просрочка: {r.daysOverdue} дн. · Сумма: {r.amount.toLocaleString('ru-RU')} ₽</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => sendReminder(r.id, 'EMAIL')}
                                        disabled={sending === r.id}
                                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium rounded-lg transition-colors border border-primary/20"
                                    >
                                        Email
                                    </button>
                                    <button
                                        onClick={() => sendReminder(r.id, 'TELEGRAM')}
                                        disabled={sending === r.id}
                                        className="px-3 py-1.5 bg-buhai-500/10 hover:bg-buhai-500/20 text-buhai-300 text-xs font-medium rounded-lg transition-colors border border-buhai-500/20"
                                    >
                                        Telegram
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="glass-card p-5">
                <h2 className="font-semibold mb-2">Настройки автоматизации</h2>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                        <div className="text-sm font-medium">Авто-напоминания (3/7/14 дней)</div>
                        <div className="text-xs text-muted-foreground">Отправлять напоминания автоматически при наступлении дедлайна</div>
                    </div>
                    <div className="w-10 h-5 bg-primary/20 rounded-full relative cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-primary rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
