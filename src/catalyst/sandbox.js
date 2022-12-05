import { version } from '../../package.json';
import { initializeLogs } from './logs';
import { $, select, selectAll } from './enode';
import { initializeInstrument } from './instrument';
import { initializeEvolvContext } from './evolv-context';
import {
    initializeWhenContext,
    initializeWhenMutate,
    initializeWhenDOM,
    initializeWhenItem,
    initializeWhenElement,
    initializeWhenElements,
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
    sandbox.select = select;
    sandbox.selectAll = selectAll;

    if (sandbox.name !== 'catalyst') {
        sandbox.$$ = (key) => {
            const item = sandbox.instrument.queue[key];

            if (!item) {
                warn(`$$: '${key}' not found in instrument queue`);
                return $();
            } else if (!item.enode.isConnected()) {
                return $();
            }

            return item.enode;
        };
        sandbox.store = {};
        sandbox.app = {};
        sandbox.instrument = initializeInstrument(sandbox);
        sandbox._evolvContext = initializeEvolvContext(sandbox);
        sandbox.whenContext = initializeWhenContext(sandbox);
        sandbox.whenMutate = initializeWhenMutate(sandbox);
        sandbox.whenDOM = initializeWhenDOM(sandbox);
        sandbox.whenItem = initializeWhenItem(sandbox);
        sandbox.whenElement = initializeWhenElement(sandbox);
        sandbox.whenElements = initializeWhenElements(sandbox);
        sandbox.waitUntil = initializeWaitUntil(sandbox);
        sandbox.initVariant = (variant) => {
            debug('init variant:', variant);
            const className = `${sandbox.name}-${variant}`;
            sandbox.whenContext('active').then(() => {
                debug(`init variant: variant ${variant} active`);
                sandbox.instrument.add(className, () =>
                    sandbox.select(document.body)
                );
            });
            sandbox.whenContext('inactive').then(() => {
                debug(`init variant: variant ${variant} inactive`);
                sandbox.instrument.remove(className);
            });
        };
    }

    // Backwards compatibility
    sandbox.reactivate = () => {};

    return sandbox;
}

export { initializeSandbox };
