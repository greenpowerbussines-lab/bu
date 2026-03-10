export type UserRole =
    | 'CEO'
    | 'MANAGER'
    | 'CHIEF_ACCOUNTANT'
    | 'ACCOUNTANT_CLERK'
    | 'WAREHOUSE_KEEPER';

const LEGACY_ROLE_MAP: Record<string, UserRole> = {
    OWNER: 'CEO',
    ACCOUNTANT: 'CHIEF_ACCOUNTANT',
    EMPLOYEE: 'ACCOUNTANT_CLERK',
};

export const ROLE_LABELS: Record<string, string> = {
    CEO: 'CEO',
    MANAGER: 'Руководитель',
    CHIEF_ACCOUNTANT: 'Главный бухгалтер',
    ACCOUNTANT_CLERK: 'Бухгалтерский клерк',
    WAREHOUSE_KEEPER: 'Складчик',
    OWNER: 'Владелец (legacy)',
    ACCOUNTANT: 'Бухгалтер (legacy)',
    EMPLOYEE: 'Сотрудник (legacy)',
};

export function normalizeRole(rawRole?: string | null): UserRole | null {
    if (!rawRole) return null;
    if (rawRole in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[rawRole];
    if (
        rawRole === 'CEO' ||
        rawRole === 'MANAGER' ||
        rawRole === 'CHIEF_ACCOUNTANT' ||
        rawRole === 'ACCOUNTANT_CLERK' ||
        rawRole === 'WAREHOUSE_KEEPER'
    ) {
        return rawRole;
    }
    return null;
}

// Routes each role can access. '*' means full access.
export const ROLE_ROUTES: Record<UserRole, string[] | '*'> = {
    CEO: '*',
    MANAGER: [
        '/dashboard',
        '/archive',
        '/chat',
        '/contractors',
        '/calendar',
        '/risks',
        '/transactions',
        '/settings',
    ],
    CHIEF_ACCOUNTANT: [
        '/dashboard',
        '/archive',
        '/reconcile',
        '/chat',
        '/contractors',
        '/calendar',
        '/risks',
        '/transactions',
        '/expenses',
        '/notifications',
        '/billing',
        '/settings',
    ],
    ACCOUNTANT_CLERK: [
        '/dashboard',
        '/archive',
        '/reconcile',
        '/transactions',
        '/calendar',
        '/expenses',
        '/notifications',
        '/settings',
    ],
    WAREHOUSE_KEEPER: ['/dashboard', '/archive', '/settings'],
};

export function canAccess(rawRole: string | null | undefined, route: string): boolean {
    const role = normalizeRole(rawRole);
    if (!role) return false;

    const allowed = ROLE_ROUTES[role];
    if (allowed === '*') return true;

    return allowed.some((allowedRoute) => route === allowedRoute || route.startsWith(`${allowedRoute}/`));
}

export const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
    { value: 'MANAGER', label: 'Руководитель' },
    { value: 'CHIEF_ACCOUNTANT', label: 'Главный бухгалтер' },
    { value: 'ACCOUNTANT_CLERK', label: 'Бухгалтерский клерк' },
    { value: 'WAREHOUSE_KEEPER', label: 'Складчик' },
];
