import crypto from 'crypto';
import type { Prisma, UserRole } from '@prisma/client';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { normalizeRole } from '@/lib/roles';

const DEV_FALLBACK_SECRET = 'dev-only-buhai-secret-change-me';
const TELEGRAM_CODE_PREFIX = 'telegram-login:';

type AuthPayload = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    authMethod: string;
    orgId: string;
    orgName: string;
};

function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

function normalizeTelegramId(value: string): string {
    return value.trim().replace(/^@/, '');
}

function resolveAuthSecret(): string | undefined {
    const explicitSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
    if (explicitSecret) return explicitSecret;

    if (process.env.DATABASE_URL) {
        return crypto.createHash('sha256').update(process.env.DATABASE_URL).digest('hex');
    }

    if (process.env.NODE_ENV !== 'production') {
        return DEV_FALLBACK_SECRET;
    }

    return undefined;
}

function createDefaultInnSeed(email: string): string {
    const username = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '').toUpperCase() || 'ORG';
    const timestamp = Date.now().toString().slice(-8);
    const suffix = crypto.randomInt(1000, 9999).toString();
    return `G${username.slice(0, 6)}${timestamp}${suffix}`;
}

async function mapDbUserToAuthPayload(userId: string): Promise<AuthPayload | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { org: true },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role) || 'ACCOUNTANT_CLERK',
        authMethod: user.authMethod,
        orgId: user.orgId,
        orgName: user.org.name,
    };
}

async function getUserByEmail(email: string): Promise<AuthPayload | null> {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { org: true },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role) || 'ACCOUNTANT_CLERK',
        authMethod: user.authMethod,
        orgId: user.orgId,
        orgName: user.org.name,
    };
}

async function getUserByTelegramId(telegramId: string): Promise<AuthPayload | null> {
    const user = await prisma.user.findUnique({
        where: { telegramId },
        include: { org: true },
    });

    if (!user) return null;

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: normalizeRole(user.role) || 'ACCOUNTANT_CLERK',
        authMethod: 'TELEGRAM',
        orgId: user.orgId,
        orgName: user.org.name,
    };
}

async function createGoogleUser(email: string, name: string | null | undefined): Promise<AuthPayload> {
    const displayName = (name || email.split('@')[0] || 'Google User').trim();

    for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
            const inn = createDefaultInnSeed(email);
            const created = await prisma.$transaction(async (tx) => {
                const org = await tx.organization.create({
                    data: {
                        name: `${displayName} Company`,
                        inn,
                        taxRegime: 'USN',
                    },
                });

                return tx.user.create({
                    data: {
                        name: displayName,
                        email,
                        role: 'CEO' as UserRole,
                        authMethod: 'CREDENTIALS',
                        orgId: org.id,
                    },
                    include: { org: true },
                });
            });

            return {
                id: created.id,
                email: created.email,
                name: created.name,
                role: 'CEO',
                authMethod: 'GOOGLE',
                orgId: created.orgId,
                orgName: created.org.name,
            };
        } catch (error) {
            if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
                continue;
            }
            throw error;
        }
    }

    throw new Error('Could not create a default organization for Google account');
}

const providers: NextAuthOptions['providers'] = [
    CredentialsProvider({
        id: 'credentials',
        name: 'Email and Password',
        credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
                throw new Error('Email and password are required');
            }

            const email = normalizeEmail(credentials.email);
            const user = await prisma.user.findUnique({
                where: { email },
                include: { org: true },
            });

            if (!user || !user.passwordHash) {
                throw new Error('Invalid credentials');
            }

            const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: normalizeRole(user.role) || 'ACCOUNTANT_CLERK',
                authMethod: user.authMethod,
                orgId: user.orgId,
                orgName: user.org.name,
            };
        },
    }),
    CredentialsProvider({
        id: 'telegram',
        name: 'Telegram',
        credentials: {
            telegramId: { label: 'Telegram ID', type: 'text' },
            code: { label: 'Code', type: 'text' },
        },
        async authorize(credentials) {
            const telegramId = normalizeTelegramId(credentials?.telegramId || '');
            const code = (credentials?.code || '').trim();
            if (!telegramId || !code) {
                throw new Error('Telegram ID and code are required');
            }

            const identifier = `${TELEGRAM_CODE_PREFIX}${telegramId}`;
            const token = `${telegramId}:${code}`;
            const verificationToken = await prisma.verificationToken.findUnique({
                where: {
                    identifier_token: {
                        identifier,
                        token,
                    },
                },
            });

            if (!verificationToken || verificationToken.expires <= new Date()) {
                throw new Error('Telegram code is invalid or expired');
            }

            await prisma.verificationToken.delete({
                where: {
                    identifier_token: {
                        identifier,
                        token,
                    },
                },
            });

            return getUserByTelegramId(telegramId);
        },
    }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    );
}

export const authOptions: NextAuthOptions = {
    secret: resolveAuthSecret(),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== 'google') {
                return true;
            }

            const email = user.email ? normalizeEmail(user.email) : '';
            if (!email) return false;

            let dbUser = await getUserByEmail(email);
            if (!dbUser) {
                dbUser = await createGoogleUser(email, user.name);
            }

            (user as any).id = dbUser.id;
            (user as any).role = dbUser.role;
            (user as any).authMethod = 'GOOGLE';
            (user as any).orgId = dbUser.orgId;
            (user as any).orgName = dbUser.orgName;
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = (user as any).id;
                token.role = (user as any).role;
                token.authMethod = (user as any).authMethod;
                token.orgId = (user as any).orgId;
                token.orgName = (user as any).orgName;
                return token;
            }

            if ((!token.id || !token.orgId || !token.role) && token.email) {
                const dbUser = await getUserByEmail(normalizeEmail(token.email));
                if (dbUser) {
                    token.id = dbUser.id;
                    token.role = dbUser.role;
                    token.authMethod = dbUser.authMethod;
                    token.orgId = dbUser.orgId;
                    token.orgName = dbUser.orgName;
                }
            }

            if (!token.id && token.email) {
                const dbUser = await getUserByEmail(normalizeEmail(token.email));
                if (dbUser) {
                    token.id = dbUser.id;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).authMethod = token.authMethod;
                (session.user as any).orgId = token.orgId;
                (session.user as any).orgName = token.orgName;
            }

            if (!(session.user as any).orgId && token.id) {
                const dbUser = await mapDbUserToAuthPayload(token.id);
                if (dbUser && session.user) {
                    (session.user as any).role = dbUser.role;
                    (session.user as any).authMethod = dbUser.authMethod;
                    (session.user as any).orgId = dbUser.orgId;
                    (session.user as any).orgName = dbUser.orgName;
                }
            }

            return session;
        },
    },
};
