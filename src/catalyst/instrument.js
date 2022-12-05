import { $ } from './enode';

function initializeInstrument(sandbox) {
    const debug = sandbox.debug;
    const warn = sandbox.warn;
    let isProcessing = false;
    let processCount = 0;
    let didItemChange = false;

    const instrument = {};
    instrument.queue = {};
    instrument._onMutate = [];

    function debounce(func, timeout = 17) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        };
    }
    function processQueueItem(key) {
        const item = instrument.queue[key];
        const enode = item.enode;
        const className = item.className;
        const type = item.type;

        let wasConnected, isConnected, hasClass, newEnode;

        if (type === 'single') {
            newEnode = enode.isConnected() ? enode : item.select();
        } else {
            newEnode = item.select();
        }

        wasConnected = item.state === 'connected';
        isConnected = newEnode.isConnected();
        hasClass =
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
            (type !== 'single' &&
                isConnected &&
                className === null &&
                !enode.isEqualTo(newEnode))
        ) {
            item.enode = newEnode;
            if (className) item.enode.addClass(className);
            item.state = 'connected';
            debug('process instrument: connect', `'${key}'`, item);
            item.onConnect.forEach((callback) => callback());
            didItemChange = true;
        } else if (wasConnected && !isConnected) {
            item.enode = newEnode;
            item.state = 'disconnected';
            debug('process instrument: disconnect', `'${key}'`, item);
            item.onDisconnect.forEach((callback) => callback());
            didItemChange = true;
        }
    }

    instrument.processQueue = () => {
        if (isProcessing) return;

        isProcessing = true;
        processCount++;
        didItemChange = false;
        let then = performance.now();

        for (const key in instrument.queue) {
            processQueueItem(key);
        }

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
            enode: $(),
            state: 'disconnected',
        };

        if (options && options.hasOwnProperty('asClass'))
            item.className = options.asClass
                ? 'evolv-' + options.asClass
                : null;
        else item.className = 'evolv-' + key;

        instrument.queue[key] = item;
    }

    instrument.add = (key, select, options) => {
        if (Array.isArray(key)) {
            key.forEach((item) => {
                addItem(...item);
            });
        } else {
            addItem(key, select, options);
        }

        instrument.processQueue();
    };

    instrument.remove = (key) => {
        const queue = instrument.queue;
        const item = queue[key];
        item.enode.removeClass(item.className);
        delete queue[key];
    };

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
