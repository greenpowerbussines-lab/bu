'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Message = { id: string; role: 'user' | 'assistant'; content: string; ts: Date };

const QUICK_QUESTIONS = [
    'Какой лимит суточных для командировок?',
    'Как оформить авансовый отчёт?',
    'Когда следующий авансовый платёж УСН?',
    'Какие документы нужны для вычета НДС?',
];

export default function ChatPage() {
    const { data: session } = useSession();
    const orgId = (session?.user as any)?.orgId;

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Привет! Я ваш корпоративный бухгалтерский ассистент 👋\n\nЯ отвечу на вопросы о командировках, расходах, налогах и бухгалтерских процедурах вашей компании. Чем могу помочь?',
            ts: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const bottomRef = useRef<HTMLDivElement>(null);

    // Init session ID
    useEffect(() => {
        const sid = localStorage.getItem('buhai_chat_session') || Math.random().toString(36).substring(7);
        setSessionId(sid);
        localStorage.setItem('buhai_chat_session', sid);
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!orgId || !sessionId) return;
        try {
            const res = await fetch(`${API_URL}/api/chat/history?orgId=${orgId}&sessionId=${sessionId}`);
            if (res.ok) {
                const history = await res.json();
                if (history.length > 0) {
                    setMessages(history.map((m: any) => ({
                        id: m.id,
                        role: m.role,
                        content: m.content,
                        ts: new Date(m.createdAt)
                    })));
                }
            }
        } catch (error) {
            console.error('Failed to fetch chat history:', error);
        }
    }, [orgId, sessionId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading || !orgId) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, ts: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        const assistantId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', ts: new Date() }]);

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId, sessionId, message: text }),
            });

            if (!response.body) throw new Error('No body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.text) {
                                fullContent += data.text;
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantId ? { ...m, content: fullContent } : m
                                ));
                            } else if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            // Ignore parse errors for incomplete JSON
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Chat error:', error);
            toast.error(error.message || 'Ошибка связи с AI');
            setMessages(prev => prev.filter(m => m.id !== assistantId));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-in">
            <div className="mb-4">
                <h1 className="text-2xl font-bold">Чат-ассистент</h1>
                <p className="text-sm text-muted-foreground mt-1">AI-бухгалтер 24/7 — ответы на корпоративные вопросы</p>
            </div>

            {/* Messages */}
            <div className="flex-1 glass-card p-4 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-buhai-500 to-buhai-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mr-2 mt-0.5">B</div>
                        )}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-muted border border-border/30 text-foreground rounded-bl-sm'
                            }`}>
                            {msg.content || (loading && msg.role === 'assistant' ? (
                                <span className="flex gap-1">
                                    {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                </span>
                            ) : '')}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Quick questions */}
            {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {QUICK_QUESTIONS.map((q) => (
                        <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="px-3 py-1.5 text-xs bg-muted hover:bg-accent border border-border hover:border-primary/30 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="glass-card p-3 flex items-center gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                    placeholder="Задайте вопрос бухгалтеру..."
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                />
                <button
                    onClick={() => sendMessage(input)}
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
