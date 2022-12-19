import { $ } from './enode';

function initializeEvolvContext(sandbox) {
    const debug = sandbox.debug;
    const warn = sandbox.warn;

    return {
        state: { current: 'active', previous: 'active' },
        onActivate: [
            window.evolv.catalyst._globalObserver.connect,
            window.evolv.catalyst._intervalPoll.startPolling,
        ],
        onDeactivate: [
            window.evolv.catalyst._globalObserver.disconnect,
            sandbox.instrument.deinstrument,
            sandbox._intervalPoll.reset,
        ],
        initializeActiveKeyListener: (value) => {
            debug('active key listener: init');
            debug('active key listener: waiting for window.evolv.client');

            sandbox
                .waitUntil(
                    () =>
                        window.evolv &&
                        window.evolv.client &&
                        window.evolv.client.getActiveKeys
                )
                .then(() => {
                    // If contextKey is null, getActiveKeys will still trigger and use rule.isActive to evaluate state
                    const contextKey =
                        typeof value === 'string' ? `web.${value}` : null;

                    window.evolv.client
                        .getActiveKeys(contextKey)
                        .listen((keys) => {
                            let isActive;

                            if (typeof value === 'string')
                                isActive = () => keys.current.length > 0;
                            else if (typeof value === 'function')
                                isActive = value;
                            else
                                warn(
                                    'init active key listener: requires context id string or isActive function, invalid input',
                                    value
                                );

                            const previous =
                                sandbox._evolvContext.state.current;
                            sandbox._evolvContext.state.current = isActive()
                                ? 'active'
                                : 'inactive';
                            const current = sandbox._evolvContext.state.current;

                            if (
                                previous === 'inactive' &&
                                current === 'active'
                            ) {
                                debug(
                                    `active key listener: activate context '${sandbox.name}'`
                                );
                                sandbox._evolvContext.onActivate.forEach(
                                    (callback) => callback()
                                );
                            } else if (
                                previous === 'active' &&
                                current === 'inactive'
                            ) {
                                debug(
                                    `active key listener: deactivate context '${sandbox.name}'`
                                );
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
}

function initializeTrack(sandbox) {
    const debug = sandbox.debug;

    return (variant) => {
        debug('track:', variant);

        // Backward compatibility
        var trackKey = 'evolv-' + sandbox.name;
        var body = sandbox.select(document.body);

        const className = `${sandbox.name}-${variant}`;
        sandbox.whenContext('active').then(() => {
            debug(`init variant: variant ${variant} active`);

            // Backward compatibility
            var tracking = body.attr(trackKey);
            if (!tracking.split(' ').includes(variant)) {
                tracking = tracking ? tracking + ' ' + variant : variant;
                body.attr({ [trackKey]: tracking });
            }

            sandbox.instrument.add(className, () =>
                sandbox.select(document.body)
            );
        });
        sandbox.whenContext('inactive').then(() => {
            debug(`init variant: variant ${variant} inactive`);

            // Backward compatibility
            body.el[0].removeAttribute(trackKey);
        });
    };
}

export { initializeEvolvContext, initializeTrack };
