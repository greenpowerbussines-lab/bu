import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import fs from 'fs';
import { callClaudeVision, parseClaudeJson, EXPENSE_RECEIPT_PROMPT } from '@buhai/ai';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export const expensesRoutes: FastifyPluginAsync = async (server) => {
    // POST /api/expenses/receipt — Process receipt image
    server.post('/receipt', async (req, reply) => {
        const data = await req.file();
        if (!data) return reply.status(400).send({ error: 'No file uploaded' });

        const { orgId, tripId } = req.query as { orgId: string; tripId?: string };

        // Get org limits
        const org = await server.prisma.organization.findUnique({ where: { id: orgId } });

        const buffer = await data.toBuffer();
        const base64 = buffer.toString('base64');

        const result = await callClaudeVision(base64, EXPENSE_RECEIPT_PROMPT, {
            module: 'expense-receipt',
            orgId,
        });

        const extracted = parseClaudeJson<{
            vendorName: string;
            amount: number;
            currency: string;
            vatAmount: number;
            receiptDate: string;
            category: string;
        }>(result.text);

        if (!extracted) {
            return reply.status(422).send({ error: 'Could not extract receipt data' });
        }

        // Check against company limits (mock limits)
        const limits: Record<string, number> = {
            food: 700,
            transport: 5000,
            accommodation: 3500,
            other: 1000,
        };

        const limit = limits[extracted.category] || 1000;
        const warning =
            extracted.amount > limit
                ? `Превышен лимит по категории "${extracted.category}": ${limit} руб. / день`
                : undefined;

        // Save file
        const fileName = `receipt-${Date.now()}-${data.filename}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, buffer);

        // Create expense record
        const expense = await server.prisma.expense.create({
            data: {
                orgId,
                tripId: tripId || 'unassigned',
                category: extracted.category,
                amount: extracted.amount,
                currency: extracted.currency || 'RUB',
                vatAmount: extracted.vatAmount,
                vendorName: extracted.vendorName,
                receiptDate: extracted.receiptDate ? new Date(extracted.receiptDate) : undefined,
                imageUrl: `/uploads/${fileName}`,
                extractedData: extracted,
                warning,
            },
        });

        return { expense, warning };
    });

    // GET /api/expenses — List expenses for a trip or org
    server.get<{
        Querystring: { orgId: string; tripId?: string };
    }>('/', async (req, reply) => {
        const { orgId, tripId } = req.query;
        const where: any = { orgId };
        if (tripId) where.tripId = tripId;

        const expenses = await server.prisma.expense.findMany({
            where,
            orderBy: { receiptDate: 'desc' },
        });

        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        return { expenses, total };
    });
};
