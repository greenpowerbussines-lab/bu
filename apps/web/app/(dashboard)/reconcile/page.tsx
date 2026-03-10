'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MOCK_DISCREPANCIES = [
    { field: 'amount', actValue: '150 000 ₽', contractValue: '145 000 ₽', severity: 'high', description: 'Сумма в акте превышает договорную на 5 000 ₽' },
    { field: 'date', actValue: '25 марта 2024', contractValue: 'до 20 марта 2024', severity: 'medium', description: 'Дата подписания акта выходит за рамки договора' },
];

const SEVERITY_STYLES: Record<string, string> = {
    high: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
    medium: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    low: 'bg-buhai-400/10 text-buhai-300 border-buhai-400/20',
};

export default function ReconcilePage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [docs, setDocs] = useState<any[]>([]);
    const [actId, setActId] = useState<string>('');
    const [contractId, setContractId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fetchDocs = useCallback(async () => {
        if (!orgId) return;
        try {
            const res = await fetch(`${API_URL}/api/documents?orgId=${orgId}`);
            const data = await res.json();
            if (data.data) {
                setDocs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    }, [orgId]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const handleCompare = async () => {
        if (!orgId) return;

        if (!actId || !contractId) {
            toast.error('Выберите акт и договор для сверки');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/reconcile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ actId, contractId, orgId }),
            });

            if (!res.ok) throw new Error('Failed to reconcile');
            const data = await res.json();
            setResult(data);
            toast.success('Сверка завершена');
        } catch (e) {
            console.error(e);
            toast.error('Ошибка при сверке документов');
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 2000));
        setResult({
            status: 'issues',
            discrepancies: MOCK_DISCREPANCIES,
            questions: [
                'Уточните обоснование суммы 150 000 руб. (договор предусматривает 145 000 руб.)',
                'Предоставьте согласование на перенос сроков с 20 на 25 марта',
            ],
            recommendation: 'Выявлены 2 расхождения, требующие уточнения у контрагента. Рекомендуем не подписывать акт до получения разъяснений.',
        });
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold">Сверка актов</h1>
                <p className="text-sm text-muted-foreground mt-1">AI сравнивает акт с договором и находит расхождения за секунды</p>
            </div>

            {/* Upload area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { label: 'Акт выполненных работ', key: 'act', value: actId, setValue: setActId, icon: '📄', type: 'ACT' },
                    { label: 'Договор', key: 'contract', value: contractId, setValue: setContractId, icon: '📑', type: 'CONTRACT' },
                ].map(({ label, key, value, setValue, icon, type }) => (
                    <div key={key} className="glass-card p-6 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">{icon}</span>
                            <span className="font-medium">{label}</span>
                        </div>
                        <select
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            <option value="">Выберите документ...</option>
                            {docs.filter(d => d.type === type || d.type === 'OTHER').map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.fileName} ({new Date(doc.documentDate).toLocaleDateString('ru-RU')})</option>
                            ))}
                        </select>
                        {value && (
                            <p className="text-xs text-emerald-400">Документ выбран</p>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={handleCompare}
                disabled={loading}
                className="w-full py-3.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors glow-primary"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Claude анализирует...
                    </span>
                ) : 'Запустить сверку →'}
            </button>

            {!actId && !contractId && (
                <p className="text-center text-xs text-muted-foreground">Нет файлов? <button onClick={handleDemo} className="text-primary hover:underline">Запустить с демо-данными</button></p>
            )}

            {/* Result */}
            {result && (
                <div className="space-y-4 animate-in">
                    {/* Status banner */}
                    <div className={`glass-card p-4 flex items-center gap-3 ${result.status === 'ok' ? 'border-emerald-500/30' : result.status === 'critical' ? 'border-rose-500/30' : 'border-amber-500/30'
                        }`}>
                        <span className="text-2xl">{result.status === 'ok' ? '✅' : result.status === 'critical' ? '🚨' : '⚠️'}</span>
                        <div>
                            <div className="font-semibold">
                                {result.status === 'ok' ? 'Расхождений не найдено' : result.status === 'critical' ? 'Критические расхождения' : 'Найдены расхождения'}
                            </div>
                            <div className="text-sm text-muted-foreground">{result.recommendation}</div>
                        </div>
                        <div className="ml-auto text-sm font-medium px-2 py-1 rounded-lg bg-muted">
                            {result.discrepancies?.length || 0} расхождений
                        </div>
                    </div>

                    {/* Discrepancies */}
                    {result.discrepancies?.length > 0 && (
                        <div className="glass-card p-5 space-y-3">
                            <h2 className="font-semibold">Найденные расхождения</h2>
                            {result.discrepancies.map((d: any, i: number) => (
                                <div key={i} className="p-4 rounded-lg bg-muted/40 border border-border/30">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-medium capitalize">{d.field === 'amount' ? 'Сумма' : d.field === 'date' ? 'Дата' : d.field}</span>
                                        <span className={`status-badge border ${SEVERITY_STYLES[d.severity]}`}>
                                            {d.severity === 'high' ? 'Высокий' : d.severity === 'medium' ? 'Средний' : 'Низкий'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">{d.description}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="p-2 rounded bg-rose-400/5 border border-rose-400/20">
                                            <div className="text-[10px] text-rose-400 mb-1">В АКТе</div>
                                            <div className="font-mono font-medium">{d.actValue}</div>
                                        </div>
                                        <div className="p-2 rounded bg-buhai-400/5 border border-buhai-400/20">
                                            <div className="text-[10px] text-buhai-300 mb-1">В ДОГОВОРЕ</div>
                                            <div className="font-mono font-medium">{d.contractValue}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Questions */}
                    {result.questions?.length > 0 && (
                        <div className="glass-card p-5">
                            <h2 className="font-semibold mb-3">Рекомендованные вопросы контрагенту</h2>
                            <div className="space-y-2">
                                {result.questions.map((q: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                                        <span className="text-primary font-semibold mt-0.5">{i + 1}.</span>
                                        <p className="text-sm text-muted-foreground">{q}</p>
                                        <button className="ml-auto text-xs text-primary hover:underline flex-shrink-0">Копировать</button>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 w-full py-2.5 border border-primary/30 text-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-colors">
                                📧 Создать письмо контрагенту
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
