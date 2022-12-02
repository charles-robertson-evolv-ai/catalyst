import { $, ENode } from './enode';

function initializeWhenContext(sandbox) {
    return (state) => {
        if (state === 'active' || undefined) {
            return {
                then: (callback) => {
                    sandbox.debug(
                        `whenContext: queue callback`,
                        callback,
                        `for 'active' state, current state: '${sandbox._evolvContext.state.current}'`
                    );
                    sandbox._evolvContext.onActivate.push(callback);
                    if (sandbox._evolvContext.state.current === 'active') {
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
                        `for 'inactive' state, current state: '${sandbox._evolvContext.state.current}'`
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
// TODO: Combine instrument items with identical select functions and
// disallow duplicate onConnect functions.
function initializeWhenDOM(sandbox) {
    const counts = {};
    const history = [];
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    return (select, options) => {
        const logName =
            options && options.logName ? options.logName : 'whenDOM';
        const keyPrefix =
            options && options.keyPrefix ? options.keyPrefix : 'when-dom-';
        let selectFunc, count, key, foundPrevious;
        const previous = history.find((item) => item.select === select);

        if (previous && keyPrefix === previous.keyPrefix) {
            debug(`${logName}: ${select} found, adding on-connect callback`);
            selectFunc = previous.selectFunc;
            key = previous.key;
            foundPrevious = true;
        } else {
            // Increment keys with different prefixes separately;
            if (!counts[keyPrefix]) counts[keyPrefix] = 1;

            // Accept string or enode
            if (typeof select === 'string') selectFunc = () => $(select);
            else if (typeof select === 'object' && select.constructor === ENode)
                selectFunc = () => select;
            else {
                warn(
                    `${logName}: unrecognized input ${select}, requires string or enode`
                );
                return {
                    then: () => null,
                };
            }

            count = counts[keyPrefix]++;
            key = keyPrefix + count;

            history.push({
                select: select,
                selectFunc: selectFunc,
                keyPrefix: keyPrefix,
                key: key,
            });
        }

        const thenFunc = (callback) => {
            if (!foundPrevious)
                sandbox.instrument.add(key, selectFunc, { asClass: null });
            sandbox.whenItem(key, { logName: logName }).then(callback);
        };

        return {
            then: thenFunc,
            // Deprecated
            thenInBulk: thenFunc,
            // Deprecated
            reactivateOnChange: () => {},
        };
    };
}

function initializeWhenItem(sandbox) {
    const $$ = sandbox.$$;
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    return (key, options) => {
        const definition = sandbox.instrument.findDefinition(key);
        const logName =
            options && options.logName ? options.logName : 'whenItem';

        if (definition === null) {
            warn(`${logName}: instrument item '${key}' not defined`);
            return {
                then: () => null,
            };
        }

        const thenFunc = (callback) => {
            debug(`${logName}: '${key}' add on-connect callback`, {
                callback,
            });

            const newEntry = () => {
                debug(`${logName}: '${key}'`, 'fire on connect:', callback);
                callback($$(key));
            };

            newEntry.callbackString = callback.toString();

            if (!definition.onConnect) {
                definition.onConnect = [];
            } else if (
                definition.onConnect.findIndex(
                    (entry) => entry.callbackString === newEntry.callbackString
                ) !== -1
            ) {
                debug(
                    `${logName}: duplicate callback not assigned to item '${key}':`,
                    callback
                );
                return;
            }

            definition.onConnect.push(newEntry);
            if (
                sandbox.instrument.queue[key] &&
                sandbox.instrument.queue[key].enode.isConnected()
            )
                newEntry();
        };

        return {
            then: thenFunc,
            // Deprecated
            thenInBulk: thenFunc,
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
