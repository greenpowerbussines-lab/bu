import crypto from 'crypto';
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

function resolveOrgName(name: string, email: string, providedOrgName: string): string {
    if (providedOrgName) return providedOrgName;
    if (name) return `${name} Team`;
    const emailPrefix = email.split('@')[0] || 'Team';
    return `${emailPrefix} Team`;
}

function generateInnCandidate(): string {
    const timestampTail = Date.now().toString().slice(-8);
    const randomTail = crypto.randomInt(1000, 10000).toString();
    return `${timestampTail}${randomTail}`.slice(0, 12);
}

async function ensureUniqueInn(preferredInn: string): Promise<string> {
    const normalized = preferredInn.trim();
    if (normalized) {
        const existing = await prisma.organization.findUnique({ where: { inn: normalized } });
        if (!existing) return normalized;
        throw new Error('ORG_INN_EXISTS');
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
        const candidate = generateInnCandidate();
        const existing = await prisma.organization.findUnique({ where: { inn: candidate } });
        if (!existing) return candidate;
    }

    throw new Error('INN_GENERATION_FAILED');
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
        const preferredInn = (body.inn || '').trim();
        const selectedTaxRegime = resolveTaxRegime(body.taxRegime);
        const telegramId = normalizeTelegramId(body.telegramId);

        if (!email) {
            return NextResponse.json({ error: 'Введите email' }, { status: 400 });
        }

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Пароль должен содержать минимум 8 символов' }, { status: 400 });
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

        let resolvedInn: string;
        try {
            resolvedInn = await ensureUniqueInn(preferredInn);
        } catch (innError) {
            if (innError instanceof Error && innError.message === 'ORG_INN_EXISTS') {
                return NextResponse.json({ error: 'Организация с таким ИНН уже зарегистрирована' }, { status: 400 });
            }
            throw innError;
        }

        const resolvedOrgName = resolveOrgName(name, email, orgName);
        const passwordHash = await bcrypt.hash(password, 10);

        const createUserWithTaxRegime = async (taxRegime: TaxRegime) => {
            return prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name: resolvedOrgName,
                        inn: resolvedInn,
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
            // Keeps signup working when production DB still has old enum values.
            if (selectedTaxRegime !== 'USN' && isTaxRegimeEnumMismatch(creationError)) {
                createdUser = await createUserWithTaxRegime('USN');
            } else {
                throw creationError;
            }
        }

        return NextResponse.json(
            {
                message: 'Аккаунт создан успешно',
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

        if (error instanceof Error && error.message === 'INN_GENERATION_FAILED') {
            return NextResponse.json(
                { error: 'Не удалось сгенерировать данные организации. Попробуйте еще раз.' },
                { status: 500 },
            );
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
