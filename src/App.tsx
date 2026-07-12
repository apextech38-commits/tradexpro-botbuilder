import { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import BotBuilder from '@/pages/bot-builder';
import { StoreProvider } from '@/hooks/useStore';
import { useAccountSwitching } from '@/hooks/useAccountSwitching';
import { useOAuthCallback, LegacyAccount } from '@/hooks/useOAuthCallback';
import { OAuthTokenExchangeService } from '@/services/oauth-token-exchange.service';
import { initAuthBridge } from '@/auth/auth-bridge';
import { initializeI18n, TranslationProvider } from '@deriv-com/translations';

const i18nInstance = initializeI18n({ cdnUrl: '' });

/**
 * Stores legacy Deriv OAuth accounts in localStorage for authorization.
 * See src/app/App.tsx storeLegacyAccounts for the original/duplicate implementation.
 *
 * Deriv OAuth returns: ?acct1=CR123&token1=a1-xxx&cur1=USD&acct2=...
 * We store in localStorage:
 *   accountsList   → { loginid: token, ... }      [Used by getToken()]
 *   clientAccounts → { loginid: { currency, token }, ... }
 *   authToken      → token of the first real account (non-VRT)
 *   active_loginid → loginid of the first real account [Used by getAccountId()]
 *   account_type   → 'demo' or 'real'
 */
function storeLegacyAccounts(accounts: LegacyAccount[]): void {
    const accountsList: Record<string, string> = {};
    const clientAccounts: Record<string, { currency: string; token: string }> = {};

    for (const { loginid, token, currency } of accounts) {
        accountsList[loginid] = token;
        clientAccounts[loginid] = { currency, token };
    }

    localStorage.setItem('accountsList', JSON.stringify(accountsList));
    localStorage.setItem('clientAccounts', JSON.stringify(clientAccounts));

    const realAccount = accounts.find(a => !a.loginid.startsWith('VRT')) ?? accounts[0];
    if (realAccount) {
        localStorage.setItem('authToken', realAccount.token);
        localStorage.setItem('active_loginid', realAccount.loginid);
        const isDemo = realAccount.loginid.startsWith('VRT') || realAccount.loginid.startsWith('VRTC');
        localStorage.setItem('account_type', isDemo ? 'demo' : 'real');
    } else {
        console.error('[Legacy OAuth] No real account found in OAuth response:', accounts);
    }
}

function App() {
    const [isApiReady, setIsApiReady] = useState(false);
    const { isProcessing, isValid, params, legacyAccounts, error, cleanupURL } = useOAuthCallback();

    useAccountSwitching();

    // ── Legacy Deriv OAuth: tokens arrive directly in the URL ────────────────
    useEffect(() => {
        if (!isProcessing && legacyAccounts.length > 0) {
            cleanupURL();
            storeLegacyAccounts(legacyAccounts);
        }
    }, [isProcessing, legacyAccounts, cleanupURL]);

    // ── New OAuth2 PKCE: exchange code for access token ───────────────────────
    useEffect(() => {
        if (!isProcessing && isValid && params.code) {
            OAuthTokenExchangeService.exchangeCodeForToken(params.code)
                .then(response => {
                    if (response.error) {
                        console.error('OAuth token exchange failed:', response.error, response.error_description);
                    }
                    cleanupURL();
                })
                .catch(err => {
                    console.error('OAuth token exchange request failed:', err);
                    cleanupURL();
                });
        } else if (!isProcessing && error) {
            console.error('OAuth callback error:', error);
        }
    }, [isProcessing, isValid, params.code, error, cleanupURL]);

    useEffect(() => {
        const cleanup = initAuthBridge();
        return cleanup;
    }, []);

    useEffect(() => {
        let cancelled = false;
        const timeoutId = setTimeout(() => {
            if (!cancelled) setIsApiReady(true);
        }, 5000);

        const initializeApi = async () => {
            // Give the OAuth effects above a chance to persist tokens to
            // localStorage before api_base reads them.
            if (isProcessing) return;
            try {
                await api_base.init();
            } catch (error) {
                console.error('API initialization failed:', error);
            } finally {
                if (!cancelled) {
                    setIsApiReady(true);
                    clearTimeout(timeoutId);
                }
            }
        };

        initializeApi();
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [isProcessing]);

    if (!isApiReady) return <div>Loading...</div>;

    return (
        <TranslationProvider i18nInstance={i18nInstance}>
            <StoreProvider>
                <BotBuilder />
            </StoreProvider>
        </TranslationProvider>
    );
}

export default App;
