import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mailer';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_PREFIX = 'password-reset:';

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function getBaseUrl(req: Request): string {
    const envUrl = process.env.NEXTAUTH_URL || process.env.APP_URL;
    if (envUrl) return envUrl.replace(/\/$/, '');

    const headers = req.headers;
    const protocol = headers.get('x-forwarded-proto') || 'https';
    const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { email?: string };
        const email = normalizeEmail(body.email || '');
        if (!email) {
            return NextResponse.json({ error: 'Введите email' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: { email: true, name: true },
        });

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const identifier = `${RESET_PREFIX}${email}`;
            const expires = new Date(Date.now() + TOKEN_TTL_MS);

            await prisma.verificationToken.deleteMany({ where: { identifier } });
            await prisma.verificationToken.create({
                data: {
                    identifier,
                    token,
                    expires,
                },
            });

            const resetUrl = `${getBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
            await sendPasswordResetEmail({
                to: user.email,
                userName: user.name || user.email,
                resetUrl,
            });
        }

        return NextResponse.json({
            message: 'Если аккаунт существует, мы отправили письмо со ссылкой для сброса пароля.',
        });
    } catch (error) {
        console.error('[password forgot]', error);
        return NextResponse.json({ error: 'Не удалось отправить письмо для сброса пароля' }, { status: 500 });
    }
}
