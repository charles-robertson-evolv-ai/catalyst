import { ENode } from './enode';

function initializeWhenContext(sandbox) {
    return (state) => {
        debug(
            `whenContext: queue callback for '${state}' state, current state: '${sandbox._evolvContext.state}'`
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
        debug('whenInstrument: add function to instrument queue');

        return {
            then: (func) => {
                sandbox.instrument._onInstrument.push(func);
            },
        };
    };
}

// Accepts select string or a select function like instrument does
function initializeWhenDOM(sandbox) {
    return (select) => {
        debug('whenDOM:', select);
        if (sandbox._whenDOMCount === undefined) sandbox._whenDOMCount = 0;
        let selectFunc;

        if (typeof select === 'string') selectFunc = () => $(select);
        else if (typeof select === 'object' && select.constructor === ENode)
            selectFunc = () => select;
        else if (typeof select === 'function') selectFunc = select;
        else {
            warn(
                `whenDOM: unrecognized input ${select}, requires string, enode, or selection function`
            );
            return {
                then: () => null,
            };
        }

        let scope = null;

        return {
            then: function (func) {
                scope = function (selectFunc) {
                    const count = ++sandbox._whenDOMCount;
                    const key = 'when-dom-' + count;

                    sandbox.instrument.definitions[key] = {
                        select: selectFunc,
                        onConnect: [
                            () => {
                                func($$(key));
                            },
                        ],
                    };
                };
                scope(selectFunc);
                sandbox.instrument.process;
            },
            // Deprecated
            thenInBulk: function (func) {
                scope = function (selectFunc) {
                    const count = ++sandbox._whenDOMCount;
                    const key = 'when-dom-' + count;

                    sandbox.instrument.definitions[key] = {
                        select: selectFunc,
                        onConnect: [
                            () => {
                                func($$(key));
                            },
                        ],
                    };
                };
                scope(selectFunc);
                sandbox.instrument.process;
            },
            // Deprecated
            reactivateOnChange: function () {},
        };
    };
}

function initializeWhenItem(sandbox) {
    (key) => {
        debug('whenItem:', key);

        const definition = sandbox.instrument.findDefinition(key);

        if (definition === null) {
            warn(`whenItem: instrument item '${key}' not defined`);
            return {
                then: () => null,
            };
        }

        let scope = null;

        return {
            then: function (func) {
                scope = function () {
                    definition.onConnect = [
                        () => {
                            func($$(key));
                        },
                    ];
                };
                scope();
                sandbox.instrument.process;
            },
            // Deprecated
            thenInBulk: function (func) {
                scope = function () {
                    definition.onConnect = [
                        () => {
                            func($$(key));
                        },
                    ];
                };
                scope();
                sandbox.instrument.process;
            },
            // Deprecated
            reactivateOnChange: function () {},
        };
    };
}

// whenElement
// waitUntil

export {
    initializeWhenContext,
    initializeWhenInstrument,
    initializeWhenDOM,
    initializeWhenItem,
};
