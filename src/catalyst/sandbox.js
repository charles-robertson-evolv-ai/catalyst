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
    const log = sandbox.log;
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    if (name === 'catalyst') {
        log(`init catalyst version ${version}`);
        log(`log level: ${sandbox.logs}`);
        sandbox.version = version;
    } else {
        debug(`init context sandbox: ${name}`);
        if (window.evolv.catalyst._globalObserver.state === 'inactive')
            window.evolv.catalyst._globalObserver.connect();
    }

    sandbox.$ = $;
    sandbox.$$ = (name) => {
        const item = sandbox.instrument.queue[name];

        if (!item) {
            if (!sandbox.instrument.findDefinition(name)) {
                warn(`$$: '${name}' not found in instrument definitions list`);
            }
            return $();
        } else if (!item.enode.isConnected()) {
            return $();
        }

        return item.enode;
    };
    sandbox.select = select;
    sandbox.selectAll = selectAll;
    sandbox.store = {};
    sandbox.app = {};

    if (sandbox.name !== 'catalyst') {
        initializeInstrument(sandbox);
        sandbox._evolvContext = initializeEvolvContext(sandbox);
        sandbox.whenContext = initializeWhenContext(sandbox);
        sandbox.whenInstrument = initializeWhenInstrument(sandbox);
        sandbox.whenDOM = initializeWhenDOM(sandbox);
        sandbox.whenItem = initializeWhenItem(sandbox);
        sandbox.whenElement = initializeWhenElement(sandbox);
        sandbox.waitUntil = initializeWaitUntil(sandbox);
    }

    // Backwards compatibility
    sandbox.reactivate = () => {};

    return sandbox;
}

export { initializeSandbox };
