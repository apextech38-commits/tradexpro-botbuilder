const PARENT_ORIGIN = 'https://tradexpro.co.ke';

interface IncomingAccount {
    account: string;
    token: string;
    currency: string;
    account_type?: string;
}

interface TradexAuthMessage {
    type: 'TRADEXPRO_AUTH';
    token: string;
    loginid: string;
    accounts: IncomingAccount[];
}

interface AuthLogoutMessage {
    type: 'AUTH_LOGOUT';
}

function isDemo(loginid: string): boolean {
    return loginid.startsWith('VRT') || loginid.startsWith('VRTC');
}

// Default lifetime assumed for the OAuth access token relayed from the parent.
// The parent doesn't currently send expires_in across postMessage, so this is a
// conservative estimate; TokenExchangeService/refresh logic on the main site is
// the source of truth for actual expiry.
const ASSUMED_TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

function applyAuth(msg: TradexAuthMessage) {
    if (!msg.token || !msg.loginid) return;

    // The token relayed from the parent (tradex_access_token) is always the
    // Deriv OAuth2/OIDC access token (ory_at_...) from auth.deriv.com/oauth2/auth —
    // the main site has no separate legacy per-account token. Writing it into
    // `accountsList` would make getSocketURL() take the *legacy* WS branch and
    // then call the classic api.authorize(token), which rejects OIDC tokens.
    //
    // Instead, populate sessionStorage['auth_info'] in the exact shape
    // OAuthTokenExchangeService expects, so getSocketURL() takes the PKCE
    // branch: DerivWSAccountsService.getAuthenticatedWebSocketURL() fetches an
    // OTP-signed WS URL that authenticates the socket by construction.
    const authInfo = {
        access_token: msg.token,
        token_type: 'bearer',
        expires_in: Math.floor(ASSUMED_TOKEN_TTL_MS / 1000),
        expires_at: Date.now() + ASSUMED_TOKEN_TTL_MS,
    };
    sessionStorage.setItem('auth_info', JSON.stringify(authInfo));

    const activeLoginid = msg.loginid;
    localStorage.setItem('active_loginid', activeLoginid);
    localStorage.setItem('account_type', isDemo(activeLoginid) ? 'demo' : 'real');

    // Deliberately do NOT write accountsList/clientAccounts/authToken here —
    // their presence is what routes getSocketURL() into the legacy branch.

    window.dispatchEvent(new Event('tradexpro-auth-applied'));
    // window.location.reload();
}

function clearAuth() {
    ['active_loginid', 'account_type'].forEach(key => localStorage.removeItem(key));
    sessionStorage.removeItem('auth_info');
    sessionStorage.removeItem('deriv_accounts');
    window.dispatchEvent(new Event('tradexpro-auth-cleared'));
}

export function initAuthBridge(): () => void {
    if (window.self === window.top) {
        return () => {};
    }

    const handleMessage = (event: MessageEvent) => {
        if (event.origin !== PARENT_ORIGIN) return;
        const data = event.data as TradexAuthMessage | AuthLogoutMessage | undefined;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'TRADEXPRO_AUTH') {
            applyAuth(data as TradexAuthMessage);
        } else if (data.type === 'AUTH_LOGOUT') {
            clearAuth();
        }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'DTRADER_AUTH_READY' }, PARENT_ORIGIN);

    return () => window.removeEventListener('message', handleMessage);
}
