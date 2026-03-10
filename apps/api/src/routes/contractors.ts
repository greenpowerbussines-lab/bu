import { FastifyPluginAsync } from 'fastify';
import { callClaude, parseClaudeJson, CONTRACTOR_SCORE_PROMPT } from '@buhai/ai';

export const contractorsRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/contractors — List org contractors
    server.get<{ Querystring: { orgId: string } }>('/', async (req, reply) => {
        const contractors = await server.prisma.contractor.findMany({
            where: { orgId: req.query.orgId },
            orderBy: { score: 'asc' }, // lowest score first (highest risk)
        });
        return contractors;
    });

    // POST /api/contractors/score — Score a contractor by INN
    server.post<{
        Body: { inn: string; orgId: string };
    }>('/score', async (req, reply) => {
        const { inn, orgId } = req.body;

        if (!inn || !orgId) {
            return reply.status(400).send({ error: 'inn and orgId are required' });
        }

        // Check cache (re-score only if older than 7 days)
        const existing = await server.prisma.contractor.findFirst({
            where: { inn, orgId },
        });

        if (
            existing?.scoredAt &&
            Date.now() - existing.scoredAt.getTime() < 7 * 24 * 60 * 60 * 1000
        ) {
            return existing;
        }

        // Fetch mock data (in production: real API calls to egrul.nalog.ru, kad.arbitr.ru, etc.)
        const fnsData = await fetchFNSData(inn);
        const courtData = await fetchCourtData(inn);
        const bankruptcyData = await fetchBankruptcyData(inn);

        const userMessage = `
ИНН контрагента: ${inn}

Данные ФНС (ЕГРЮЛ):
${JSON.stringify(fnsData, null, 2)}

Судебные дела (Картотека арбитражных дел):
${JSON.stringify(courtData, null, 2)}

Данные о банкротстве (Федресурс):
${JSON.stringify(bankruptcyData, null, 2)}
    `;

        const result = await callClaude(CONTRACTOR_SCORE_PROMPT, userMessage, {
            module: 'contractor-score',
            orgId,
        });

        const scoring = parseClaudeJson<{
            score: number;
            riskLevel: string;
            flags: string[];
            recommendation: string;
            summary: string;
        }>(result.text);

        // Upsert contractor
        const contractor = await server.prisma.contractor.upsert({
            where: { inn_orgId: { inn, orgId } },
            update: {
                score: scoring?.score,
                riskLevel: (scoring?.riskLevel as any) || 'MEDIUM',
                riskFlags: scoring?.flags || [],
                fnsData,
                courtData,
                bankruptcyData,
                scoredAt: new Date(),
                name: (fnsData as any)?.name || existing?.name || 'Неизвестно',
            },
            create: {
                inn,
                orgId,
                name: (fnsData as any)?.name || 'Неизвестно',
                score: scoring?.score,
                riskLevel: (scoring?.riskLevel as any) || 'MEDIUM',
                riskFlags: scoring?.flags || [],
                fnsData,
                courtData,
                bankruptcyData,
                scoredAt: new Date(),
            },
        });

        return {
            ...contractor,
            recommendation: scoring?.recommendation,
            summary: scoring?.summary,
        };
    });

    // DELETE /api/contractors/:id
    server.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
        await server.prisma.contractor.delete({ where: { id: req.params.id } });
        return { success: true };
    });
};

// =============================================
// Mock external API functions
// In production, replace with real API calls
// =============================================

async function fetchFNSData(inn: string) {
    // Mock data — replace with egrul.nalog.ru API
    return {
        name: `ООО "Компания ${inn.slice(-4)}"`,
        inn,
        registrationDate: '2018-05-15',
        status: 'active',
        directors: 1,
        capitalRub: 10000,
        taxDebts: false,
        address: 'г. Москва, ул. Примерная, д. 1',
    };
}

async function fetchCourtData(inn: string) {
    // Mock — replace with kad.arbitr.ru
    return {
        activeCases: 0,
        totalAmount: 0,
        caseTypes: [],
    };
}

async function fetchBankruptcyData(inn: string) {
    // Mock — replace with bankrot.fedresurs.ru
    return {
        inBankruptcy: false,
        messages: [],
    };
}
