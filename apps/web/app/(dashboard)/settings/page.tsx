export default function SettingsPage() {
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-[-0.03em] text-foreground">Настройки</h1>
                <p className="mt-1 text-sm text-muted-foreground">Параметры компании, уведомлений и доступа к платформе.</p>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Компания</h2>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="rounded-2xl bg-white/70 p-4">
                            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Юрлицо</div>
                            <div className="mt-1 font-medium text-foreground">ООО &quot;Ромашка&quot;</div>
                        </div>
                        <div className="rounded-2xl bg-white/70 p-4">
                            <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Налоговый режим</div>
                            <div className="mt-1 font-medium text-foreground">УСН 6%</div>
                        </div>
                    </div>
                </article>

                <article className="glass-card p-6">
                    <h2 className="text-lg font-semibold text-foreground">Автоматизация</h2>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between rounded-2xl bg-white/70 p-4">
                            <div>
                                <div className="font-medium text-foreground">AI-подсказки</div>
                                <div className="mt-1 text-xs text-muted-foreground">Рекомендации по рискам и проводкам</div>
                            </div>
                            <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">Включено</div>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/70 p-4">
                            <div>
                                <div className="font-medium text-foreground">AR-напоминания</div>
                                <div className="mt-1 text-xs text-muted-foreground">Email и Telegram уведомления клиентам</div>
                            </div>
                            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Активно</div>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
}
