import { render, screen } from '@testing-library/react';
import { useStore } from '@/hooks/useStore';
import TradingControlsPanel from '../trading-controls-panel';

jest.mock('@/hooks/useStore', () => ({
    useStore: jest.fn(),
}));

jest.mock('@/components/shared_ui/toggle-switch', () => ({
    __esModule: true,
    default: ({ id, is_enabled, handleToggle, name }: any) => (
        <input aria-label={name} id={id} type='checkbox' checked={is_enabled} onChange={handleToggle} />
    ),
}));

describe('TradingControlsPanel', () => {
    beforeEach(() => {
        (useStore as jest.Mock).mockReturnValue({
            toolbar: {
                bulk_trading_enabled: true,
                bulk_trading_count: 5,
                speed_mode_enabled: false,
                setBulkTradingEnabled: jest.fn(),
                setBulkTradingCount: jest.fn(),
                setSpeedModeEnabled: jest.fn(),
            },
        });
    });

    it('renders the speed mode toggle without bulk trading', () => {
        render(<TradingControlsPanel />);

        expect(screen.queryByText('Bulk trading')).not.toBeInTheDocument();
        expect(screen.getByText('Speed mode')).toBeInTheDocument();
    });
});
