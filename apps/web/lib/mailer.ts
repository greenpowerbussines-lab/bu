import nodemailer from 'nodemailer';

type PasswordResetMailParams = {
    to: string;
    resetUrl: string;
    userName: string;
};

function parsePort(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value || '', 10);
    if (!Number.isFinite(parsed)) return fallback;
    return parsed;
}

function getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parsePort(process.env.SMTP_PORT, 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host) {
        throw new Error('SMTP_HOST is not configured');
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: process.env.SMTP_SECURE === 'true' || port === 465,
        auth: user && pass ? { user, pass } : undefined,
    });
}

export async function sendPasswordResetEmail(params: PasswordResetMailParams): Promise<void> {
    const from = process.env.SMTP_FROM;
    if (!from) {
        throw new Error('SMTP_FROM is not configured');
    }

    const transporter = getTransporter();
    const subject = 'BuhAI: восстановление пароля';
    const text = [
        `Здравствуйте, ${params.userName}!`,
        '',
        'Вы запросили восстановление пароля для BuhAI.',
        `Ссылка для сброса: ${params.resetUrl}`,
        '',
        'Ссылка действует 60 минут.',
        'Если вы не запрашивали восстановление, просто проигнорируйте это письмо.',
    ].join('\n');

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
            <h2 style="margin: 0 0 16px;">Восстановление пароля BuhAI</h2>
            <p>Здравствуйте, <strong>${params.userName}</strong>!</p>
            <p>Нажмите кнопку ниже, чтобы установить новый пароль:</p>
            <p style="margin: 20px 0;">
                <a href="${params.resetUrl}" style="background:#0071e3;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;display:inline-block;">
                    Сбросить пароль
                </a>
            </p>
            <p>Или перейдите по ссылке:</p>
            <p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
            <p style="color:#555;">Ссылка действует 60 минут. Если это были не вы, проигнорируйте письмо.</p>
        </div>
    `;

    await transporter.sendMail({
        from,
        to: params.to,
        subject,
        text,
        html,
    });
}
