'use client';
import Image from 'next/image';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ExpensesPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [expenses, setExpenses] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchExpenses = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/expenses?orgId=${orgId}`);
            if (res.ok) {
                const json = await res.json();
                setExpenses(json.expenses);
                setTotal(json.total);
            }
        } catch (error) {
            console.error('Failed to fetch expenses:', error);
            toast.error('Ошибка загрузки расходов');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !orgId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/expenses/receipt?orgId=${orgId}`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.warning) {
                    toast.warning(data.warning);
                } else {
                    toast.success('Чек успешно обработан');
                }
                fetchExpenses();
            } else {
                toast.error('Не удалось распознать чек');
            }
        } catch (error) {
            toast.error('Ошибка загрузки');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Командировки и чеки</h1>
                    <p className="text-sm text-muted-foreground mt-1">Автоматический учет расходов по фото чеков через AI</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Обработка...
                            </>
                        ) : (
                            <>
                                <span>📷</span>
                                Загрузить чек
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Всего расходов</div>
                    <div className="text-2xl font-bold mt-1">{total.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="glass-card p-5">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Обработано чеков</div>
                    <div className="text-2xl font-bold mt-1">{expenses.length}</div>
                </div>
                <div className="glass-card p-5">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">На проверке</div>
                    <div className="text-2xl font-bold mt-1">0</div>
                </div>
            </div>

            {/* Results list */}
            <div className="space-y-4">
                <h2 className="font-semibold">Последние расходы</h2>
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />)}
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="glass-card p-12 text-center text-muted-foreground">
                        Чеки еще не загружены. Используйте кнопку выше, чтобы добавить первый расход.
                    </div>
                ) : (
                    expenses.map((e) => (
                        <div key={e.id} className={`glass-card p-4 border transition-all ${e.warning ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/40'}`}>
                            <div className="flex items-start gap-4">
                                <div className="relative w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xl overflow-hidden border border-border">
                                    {e.imageUrl ? (
                                        <Image
                                            src={`${API_URL}${e.imageUrl}`}
                                            alt="Receipt"
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    ) : '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="font-semibold">{e.vendorName || 'Неизвестный продавец'}</h3>
                                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground lowercase">
                                            {e.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {e.receiptDate ? new Date(e.receiptDate).toLocaleDateString('ru-RU') : 'Дата не определена'}
                                    </p>
                                    {e.warning && (
                                        <div className="mt-2 text-xs text-amber-500 flex items-center gap-1.5 font-medium">
                                            <span>⚠️</span> {e.warning}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold">{e.amount.toLocaleString('ru-RU')} {e.currency === 'RUB' ? '₽' : e.currency}</div>
                                    <div className="text-xs text-muted-foreground">НДС: {e.vatAmount || 0} ₽</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
