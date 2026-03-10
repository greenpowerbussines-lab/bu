import { FastifyPluginAsync } from 'fastify';
import { streamClaude, buildChatSystemPrompt } from '@buhai/ai';

export const chatRoutes: FastifyPluginAsync = async (server) => {
    // POST /api/chat — Send message, get streaming response
    server.post<{
        Body: {
            orgId: string;
            sessionId: string;
            message: string;
        };
    }>('/', async (req, reply) => {
        const { orgId, sessionId, message } = req.body;

        if (!orgId || !message) {
            return reply.status(400).send({ error: 'orgId and message are required' });
        }

        // Get org info for system prompt
        const org = await server.prisma.organization.findUnique({
            where: { id: orgId },
        });

        if (!org) return reply.status(404).send({ error: 'Organization not found' });

        // Get chat history for this session
        const history = await server.prisma.chatMessage.findMany({
            where: { sessionId, orgId },
            orderBy: { createdAt: 'asc' },
            take: 20,
        });

        // Save user message
        await server.prisma.chatMessage.create({
            data: { role: 'user', content: message, sessionId, orgId },
        });

        // Build system prompt
        const systemPrompt = buildChatSystemPrompt({
            name: org.name,
            taxRegime: org.taxRegime,
            regulations: org.regulations,
            travelPolicy: org.travelPolicy,
        });

        const messages = [
            ...history.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
            { role: 'user' as const, content: message },
        ];

        // Stream response
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        let fullResponse = '';

        try {
            for await (const chunk of streamClaude(systemPrompt, messages, {
                module: 'chat',
                orgId,
            })) {
                fullResponse += chunk;
                reply.raw.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            }

            // Save assistant response
            await server.prisma.chatMessage.create({
                data: { role: 'assistant', content: fullResponse, sessionId, orgId },
            });

            reply.raw.write('data: [DONE]\n\n');
            reply.raw.end();
        } catch (err) {
            reply.raw.write(`data: ${JSON.stringify({ error: 'AI unavailable' })}\n\n`);
            reply.raw.end();
        }
    });

    // GET /api/chat/history — Get session history
    server.get<{
        Querystring: { orgId: string; sessionId: string };
    }>('/history', async (req, reply) => {
        const { orgId, sessionId } = req.query;

        const messages = await server.prisma.chatMessage.findMany({
            where: { orgId, sessionId },
            orderBy: { createdAt: 'asc' },
        });

        return messages;
    });

    // GET /api/chat/sessions — List all sessions for an org
    server.get<{ Querystring: { orgId: string } }>(
        '/sessions',
        async (req, reply) => {
            const { orgId } = req.query;

            const sessions = await server.prisma.chatMessage.groupBy({
                by: ['sessionId'],
                where: { orgId, role: 'user' },
                _max: { createdAt: true },
                _count: { id: true },
                orderBy: { _max: { createdAt: 'desc' } },
                take: 20,
            });

            return sessions;
        }
    );
};
