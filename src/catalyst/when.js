import { $, ENode } from './enode';

function hash(string) {
    let hash = 0;
    const increment = Math.trunc(string.length / 512) || 1;

    for (let i = 0; i < string.length; i += increment) {
        let chr = string.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
    }

    hash &= 0xffff;

    return hash;
}

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

                newEntry.hash = hash(callback.toString());

                // Dedupe callbacks
                if (
                    sandbox._evolvContext[queueName].findIndex(
                        (entry) => entry.hash === newEntry.hash
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

                newEntry.hash = hash(callback.toString());

                // Dedupe callbacks
                if (
                    sandbox.instrument._onMutate.findIndex(
                        (entry) => entry.hash === newEntry.hash
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

function initializeWhenItem(sandbox) {
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

        const thenFunc = (callback, isInBulk) => {
            debug(`${logPrefix}: '${key}' add on-${action} callback`, {
                callback,
            });

            let newEntry;
            const index = item[queueName].length + 1;

            if (!isInBulk) {
                newEntry = () => {
                    const enode =
                        item.type === 'single'
                            ? item.enode.first()
                            : item.enode;

                    debug(
                        `${logPrefix}: '${key}'`,
                        `fire on ${action}:`,
                        callback
                    );

                    enode
                        .markOnce(`evolv-${key}-${index}`)
                        .each((enodeItem) => callback(enodeItem));
                };
            } else {
                newEntry = () => {
                    const enode =
                        item.type === 'single'
                            ? item.enode.first()
                            : item.enode;

                    debug(
                        `${logPrefix}: '${key}'`,
                        `fire in bulk on ${action}:`,
                        callback
                    );

                    callback(enode.markOnce(`evolv-${key}-${index}`));
                };
            }

            newEntry.hash =
                options && options.hash
                    ? options.hash
                    : hash(callback.toString());

            if (
                item[queueName].findIndex(
                    (entry) => entry.hash === newEntry.hash
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

        function thenInBulkFunc(callback) {
            thenFunc(callback, true);
        }

        return {
            then: thenFunc,
            // Deprecated
            thenInBulk: thenInBulkFunc,
            // Deprecated
            reactivateOnChange: () => {},
        };
    };
}

function initializeWhenDOM(sandbox) {
    const counts = {};
    const history = [];
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    const whenDOM = (select, options) => {
        const logPrefix =
            options && options.logPrefix ? options.logPrefix : 'whenDOM';
        const keyPrefix =
            options && options.keyPrefix ? options.keyPrefix : 'when-dom-';
        const type = options && options.type ? options.type : 'multi';
        let selectFunc, count, key, foundPrevious;
        const previous = history.find((item) => item.select === select);
        const whenItemOptions = { logPrefix };
        if (options && options.hash) whenItemOptions.hash = options.hash;

        if (previous && keyPrefix === previous.keyPrefix) {
            selectFunc = previous.selectFunc;
            key = previous.key;
            debug(`${logPrefix}: selector '${select}' found in item '${key}'`);
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

        return {
            then: (callback) => {
                if (!foundPrevious)
                    sandbox.instrument.add(key, selectFunc, {
                        asClass: null,
                        type: type,
                    });
                sandbox.whenItem(key, whenItemOptions).then(callback);
            },
            thenInBulk: (callback) => {
                if (!foundPrevious)
                    sandbox.instrument.add(key, selectFunc, {
                        asClass: null,
                        type: type,
                    });
                sandbox.whenItem(key, whenItemOptions).thenInBulk(callback);
            },
            // Deprecated
            reactivateOnChange: () => {},
        };
    };

    whenDOM.counts = counts;
    whenDOM.history = history;
    whenDOM.reset = function () {
        debug('whenDOM: reset selector history');

        for (const key in this.counts) {
            delete this.counts[key];
        }

        this.history.length = 0;
    };

    return whenDOM;
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
                        hash: hash(callback.toString()),
                    })
                    .then((enode) => callback(enode.el[0]));
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
                        hash: hash(callback.toString()),
                    })
                    .then((enode) => callback(enode.el[0]));
            },
        };
    };
}

function initializeWaitUntil(sandbox) {
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    return (condition, timeout) => {
        if (typeof condition !== 'function') {
            warn(
                'waitUntil: requires callback function that evaluates to true or false, input invalid',
                condition
            );
        }
        debug('waitUntil: add callback to interval poll queue', {
            condition,
            timeout,
        });
        return {
            then: (callback) => {
                const queue = sandbox._intervalPoll.queue;

                const newEntry = {
                    condition: condition,
                    callback: () => callback(condition()),
                    timeout: timeout || null,
                    startTime: performance.now(),
                    hash: hash(callback.toString()),
                };

                if (queue.some((entry) => entry.hash === newEntry.hash)) {
                    debug(
                        `waitUntil: duplicate callback not added to interval poll queue`,
                        callback
                    );
                    return;
                }
                queue.push(newEntry);
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
