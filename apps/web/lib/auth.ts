import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { normalizeRole } from '@/lib/roles';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const normalizedEmail = credentials.email.trim().toLowerCase();
                const user = await prisma.user.findUnique({
                    where: { email: normalizedEmail },
                    include: { org: true },
                });

                if (!user || !user.passwordHash) {
                    throw new Error('User not found');
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                const role = normalizeRole(user.role) || 'ACCOUNTANT_CLERK';

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role,
                    authMethod: user.authMethod,
                    orgId: user.orgId,
                    orgName: user.org.name,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.authMethod = (user as any).authMethod;
                token.orgId = (user as any).orgId;
                token.orgName = (user as any).orgName;
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
            return session;
        },
    },
};
