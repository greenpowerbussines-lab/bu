import { FastifyPluginAsync } from 'fastify';

const TAX_DEADLINES: Record<string, Array<{ name: string; month: number; day: number; description: string; docsRequired: string[] }>> = {
    USN: [
        { name: 'Декларация УСН', month: 3, day: 25, description: 'Годовая декларация по УСН', docsRequired: ['КУДиР', 'Платёжные поручения', 'Выписки банка'] },
        { name: 'Авансовый платёж УСН (Q1)', month: 4, day: 28, description: 'Авансовый платёж за I квартал', docsRequired: ['КУДиР'] },
        { name: 'Авансовый платёж УСН (Q2)', month: 7, day: 28, description: 'Авансовый платёж за II квартал', docsRequired: ['КУДиР'] },
        { name: 'Авансовый платёж УСН (Q3)', month: 10, day: 28, description: 'Авансовый платёж за III квартал', docsRequired: ['КУДиР'] },
        { name: 'РСВ (Q1)', month: 4, day: 25, description: 'Расчёт по страховым взносам', docsRequired: ['Ведомости', 'Трудовые договоры'] },
        { name: 'РСВ (полугодие)', month: 7, day: 25, description: 'Расчёт по страховым взносам', docsRequired: ['Ведомости'] },
        { name: 'РСВ (9 мес.)', month: 10, day: 25, description: 'Расчёт по страховым взносам', docsRequired: ['Ведомости'] },
        { name: 'РСВ (год)', month: 1, day: 25, description: 'Расчёт по страховым взносам (годовой)', docsRequired: ['Ведомости'] },
        { name: 'Уведомление о НДФЛ', month: 1, day: 25, description: 'Уведомление об исчисленных суммах НДФЛ', docsRequired: ['Расчётные ведомости'] },
    ],
    OSN: [
        { name: 'Декларация НДС (Q1)', month: 4, day: 25, description: 'Квартальная декларация НДС', docsRequired: ['Книга покупок', 'Книга продаж'] },
        { name: 'Декларация НДС (Q2)', month: 7, day: 25, description: 'Квартальная декларация НДС', docsRequired: ['Книга покупок', 'Книга продаж'] },
        { name: 'Декларация НДС (Q3)', month: 10, day: 25, description: 'Квартальная декларация НДС', docsRequired: ['Книга покупок', 'Книга продаж'] },
        { name: 'Декларация НДС (Q4)', month: 1, day: 27, description: 'Квартальная декларация НДС', docsRequired: ['Книга покупок', 'Книга продаж'] },
        { name: 'Декларация по налогу на прибыль', month: 3, day: 25, description: 'Годовая декларация по налогу на прибыль', docsRequired: ['ОПиУ', 'Налоговые регистры'] },
    ],
    PATENT: [
        { name: 'Оплата патента (1-й платёж)', month: 1, day: 31, description: '1/3 стоимости патента (патент >6 месяцев)', docsRequired: [] },
        { name: 'Оплата патента (2-й платёж)', month: 12, day: 31, description: '2/3 стоимости патента', docsRequired: [] },
    ],
    ENVD: [],
    ESN: [],
};

export const deadlinesRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/deadlines — Get deadlines for org
    server.get<{ Querystring: { orgId: string; year?: number } }>(
        '/',
        async (req, reply) => {
            const { orgId, year = new Date().getFullYear() } = req.query;

            const org = await server.prisma.organization.findUnique({
                where: { id: orgId },
            });

            if (!org) return reply.status(404).send({ error: 'Organization not found' });

            // Get or generate deadlines
            let deadlines = await server.prisma.deadline.findMany({
                where: {
                    orgId,
                    dueDate: {
                        gte: new Date(`${year}-01-01`),
                        lte: new Date(`${year}-12-31`),
                    },
                },
                orderBy: { dueDate: 'asc' },
            });

            // Auto-generate if none exist for this year
            if (deadlines.length === 0) {
                const templates = TAX_DEADLINES[org.taxRegime] || [];
                const toCreate = templates.map((t) => {
                    const d = new Date(year, t.month - 1, t.day);
                    return {
                        orgId,
                        name: t.name,
                        description: t.description,
                        docsRequired: t.docsRequired,
                        dueDate: d,
                        taxRegime: org.taxRegime,
                        reminderDays: [14, 7, 1],
                    };
                });

                if (toCreate.length > 0) {
                    await server.prisma.deadline.createMany({ data: toCreate });
                    deadlines = await server.prisma.deadline.findMany({
                        where: {
                            orgId,
                            dueDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) },
                        },
                        orderBy: { dueDate: 'asc' },
                    });
                }
            }

            return deadlines;
        }
    );

    // PATCH /api/deadlines/:id — Mark as complete
    server.patch<{
        Params: { id: string };
        Body: { completed: boolean };
    }>('/:id', async (req, reply) => {
        const updated = await server.prisma.deadline.update({
            where: { id: req.params.id },
            data: {
                completed: req.body.completed,
                completedAt: req.body.completed ? new Date() : null,
            },
        });
        return updated;
    });
};
