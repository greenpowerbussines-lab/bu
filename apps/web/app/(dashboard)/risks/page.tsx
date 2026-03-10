'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const MOCK_RISKS = {
    overallRisk: 'MEDIUM',
    risks: [
        { level: 'HIGH', category: 'Дробление бизнеса', description: 'Обнаружены регулярные переводы в адрес 3 ИП за одинаковые услуги. ФНС рассматривает как признак дробления.', transactions: 12, recommendation: 'Подготовьте деловые обоснования и договоры на каждый вид услуг отдельно.' },
        { level: 'MEDIUM', category: 'Контрагент с признаками однодневки', description: 'ООО МегаПоставка (ИНН 7743013902) имеет признаки фиктивной организации. Риск снятия НДС-вычетов.', transactions: 3, recommendation: 'Запросите полный пакет документов у контрагента и проверьте реальность сделки.' },
        { level: 'LOW', category: 'Расходы без документального подтверждения', description: '5 транзакций на общую сумму 47 500 ₽ не имеют привязанных первичных документов в архиве.', transactions: 5, recommendation: 'Загрузите подтверждающие чеки и акты в архив BuhAI.' },
    ],
    immediateActions: [
        'Запросите документы у ООО МегаПоставка до 25 апреля',
        'Загрузите 5 непривязанных документов в архив',
        'Проконсультируйтесь с юристом по теме ИП-дробления',
    ],
};

const RISK_LEVEL_STYLES: Record<string, string> = {
    HIGH: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    MEDIUM: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    LOW: 'text-buhai-300 bg-buhai-400/10 border-buhai-400/20',
};

const OVERALL_STYLES: Record<string, { color: string; label: string; icon: string }> = {
    LOW: { color: 'text-emerald-400', label: 'Низкий риск', icon: '✅' },
    MEDIUM: { color: 'text-amber-400', label: 'Средний риск', icon: '⚠️' },
    HIGH: { color: 'text-rose-400', label: 'Высокий риск', icon: '🚨' },
    CRITICAL: { color: 'text-rose-500', label: 'Критический риск', icon: '🆘' },
};

export default function RisksPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [data, setData] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const runAnalysis = useCallback(async () => {
        if (!orgId) return;
        setAnalyzing(true);
        try {
            const res = await fetch(`${API_URL}/api/analysis/tax-risks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId }),
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
                toast.success('Анализ рисков обновлён');
            }
        } catch (error) {
            console.error('Tax risk analysis failed:', error);
            toast.error('Ошибка при анализе рисков');
        } finally {
            setAnalyzing(false);
        }
    }, [orgId]);

    useEffect(() => {
        if (!data) runAnalysis();
    }, [data, runAnalysis]);

    const displayData = data || MOCK_RISKS;
    const overall = OVERALL_STYLES[displayData.overallRisk] || OVERALL_STYLES.LOW;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Мониторинг налоговых рисков</h1>
                    <p className="text-sm text-muted-foreground mt-1">Анализ транзакций по базе ФНС 2024-2025</p>
                </div>
                <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
                >
                    {analyzing ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Анализирую...
                        </span>
                    ) : '🔍 Обновить анализ'}
                </button>
            </div>

            {/* Overall risk banner */}
            <div className={`glass-card p-5 flex items-center gap-4`}>
                <span className="text-4xl">{overall.icon}</span>
                <div className="flex-1">
                    <div className={`text-lg font-bold ${overall.color}`}>{overall.label}</div>
                    <p className="text-sm text-muted-foreground">Общая оценка налоговых рисков за последние 90 дней</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold">{displayData.risks?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">рисков найдено</div>
                </div>
            </div>

            {/* Immediate actions */}
            <div className="glass-card p-5">
                <h2 className="font-semibold mb-3">🚀 Немедленные действия</h2>
                <div className="space-y-2">
                    {displayData.immediateActions?.map((action: string, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                            <span className="text-primary font-bold text-sm mt-0.5">{i + 1}</span>
                            <p className="text-sm">{action}</p>
                        </div>
                    ))}
                    {(displayData.immediateActions?.length === 0) && (
                        <p className="text-sm text-muted-foreground">Нет рекомендаций на данный момент</p>
                    )}
                </div>
            </div>

            {/* Risk list */}
            <div className="space-y-4">
                <h2 className="font-semibold">Детальный анализ рисков</h2>
                {displayData.risks?.map((risk: any, i: number) => (
                    <div key={i} className="glass-card p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="font-semibold">{risk.category}</h3>
                            <span className={`status-badge border flex-shrink-0 ${RISK_LEVEL_STYLES[risk.level] || RISK_LEVEL_STYLES.LOW}`}>
                                {risk.level === 'HIGH' ? 'Высокий' : risk.level === 'MEDIUM' ? 'Средний' : 'Низкий'} риск
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{risk.transactions || 0} транзакций</span>
                            <div className="flex-1 p-2 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                                <span className="text-primary font-medium">💡 </span>
                                {risk.recommendation}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
