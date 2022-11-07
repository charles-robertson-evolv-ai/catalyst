import { $, ENode } from './enode';

function initializeWhenContext(sandbox) {
    return (state) => {
        sandbox.debug(
            `whenContext: queue callback for '${state}' state, futurerrent state: '${sandbox._evolvContext.state}'`
        );

        if (state === 'active' || undefined) {
            return {
                then: (func) => {
                    sandbox._evolvContext.onActivate.push(func);
                    if (sandbox._evolvContext.state === 'active') {
                        func();
                    }
                },
            };
        } else if (state === 'inactive') {
            return {
                then: (func) => {
                    if (func) sandbox._evolvContext.onDeactivate.push(func);
                    if (sandbox._evolvContext.state === 'inactive') {
                        func();
                    }
                },
            };
        } else {
            return {
                then: () => {
                    warn(
                        `whenContext: unknown state, requires 'active' or 'inactive', default is 'active'`
                    );
                },
            };
        }
    };
}

function initializeWhenInstrument(sandbox) {
    return () => {
        sandbox.debug('whenInstrument: add function to instrument queue');

        return {
            then: (func) => {
                sandbox.instrument._onInstrument.push(func);
            },
        };
    };
}

// Accepts select string or a select function like instrument does
function initializeWhenDOM(sandbox) {
    sandbox._whenDOMCount = {};

    return (select, options) => {
        sandbox.debug('whenDOM:', select);
        const $$ = sandbox.$$;
        let selectFunc;
        let keyPrefix =
            options && options.keyPrefix ? options.keyPrefix : 'when-dom-';

        // Increment keys with different prefixes separately;
        if (!sandbox._whenDOMCount[keyPrefix])
            sandbox._whenDOMCount[keyPrefix] = 1;

        // Accept string, enode, or select function
        if (typeof select === 'string') selectFunc = () => $(select);
        else if (typeof select === 'object' && select.constructor === ENode)
            selectFunc = () => select;
        else if (typeof select === 'function') selectFunc = select;
        else {
            sandbox.warn(
                `whenDOM: unrecognized input ${select}, requires string, enode, or selection function`
            );
            return {
                then: () => null,
            };
        }

        return {
            then: (callback) => {
                const count = sandbox._whenDOMCount[keyPrefix]++;
                const key = keyPrefix + count;

                sandbox.instrument.definitions[key] = {
                    select: selectFunc,
                    onConnect: [
                        () => {
                            callback($$(key));
                        },
                    ],
                    asClass: null,
                };
                sandbox.instrument.process();
            },
            // Deprecated
            thenInBulk: (callback) => {
                const count = sandbox._whenDOMCount[keyPrefix]++;
                const key = keyPrefix + count;

                sandbox.instrument.definitions[key] = {
                    select: selectFunc,
                    onConnect: [
                        () => {
                            callback($$(key));
                        },
                    ],
                    asClass: null,
                };
                sandbox.instrument.process();
            },
            // Deprecated
            reactivateOnChange: () => {},
        };
    };
}

function initializeWhenItem(sandbox) {
    const $$ = sandbox.$$;

    return (key, options) => {
        sandbox.debug('whenItem:', key);

        const definition = sandbox.instrument.findDefinition(key);

        if (definition === null) {
            sandbox.warn(`whenItem: instrument item '${key}' not defined`);
            return {
                then: () => null,
            };
        }

        // let scope = null;

        return {
            then: (callback) => {
                // Don't add duplicate callbacks
                const newEntry = () => {
                    callback($$(key));
                };
                const newEntryString = newEntry.toString();
                if (!definition.onConnect) {
                    definition.onConnect = [];
                } else if (
                    definition.onConnect.findIndex(
                        (entry) => entry.toString() === newEntryString
                    ) !== -1
                ) {
                    sandbox.debug(
                        `whenItem: Duplicate callback ${newEntryString}, not assigned to item '${key}'`
                    );
                    return;
                }

                definition.onConnect.push(newEntry);
                sandbox.instrument.process();
            },
            // Deprecated
            thenInBulk: (callback) => {
                definition.onConnect = [
                    () => {
                        callback($$(key));
                    },
                ];
                sandbox.instrument.process();
            },
            // Deprecated
            reactivateOnChange: function () {},
        };
    };
}

function initializeWhenElement(sandbox) {
    return (select) => {
        return {
            then: function (func) {
                sandbox
                    .whenDOM(select, { keyPrefix: 'when-element-' })
                    .then((el) => func(el.firstDom()));
            },
        };
    };
}

function initializeWaitUntil(sandbox) {
    sandbox._intervalPoll = {
        queue: [],
        isPolling: false,
        entryId: 0,
        startPolling: () => {
            sandbox.debug('waitUntil: start polling');
            if (sandbox._intervalPoll.isPolling) return;
            const intervalPoll = sandbox._intervalPoll;
            intervalPoll.isPolling = true;
            const queue = intervalPoll.queue;
            const interval = setInterval(() => {
                if (queue.length < 1) {
                    sandbox.debug('waitUntil: queue empty, stop polling');
                    clearInterval(interval);
                    return;
                }

                for (let i = 0; i < queue.length; i++) {
                    const entry = queue[i];

                    // On first run
                    if (!entry.startTime) {
                        entry.id = intervalPoll.entryId++;
                        entry.startTime = performance.now();
                        if (entry.timeout) {
                            sandbox.debug(
                                `waitUntil: setting timeout for ${entry.timeout}ms`
                            );
                            setTimeout(() => {
                                sandbox.debug(
                                    'waitUntil: condition timed out',
                                    entry
                                );
                                const futureIndex = queue.findIndex(
                                    (futureEntry) => futureEntry.id === entry.id
                                );
                                queue.splice(futureIndex, 1);
                            }, entry.timeout);
                        }
                    }

                    if (entry.condition()) {
                        sandbox.debug(
                            'waitUntil: condition met:',
                            entry.condition(),
                            `${(performance.now() - entry.startTime).toFixed(
                                2
                            )}ms`
                        );
                        entry.callback();
                        queue.splice(i, 1);
                    }
                }
            }, 17);
            sandbox._intervalPoll.isPolling = false;
        },
    };

    return (condition, timeout) => {
        sandbox.debug(
            'waitUntil: add callback to queue, condition:',
            condition
        );
        return {
            then: (callback) => {
                const queueEntry = {
                    condition: condition,
                    callback: () => callback(condition()),
                };
                if (timeout) queueEntry.timeout = timeout;
                sandbox._intervalPoll.queue.push(queueEntry);
                sandbox._intervalPoll.startPolling();
            },
        };
    };
}

export {
    initializeWhenContext,
    initializeWhenInstrument,
    initializeWhenDOM,
    initializeWhenItem,
    initializeWhenElement,
    initializeWaitUntil,
};
