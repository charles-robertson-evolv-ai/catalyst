import { $ } from './enode';

function initializeEvolvContext(sandbox) {
    const debug = sandbox.debug;

    // Backward compatibility
    sandbox.track = function (txt) {
        var trackKey = 'evolv-' + this.name;
        var node = $('body');
        var tracking = node.attr(trackKey);
        tracking = tracking ? tracking + ' ' + txt : txt;
        node.attr({ [trackKey]: tracking });
        return this;
    };

    return {
        state: { current: 'active', previous: 'active' },
        onActivate: [
            () => debug(`activate context: ${sandbox.name}`),
            window.evolv.catalyst._globalObserver.connect,
            window.evolv.catalyst._intervalPoll.startPolling,
        ],
        onDeactivate: [() => debug(`deactivate context: ${sandbox.name}`)],
        initializeActiveKeyListener: (contextId) => {
            debug('init active key listener: waiting for window.evolv.client');
            sandbox
                .waitUntil(
                    () =>
                        window.evolv &&
                        window.evolv.client &&
                        window.evolv.client.getActiveKeys
                )
                .then(() => {
                    window.evolv.client
                        .getActiveKeys('web.' + contextId)
                        .listen((keys) => {
                            debug('active key listener:', keys);
                            // if (keys)
                        });
                });
        },
        initializeIsActiveListener: (isActive) => {
            sandbox
                .waitUntil(
                    () =>
                        window.evolv &&
                        window.evolv.client &&
                        window.evolv.client.getActiveKeys
                )
                .then(() => {
                    window.evolv.client.getActiveKeys().listen((keys) => {
                        sandbox._evolvContext.state.previous =
                            sandbox._evolvContext.state.current;
                        sandbox._evolvContext.state.current = isActive()
                            ? 'active'
                            : 'inactive';
                        const current = sandbox._evolvContext.state.current;
                        const previous = sandbox._evolvContext.state.previous;

                        if (previous === 'inactive' && current === 'active') {
                            debug('active key listener: activate');
                            sandbox._evolvContext.onActivate.forEach(
                                (callback) => callback()
                            );
                        } else if (
                            previous === 'active' &&
                            current === 'inactive'
                        ) {
                            debug('active key listener: deactivate');
                            sandbox._evolvContext.onDeactivate.forEach(
                                (callback) => callback()
                            );
                        } else {
                            debug(
                                `active key listener: no change, current state '${current}'`
                            );
                        }
                    });
                });
        },
    };
    // sandbox._evolvContext = {};
    // const evolvContext = sandbox._evolvContext;

    // evolvContext.updateState = () => {
    //     // Defaults the Evolv context state to active so you can run an experiment
    //     // even without the benefit of SPA handling.
    //     if (!sandbox.id && !sandbox.isActive) {
    //         evolvContext.state = 'active';
    //         return 'active';
    //     }

    //     if (sandbox.id) {
    //         evolvContext.state = document.documentElement.classList.contains(
    //             'evolv_web_' + sandbox.id
    //         )
    //             ? 'active'
    //             : 'inactive';
    //     } else if (sandbox.isActive) {
    //         // Deprecated
    //         evolvContext.state = sandbox.isActive() ? 'active' : 'inactive';
    //     }

    //     return evolvContext.state;
    // };

    // evolvContext.updateState();
    // evolvContext.onActivate = [
    //     () =>
    //         debug(
    //             `evolv context: ${sandbox.name} activate, ${(
    //                 performance.now() - sandbox.perf
    //             ).toFixed(2)}ms`
    //         ),
    // ];
    // evolvContext.onDeactivate = [
    //     () => debug(`evolv context: ${sandbox.name} deactivate`),
    // ];
}

export { initializeEvolvContext };
