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
    const $ = sandbox.$;
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    const instrument = {};
    instrument._isProcessing = false;
    instrument._processCount = 0;
    instrument.definitions = {};
    instrument.items = {};
    instrument._onInstrument = [];

    instrument.process = debounce(() => {
        if (instrument._isProcessing) return;
        if (sandbox._evolvContext.state === 'inactive') return;

        instrument._isProcessing = true;
        instrument._processCount++;
        const items = instrument.items;
        let didItemChange = false;
        let then = performance.now();

        function processItems(definitions) {
            for (const key in definitions) {
                // TODO: Refactor this block when restructure ENode
                if (items[key] === undefined)
                    items[key] = { enode: $(), state: 'inactive' };
                const item = items[key];
                const enode = item.enode;
                // const className = item.asClass || 'evolv-' + key;
                const isOnPage = enode.isConnected();
                const hasClass = enode.hasClass('evolv-' + key);

                debug(
                    'process instrument:',
                    `'${key}'`,
                    [enode],
                    isOnPage,
                    hasClass
                );

                const definition = definitions[key];

                if (isOnPage && hasClass) {
                    processItems(definition.children);
                    continue;
                }

                item.enode = definition['select']();

                const oldState = item.state;
                const newState = item.enode.doesExist() ? 'active' : 'inactive';
                item.state = newState;

                if (oldState === 'inactive' && newState === 'active') {
                    item.enode.addClass('evolv-' + key);
                    if (definition.onConnect)
                        definition.onConnect.forEach((func) => func());
                    didItemChange = true;
                    debug('process instrument: connect', `'${key}'`, item);
                } else if (oldState === 'active' && newState === 'inactive') {
                    if (definition.onDisconnect)
                        definition.onDisconnect.forEach((func) => func());
                    didItemChange = true;
                    debug('process instrument: disconnect', `'${key}'`, item);
                }
            }
        }

        processItems(instrument.definitions);

        debug(
            'process instrument: complete',
            (performance.now() - then).toFixed(2),
            instrument._processCount
        );

        instrument._isProcessing = false;

        // Covers scenario where mutations are missed during long process
        if (didItemChange) instrument.process();
    });

    instrument.add = (key, select, options) => {
        debug('add instrument:', key, select, options);

        const newDefinition = {};
        newDefinition.select = select;

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
                warn(`add instrument: parent '${options.parent}' not found`);
        } else {
            instrument.definitions[key] = newDefinition;
        }

        parent.children = parent.children || {};
        parent.children[key] = newDefinition;
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
