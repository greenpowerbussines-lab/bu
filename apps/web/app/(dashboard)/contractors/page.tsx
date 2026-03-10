'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SCORE_COLOR = (score: number) =>
    score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';

const SCORE_BG = (score: number) =>
    score >= 75 ? 'bg-emerald-400/10 border-emerald-400/20' : score >= 50 ? 'bg-amber-400/10 border-amber-400/20' : 'bg-rose-400/10 border-rose-400/20';

const FLAG_LABELS: Record<string, string> = {
    mass_director: '🔴 Массовый директор',
    tax_debts: '🔴 Долги по налогам',
    court_cases_large: '🟡 Крупные судебные иски',
    bankruptcy_risk: '🔴 Риск банкротства',
    young_company: '🟡 Молодая компания',
    address_mass: '🟡 Массовый адрес',
};

const MOCK_CONTRACTORS = [
    { id: '1', name: 'ООО Ромашка', inn: '7707083893', score: 82, riskLevel: 'LOW', riskFlags: [], scoredAt: '2024-03-15', recommendation: 'Надёжный контрагент. Работаете с 2018 года, долгов нет.' },
    { id: '2', name: 'ИП Петров А.В.', inn: '501801941153', score: 61, riskLevel: 'MEDIUM', riskFlags: ['young_company', 'court_cases_large'], scoredAt: '2024-03-14', recommendation: 'Умеренный риск. Рекомендуем запросить гарантийные письма.' },
    { id: '3', name: 'ООО МегаПоставка', inn: '7743013902', score: 23, riskLevel: 'HIGH', riskFlags: ['mass_director', 'tax_debts', 'bankruptcy_risk'], scoredAt: '2024-03-13', recommendation: 'Высокий риск! Рекомендуем отказаться от сотрудничества.' },
];

export default function ContractorsPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [contractors, setContractors] = useState<any[]>([]);
    const [inn, setInn] = useState('');
    const [checking, setChecking] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchContractors = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/contractors?orgId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setContractors(data);
            }
        } catch (error) {
            console.error('Failed to fetch contractors:', error);
            toast.error('Ошибка при загрузке списка контрагентов');
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchContractors();
    }, [fetchContractors]);

    const checkContractor = async () => {
        if (!inn.trim() || !orgId) return;
        setChecking(true);
        try {
            const res = await fetch(`${API_URL}/api/contractors/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inn, orgId }),
            });

            if (!res.ok) throw new Error('Failed to score contractor');

            const data = await res.json();
            setContractors(prev => {
                const filtered = prev.filter(c => c.inn !== inn);
                return [data, ...filtered];
            });
            setInn('');
            toast.success('Проверка завершена');
        } catch (e) {
            console.error(e);
            toast.error('Ошибка при проверке контрагента');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold">Проверка контрагентов</h1>
                <p className="text-sm text-muted-foreground mt-1">Скоринг надёжности по ИНН за 30 секунд</p>
            </div>

            {/* INN Check */}
            <div className="glass-card p-5">
                <h2 className="font-semibold mb-3">Проверить нового контрагента</h2>
                <div className="flex gap-3">
                    <input
                        value={inn}
                        onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
                        placeholder="Введите ИНН (10 или 12 цифр)"
                        onKeyDown={(e) => e.key === 'Enter' && checkContractor()}
                        className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono placeholder:text-muted-foreground placeholder:font-sans"
                    />
                    <button
                        onClick={checkContractor}
                        disabled={checking || inn.length < 10}
                        className="px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                        {checking ? (
                            <span className="flex items-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Проверка...
                            </span>
                        ) : 'Проверить →'}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Данные: ФНС ЕГРЮЛ, картотека арбитражных дел, Федресурс</p>
            </div>

            {/* Contractors list */}
            <div className="space-y-3">
                {contractors.map((c) => (
                    <div key={c.id} className={`glass-card p-5 border ${SCORE_BG(c.score)}`}>
                        <div className="flex items-start gap-4">
                            {/* Score circle */}
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-muted border-2 border-current flex items-center justify-center">
                                <span className={`text-xl font-bold ${SCORE_COLOR(c.score)}`}>{c.score}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-semibold truncate">{c.name}</h3>
                                    <span className={`status-badge border flex-shrink-0 ${SCORE_BG(c.score)} ${SCORE_COLOR(c.score)}`}>
                                        {c.riskLevel === 'LOW' ? 'Низкий риск' : c.riskLevel === 'MEDIUM' ? 'Средний риск' : 'Высокий риск'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono">ИНН: {c.inn}</p>
                                <p className="text-sm text-muted-foreground mt-1">{c.recommendation}</p>

                                {c.riskFlags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {c.riskFlags.map((flag: string) => (
                                            <span key={flag} className="text-xs px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 border border-rose-400/20">
                                                {FLAG_LABELS[flag] || flag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <p className="text-xs text-muted-foreground mb-2">Скоринг от {new Date(c.scoredAt).toLocaleDateString('ru-RU')}</p>
                                <button
                                    onClick={() => { setInn(c.inn); checkContractor(); }}
                                    className="text-xs text-primary hover:underline"
                                >Обновить</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
