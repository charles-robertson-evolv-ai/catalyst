import { initializeLogs } from './logs';
import { $ } from './enode';
import { initializeInstrument } from './instrument';
import { initializeEvolvContext } from './evolv-context';
import {
    initializeWhenContext,
    initializeWhenInstrument,
    initializeWhenDOM,
    initializeWhenItem,
} from './when.js';

function initializeSandbox(name) {
    const sandbox = {};
    sandbox.name = name;

    initializeLogs(sandbox);
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    if (name !== 'catalyst') sandbox.debug(`init context: ${name}`);

    sandbox.$ = $;
    sandbox.$$ = (name) => {
        const item = sandbox.instrument.items[name];

        if (!item) {
            warn(`$$: Item ${name} not found in instrument item list`);
            return $();
        } else if (item.state === 'inactive') {
            // warn(`$$: Item ${name} is not currently on the page.`);
            return $();
        }

        return item.enode;
    };

    const $$ = sandbox.$$;

    sandbox.store = {};
    sandbox.app = {};

    initializeInstrument(sandbox);
    initializeEvolvContext(sandbox);

    sandbox.whenContext = initializeWhenContext(sandbox);
    sandbox.whenInstrument = initializeWhenInstrument(sandbox);
    sandbox.whenDOM = initializeWhenDOM(sandbox);
    sandbox.whenItem = initializeWhenItem(sandbox);

    // Backwards compatibility
    sandbox.reactivate = sandbox.instrument.process;

    return sandbox;
}

export { initializeSandbox };
