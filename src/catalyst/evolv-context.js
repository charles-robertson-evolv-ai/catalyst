function initializeEvolvContext(sandbox) {
    sandbox._evolvContext = {};
    sandbox._evolvContext.updateState = () => {
        // Defaults the Evolv context state to active so you can run an experiment
        // even without the benefit of SPA handling.
        if (!sandbox.id && !sandbox.isActive) return 'active';

        if (sandbox.id) {
            sandbox._evolvContext.state =
                document.documentElement.classList.contains(
                    'evolv_web_' + sandbox.id
                )
                    ? 'active'
                    : 'inactive';
        } else if (sandbox.isActive) {
            sandbox._evolvContext.state = sandbox.isActive()
                ? 'active'
                : 'inactive';
        }

        return sandbox._evolvContext.state;
    };
    sandbox._evolvContext.state = sandbox._evolvContext.updateState();
    sandbox._evolvContext.onActivate = [() => debug('evolv context: activate')];
    sandbox._evolvContext.onDeactivate = [
        () => debug('evolv context: deactivate'),
    ];

    // Backward compatibility
    sandbox.track = function (txt) {
        var trackKey = 'evolv-' + this.exp;
        var node = $('body');
        var tracking = node.attr(trackKey);
        tracking = tracking ? tracking + ' ' + txt : txt;
        node.attr({ [trackKey]: tracking });
        return this;
    };
}

export { initializeEvolvContext };
