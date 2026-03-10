import { NextResponse } from 'next/server';

const ONE_ID_ENDPOINT = 'https://sso.egov.uz/sso/oauth/Authorization.do';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const origin = url.origin;
    const mode = url.searchParams.get('mode') || 'register';

    const clientId = process.env.ONE_ID_CLIENT_ID || process.env.NEXT_PUBLIC_ONE_ID_CLIENT_ID;
    if (!clientId) {
        const fallbackUrl = new URL('/register', origin);
        fallbackUrl.searchParams.set('error', 'OneID не настроен: отсутствует ONE_ID_CLIENT_ID');
        return NextResponse.redirect(fallbackUrl);
    }

    const redirectUri = `${origin}/api/auth/oneid/callback`;
    const state = `${mode}:${crypto.randomUUID()}`;

    const oneIdUrl = new URL(ONE_ID_ENDPOINT);
    oneIdUrl.searchParams.set('response_type', 'one_code');
    oneIdUrl.searchParams.set('client_id', clientId);
    oneIdUrl.searchParams.set('redirect_uri', redirectUri);
    oneIdUrl.searchParams.set('scope', 'myid');
    oneIdUrl.searchParams.set('state', state);

    return NextResponse.redirect(oneIdUrl);
}
