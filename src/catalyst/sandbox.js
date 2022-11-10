import { version } from '../../package.json';
import { initializeLogs } from './logs';
import { $, select, selectAll } from './enode';
import { initializeInstrument } from './instrument';
import { initializeEvolvContext } from './evolv-context';
import {
    initializeWhenContext,
    initializeWhenInstrument,
    initializeWhenDOM,
    initializeWhenItem,
    initializeWhenElement,
    initializeWaitUntil,
} from './when.js';

function initializeSandbox(name) {
    const sandbox = {};
    sandbox.name = name;

    initializeLogs(sandbox);
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    if (name === 'catalyst') {
        debug(`init catalyst version ${version}`);
        sandbox.version = version;
    } else {
        debug(`init context: ${name}`);
        debug(
            'SPA:',
            Array.from(document.documentElement.classList).join(', ')
        );
    }

    sandbox.$ = $;
    sandbox.$$ = (name) => {
        const item = sandbox.instrument.items[name];

        if (!item) {
            if (!sandbox.instrument.findDefinition(name)) {
                warn(`$$: '${name}' not found in instrument definitions list`);
            }
            return $();
        } else if (!item.enode.isConnected()) {
            // warn(`$$: Item ${name} is not currently on the page.`);
            return $();
        }

        return item.enode;
    };
    sandbox.select = select;
    sandbox.selectAll = selectAll;

    const $$ = sandbox.$$;

    sandbox.store = {};
    sandbox.app = {};

    initializeInstrument(sandbox);
    initializeEvolvContext(sandbox);

    sandbox.whenContext = initializeWhenContext(sandbox);
    sandbox.whenInstrument = initializeWhenInstrument(sandbox);
    sandbox.whenDOM = initializeWhenDOM(sandbox);
    sandbox.whenItem = initializeWhenItem(sandbox);
    sandbox.whenElement = initializeWhenElement(sandbox);
    sandbox.waitUntil = initializeWaitUntil(sandbox);

    // Backwards compatibility
    sandbox.reactivate = sandbox.instrument.process;

    return sandbox;
}

export { initializeSandbox };
