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

function applyAuth(msg: TradexAuthMessage) {
    if (!msg.token || !msg.loginid) return;

    const accountsList: Record<string, string> = {};
    const clientAccounts: Record<string, { currency: string; token: string }> = {};

    const accounts = msg.accounts?.length
        ? msg.accounts
        : [{ account: msg.loginid, token: msg.token, currency: 'USD' }];

    accounts.forEach(acc => {
        accountsList[acc.account] = acc.token;
        clientAccounts[acc.account] = { currency: acc.currency, token: acc.token };
    });

    const activeLoginid = msg.loginid;
    const activeToken = accountsList[activeLoginid] ?? msg.token;

    localStorage.setItem('accountsList', JSON.stringify(accountsList));
    localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));
    localStorage.setItem('authToken', activeToken);
    localStorage.setItem('active_loginid', activeLoginid);
    localStorage.setItem('account_type', isDemo(activeLoginid) ? 'demo' : 'real');

    window.dispatchEvent(new Event('tradexpro-auth-applied'));
    // window.location.reload();
}

function clearAuth() {
    ['accountsList', 'clientAccounts', 'authToken', 'active_loginid', 'account_type'].forEach(key =>
        localStorage.removeItem(key)
    );
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
