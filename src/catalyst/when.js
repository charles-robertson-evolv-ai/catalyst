import { $, ENode } from './enode';

function initializeWhenContext(sandbox) {
    return (state) => {
        if (state === 'active' || undefined) {
            return {
                then: (callback) => {
                    sandbox.debug(
                        `whenContext: queue callback`,
                        callback,
                        `for 'active' state, current state: '${sandbox._evolvContext.state}'`
                    );
                    sandbox._evolvContext.onActivate.push(callback);
                    if (sandbox._evolvContext.state === 'active') {
                        callback();
                    }
                },
            };
        } else if (state === 'inactive') {
            return {
                then: (callback) => {
                    sandbox.debug(
                        `whenContext: queue callback`,
                        callback,
                        `for 'inactive' state, current state: '${sandbox._evolvContext.state}'`
                    );
                    if (callback)
                        sandbox._evolvContext.onDeactivate.push(callback);
                    if (sandbox._evolvContext.state === 'inactive') {
                        callback();
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
// TODO: Remove select function and only allow ENode
// TODO: Combine instrument items with identical select functions and
// disallow duplicate onConnect functions.
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
                sandbox.debug(`whenItem: '${key}'`, 'add on connect', {
                    callback,
                });

                // Don't add duplicate callbacks (not ready yet. requires refactoring definitions and instrumentation)
                // const callbackString = callback.toString();

                const newEntry = () => {
                    sandbox.debug(
                        `whenItem: '${key}'`,
                        'fire on connect:',
                        callback
                    );
                    callback($$(key));
                };
                // const newEntryString = newEntry.toString();
                if (!definition.onConnect) {
                    definition.onConnect = [];
                } /* else if (
                    definition.onConnect.findIndex(
                        (entry) => entry.callbackString === callbackString
                    ) !== -1
                ) {
                    sandbox.debug(
                        `whenItem: Duplicate callback ${newEntryString}, not assigned to item '${key}'`
                    );
                    return;
                } */

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
            then: (callback) => {
                sandbox
                    .whenDOM(select, { keyPrefix: 'when-element-' })
                    .then((enode) => callback(enode.el[0]));
            },
        };
    };
}

// Add deduping
function initializeWaitUntil(sandbox) {
    sandbox._intervalPoll = {
        queue: [],
    };

    sandbox.whenContext('active').then(() => {
        if (
            window.evolv &&
            window.evolv.catalyst &&
            window.evolv.catalyst._intervalPoll &&
            window.evolv.catalyst._intervalPoll.usePolling
        )
            window.evolv.catalyst._intervalPoll.startPolling();
    });

    return (condition, timeout) => {
        sandbox.debug(
            'waitUntil: add callback to interval poll queue, condition:',
            condition
        );
        return {
            then: (callback) => {
                const entry = {
                    condition: condition,
                    callback: () => callback(condition()),
                    timeout: timeout || null,
                    startTime: performance.now(),
                };
                sandbox._intervalPoll.queue.push(entry);
                window.evolv.catalyst._intervalPoll.usePolling = true;
                window.evolv.catalyst._intervalPoll.startPolling();
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
