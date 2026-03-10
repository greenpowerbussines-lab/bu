import { NextResponse } from 'next/server';
import { AuthMethod, TaxRegime, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

type RegisterPayload = {
    name?: string;
    email?: string;
    password?: string;
    orgName?: string;
    inn?: string;
    taxRegime?: string;
    authMethod?: 'credentials' | 'oneid' | 'eri';
    oneIdSub?: string;
    eriKeyData?: string;
};

const ALLOWED_TAX_REGIMES = new Set<TaxRegime>(['USN', 'OSN', 'PATENT', 'ENVD', 'ESN']);

function mapAuthMethod(method: RegisterPayload['authMethod']): AuthMethod {
    if (method === 'oneid') return 'ONE_ID';
    if (method === 'eri') return 'ERI';
    return 'CREDENTIALS';
}

function resolveTaxRegime(raw: string | undefined): TaxRegime {
    if (!raw) return 'USN';
    if (ALLOWED_TAX_REGIMES.has(raw as TaxRegime)) return raw as TaxRegime;
    return 'USN';
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as RegisterPayload;
        const {
            name = '',
            email = '',
            password = '',
            orgName = '',
            inn = '',
            taxRegime,
            authMethod = 'credentials',
            oneIdSub,
            eriKeyData,
        } = body;

        if (!email.trim() || !orgName.trim() || !inn.trim()) {
            return NextResponse.json({ error: 'Заполните email, название компании и ИНН' }, { status: 400 });
        }

        if (!password || password.length < 8) {
            return NextResponse.json({ error: 'Пароль CEO должен содержать минимум 8 символов' }, { status: 400 });
        }

        if (authMethod === 'oneid' && !oneIdSub?.trim()) {
            return NextResponse.json({ error: 'Для OneID не получен идентификатор пользователя' }, { status: 400 });
        }

        if (authMethod === 'eri' && !eriKeyData?.trim()) {
            return NextResponse.json({ error: 'Для ERI требуется подтвержденный ключ' }, { status: 400 });
        }

        const existingByEmail = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existingByEmail) {
            return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 400 });
        }

        if (oneIdSub?.trim()) {
            const existingByOneId = await prisma.user.findUnique({ where: { oneIdSub: oneIdSub.trim() } });
            if (existingByOneId) {
                return NextResponse.json({ error: 'Этот OneID уже привязан к другому пользователю' }, { status: 400 });
            }
        }

        const existingOrg = await prisma.organization.findUnique({ where: { inn: inn.trim() } });
        if (existingOrg) {
            return NextResponse.json({ error: 'Организация с таким ИНН уже зарегистрирована' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const resolvedAuthMethod = mapAuthMethod(authMethod);
        const resolvedTaxRegime = resolveTaxRegime(taxRegime);

        const createdUser = await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: orgName.trim(),
                    inn: inn.trim(),
                    taxRegime: resolvedTaxRegime,
                },
            });

            return tx.user.create({
                data: {
                    name: name.trim() || email.trim(),
                    email: email.trim().toLowerCase(),
                    passwordHash,
                    role: UserRole.CEO,
                    authMethod: resolvedAuthMethod,
                    oneIdSub: oneIdSub?.trim() || null,
                    eriKeyData: resolvedAuthMethod === 'ERI' ? eriKeyData?.trim() || null : null,
                    orgId: org.id,
                },
            });
        });

        return NextResponse.json(
            {
                message: 'Аккаунт CEO создан успешно',
                userId: createdUser.id,
            },
            { status: 201 },
        );
    } catch (error: any) {
        console.error('[register POST]', error);
        return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
