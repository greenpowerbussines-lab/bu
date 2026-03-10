import { FastifyPluginAsync } from 'fastify';

export const transactionsRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/transactions
    server.get<{
        Querystring: { orgId: string; matched?: string; page?: number; limit?: number };
    }>('/', async (req, reply) => {
        const { orgId, matched, page = 1, limit = 50 } = req.query;
        const where: any = { orgId };
        if (matched !== undefined) where.matched = matched === 'true';

        const [total, transactions] = await Promise.all([
            server.prisma.transaction.count({ where }),
            server.prisma.transaction.findMany({
                where,
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data: transactions, total, page, limit };
    });

    // POST /api/transactions/import — Import bank statement (CSV/JSON)
    server.post<{
        Body: { orgId: string; transactions: Array<{ amount: number; date: string; description: string; reference?: string }> };
    }>('/import', async (req, reply) => {
        const { orgId, transactions } = req.body;

        const created = await server.prisma.transaction.createMany({
            data: transactions.map((t) => ({
                orgId,
                amount: t.amount,
                date: new Date(t.date),
                description: t.description,
                reference: t.reference,
                matched: false,
            })),
            skipDuplicates: true,
        });

        return { imported: created.count };
    });

    // PATCH /api/transactions/:id/match — Manually match a transaction
    server.patch<{
        Params: { id: string };
        Body: { documentId: string; category?: string };
    }>('/:id/match', async (req, reply) => {
        const updated = await server.prisma.transaction.update({
            where: { id: req.params.id },
            data: {
                matched: true,
                matchedDocId: req.body.documentId,
                category: req.body.category,
            },
        });
        return updated;
    });
};
