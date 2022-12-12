import { version } from '../../package.json';
import { initializeLogs } from './logs';
import { $, select, selectAll } from './enode';
import { initializeSelectInstrument, initializeInstrument } from './instrument';
import { initializeEvolvContext, initializeTrack } from './evolv-context';
import { initializeSandboxIntervalPoll } from './interval-poll';
import { initializeStore } from './store';
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
        sandbox.selectInstrument = initializeSelectInstrument(sandbox);
        sandbox.$$ = sandbox.selectInstrument;
        sandbox.store = initializeStore(sandbox);
        sandbox.app = {};
        sandbox.instrument = initializeInstrument(sandbox);
        sandbox._intervalPoll = initializeSandboxIntervalPoll(sandbox);
        sandbox._evolvContext = initializeEvolvContext(sandbox);
        sandbox.whenContext = initializeWhenContext(sandbox);
        sandbox.whenMutate = initializeWhenMutate(sandbox);
        sandbox.whenDOM = initializeWhenDOM(sandbox);
        sandbox.whenItem = initializeWhenItem(sandbox);
        sandbox.whenElement = initializeWhenElement(sandbox);
        sandbox.whenElements = initializeWhenElements(sandbox);
        sandbox.waitUntil = initializeWaitUntil(sandbox);
        sandbox.track = initializeTrack(sandbox);
    }

    // Backwards compatibility
    sandbox.reactivate = () => {};

    return sandbox;
}

export { initializeSandbox };
