import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

import { documentsRoutes } from './routes/documents';
import { reconcileRoutes } from './routes/reconcile';
import { chatRoutes } from './routes/chat';
import { contractorsRoutes } from './routes/contractors';
import { transactionsRoutes } from './routes/transactions';
import { analysisRoutes } from './routes/analysis';
import { expensesRoutes } from './routes/expenses';
import { deadlinesRoutes } from './routes/deadlines';
import { notificationsRoutes } from './routes/notifications';
import { prismaPlugin } from './plugins/prisma';
import { BuhAiBot } from '@buhai/integrations';

const server = Fastify({
    logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport:
            process.env.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
    },
});

async function start() {
    // Plugins
    await server.register(cors, {
        origin: [
            'http://localhost:3000',
            process.env.FRONTEND_URL || 'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        credentials: true,
    });

    await server.register(multipart, {
        limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    });

    await server.register(prismaPlugin);

    // Prefix all routes with /api
    await server.register(
        async (app: FastifyInstance) => {
            await app.register(documentsRoutes, { prefix: '/documents' });
            await app.register(reconcileRoutes, { prefix: '/reconcile' });
            await app.register(chatRoutes, { prefix: '/chat' });
            await app.register(contractorsRoutes, { prefix: '/contractors' });
            await app.register(transactionsRoutes, { prefix: '/transactions' });
            await app.register(analysisRoutes, { prefix: '/analysis' });
            await app.register(expensesRoutes, { prefix: '/expenses' });
            await app.register(deadlinesRoutes, { prefix: '/deadlines' });
            await app.register(notificationsRoutes, { prefix: '/notifications' });
        },
        { prefix: '/api' }
    );

    // Health check
    server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`🚀 BuhAI API running at http://localhost:${port}`);

    // Launch Telegram Bot if token provided
    if (process.env.TELEGRAM_BOT_TOKEN) {
        const bot = new BuhAiBot(process.env.TELEGRAM_BOT_TOKEN);
        bot.launch();
    }
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
