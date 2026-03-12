import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
    compact?: boolean;
    href?: string;
    className?: string;
};

export function BrandLogo({ compact = false, href = '/', className = '' }: BrandLogoProps) {
    const content = (
        <div className={`duo-brand ${compact ? 'duo-brand-compact' : ''} ${className}`}>
            <div className="duo-brand-mark">
                <Image src="/logo.jpg" alt="BuhAI logo" width={44} height={44} className="h-11 w-11 rounded-2xl object-cover" priority />
            </div>
            {!compact && (
                <div className="min-w-0">
                    <div className="duo-brand-title">BuhAI</div>
                    <div className="duo-brand-subtitle">Control with AI</div>
                </div>
            )}
        </div>
    );

    return href ? (
        <Link href={href} className="inline-flex">
            {content}
        </Link>
    ) : (
        content
    );
}
