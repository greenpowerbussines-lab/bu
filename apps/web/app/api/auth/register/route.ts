import { NextResponse } from 'next/server';
import { Prisma, TaxRegime, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

type RegisterPayload = {
    name?: string;
    email?: string;
    password?: string;
    orgName?: string;
    inn?: string;
    taxRegime?: string;
    telegramId?: string;
};

const ALLOWED_TAX_REGIMES = new Set<TaxRegime>(['USN', 'OSN', 'PATENT', 'ENVD', 'ESN']);

function resolveTaxRegime(raw: string | undefined): TaxRegime {
    if (!raw) return 'USN';
    if (ALLOWED_TAX_REGIMES.has(raw as TaxRegime)) return raw as TaxRegime;
    return 'USN';
}

function normalizeTelegramId(raw: string | undefined): string | null {
    const value = (raw || '').trim().replace(/^@/, '');
    return value || null;
}

function isTaxRegimeEnumMismatch(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('invalid input value for enum') && message.includes('TaxRegime');
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterPayload;
        const name = (body.name || '').trim();
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';
        const orgName = (body.orgName || '').trim();
        const inn = (body.inn || '').trim();
        const telegramId = normalizeTelegramId(body.telegramId);

        if (!email || !orgName || !inn) {
            return NextResponse.json({ error: 'Заполните email, название компании и ИНН' }, { status: 400 });
        }

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Пароль CEO должен содержать минимум 8 символов' }, { status: 400 });
        }

        const existingByEmail = await prisma.user.findUnique({ where: { email } });
        if (existingByEmail) {
            return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 });
        }

        if (telegramId) {
            const existingByTelegramId = await prisma.user.findUnique({ where: { telegramId } });
            if (existingByTelegramId) {
                return NextResponse.json({ error: 'Этот Telegram ID уже привязан к другому аккаунту' }, { status: 400 });
            }
        }

        const existingOrg = await prisma.organization.findUnique({ where: { inn } });
        if (existingOrg) {
            return NextResponse.json({ error: 'Организация с таким ИНН уже зарегистрирована' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const selectedTaxRegime = resolveTaxRegime(body.taxRegime);

        const createUserWithTaxRegime = async (taxRegime: TaxRegime) => {
            return prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name: orgName,
                        inn,
                        taxRegime,
                    },
                });

                return tx.user.create({
                    data: {
                        name: name || email,
                        email,
                        passwordHash,
                        role: UserRole.CEO,
                        authMethod: 'CREDENTIALS',
                        telegramId,
                        orgId: org.id,
                    },
                });
            });
        };

        let createdUser;
        try {
            createdUser = await createUserWithTaxRegime(selectedTaxRegime);
        } catch (creationError) {
            // Temporary compatibility fallback for old DB enum definitions.
            if (selectedTaxRegime !== 'USN' && isTaxRegimeEnumMismatch(creationError)) {
                createdUser = await createUserWithTaxRegime('USN');
            } else {
                throw creationError;
            }
        }

        return NextResponse.json(
            {
                message: 'Аккаунт CEO создан успешно',
                userId: createdUser.id,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error('[register POST]', error);

        if (error instanceof Prisma.PrismaClientInitializationError) {
            return NextResponse.json(
                { error: 'Нет подключения к базе данных. Проверьте DATABASE_URL в Vercel.' },
                { status: 503 },
            );
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2021') {
                return NextResponse.json(
                    { error: 'Таблицы базы данных не созданы. Выполните prisma db push для production БД.' },
                    { status: 500 },
                );
            }

            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: 'Пользователь или организация с такими данными уже существует.' },
                    { status: 400 },
                );
            }
        }

        if (isTaxRegimeEnumMismatch(error)) {
            return NextResponse.json(
                { error: 'В базе не обновлен список налоговых режимов. Обновите схему через prisma db push.' },
                { status: 500 },
            );
        }

        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
