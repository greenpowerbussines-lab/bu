import Link from 'next/link';

const FEATURES = [
    { title: 'Архив документов', description: 'OCR, классификация и единый поиск по первичке, УПД, актам и счетам.' },
    { title: 'Сверка актов', description: 'Сравнение договора и акта с пояснениями по расхождениям за секунды.' },
    { title: 'Налоговые риски', description: 'AI-подсказки по проблемным операциям и контрагентам до визита инспекции.' },
    { title: 'Календарь бухгалтера', description: 'Дедлайны по режиму налогообложения и контроль статуса сдачи.' },
];

export default function LandingPage() {
    return (
        <main className="app-shell flex min-h-screen flex-col px-4 py-4 md:px-6 md:py-6">
            <div className="surface-panel relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1440px] flex-col overflow-hidden px-6 py-6 md:px-10 md:py-8">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[-120px] top-[-120px] h-72 w-72 rounded-full bg-[#ffcc00]/20 blur-3xl" />
                    <div className="absolute right-[-60px] top-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                </div>

                <nav className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffcc00] text-lg font-bold text-[#1d1d1f] shadow-[0_10px_24px_rgba(255,204,0,0.35)]">
                            B
                        </div>
                        <div>
                            <div className="text-lg font-semibold tracking-[-0.03em] text-foreground">BuhAI</div>
                            <div className="text-xs text-muted-foreground">1C meets Apple</div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <a href="#features" className="pill-button">
                            Возможности
                        </a>
                        <a href="#pricing" className="pill-button">
                            Тарифы
                        </a>
                        <Link href="/login" className="pill-button">
                            Войти
                        </Link>
                        <Link href="/register" className="pill-button pill-button-primary">
                            Начать бесплатно
                        </Link>
                    </div>
                </nav>

                <section className="relative z-10 grid flex-1 gap-8 py-10 md:grid-cols-[1.15fr_0.85fr] md:items-center md:py-16">
                    <div className="max-w-3xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            AI-контур для бухгалтерии малого и среднего бизнеса
                        </div>
                        <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.06em] text-foreground md:text-7xl">
                            Бухгалтерия, которая держит <span className="gradient-text">всё под контролем</span>
                        </h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                            Единый кабинет для документов, сверки, налоговых рисков, коммуникации с командой и управленческой аналитики.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link href="/register" className="pill-button pill-button-primary">
                                Запустить за 5 минут
                            </Link>
                            <Link href="/dashboard" className="pill-button">
                                Открыть интерфейс
                            </Link>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            {[
                                { value: '70%', label: 'рутины автоматизируется' },
                                { value: '< 30 c', label: 'на скоринг контрагента' },
                                { value: '24/7', label: 'работает AI-ассистент' },
                            ].map((item) => (
                                <div key={item.label} className="glass-card p-5">
                                    <div className="text-3xl font-bold tracking-[-0.05em] text-foreground">{item.value}</div>
                                    <div className="mt-2 text-sm text-muted-foreground">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card relative overflow-hidden p-6 md:p-8">
                        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#32C5FF,#B620E0,#F7B500)]" />
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-muted-foreground">Финансовая сводка</div>
                                <div className="mt-1 text-2xl font-bold tracking-[-0.04em] text-foreground">Сегодня в BuhAI</div>
                            </div>
                            <div className="rounded-full bg-[#ffcc00]/25 px-3 py-1 text-xs font-semibold text-foreground">Business</div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                                <div className="text-sm text-muted-foreground">Поступления</div>
                                <div className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">4 250 000 ₽</div>
                                <div className="mt-2 text-sm text-emerald-600">+12.5% к прошлому месяцу</div>
                            </div>
                            <div className="rounded-[24px] bg-white/80 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                                <div className="text-sm text-muted-foreground">НДС к уплате</div>
                                <div className="mt-3 text-3xl font-bold tracking-[-0.05em] text-foreground">368 100 ₽</div>
                                <div className="mt-2 text-sm text-amber-700">Срок до 25 марта</div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-[24px] bg-[rgba(245,245,247,0.9)] p-5">
                            <div className="text-sm font-semibold text-foreground">AI-аналитика</div>
                            <p className="mt-3 text-sm leading-7 text-muted-foreground">
                                Расходы на маркетинг выросли выше нормы. Сервис рекомендует запросить детализацию актов у подрядчика и сверить лимиты.
                            </p>
                            <div className="mt-4 flex gap-3">
                                <Link href="/reconcile" className="pill-button">
                                    Сверить акт
                                </Link>
                                <Link href="/chat" className="pill-button">
                                    Спросить AI
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="relative z-10 border-t border-black/5 py-10">
                    <div className="mb-8 max-w-2xl">
                        <h2 className="text-3xl font-bold tracking-[-0.04em] text-foreground">Модули, которые реально экономят время</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Новый дизайн перенесён в рабочий интерфейс, а бизнес-функции остались на своих маршрутах и API.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {FEATURES.map((feature) => (
                            <article key={feature.title} className="glass-card p-6">
                                <h3 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{feature.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section id="pricing" className="relative z-10 border-t border-black/5 py-10">
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { name: 'Starter', price: '$29', description: 'Базовые документы, календарь и сверка актов.' },
                            { name: 'Business', price: '$79', description: 'Полный контур для команды: AI, риски, дашборд и банк.', current: true },
                            { name: 'Enterprise', price: '$199', description: 'White-label, API, Telegram и расширенная автоматизация.' },
                        ].map((plan) => (
                            <article
                                key={plan.name}
                                className={`glass-card p-6 ${plan.current ? 'gradient-border' : ''}`}
                            >
                                <div className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">{plan.name}</div>
                                <div className="mt-3 text-4xl font-bold tracking-[-0.05em] text-foreground">{plan.price}</div>
                                <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                                <Link
                                    href="/register"
                                    className={`mt-6 inline-flex ${plan.current ? 'pill-button pill-button-primary' : 'pill-button'}`}
                                >
                                    Выбрать план
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
