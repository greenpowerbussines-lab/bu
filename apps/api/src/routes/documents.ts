import { FastifyPluginAsync } from 'fastify';
import path from 'path';
import fs from 'fs';
import { callClaudeVision, parseClaudeJson, CLASSIFY_DOCUMENT_PROMPT } from '@buhai/ai';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const documentsRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/documents — List documents for an org
    server.get<{
        Querystring: {
            orgId: string;
            type?: string;
            status?: string;
            search?: string;
            page?: number;
            limit?: number;
        };
    }>('/', async (req, reply) => {
        const { orgId, type, status, search, page = 1, limit = 20 } = req.query;

        if (!orgId) {
            return reply.status(400).send({ error: 'orgId is required' });
        }

        const where: any = { orgId };
        if (type) where.type = type;
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { fileName: { contains: search, mode: 'insensitive' } },
                { contractorName: { contains: search, mode: 'insensitive' } },
                { contractorInn: { contains: search } },
                { documentNumber: { contains: search, mode: 'insensitive' } },
                { tags: { has: search } },
            ];
        }

        const [total, docs] = await Promise.all([
            server.prisma.document.count({ where }),
            server.prisma.document.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        return { data: docs, total, page, limit, pages: Math.ceil(total / limit) };
    });

    // POST /api/documents/upload — Upload + OCR a document
    server.post('/upload', async (req, reply) => {
        const data = await req.file();
        if (!data) {
            return reply.status(400).send({ error: 'No file uploaded' });
        }

        const orgId = (req.query as any).orgId;
        if (!orgId) {
            return reply.status(400).send({ error: 'orgId is required' });
        }

        // Save file locally (or R2 in production)
        const fileName = `${Date.now()}-${data.filename}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const buffer = await data.toBuffer();
        fs.writeFileSync(filePath, buffer);

        // Create document record (PENDING)
        const doc = await server.prisma.document.create({
            data: {
                fileName: data.filename,
                fileUrl: `/uploads/${fileName}`,
                mimeType: data.mimetype,
                fileSize: buffer.length,
                status: 'PENDING',
                orgId,
            },
        });

        // Process asynchronously
        processDocument(server, doc.id, buffer, data.mimetype).catch(console.error);

        return reply.status(201).send({ document: doc, message: 'Document uploaded, processing...' });
    });

    // GET /api/documents/:id — Get single document
    server.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
        const doc = await server.prisma.document.findUnique({
            where: { id: req.params.id },
        });

        if (!doc) return reply.status(404).send({ error: 'Document not found' });
        return doc;
    });

    // DELETE /api/documents/:id
    server.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
        await server.prisma.document.delete({ where: { id: req.params.id } });
        return { success: true };
    });
};

async function processDocument(
    server: any,
    docId: string,
    buffer: Buffer,
    mimeType: string
) {
    try {
        await server.prisma.document.update({
            where: { id: docId },
            data: { status: 'PROCESSING' },
        });

        // Convert buffer to base64 for Claude Vision
        const base64 = buffer.toString('base64');

        const result = await callClaudeVision(base64, CLASSIFY_DOCUMENT_PROMPT, {
            module: 'document-classify',
        });

        const extracted = parseClaudeJson<{
            type: string;
            contractorName: string | null;
            contractorInn: string | null;
            amount: number | null;
            currency: string;
            documentDate: string | null;
            documentNumber: string | null;
            tags: string[];
        }>(result.text);

        if (extracted) {
            await server.prisma.document.update({
                where: { id: docId },
                data: {
                    status: 'PROCESSED',
                    type: (extracted.type as any) || 'OTHER',
                    contractorName: extracted.contractorName,
                    contractorInn: extracted.contractorInn,
                    amount: extracted.amount ? extracted.amount : undefined,
                    currency: extracted.currency || 'RUB',
                    documentDate: extracted.documentDate
                        ? new Date(extracted.documentDate)
                        : undefined,
                    documentNumber: extracted.documentNumber,
                    tags: extracted.tags || [],
                    extractedData: extracted,
                },
            });

            // Log AI call
            await server.prisma.aiCallLog.create({
                data: {
                    model: 'claude-opus-4-5',
                    module: 'document-classify',
                    inputTokens: result.inputTokens,
                    outputTokens: result.outputTokens,
                    durationMs: result.durationMs,
                    success: true,
                },
            });
        } else {
            await server.prisma.document.update({
                where: { id: docId },
                data: { status: 'ERROR' },
            });
        }
    } catch (error) {
        console.error('[Document Processing] Error:', error);
        await server.prisma.document.update({
            where: { id: docId },
            data: { status: 'ERROR' },
        });
    }
}
