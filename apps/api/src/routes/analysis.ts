import { FastifyPluginAsync } from 'fastify';
import { callClaude, parseClaudeJson, buildInsightsPrompt, TAX_RISK_PROMPT } from '@buhai/ai';

export const analysisRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/analysis/dashboard — Executive dashboard data
    server.get<{ Querystring: { orgId: string } }>(
        '/dashboard',
        async (req, reply) => {
            const { orgId } = req.query;

            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const [
                totalTransactions,
                weekTransactions,
                prevWeekTransactions,
                unmatchedDocs,
                contractors,
                org,
            ] = await Promise.all([
                server.prisma.transaction.aggregate({
                    where: { orgId, date: { gte: monthAgo } },
                    _sum: { amount: true },
                    _count: { id: true },
                }),
                server.prisma.transaction.aggregate({
                    where: { orgId, date: { gte: weekAgo } },
                    _sum: { amount: true },
                    _count: { id: true },
                }),
                server.prisma.transaction.aggregate({
                    where: {
                        orgId,
                        date: {
                            gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
                            lt: weekAgo,
                        },
                    },
                    _sum: { amount: true },
                }),
                server.prisma.document.count({
                    where: { orgId, status: 'PENDING' },
                }),
                server.prisma.contractor.findMany({
                    where: { orgId, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
                    take: 5,
                    orderBy: { score: 'asc' },
                }),
                server.prisma.organization.findUnique({ where: { id: orgId } }),
            ]);

            const weekSum = Number(weekTransactions._sum.amount || 0);
            const prevWeekSum = Number(prevWeekTransactions._sum.amount || 0);
            const trend =
                prevWeekSum > 0
                    ? Math.round(((weekSum - prevWeekSum) / prevWeekSum) * 100)
                    : 0;

            const weeklyData = {
                cashflow: { thisWeek: weekSum, lastWeek: prevWeekSum, trend },
                totalTransactions: totalTransactions._count.id,
                unmatchedDocuments: unmatchedDocs,
                riskyContractors: contractors.length,
                taxRegime: org?.taxRegime,
            };

            // Generate AI insights
            let aiInsights: string[] = [];
            try {
                const insightResult = await callClaude(
                    'Ты финансовый аналитик. Отвечай только JSON массивом строк.',
                    buildInsightsPrompt(weeklyData),
                    { module: 'dashboard-insights', orgId, maxTokens: 1024 }
                );
                aiInsights = parseClaudeJson<string[]>(insightResult.text) || [];
            } catch {
                aiInsights = ['📊 Недостаточно данных для анализа. Загрузите больше транзакций.'];
            }

            return {
                cashflow: {
                    thisWeekRub: weekSum,
                    lastWeekRub: prevWeekSum,
                    trendPercent: trend,
                },
                documents: {
                    pendingCount: unmatchedDocs,
                },
                risks: {
                    highRiskContractors: contractors,
                },
                aiInsights,
                period: { from: weekAgo.toISOString(), to: now.toISOString() },
            };
        }
    );

    // POST /api/analysis/tax-risks — Tax risk analysis
    server.post<{ Body: { orgId: string; fromDate?: string; toDate?: string } }>(
        '/tax-risks',
        async (req, reply) => {
            const { orgId, fromDate, toDate } = req.body;
            const org = await server.prisma.organization.findUnique({ where: { id: orgId } });

            const transactions = await server.prisma.transaction.findMany({
                where: {
                    orgId,
                    date: {
                        gte: fromDate ? new Date(fromDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                        lte: toDate ? new Date(toDate) : new Date(),
                    },
                },
                take: 200,
                orderBy: { amount: 'desc' },
            });

            const riskyContractors = await server.prisma.contractor.findMany({
                where: { orgId, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
                take: 10,
            });

            const userMessage = `
Налоговый режим: ${org?.taxRegime}
Транзакции (${transactions.length} шт.):
${JSON.stringify(transactions.slice(0, 50), null, 2)}

Контрагенты с высоким риском:
${JSON.stringify(riskyContractors.map((c) => ({ name: c.name, inn: c.inn, flags: c.riskFlags })), null, 2)}
      `;

            const result = await callClaude(TAX_RISK_PROMPT, userMessage, {
                module: 'tax-risk',
                orgId,
                maxTokens: 2048,
            });

            const analysis = parseClaudeJson(result.text);
            return analysis || { overallRisk: 'LOW', risks: [], immediateActions: [] };
        }
    );
};
