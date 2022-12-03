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
    let isProcessing = false;
    let processCount = 0;
    let didItemChange = false;

    const instrument = {};
    instrument.queue = {};
    instrument._onMutate = [];

    function processQueueItem(key) {
        const item = instrument.queue[key];
        const enode = item.enode;
        const newEnode = item.select();
        const className = item.className;
        const wasConnected = enode.isConnected();
        const isConnected = newEnode.isConnected();
        const hasClass =
            newEnode.hasClass(className) ||
            (newEnode.doesExist() && className === null);

        debug('process instrument:', `'${key}'`, {
            wasConnected,
            isConnected,
            hasClass,
        });

        if (
            (!wasConnected && isConnected) ||
            (isConnected && !hasClass) ||
            (isConnected && className === null && !enode.isEqualTo(newEnode))
        ) {
            item.enode = newEnode;
            if (className) item.enode.addClass(className);
            debug('process instrument: connect', `'${key}'`, item);
            item.onConnect.forEach((callback) => callback());
            didItemChange = true;
        } else if (wasConnected && !isConnected) {
            item.enode = newEnode;
            debug('process instrument: disconnect', `'${key}'`, item);
            item.onDisconnect.forEach((callback) => callback());
            didItemChange = true;
        } else if (wasConnected && isConnected && hasClass) {
            processQueueLoop(item.children);
        }
    }

    function processQueueLoop(keys) {
        if (!keys) keys = Object.keys(instrument.queue);
        for (const key of keys) {
            processQueueItem(key);
        }
    }

    instrument.processQueue = () => {
        if (isProcessing) return;

        isProcessing = true;
        processCount++;
        didItemChange = false;
        let then = performance.now();

        processQueueLoop();

        debug(
            'process instrument: complete',
            `${(performance.now() - then).toFixed(2)}ms`,
            processCount
        );

        isProcessing = false;

        // Covers scenario where mutations are missed during long process
        if (didItemChange) {
            debug('process instrument: item changed, reprocessing');
            instrument.debouncedProcessQueue();
        }

        instrument._onMutate.forEach((callback) => callback());
    };

    instrument.debouncedProcessQueue = debounce(() => {
        instrument.processQueue();
    });

    function addItem(key, select, options) {
        debug('add instrument:', key, select, options);
        if (typeof key !== 'string' && typeof select !== 'function') {
            warn(
                `add instrument: requires item key string and select function`
            );
            return;
        }

        const item = {
            select: select,
            onConnect: options && options.onConnect ? options.onConnect : [],
            onDisconnect:
                options && options.onDisconnect ? options.onDisconnect : [],
            type: options && options.type === 'single' ? 'single' : 'multi',
            children: [],
            enode: $(),
        };

        if (options && options.hasOwnProperty('asClass'))
            item.className = options.asClass
                ? 'evolv-' + options.asClass
                : null;
        else item.className = 'evolv-' + key;

        if (options && options.parent) {
            let parent = instrument.queue[options.parent];

            if (parent) {
                parent.children.push(key);
            } else {
                warn(`add instrument: parent '${options.parent}' not found`);
            }
        }

        instrument.queue[key] = item;
    }

    instrument.add = (key, select, options) => {
        debug(key, select, options);
        if (Array.isArray(key)) {
            key.forEach((item) => {
                debug('instrument.add:', item);
                addItem(...item);
            });
        } else {
            addItem(key, select, options);
        }

        instrument.processQueue();
    };

    // instrument.findDefinition = (searchKey) => {
    //     let result = null;

    //     function searchBlock(searchKey, block) {
    //         if (block[searchKey]) {
    //             result = block[searchKey];
    //             return;
    //         }

    //         for (const key in block) {
    //             if (block[key].children) {
    //                 searchBlock(searchKey, block[key].children);
    //             }
    //         }
    //     }

    //     searchBlock(searchKey, instrument.definitions);

    //     return result;
    // };

    sandbox.store.instrumentDOM = (data) => {
        const argumentArray = [];

        for (const key in data) {
            const dataItem = data[key];
            const select = Object.getOwnPropertyDescriptor(dataItem, 'dom').get;
            const options = {};
            if (dataItem.hasOwnProperty('asClass'))
                options.asClass = dataItem.asClass;

            argumentArray.push([key, select, options]);
        }

        instrument.add(argumentArray);
    };

    return instrument;
}

export { initializeInstrument };
