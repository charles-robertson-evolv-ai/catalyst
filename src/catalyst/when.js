import { $, ENode } from './enode';

function initializeWhenContext(sandbox) {
    const debug = sandbox.debug;

    return (state) => {
        let queueName;

        if (
            !(state === 'active' || state === undefined || state === 'inactive')
        ) {
            return {
                then: () => {
                    warn(
                        `whenContext: unknown state, requires 'active' or 'inactive', default is 'active'`
                    );
                },
            };
        } else if (state === 'active' || undefined) {
            queueName = 'onActivate';
        } else {
            queueName = 'onDeactivate';
        }

        return {
            then: (callback) => {
                const newEntry = () => {
                    debug(
                        `whenContext: fire on ${
                            state === 'inactive' ? 'deactivate' : 'activate'
                        }`,
                        callback
                    );
                    callback();
                };

                newEntry.callbackString = callback.toString();

                // Dedupe callbacks
                if (
                    sandbox._evolvContext[queueName].findIndex(
                        (entry) =>
                            entry.callbackString === newEntry.callbackString
                    ) !== -1
                ) {
                    debug(
                        `whenContext: duplicate callback not assigned to '${state}' state`,
                        callback
                    );
                    return;
                }

                debug(
                    `whenContext: queue callback for '${state}' state, current state: '${sandbox._evolvContext.state.current}'`,
                    callback
                );
                sandbox._evolvContext[queueName].push(newEntry);
                if (
                    state === 'active' &&
                    sandbox._evolvContext.state.current === 'active'
                ) {
                    newEntry();
                } else if (
                    state === 'inactive' &&
                    sandbox._evolvContext.state.current === 'inactive'
                ) {
                    newEntry();
                }
            },
        };
    };
}

function initializeWhenMutate(sandbox) {
    const debug = sandbox.debug;

    return () => {
        return {
            then: (callback) => {
                const newEntry = () => {
                    debug(`whenMutate: fire on mutate`, callback);
                    callback();
                };

                newEntry.callbackString = callback.toString();

                // Dedupe callbacks
                if (
                    sandbox.instrument._onMutate.findIndex(
                        (entry) =>
                            entry.callbackString === newEntry.callbackString
                    ) !== -1
                ) {
                    debug(
                        `whenMutate: duplicate callback not assigned to on-mutate queue`,
                        callback
                    );
                    return;
                }

                debug('whenMutate: add callback to on-mutate queue', callback);
                sandbox.instrument._onMutate.push(newEntry);
            },
        };
    };
}

function initializeWhenDOM(sandbox) {
    const counts = {};
    const history = [];
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    return (select, options) => {
        const logPrefix =
            options && options.logPrefix ? options.logPrefix : 'whenDOM';
        const keyPrefix =
            options && options.keyPrefix ? options.keyPrefix : 'when-dom-';
        const type = options && options.type ? options.type : 'multi';
        let selectFunc, count, key, foundPrevious;
        const previous = history.find((item) => item.select === select);
        const whenItemOptions = { logPrefix };
        if (options && options.callbackString)
            whenItemOptions.callbackString = options.callbackString;

        if (previous && keyPrefix === previous.keyPrefix) {
            selectFunc = previous.selectFunc;
            key = previous.key;
            debug(`${logPrefix}: '${select}' found in item '${key}'`);
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
                    `${logPrefix}: unrecognized input ${select}, requires string or enode`
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
                sandbox.instrument.add(key, selectFunc, {
                    asClass: null,
                    type: type,
                });
            sandbox.whenItem(key, whenItemOptions).then(callback);
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
        const item = sandbox.instrument.queue[key];
        const logPrefix =
            options && options.logPrefix ? options.logPrefix : 'whenItem';
        let queueName, action;
        if (options && options.disconnect) {
            queueName = 'onDisconnect';
            action = 'disconnect';
        } else {
            queueName = 'onConnect';
            action = 'connect';
        }

        if (!item) {
            warn(`${logPrefix}: instrument item '${key}' not defined`);
            return {
                then: () => null,
            };
        }

        const thenFunc = (callback) => {
            const index = item[queueName].length + 1;

            debug(`${logPrefix}: '${key}' add on-${action} callback`, {
                callback,
            });

            const newEntry = () => {
                debug(`${logPrefix}: '${key}'`, `fire on ${action}:`, callback);
                callback(item.enode.markOnce(`evolv-${key}-${index}`));
            };

            newEntry.callbackString =
                options && options.callbackString
                    ? options.callbackString
                    : callback.toString();

            if (
                item[queueName].findIndex(
                    (entry) => entry.callbackString === newEntry.callbackString
                ) !== -1
            ) {
                debug(
                    `${logPrefix}: duplicate on-${action} callback not assigned to item '${key}':`,
                    callback
                );
                return;
            }

            item[queueName].push(newEntry);

            if (
                queueName === 'onConnect' &&
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
                    .whenDOM(select, {
                        keyPrefix: 'when-element-',
                        logPrefix: 'whenElement',
                        type: 'single',
                        callbackString: callback.toString,
                    })
                    .then((enodes) => callback(enodes.el[0]));
            },
        };
    };
}

function initializeWhenElements(sandbox) {
    return (select) => {
        return {
            then: (callback) => {
                sandbox
                    .whenDOM(select, {
                        keyPrefix: 'when-elements-',
                        logPrefix: 'whenElements',
                        callbackString: callback.toString,
                    })
                    .then((enodes) =>
                        enodes.each((enode) => callback(enode.el[0]))
                    );
            },
        };
    };
}

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
    initializeWhenMutate,
    initializeWhenDOM,
    initializeWhenItem,
    initializeWhenElement,
    initializeWhenElements,
    initializeWaitUntil,
};
