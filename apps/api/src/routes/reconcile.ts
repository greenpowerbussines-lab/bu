import { FastifyPluginAsync } from 'fastify';
import { callClaude, parseClaudeJson, RECONCILE_PROMPT } from '@buhai/ai';

export const reconcileRoutes: FastifyPluginAsync = async (server) => {
    // POST /api/reconcile — Compare act vs contract
    server.post<{
        Body: {
            actId: string;
            contractId: string;
            orgId: string;
        };
    }>('/', async (req, reply) => {
        const { actId, contractId, orgId } = req.body;

        if (!actId || !contractId || !orgId) {
            return reply.status(400).send({ error: 'actId, contractId, orgId are required' });
        }

        // Load both documents
        const [act, contract] = await Promise.all([
            server.prisma.document.findUnique({ where: { id: actId } }),
            server.prisma.document.findUnique({ where: { id: contractId } }),
        ]);

        if (!act) return reply.status(404).send({ error: 'Act not found' });
        if (!contract) return reply.status(404).send({ error: 'Contract not found' });

        const userMessage = `
Акт:
${JSON.stringify(act.extractedData || { fileName: act.fileName, amount: act.amount, date: act.documentDate, contractor: act.contractorName }, null, 2)}

Договор:
${JSON.stringify(contract.extractedData || { fileName: contract.fileName, amount: contract.amount, date: contract.documentDate, contractor: contract.contractorName }, null, 2)}
    `;

        const result = await callClaude(RECONCILE_PROMPT, userMessage, {
            module: 'reconcile',
            orgId,
        });

        const analysis = parseClaudeJson<{
            status: string;
            discrepancies: any[];
            questions: string[];
            recommendation: string;
        }>(result.text);

        // Save result
        const reconciliation = await server.prisma.reconciliationResult.create({
            data: {
                status: analysis?.status || 'error',
                discrepancies: analysis?.discrepancies || [],
                questions: analysis?.questions || [],
                actId,
                contractId,
                orgId,
            },
        });

        // Log AI call
        await server.prisma.aiCallLog.create({
            data: {
                model: 'claude-opus-4-5',
                module: 'reconcile',
                inputTokens: result.inputTokens,
                outputTokens: result.outputTokens,
                durationMs: result.durationMs,
                success: true,
                orgId,
            },
        });

        return {
            id: reconciliation.id,
            status: analysis?.status || 'error',
            discrepancies: analysis?.discrepancies || [],
            questions: analysis?.questions || [],
            recommendation: analysis?.recommendation || '',
            act: { id: act.id, name: act.fileName, amount: act.amount },
            contract: { id: contract.id, name: contract.fileName, amount: contract.amount },
        };
    });

    // GET /api/reconcile — List reconciliation results
    server.get<{ Querystring: { orgId: string } }>('/', async (req, reply) => {
        const { orgId } = req.query;
        const results = await server.prisma.reconciliationResult.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return results;
    });
};
