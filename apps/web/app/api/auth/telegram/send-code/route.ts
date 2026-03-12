import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TELEGRAM_CODE_PREFIX = 'telegram-login:';
const CODE_TTL_MINUTES = 10;

function normalizeTelegramId(value: string): string {
    return value.trim().replace(/^@/, '');
}

async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Telegram send failed: ${response.status} ${errorBody}`);
    }
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { telegramId?: string };
        const telegramId = normalizeTelegramId(body.telegramId || '');

        if (!telegramId) {
            return NextResponse.json({ error: 'Введите Telegram ID' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId },
            select: { id: true, telegramId: true },
        });

        // Keep response neutral to avoid user enumeration.
        if (!user?.telegramId) {
            return NextResponse.json({ message: 'Если аккаунт найден, код отправлен в Telegram.' });
        }

        const code = crypto.randomInt(100000, 1000000).toString();
        const identifier = `${TELEGRAM_CODE_PREFIX}${telegramId}`;
        const token = `${telegramId}:${code}`;
        const expires = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

        await prisma.verificationToken.deleteMany({ where: { identifier } });
        await prisma.verificationToken.create({
            data: {
                identifier,
                token,
                expires,
            },
        });

        await sendTelegramMessage(
            user.telegramId,
            `BuhAI: код входа ${code}. Срок действия: ${CODE_TTL_MINUTES} минут.`,
        );

        return NextResponse.json({ message: 'Код отправлен в Telegram.' });
    } catch (error) {
        console.error('[telegram send-code]', error);
        return NextResponse.json({ error: 'Не удалось отправить код в Telegram' }, { status: 500 });
    }
}
