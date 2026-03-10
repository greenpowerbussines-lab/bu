export default function BillingPage() {
    const PLANS = [
        {
            id: 'STARTER', name: 'Стартер', price: 29, current: false,
            features: ['1 пользователь', 'Архив документов (Модуль 2)', 'Сверка актов (Модуль 1)', 'Налоговый календарь (Модуль 9)', 'До 100 документов/мес', 'Email поддержка'],
            modules: [1, 2, 9],
        },
        {
            id: 'BUSINESS', name: 'Бизнес', price: 79, current: true,
            features: ['5 пользователей', 'Все модули Стартера', 'Чат-ассистент (Модуль 3)', 'Дашборд руководителя (Модуль 4)', 'Мониторинг рисков (Модуль 5)', 'Bank reconciliation (Модуль 6)', 'Без лимита документов', 'Приоритетная поддержка'],
            modules: [1, 2, 3, 4, 5, 6, 9],
        },
        {
            id: 'ENTERPRISE', name: 'Корпоративный', price: 199, current: false,
            features: ['Неограниченно пользователей', 'Все 10 модулей', 'White-label брендинг', 'Telegram-бот', 'API доступ', 'Интеграция 1С', 'AR напоминания (Модуль 7)', 'Командировки (Модуль 10)', 'Выделенный менеджер'],
            modules: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in">
            <div>
                <h1 className="text-2xl font-bold">Тариф и оплата</h1>
                <p className="text-sm text-muted-foreground mt-1">Управление подпиской</p>
            </div>

            {/* Current plan badge */}
            <div className="glass-card p-5 flex items-center gap-4 border border-primary/20 bg-primary/5">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">💎</div>
                <div className="flex-1">
                    <div className="font-semibold">Текущий план: Бизнес</div>
                    <p className="text-sm text-muted-foreground">$79/месяц · Следующее списание: 1 апреля 2024</p>
                </div>
                <button className="px-4 py-2 bg-muted hover:bg-accent border border-border rounded-lg text-sm font-medium transition-colors">
                    Управление картой
                </button>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {PLANS.map((plan) => (
                    <div key={plan.id} className={`glass-card p-6 relative ${plan.current ? 'border-primary/30 bg-primary/5' : ''}`}>
                        {plan.current && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full whitespace-nowrap">
                                Текущий план
                            </div>
                        )}
                        <div className="mb-5">
                            <div className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">${plan.price}</span>
                                <span className="text-muted-foreground text-sm">/мес</span>
                            </div>
                        </div>
                        <ul className="space-y-2 mb-6">
                            {plan.features.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                    <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                                    <span className="text-muted-foreground">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <button
                            className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.current
                                    ? 'bg-muted text-muted-foreground cursor-default'
                                    : 'bg-primary hover:bg-primary/90 text-white'
                                }`}
                            disabled={plan.current}
                        >
                            {plan.current ? 'Текущий план' : `Перейти на ${plan.name}`}
                        </button>
                    </div>
                ))}
            </div>

            {/* Usage stats */}
            <div className="glass-card p-5">
                <h2 className="font-semibold mb-4">Использование в этом месяце</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'AI запросов', used: 847, limit: null },
                        { label: 'Документов обработано', used: 234, limit: null },
                        { label: 'Контрагентов проверено', used: 12, limit: null },
                        { label: 'Пользователей', used: 3, limit: 5 },
                    ].map(({ label, used, limit }) => (
                        <div key={label} className="p-3 bg-muted rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">{label}</div>
                            <div className="font-semibold">{used}{limit ? ` / ${limit}` : ''}</div>
                            {limit && (
                                <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${(used / limit) * 100}%` }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
