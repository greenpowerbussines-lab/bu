'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    PROCESSING: 'bg-buhai-400/10 text-buhai-300 border-buhai-400/20',
    PROCESSED: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    VERIFIED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    ERROR: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Ожидает', PROCESSING: 'Обработка...', PROCESSED: 'Обработан', VERIFIED: 'Проверен', ERROR: 'Ошибка'
};

const TYPE_ICONS: Record<string, string> = {
    INVOICE: '🧾', ACT: '📄', CONTRACT: '📑', RECEIPT: '🧾', WAYBILL: '📦', UPD: '📋', OTHER: '📎'
};

const MOCK_DOCS = [
    { id: '1', type: 'ACT', status: 'PROCESSED', fileName: 'Акт_Ромашка_март2024.pdf', contractorName: 'ООО Ромашка', amount: 150000, currency: 'RUB', documentDate: '2024-03-15', documentNumber: 'А-2024-042', tags: ['услуги', 'март 2024'] },
    { id: '2', type: 'INVOICE', status: 'PROCESSED', fileName: 'Счёт_ТехСервис.pdf', contractorName: 'ИП Петров', amount: 47500, currency: 'RUB', documentDate: '2024-03-18', documentNumber: 'С-147', tags: ['ремонт', 'техника'] },
    { id: '3', type: 'CONTRACT', status: 'VERIFIED', fileName: 'Договор_поставки.pdf', contractorName: 'ООО МегаПоставка', amount: 890000, currency: 'RUB', documentDate: '2024-01-10', documentNumber: 'Д-2024-001', tags: ['поставка', 'долгосрочный'] },
    { id: '4', type: 'RECEIPT', status: 'PENDING', fileName: 'Чек_Лента.jpg', contractorName: '', amount: 3240, currency: 'RUB', documentDate: '2024-03-20', documentNumber: '', tags: [] },
    { id: '5', type: 'UPD', status: 'PROCESSING', fileName: 'УПД_Газпром_март.xml', contractorName: 'ПАО Газпром', amount: 127890, currency: 'RUB', documentDate: '2024-03-19', documentNumber: 'УПД-2024-089', tags: ['газ', 'коммуналка'] },
];

export default function ArchivePage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [docs, setDocs] = useState<any[]>([]);
    const [filter, setFilter] = useState({ search: '', type: '', status: '' });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<any | null>(null);

    const fetchDocs = useCallback(async () => {
        if (!orgId) return;
        try {
            const params = new URLSearchParams({
                orgId,
                ...(filter.search && { search: filter.search }),
                ...(filter.type && { type: filter.type }),
                ...(filter.status && { status: filter.status }),
            });
            const res = await fetch(`${API_URL}/api/documents?${params}`);
            const data = await res.json();
            if (data.data) {
                setDocs(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        } finally {
            setLoading(false);
        }
    }, [orgId, filter]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    // Poll for processing status if there are processing docs
    useEffect(() => {
        const hasProcessing = docs.some(d => d.status === 'PROCESSING' || d.status === 'PENDING');
        if (hasProcessing) {
            const interval = setInterval(fetchDocs, 3000);
            return () => clearInterval(interval);
        }
    }, [docs, fetchDocs]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!orgId) return;
        setUploading(true);

        for (const file of acceptedFiles) {
            const formData = new FormData();
            formData.append('file', file);

            try {
                const res = await fetch(`${API_URL}/api/documents/upload?orgId=${orgId}`, {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    toast.success(`Файл ${file.name} загружен`);
                    fetchDocs();
                } else {
                    toast.error(`Ошибка при загрузке ${file.name}`);
                }
            } catch (error) {
                toast.error(`Ошибка сети при загрузке ${file.name}`);
            }
        }
        setUploading(false);
    }, [orgId, fetchDocs]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'], 'application/xml': ['.xml'] },
    });

    const filtered = docs; // Filtering happens on the backend now

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Архив документов</h1>
                    <p className="text-sm text-muted-foreground mt-1">OCR + AI классификация всех входящих документов</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-muted rounded-lg">{docs.length} документов</span>
                </div>
            </div>

            {/* Upload zone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="text-4xl mb-3">{uploading ? '⏳' : isDragActive ? '📥' : '☁️'}</div>
                <p className="font-medium mb-1">{isDragActive ? 'Отпустите для загрузки' : 'Перетащите файлы или нажмите для выбора'}</p>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG, XML · до 50 МБ · AI обработка автоматически</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Поиск по названию или контрагенту..."
                    value={filter.search}
                    onChange={(e) => setFilter(p => ({ ...p, search: e.target.value }))}
                    className="flex-1 min-w-[200px] px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
                <select
                    value={filter.type}
                    onChange={(e) => setFilter(p => ({ ...p, type: e.target.value }))}
                    className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Все типы</option>
                    <option value="INVOICE">Счёт</option>
                    <option value="ACT">Акт</option>
                    <option value="CONTRACT">Договор</option>
                    <option value="RECEIPT">Чек</option>
                    <option value="UPD">УПД</option>
                </select>
                <select
                    value={filter.status}
                    onChange={(e) => setFilter(p => ({ ...p, status: e.target.value }))}
                    className="px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">Все статусы</option>
                    <option value="PENDING">Ожидает</option>
                    <option value="PROCESSED">Обработан</option>
                    <option value="VERIFIED">Проверен</option>
                    <option value="ERROR">Ошибка</option>
                </select>
            </div>

            {/* Documents table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40">
                                {['Документ', 'Тип', 'Контрагент', 'Сумма', 'Дата', 'Статус', ''].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground animate-pulse">Загрузка...</td></tr>
                            ) : (
                                filtered.map((doc) => (
                                    <tr key={doc.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{TYPE_ICONS[doc.type] || '📎'}</span>
                                                <div>
                                                    <div className="font-medium text-foreground truncate max-w-[200px]">{doc.fileName}</div>
                                                    {doc.tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1">
                                                            {doc.tags.slice(0, 2).map((tag: string) => (
                                                                <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{doc.type}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{doc.contractorName || '—'}</td>
                                        <td className="px-4 py-3 font-mono">{doc.amount ? `${doc.amount.toLocaleString('ru-RU')} ₽` : '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{doc.documentDate || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`status-badge border ${STATUS_STYLES[doc.status]}`}>
                                                {doc.status === 'PROCESSING' && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                                                {STATUS_LABELS[doc.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setPreview(doc)}
                                                className="text-muted-foreground hover:text-foreground transition-colors text-xs underline"
                                            >Просмотр</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Документы не найдены</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview modal */}
            {preview && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="font-semibold">{preview.fileName}</h2>
                                <p className="text-sm text-muted-foreground mt-0.5">#{preview.documentNumber || 'б/н'}</p>
                            </div>
                            <button onClick={() => setPreview(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {[
                                { l: 'Тип', v: preview.type },
                                { l: 'Статус', v: STATUS_LABELS[preview.status] },
                                { l: 'Контрагент', v: preview.contractorName || '—' },
                                { l: 'Сумма', v: preview.amount ? `${preview.amount.toLocaleString('ru-RU')} ₽` : '—' },
                                { l: 'Дата', v: preview.documentDate || '—' },
                                { l: 'Теги', v: preview.tags.join(', ') || '—' },
                            ].map(({ l, v }) => (
                                <div key={l} className="p-3 bg-muted rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">{l}</div>
                                    <div className="font-medium">{v}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
