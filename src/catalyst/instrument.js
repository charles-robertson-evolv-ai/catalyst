import { $ } from './enode';

function debounce(func, timeout = 17) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

function initializeInstrument(sandbox) {
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    const instrument = {};
    instrument._isProcessing = false;
    instrument._processCount = 0;
    instrument.definitions = {};
    instrument.items = {};
    instrument._onInstrument = [];
    instrument._didItemChange = false;

    function processItems(items, definitions) {
        for (const key in definitions) {
            processItem(key, items, definitions);
        }
    }

    function processItem(key, items, definitions) {
        // TODO: Refactor this block when restructure ENode
        if (items[key] === undefined)
            items[key] = { enode: $(), state: 'inactive' };
        const item = items[key];
        const enode = item.enode;
        // const className = item.asClass || 'evolv-' + key;
        const isOnPage = enode.isConnected();
        const hasClass = enode.hasClass('evolv-' + key);

        debug('process instrument:', `'${key}'`, [enode], isOnPage, hasClass);

        const definition = definitions[key];

        if (isOnPage && hasClass) {
            processItems(definition.children);
            return;
        }

        item.enode = definition['select']();

        const oldState = item.state;
        const newState = item.enode.doesExist() ? 'active' : 'inactive';
        item.state = newState;

        if (oldState === 'inactive' && newState === 'active') {
            item.enode.addClass('evolv-' + key);
            if (definition.onConnect)
                definition.onConnect.forEach((func) => func());
            instrument._didItemChange = true;
            debug('process instrument: connect', `'${key}'`, item);
        } else if (oldState === 'active' && newState === 'inactive') {
            if (definition.onDisconnect)
                definition.onDisconnect.forEach((func) => func());
            instrument._didItemChange = true;
            debug('process instrument: disconnect', `'${key}'`, item);
        }
    }

    instrument.process = debounce(() => {
        if (instrument._isProcessing) return;
        if (sandbox._evolvContext.state === 'inactive') return;

        instrument._isProcessing = true;
        instrument._processCount++;
        instrument._didItemChange = false;
        let then = performance.now();

        processItems(instrument.items, instrument.definitions);

        debug(
            'process instrument: complete',
            (performance.now() - then).toFixed(2),
            instrument._processCount
        );

        instrument._isProcessing = false;

        // Covers scenario where mutations are missed during long process
        if (instrument._didItemChange) instrument.process();
    });

    instrument.add = (key, select, options) => {
        function addItem(key, select, options) {
            debug('add instrument:', key, select, options);
            if (
                typeof key !== 'string' &&
                (typeof select !== 'function' || typeof select !== 'string')
            ) {
                warn(
                    `add instrument: requires item key string and selector string or select function`
                );
                return;
            }

            const newDefinition = {};
            if (typeof select === 'string') {
                newDefinition.select = () => $(select);
            } else {
                newDefinition.select = select;
            }

            if (options) {
                if (options.onConnect)
                    newDefinition.onConnect = [options.onConnect];
                if (options.onDisconnect)
                    newDefinition.onDisconnect = [options.onDisconnect];
                // if (options.asClass) newDefinition.asClass = options.asClass;
            }

            let parent = {};
            if (options && options.parent) {
                parent = instrument.findDefinition(options.parent);

                if (!parent)
                    warn(
                        `add instrument: parent '${options.parent}' not found`
                    );
            } else {
                instrument.definitions[key] = newDefinition;
            }

            parent.children = parent.children || {};
            parent.children[key] = newDefinition;
        }

        if (Array.isArray(key)) {
            key.forEach((item) => {
                addItem(...item);
            });
        } else {
            addItem(key, select, options);
        }

        instrument.process();
    };

    instrument.findDefinition = (searchKey) => {
        let result = null;

        function searchBlock(searchKey, block) {
            if (block[searchKey]) {
                result = block[searchKey];
                return;
            }

            for (const key in block) {
                if (block[key].children) {
                    searchBlock(searchKey, block[key].children);
                }
            }
        }

        searchBlock(searchKey, instrument.definitions);

        return result;
    };

    sandbox.store.instrumentDOM = (data) => {
        for (const key in data) {
            const dataItem = data[key];
            const select = Object.getOwnPropertyDescriptor(dataItem, 'dom').get;
            // const asClass = dataItem.asClass;
            // const options = {};
            // if (asClass) options.asClass = asClass;

            instrument.add(key, select);
        }
    };

    sandbox.instrument = instrument;
}

export { initializeInstrument };
