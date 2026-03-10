import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export const metadata: Metadata = {
    title: {
        default: 'BuhAI | Умная бухгалтерия на базе AI',
        template: '%s | BuhAI',
    },
    description:
        'SaaS-платформа автоматизации бухгалтерии для малого и среднего бизнеса: документы, сверка, риски, календарь и AI-помощник.',
    keywords: ['бухгалтерия', 'AI', 'автоматизация', 'OCR', 'налоги', 'УСН', 'ОСН'],
    authors: [{ name: 'BuhAI Team' }],
    openGraph: {
        type: 'website',
        locale: 'ru_RU',
        url: 'https://buh-ai.com',
        siteName: 'BuhAI',
        title: 'BuhAI | Умная бухгалтерия на базе AI',
        description: 'Автоматизируйте рутину бухгалтерии и работайте в едином AI-контуре.',
    },
    robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru" suppressHydrationWarning>
            <body className={`${inter.variable} bg-background font-sans text-foreground`}>
                <AuthProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            style: {
                                background: 'rgba(255, 255, 255, 0.92)',
                                border: '1px solid rgba(255, 255, 255, 0.72)',
                                color: '#1d1d1f',
                                boxShadow: '0 18px 45px rgba(15, 23, 42, 0.08)',
                            },
                        }}
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
