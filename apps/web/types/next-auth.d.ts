import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: DefaultSession['user'] & {
            id: string;
            role: string;
            authMethod?: string;
            orgId: string;
            orgName: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?: string;
        role?: string;
        authMethod?: string;
        orgId?: string;
        orgName?: string;
    }
}
