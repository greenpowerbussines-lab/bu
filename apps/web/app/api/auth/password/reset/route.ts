import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

const RESET_PREFIX = 'password-reset:';

export async function POST(req: Request) {
    try {
        const body = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
        const token = (body.token || '').trim();
        const password = body.password || '';

        if (!token) {
            return NextResponse.json({ error: 'Токен сброса не передан' }, { status: 400 });
        }

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов' }, { status: 400 });
        }

        const resetToken = await prisma.verificationToken.findUnique({
            where: { token },
        });

        if (!resetToken || !resetToken.identifier.startsWith(RESET_PREFIX) || resetToken.expires <= new Date()) {
            return NextResponse.json({ error: 'Ссылка недействительна или устарела' }, { status: 400 });
        }

        const email = resetToken.identifier.slice(RESET_PREFIX.length);
        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { email },
                data: {
                    passwordHash,
                    authMethod: 'CREDENTIALS',
                },
            });

            await tx.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier: resetToken.identifier,
                        token: resetToken.token,
                    },
                },
            });
        });

        return NextResponse.json({ message: 'Пароль успешно обновлен' });
    } catch (error) {
        console.error('[password reset]', error);
        return NextResponse.json({ error: 'Не удалось обновить пароль' }, { status: 500 });
    }
}
