function initializeEvolvContext(sandbox) {
    const debug = sandbox.debug;
    sandbox._evolvContext = {};
    const evolvContext = sandbox._evolvContext;

    evolvContext.updateState = () => {
        // Defaults the Evolv context state to active so you can run an experiment
        // even without the benefit of SPA handling.
        if (!sandbox.id && !sandbox.isActive) {
            evolvContext.state = 'active';
            return 'active';
        }

        if (sandbox.id) {
            evolvContext.state = document.documentElement.classList.contains(
                'evolv_web_' + sandbox.id
            )
                ? 'active'
                : 'inactive';
        } else if (sandbox.isActive) {
            // Deprecated
            evolvContext.state = sandbox.isActive() ? 'active' : 'inactive';
        }

        return evolvContext.state;
    };
    evolvContext.state = evolvContext.updateState();
    evolvContext.onActivate = [() => debug('evolv context: activate')];
    evolvContext.onDeactivate = [() => debug('evolv context: deactivate')];

    // Backward compatibility
    sandbox.track = function (txt) {
        var trackKey = 'evolv-' + this.name;
        var node = sandbox.$('body');
        var tracking = node.attr(trackKey);
        tracking = tracking ? tracking + ' ' + txt : txt;
        node.attr({ [trackKey]: tracking });
        return this;
    };
}

export { initializeEvolvContext };
