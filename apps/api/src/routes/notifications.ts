import { FastifyPluginAsync } from 'fastify';

export const notificationsRoutes: FastifyPluginAsync = async (server) => {
    // GET /api/notifications/ar — Get list of pending AR reminders
    server.get<{
        Querystring: { orgId: string };
    }>('/ar', async (req, reply) => {
        const { orgId } = req.query;

        // In a real app, we would query Documents where type=INVOICE and status=UNPAID
        // and check against their dueDate.
        // For the MVP, we'll simulate this with some logic.

        const overdueInvoices = await server.prisma.document.findMany({
            where: {
                orgId,
                type: 'INVOICE',
                status: 'PENDING', // Assuming PENDING means unpaid
                // dueDate would be in extractedData JSON or a separate field
            },
        });

        // Filter and map to reminder format
        const reminders = overdueInvoices.map((doc) => {
            const data = (doc.extractedData as any) || {};
            return {
                id: doc.id,
                clientName: data.clientName || data.vendorName || 'Неизвестный клиент',
                amount: data.amount || 0,
                dueDate: data.dueDate || doc.createdAt,
                daysOverdue: Math.floor((Date.now() - new Date(doc.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                status: 'READY_TO_SEND',
            };
        }).filter((r) => r.daysOverdue > 0);

        return reminders;
    });

    // POST /api/notifications/send — Send a reminder
    server.post<{
        Body: { orgId: string; documentId: string; channel: 'EMAIL' | 'TELEGRAM'; status?: string };
    }>('/send', async (req, reply) => {
        const { orgId, documentId, channel } = req.body;

        const doc = await server.prisma.document.findUnique({ where: { id: documentId } });
        if (!doc) return reply.status(404).send({ error: 'Document not found' });

        // Simulate sending
        console.log(`Sending AR reminder for doc ${documentId} via ${channel}`);

        await server.prisma.notificationLog.create({
            data: {
                orgId,
                documentId,
                channel,
                status: 'SENT',
                sentAt: new Date(),
                recipient: 'system', // Default or derived from org settings
                body: `AR Reminder sent for document ${documentId}`,
            }
        });

        return { success: true, message: `Reminder sent via ${channel}` };
    });
};
