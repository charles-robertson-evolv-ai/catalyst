import { initializeSandbox } from './sandbox.js';
import { version } from '../../package.json';

export function initializeCatalyst() {
    var catalyst = initializeSandbox('catalyst');
    catalyst.version = version;
    catalyst.sandboxes = [];
    const debug = catalyst.debug;

    let catalystProxy = new Proxy(catalyst, {
        get(target, name, receiver) {
            let reflection = Reflect.get(target, name, receiver);
            if (!reflection) {
                target[name] = initializeSandbox(name);
                reflection = Reflect.get(target, name, receiver);
                catalyst.sandboxes.push(reflection);
            }

            return reflection;
        },
    });

    catalyst.initVariant = (context, variant) => {
        const sandbox = window.evolv.catalyst[context];
        sandbox.whenContext('active').then(() => {
            sandbox.debug('variant active:', variant);
            document.body.classList.add(`evolv-${variant}`);
        });

        sandbox.whenContext('inactive').then(() => {
            sandbox.debug('variant inactive:', variant);
            document.body.classList.remove(`evolv-${variant}`);
        });

        return sandbox;
    };

    // SPA mutation observer for all sandboxes
    debug('init evolv context observer: watching html');
    new MutationObserver(() => {
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
