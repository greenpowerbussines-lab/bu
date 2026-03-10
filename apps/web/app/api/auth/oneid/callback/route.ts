import { NextResponse } from 'next/server';

const ONE_ID_ENDPOINT = 'https://sso.egov.uz/sso/oauth/Authorization.do';

type OneIdTokenResponse = {
    access_token?: string;
    [key: string]: unknown;
};

type OneIdUserResponse = {
    pin?: string;
    pinfl?: string;
    sub?: string;
    first_name?: string;
    sur_name?: string;
    full_name?: string;
    email?: string;
    [key: string]: unknown;
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const origin = url.origin;
    const redirectUri = `${origin}/api/auth/oneid/callback`;
    const registerUrl = new URL('/register', origin);

    if (error) {
        registerUrl.searchParams.set('error', `OneID вернул ошибку: ${error}`);
        return NextResponse.redirect(registerUrl);
    }

    if (!code) {
        registerUrl.searchParams.set('error', 'Не получен код авторизации OneID');
        return NextResponse.redirect(registerUrl);
    }

    const clientId = process.env.ONE_ID_CLIENT_ID || process.env.NEXT_PUBLIC_ONE_ID_CLIENT_ID;
    const clientSecret = process.env.ONE_ID_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        registerUrl.searchParams.set('error', 'OneID не настроен. Добавьте ONE_ID_CLIENT_ID и ONE_ID_CLIENT_SECRET');
        return NextResponse.redirect(registerUrl);
    }

    try {
        // Step 1: exchange one-time code to access token.
        const tokenRes = await fetch(ONE_ID_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'one_authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code,
            }),
            cache: 'no-store',
        });

        const tokenJson = (await tokenRes.json()) as OneIdTokenResponse;
        const accessToken = tokenJson.access_token;

        if (!accessToken) {
            throw new Error('OneID token exchange failed');
        }

        // Step 2: read user profile with issued access token.
        const userRes = await fetch(ONE_ID_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'one_access_token_identify',
                client_id: clientId,
                client_secret: clientSecret,
                access_token: accessToken,
                scope: 'my_portal',
            }),
            cache: 'no-store',
        });

        const userJson = (await userRes.json()) as OneIdUserResponse;

        const oneIdSub = userJson.pin || userJson.pinfl || userJson.sub;
        if (!oneIdSub) {
            throw new Error('OneID user identifier missing');
        }

        const derivedName =
            userJson.full_name ||
            [userJson.first_name, userJson.sur_name].filter(Boolean).join(' ') ||
            'Пользователь OneID';
        const derivedEmail = userJson.email || `${oneIdSub}@oneid.local`;

        registerUrl.searchParams.set('auth', 'oneid');
        registerUrl.searchParams.set('oneid_sub', oneIdSub);
        registerUrl.searchParams.set('oneid_name', derivedName);
        registerUrl.searchParams.set('oneid_email', derivedEmail);
        if (state) {
            registerUrl.searchParams.set('state', state);
        }

        return NextResponse.redirect(registerUrl);
    } catch (err) {
        console.error('[oneid callback]', err);
        registerUrl.searchParams.set('error', 'Ошибка обработки ответа OneID');
        return NextResponse.redirect(registerUrl);
    }
}
