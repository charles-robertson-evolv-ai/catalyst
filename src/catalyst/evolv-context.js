import { $ } from './enode';

function initializeEvolvContext(sandbox) {
    const debug = sandbox.debug;
    const warn = sandbox.warn;

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
        initializeActiveKeyListener: (value) => {
            debug('init active key listener: waiting for window.evolv.client');

            sandbox
                .waitUntil(
                    () =>
                        window.evolv &&
                        window.evolv.client &&
                        window.evolv.client.getActiveKeys
                )
                .then(() => {
                    window.evolv.client.getActiveKeys().listen((keys) => {
                        let isActive;

                        if (typeof value === 'string')
                            isActive = () => keys.current.length > 0;
                        else if (typeof value === 'function') isActive = value;
                        else
                            warn(
                                'init active key listener: requires context id string or isActive function, invalid input',
                                value
                            );

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
}

export { initializeEvolvContext };
