import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ASSIGNABLE_ROLES: UserRole[] = ['MANAGER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT_CLERK', 'WAREHOUSE_KEEPER'];

// GET /api/employees - list all employees in the same org (CEO only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CEO') {
        return NextResponse.json({ error: 'Only CEO can manage employees' }, { status: 403 });
    }

    const employees = await prisma.user.findMany({
        where: { orgId: session.user.orgId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            authMethod: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ employees });
}

type CreateEmployeePayload = {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
};

// POST /api/employees - CEO creates an employee login/password
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CEO') {
        return NextResponse.json({ error: 'Only CEO can add employees' }, { status: 403 });
    }

    try {
        const body = (await req.json()) as CreateEmployeePayload;
        const name = body.name?.trim() || '';
        const email = body.email?.trim().toLowerCase() || '';
        const password = body.password || '';
        const role = body.role;

        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: 'Fill in all required fields' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }

        if (!ASSIGNABLE_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const employee = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                orgId: session.user.orgId,
                role,
                authMethod: 'CREDENTIALS',
                createdById: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json({ message: 'Employee created', employee }, { status: 201 });
    } catch (error) {
        console.error('[employees POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
