import { initializeSandbox } from './sandbox';
import { initializeIntervalPoll } from './interval-poll';

export function initializeCatalyst() {
    const catalyst = initializeSandbox('catalyst');
    const debug = catalyst.debug;

    catalyst.sandboxes = [];

    // Creates proxy for window.evolv.catalyst that adds a new sandbox whenever
    // a new property is accessed.
    let catalystProxy = new Proxy(catalyst, {
        get(target, name, receiver) {
            let catalystReflection = Reflect.get(target, name, receiver);
            if (!catalystReflection) {
                const sandbox = initializeSandbox(name);
                let hasInitializedActiveKeyListener = false;

                // Automatically initializes the active key listener for SPA handling if either
                // property is set. Only permitted to run once. isActive() is deprecated.
                const sandboxProxy = new Proxy(sandbox, {
                    set(target, property, value) {
                        target[property] = value;

                        if (
                            !hasInitializedActiveKeyListener &&
                            (property === 'id' || property === 'isActive')
                        ) {
                            sandbox._evolvContext.initializeActiveKeyListener(
                                value
                            );
                            hasInitializedActiveKeyListener = true;
                        } else if (
                            property === 'id' ||
                            property === 'isActive'
                        ) {
                            sandbox.debug(
                                'init sandbox: active key listener already initialized'
                            );
                        }

                        return true;
                    },
                });
                target[name] = sandboxProxy;
                catalystReflection = Reflect.get(target, name, receiver);
                catalyst.sandboxes.push(sandboxProxy);
            }

            return catalystReflection;
        },
    });

    catalyst._intervalPoll = initializeIntervalPoll(catalyst);

    // The main mutation observer for all sandboxes
    debug('global observer: init');

    catalyst._globalObserver = {
        observer: new MutationObserver(() => {
            let anySandboxActive = false;
            for (const sandbox of catalyst.sandboxes) {
                if (sandbox._evolvContext.state.current === 'inactive')
                    continue;
                anySandboxActive = true;
                sandbox.instrument.debouncedProcessQueue();
            }
            if (!anySandboxActive) {
                debug('global observer: no sandboxes active');
                catalyst._globalObserver.disconnect();
            }
        }),
        connect: () => {
            debug('global observer: observe');
            catalyst._globalObserver.observer.observe(document.body, {
                childList: true,
                attributes: true,
                subtree: true,
            });
            catalyst._globalObserver.state = 'active';
        },
        disconnect: () => {
            debug('global observer: disconnect');
            catalyst._globalObserver.observer.disconnect();
            catalyst._globalObserver.state = 'inactive';
        },
    };

    catalyst._globalObserver.connect();

    return catalystProxy;
}

export function processConfig(config) {
    function pageMatch(page) {
        if (!page) return false;

        return new RegExp(page).test(location.pathname);
    }

    window.evolv = window.evolv || {};
    var pages = config && config.pages ? config.pages : ['.*'];
    var matches = pages.some(pageMatch);
    var evolv = window.evolv;

    if (matches) {
        if (window.evolv.catalyst) return window.evolv.catalyst;

        evolv.catalyst = initializeCatalyst();
        evolv.renderRule = evolv.catalyst;

        return evolv.catalyst;
    }
}
