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

                // Updates the context state to enable SPA handling if either
                // property is set. isActive() is deprecated.
                const sandboxProxy = new Proxy(sandbox, {
                    set(target, property, value) {
                        target[property] = value;

                        if (property === 'id' || property === 'isActive') {
                            sandbox._evolvContext.updateState();
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

    catalyst.initVariant = (context, variant) => {
        const sandbox = window.evolv.catalyst[context];
        sandbox.whenContext('active').then(() => {
            debug('variant active:', variant);
            document.body.classList.add(`evolv-${variant}`);
        });

        sandbox.whenContext('inactive').then(() => {
            debug('variant inactive:', variant);
            document.body.classList.remove(`evolv-${variant}`);
        });

        return sandbox;
    };

    catalyst._intervalPoll = initializeIntervalPoll(catalyst);

    // SPA mutation observer for all sandboxes
    debug('init evolv context observer: watching html');
    new MutationObserver(() => {
        catalyst.log(
            'SPA:',
            Array.from(document.documentElement.classList).join(', ')
        );
        catalyst.sandboxes.forEach((sandbox) => {
            const oldState = sandbox._evolvContext.state;
            const newState = sandbox._evolvContext.updateState();
            if (
                (oldState === 'inactive' || oldState === undefined) &&
                newState === 'active'
            ) {
                sandbox._evolvContext.onActivate.forEach((func) => func());
            } else if (oldState === 'active' && newState === 'inactive') {
                sandbox._evolvContext.onDeactivate.forEach((func) => func());
            }
        });
    }).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    // The main mutation observer for all sandboxes
    debug('init main observer: watching body');
    new MutationObserver(() => {
        catalyst.sandboxes.forEach((sandbox) => {
            sandbox.instrument.process();
        });
    }).observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true,
    });

    return catalystProxy;
}

function pageMatch(page) {
    if (!page) return false;

    return new RegExp(page).test(location.pathname);
}

export function processConfig(config) {
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
