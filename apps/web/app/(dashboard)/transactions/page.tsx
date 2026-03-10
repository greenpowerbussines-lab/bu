'use client';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function TransactionsPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    const fetchTransactions = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/transactions?orgId=${orgId}`);
            if (res.ok) {
                const json = await res.json();
                setTransactions(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            toast.error('Ошибка загрузки выписок');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const importMockTransactions = async () => {
        if (!orgId) return;
        setImporting(true);
        try {
            const mockData = [
                { amount: -15000, date: new Date().toISOString(), description: 'Оплата аренды за март', reference: 'INV-2024-001' },
                { amount: 450000, date: new Date().toISOString(), description: 'Поступление от ООО Ромашка по договору №12', reference: '7707083893' },
                { amount: -2400, date: new Date().toISOString(), description: 'Комиссия банка за ведение счета' },
            ];

            const res = await fetch(`${API_URL}/api/transactions/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, transactions: mockData }),
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Импортировано транзакций: ${data.imported}`);
                fetchTransactions();
            }
        } catch (error) {
            toast.error('Ошибка импорта');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Банковские выписки</h1>
                    <p className="text-sm text-muted-foreground mt-1">Импорт и сверка банковских операций с документами</p>
                </div>
                <button
                    onClick={importMockTransactions}
                    disabled={importing}
                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                    {importing ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Импорт...
                        </>
                    ) : (
                        <>
                            <span>📥</span>
                            Импортировать выписку
                        </>
                    )}
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Дата</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Описание</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right">Сумма</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-center">Статус</th>
                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-4 py-4 h-12 bg-muted/20" />
                                </tr>
                            ))
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">
                                    Выписки еще не импортированы
                                </td>
                            </tr>
                        ) : (
                            transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                                        {new Date(t.date).toLocaleDateString('ru-RU')}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium">{t.description}</div>
                                        {t.reference && <div className="text-xs text-muted-foreground font-mono">{t.reference}</div>}
                                    </td>
                                    <td className={`px-4 py-4 text-sm font-bold text-right ${t.amount > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('ru-RU')} ₽
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`status-badge border inline-flex ${t.matched
                                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                                            : 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                                            }`}>
                                            {t.matched ? 'Сверено' : 'Не сверено'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {!t.matched && (
                                            <button className="text-xs text-primary hover:underline font-medium">
                                                Подобрать документ
                                            </button>
                                        )}
                                        {t.matched && (
                                            <span className="text-xs text-muted-foreground italic">
                                                Связано с #{t.matchedDocId?.slice(-6)}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
