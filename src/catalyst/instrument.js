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
    instrument.definitions = {};
    instrument.items = {};
    instrument._isProcessing = false;
    instrument._processCount = 0;
    instrument._onInstrument = [];
    instrument._didItemChange = false;

    function processItems(items, definitions) {
        for (const key in definitions) {
            processItem(key, items, definitions);
        }
    }

    function processItem(key, items, definitions) {
        const definition = definitions[key];

        if (items[key] === undefined) {
            let className;
            if (definition.hasOwnProperty('asClass')) {
                let asClass = definition.asClass;
                className = asClass ? 'evolv-' + asClass : null;
            } else className = 'evolv-' + key;

            items[key] = {
                enode: $(),
                // state: 'inactive',
                className: className,
            };
        }

        const item = items[key];
        const enode = item.enode;
        const newEnode = definition['select']();
        const className = item.className;
        // const oldState = item.state;
        const wasConnected = enode.isConnected();
        const isConnected = newEnode.isConnected();
        const hasClass =
            newEnode.hasClass(className) ||
            (newEnode.doesExist() && className === null);
        // const newState = isConnected && hasClass ? 'active' : 'inactive';

        debug('process instrument:', `'${key}'`, {
            wasConnected,
            isConnected,
            hasClass,
        });

        if (wasConnected && isConnected && hasClass) {
            processItems(definition.children);
        } else if (
            (!wasConnected && isConnected) ||
            (isConnected && !hasClass)
        ) {
            item.enode = newEnode;
            if (className) item.enode.addClass(className);
            debug('process instrument: connect', `'${key}'`, item);
            if (definition.onConnect)
                definition.onConnect.forEach((func) => func());
            instrument._didItemChange = true;
        } else if (wasConnected && !isConnected) {
            item.enode = newEnode;
            debug('process instrument: disconnect', `'${key}'`, item);
            if (definition.onDisconnect)
                definition.onDisconnect.forEach((func) => func());
            instrument._didItemChange = true;
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
        if (instrument._didItemChange) {
            debug('process instrument: item changed, reprocessing');
            instrument.process();
        }
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
                if (options.hasOwnProperty('asClass'))
                    newDefinition.asClass = options.asClass;
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
            const options = {};
            if (dataItem.hasOwnProperty('asClass'))
                options.asClass = dataItem.asClass;

            instrument.add(key, select, options);
        }
    };

    sandbox.instrument = instrument;
}

export { initializeInstrument };
