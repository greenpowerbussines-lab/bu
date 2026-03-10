import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ASSIGNABLE_ROLES: UserRole[] = ['MANAGER', 'CHIEF_ACCOUNTANT', 'ACCOUNTANT_CLERK', 'WAREHOUSE_KEEPER'];

type RouteContext = {
    params: {
        id: string;
    };
};

// DELETE /api/employees/[id] - CEO removes employee
export async function DELETE(_req: Request, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CEO') {
        return NextResponse.json({ error: 'Only CEO can remove employees' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target || target.orgId !== session.user.orgId) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (target.id === session.user.id) {
        return NextResponse.json({ error: 'CEO cannot remove self' }, { status: 400 });
    }

    if (target.role === 'CEO') {
        return NextResponse.json({ error: 'CEO account cannot be removed' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Employee removed' });
}

type UpdateEmployeePayload = {
    role?: UserRole;
};

// PATCH /api/employees/[id] - CEO updates employee role
export async function PATCH(req: Request, { params }: RouteContext) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'CEO') {
        return NextResponse.json({ error: 'Only CEO can change roles' }, { status: 403 });
    }

    const body = (await req.json()) as UpdateEmployeePayload;
    if (!body.role || !ASSIGNABLE_ROLES.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target || target.orgId !== session.user.orgId) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (target.id === session.user.id || target.role === 'CEO') {
        return NextResponse.json({ error: 'CEO role cannot be changed' }, { status: 400 });
    }

    const employee = await prisma.user.update({
        where: { id: params.id },
        data: { role: body.role },
        select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ employee });
}
