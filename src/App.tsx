import { useEffect, useState } from 'react';
import { api_base } from '@/external/bot-skeleton';
import BotBuilder from '@/pages/bot-builder';
import { StoreProvider } from '@/hooks/useStore';
import { initializeI18n, TranslationProvider } from '@deriv-com/translations';

const i18nInstance = initializeI18n({ cdnUrl: '' });

function App() {
    const [isApiReady, setIsApiReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const timeoutId = setTimeout(() => {
            if (!cancelled) setIsApiReady(true);
        }, 5000);

        const initializeApi = async () => {
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
    }, []);

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
