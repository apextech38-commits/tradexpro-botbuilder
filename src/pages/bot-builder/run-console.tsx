import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Journal from '@/components/journal';
import Button from '@/components/shared_ui/button';
import Tabs from '@/components/shared_ui/tabs';
import ToggleSwitch from '@/components/shared_ui/toggle-switch';
import Summary from '@/components/summary';
import Transactions from '@/components/transactions';
import { useStore } from '@/hooks/useStore';
import { LabelPairedPlayLgFillIcon, LabelPairedSquareLgFillIcon } from '@deriv/quill-icons/LabelPaired';
import { Localize, localize } from '@deriv-com/translations';
// Named exports aren't re-exported from the run-panel barrel (index.ts only
// default-exports RunPanel), so pull them from the file directly.
import { StatisticsInfoModal, StatisticsSummary } from '@/components/run-panel/run-panel';
import './run-console.scss';

/**
 * Static, always-visible recreation of the "Run" card (Run + Execution speed,
 * Summary/Transactions/Journal tabs, stats, Reset) that used to only exist as a
 * fixed-position Drawer (see components/run-panel). This version renders inline
 * in the empty column to the right of the Blockly workspace on the Bot Builder tab.
 *
 * NOTE: the "Execution: FAST" toggle is currently a display-only control (local
 * state). There is no backend/runtime hook for execution speed yet, so it does not
 * change trade timing until that's wired up - flagging this so it isn't mistaken
 * for a working setting.
 */
const RunConsole = observer(() => {
    const { run_panel, transactions, client } = useStore();
    const { currency } = client;
    const { statistics } = transactions;
    const { total_payout, total_profit, total_stake, won_contracts, lost_contracts, number_of_runs } = statistics;
    const {
        active_index,
        is_stop_button_visible,
        is_stop_button_disabled,
        is_clear_stat_disabled,
        is_statistics_info_modal_open,
        onClearStatClick,
        onRunButtonClick,
        onStopBotClick,
        setActiveTabIndex,
        toggleStatisticsInfoModal,
    } = run_panel;

    const [is_fast_execution, setIsFastExecution] = React.useState(true);

    const handleRunStopClick = () => {
        if (is_stop_button_visible) {
            onStopBotClick();
            return;
        }
        onRunButtonClick();
    };

    return (
        <div className='run-console'>
            <div className='run-console__header'>
                <Button
                    id='run-console__run-button'
                    className={classNames('run-console__run-button', {
                        'run-console__run-button--stop': is_stop_button_visible,
                    })}
                    is_disabled={is_stop_button_visible && is_stop_button_disabled}
                    icon={
                        is_stop_button_visible ? (
                            <LabelPairedSquareLgFillIcon fill='#fff' />
                        ) : (
                            <LabelPairedPlayLgFillIcon fill='#fff' />
                        )
                    }
                    onClick={handleRunStopClick}
                    primary
                    has_effect
                >
                    {is_stop_button_visible ? <Localize i18n_default_text='Stop' /> : <Localize i18n_default_text='Run' />}
                </Button>
                <div className='run-console__execution'>
                    <span className='run-console__execution-label'>{localize('Execution')}</span>
                    <span className='run-console__execution-mode'>{is_fast_execution ? localize('FAST') : localize('NORMAL')}</span>
                    <ToggleSwitch
                        id='run-console__execution-toggle'
                        is_enabled={is_fast_execution}
                        handleToggle={() => setIsFastExecution(prev => !prev)}
                        name='run_console_execution_toggle'
                    />
                </div>
            </div>

            <div className='run-console__body'>
                <Tabs active_index={active_index} onTabItemClick={setActiveTabIndex} top>
                    <div id='run-console-tab__summary' label={<Localize i18n_default_text='Summary' />}>
                        <Summary is_drawer_open />
                    </div>
                    <div id='run-console-tab__transactions' label={<Localize i18n_default_text='Transactions' />}>
                        <Transactions is_drawer_open />
                    </div>
                    <div id='run-console-tab__journal' label={<Localize i18n_default_text='Journal' />}>
                        <Journal />
                    </div>
                </Tabs>
            </div>

            <StatisticsSummary
                currency={currency}
                is_mobile={false}
                lost_contracts={lost_contracts}
                number_of_runs={number_of_runs}
                total_stake={total_stake}
                total_payout={total_payout}
                toggleStatisticsInfoModal={toggleStatisticsInfoModal}
                total_profit={total_profit}
                won_contracts={won_contracts}
            />

            <StatisticsInfoModal
                is_mobile={false}
                is_statistics_info_modal_open={is_statistics_info_modal_open}
                toggleStatisticsInfoModal={toggleStatisticsInfoModal}
            />

            <div className='run-console__footer'>
                <Button
                    id='run-console__clear-button'
                    className='run-console__footer-button'
                    disabled={is_clear_stat_disabled}
                    onClick={onClearStatClick}
                    has_effect
                    secondary
                >
                    <Localize i18n_default_text='Reset' />
                </Button>
            </div>
        </div>
    );
});

export default RunConsole;
