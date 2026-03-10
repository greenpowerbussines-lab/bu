'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, Trash2, Pencil, X, Check } from 'lucide-react';
import { ROLE_LABELS, ASSIGNABLE_ROLES } from '@/lib/roles';

type Employee = {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
};

export default function EmployeesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const user = session?.user;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState('');
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ACCOUNTANT_CLERK' });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await fetch('/api/employees');
            if (!res.ok) return;
            const data = await res.json();
            setEmployees(data.employees || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (status === 'authenticated') {
            if (user?.role !== 'CEO') {
                router.push('/dashboard');
                return;
            }
            fetchEmployees();
        }
    }, [status, user, router, fetchEmployees]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);
        try {
            if (form.password.length < 8) {
                setFormError('Пароль должен содержать минимум 8 символов');
                return;
            }

            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) {
                setFormError(data.error || 'Ошибка');
                return;
            }
            setForm({ name: '', email: '', password: '', role: 'ACCOUNTANT_CLERK' });
            setShowForm(false);
            fetchEmployees();
        } catch {
            setFormError('Ошибка подключения');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить сотрудника?')) return;
        await fetch(`/api/employees/${id}`, { method: 'DELETE' });
        fetchEmployees();
    };

    const handleRoleChange = async (id: string) => {
        const res = await fetch(`/api/employees/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: editRole }),
        });
        if (res.ok) {
            setEditingId(null);
            fetchEmployees();
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-[-0.04em] text-foreground">
                        Управление сотрудниками
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        CEO создаёт аккаунты сотрудников и назначает роли. Сотрудники входят через email и пароль.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="pill-button pill-button-primary flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Добавить сотрудника
                </button>
            </div>

            {/* Role legend */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {ASSIGNABLE_ROLES.map((r) => (
                    <div key={r.value} className="rounded-2xl border border-black/6 bg-white/70 p-4">
                        <div className="text-sm font-semibold text-foreground">{r.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                            {r.value === 'MANAGER' && 'Дашборд, документы, аналитика, контрагенты'}
                            {r.value === 'CHIEF_ACCOUNTANT' && 'Все финансовые модули, биллинг, настройки'}
                            {r.value === 'ACCOUNTANT_CLERK' && 'Документы, сверки, транзакции, расходы'}
                            {r.value === 'WAREHOUSE_KEEPER' && 'Дашборд и первичные документы'}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add employee form */}
            {showForm && (
                <div className="rounded-2xl border border-black/6 bg-white/80 p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Новый сотрудник</h2>
                        <button
                            type="button"
                            onClick={() => { setShowForm(false); setFormError(''); }}
                            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {formError && (
                        <div className="mb-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600">
                            {formError}
                        </div>
                    )}

                    <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Имя сотрудника
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Алишер Каримов"
                                required
                                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                placeholder="alisher@company.uz"
                                required
                                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                                Пароль
                            </label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                                minLength={8}
                                placeholder="Минимум 6 символов"
                                required
                                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">Роль</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                                className="w-full rounded-2xl border border-black/6 bg-white/75 px-4 py-3 text-sm outline-none focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
                            >
                                {ASSIGNABLE_ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setFormError(''); }}
                                className="pill-button"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={formLoading}
                                className="pill-button pill-button-primary"
                            >
                                {formLoading ? 'Создаём...' : 'Создать аккаунт'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Employees table */}
            <div className="rounded-2xl border border-black/6 bg-white/80 overflow-hidden">
                <div className="border-b border-black/5 px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Users className="h-4 w-4" />
                        Сотрудники компании ({employees.length})
                    </div>
                </div>

                {employees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                        <Users className="h-10 w-10 opacity-30" />
                        <p className="text-sm">Сотрудников пока нет. Добавьте первого сотрудника.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-black/5">
                        {employees.map((emp) => (
                            <div key={emp.id} className="flex items-center gap-4 px-6 py-4">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#e8eaef] text-sm font-semibold text-foreground">
                                    {(emp.name?.[0] || 'U').toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-foreground">{emp.name}</div>
                                    <div className="text-xs text-muted-foreground">{emp.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingId === emp.id ? (
                                        <>
                                            <select
                                                value={editRole}
                                                onChange={(e) => setEditRole(e.target.value)}
                                                className="rounded-xl border border-black/6 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary/30"
                                            >
                                                {ASSIGNABLE_ROLES.map((r) => (
                                                    <option key={r.value} value={r.value}>
                                                        {r.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange(emp.id)}
                                                className="rounded-full p-1.5 text-emerald-600 hover:bg-emerald-50"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                    emp.role === 'CEO'
                                                        ? 'bg-[#ffcc00]/20 text-[#a07800]'
                                                        : emp.role === 'CHIEF_ACCOUNTANT'
                                                        ? 'bg-primary/10 text-primary'
                                                        : emp.role === 'MANAGER'
                                                        ? 'bg-purple-500/10 text-purple-600'
                                                        : emp.role === 'ACCOUNTANT_CLERK'
                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                        : 'bg-orange-500/10 text-orange-600'
                                                }`}
                                            >
                                                {ROLE_LABELS[emp.role] || emp.role}
                                            </span>
                                            {emp.role !== 'CEO' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingId(emp.id);
                                                            setEditRole(emp.role);
                                                        }}
                                                        className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                                                        title="Изменить роль"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(emp.id)}
                                                        className="rounded-full p-1.5 text-rose-400 hover:text-rose-600"
                                                        title="Удалить"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
