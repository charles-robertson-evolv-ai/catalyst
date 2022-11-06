(function () {
    'use strict';

    const environmentLogDefaults = {
        // VCG
        b02d16aa80: 'silent', // Prod
        add8459f1c: 'normal', // Staging
        '55e68a2ba9': 'normal', // Development
        eee20e49ae: 'normal', // Prototype
        b5d276c11b: 'normal', // verizon qa

        // VBG
        '13d2e2d4fb': 'silent', // Prod
        '4271e3bfc8': 'normal', // QA Testing
        '6bfb40849e': 'normal', // UAT
    };

    function initializeLogs(sandbox) {
        // Uses console.info() because VBG blocks console.log();

        const logPrefix = `[evolv-${sandbox.name}]`;

        const participantsURL = document.querySelector(
            'script[src^="https://participants.evolv.ai"]'
        );
        const environmentMatch = participantsURL
            ? participantsURL
                  .getAttribute('src')
                  .match(
                      /(?<=https:\/\/participants\.evolv\.ai\/v1\/)[a-z0-9]*(?=\/)/
                  )
            : null;
        let environmentId = environmentMatch ? environmentMatch[0] : null;
        const environmentLogs = environmentId
            ? environmentLogDefaults[environmentId]
            : null;

        const localStorageLogs = localStorage.getItem('evolv:catalyst-logs');
        sandbox.logs = sandbox.logs || 'normal';
        if (environmentLogs) sandbox.logs = environmentLogs;
        if (localStorageLogs) sandbox.logs = localStorageLogs;

        sandbox.log = (...args) => {
            const logs = sandbox.logs;
            if (logs === 'normal' || logs === 'debug')
                console.info(logPrefix, ...args);
        };
        sandbox.warn = (...args) => {
            const logs = sandbox.logs;
            if (logs === 'normal' || logs === 'debug')
                console.warn(logPrefix, ...args);
        };
        sandbox.debug = (...args) => {
            if (sandbox.logs === 'debug') console.info(`${logPrefix}`, ...args);
        };
    }

    function toNodeValue(sel, context) {
        context = context || document;
        if (!sel) {
            return [];
        } else if (typeof sel === 'string') {
            if (sel[0] === '<') {
                var div = context.createElement('div');
                div.innerHTML = sel.trim();
                return [div.firstChild];
            } else if (sel[0] === '/') {
                var snapshot = document.evaluate(
                    sel,
                    context,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );

                // Can this be refactored using function.prototype.apply()?
                var el = [];

                for (var i = 0; i < snapshot.snapshotLength; i++) {
                    el[i] = snapshot.snapshotItem(i);
                }

                return el;
            } else {
                return context.querySelectorAll(sel);
            }
        } else if (sel instanceof Element) {
            return [sel];
        } else if (sel.constructor === ENode) {
            return sel.el;
        } else if (Array.isArray(sel)) {
            return sel;
        } else {
            return [];
        }
    }

    const ENode = function (sel, context) {
        context = context || document;
        var el = toNodeValue(sel, context);
        this.el = Array.prototype.slice.call(el);
        this.length = this.el.length;
    };

    // Checks
    ENode.prototype.doesExist = function () {
        return this.length > 0 && this.el[0] !== null;
    };

    ENode.prototype.isConnected = function () {
        return this.doesExist() && this.el.findIndex((e) => !e.isConnected) === -1;
    };

    ENode.prototype.hasClass = function (className) {
        return (
            this.doesExist() &&
            this.el.findIndex((e) => !e.classList.contains(className)) === -1
        );
    };

    // Filters
    ENode.prototype.filter = function (sel) {
        var el = this.el;
        if (!sel) return this;
        return new ENode(
            el.filter(function (e) {
                return e.matches(sel);
            })
        );
    };
    ENode.prototype.contains = function (text) {
        var el = this.el;

        if (text instanceof RegExp) {
            return new ENode(
                el.filter(function (e) {
                    return regex.test(e.textContent);
                })
            );
        } else {
            return new ENode(
                el.filter(function (e) {
                    return e.textContent.includes(text);
                })
            );
        }
    };

    //navigation
    ENode.prototype.find = function (sel) {
        var el = this.el;
        return new ENode(
            el
                .map(function (e) {
                    return Array.prototype.slice.call(toNodeValue(sel, e));
                })
                .flat(2)
        );
    };
    ENode.prototype.closest = function (sel) {
        var el = this.el;
        return new ENode(
            el.map(function (e) {
                return e.closest(sel);
            })
        );
    };
    ENode.prototype.parent = function () {
        var el = this.el;
        var parents = el.map(function (e) {
            return e.parentNode;
        });
        parents = parents.filter(function (item, pos) {
            return parents.indexOf(item) == pos;
        });
        return new ENode(parents);
    };
    ENode.prototype.children = function (sel) {
        var el = this.el;
        return new ENode(
            el.reduce(function (a, b) {
                return a.concat(Array.prototype.slice.call(b.children));
            }, [])
        ).filter(sel);
    };
    ENode.prototype.next = function () {
        return new ENode(
            this.el.map(function (e) {
                return e.nextElementSibling;
            })
        );
    };
    ENode.prototype.prev = function () {
        return new ENode(
            this.el.map(function (e) {
                return e.previousElementSibling;
            })
        );
    };

    //manipulating class
    ENode.prototype.addClass = function (classString) {
        this.el.forEach(function (e) {
            classString.split(' ').forEach(function (className) {
                e.classList.add(className);
            });
        });
        return this;
    };
    ENode.prototype.removeClass = function (className) {
        function removeTheClass(e) {
            e.classList.remove(className);
        }
        this.el.forEach(removeTheClass);
        return this;
    };

    //repositioning and insertion
    ENode.prototype.append = function (item) {
        var node = this.el[0];
        if (!node) return;

        var items = toNodeValue(item);
        items.forEach(function (e) {
            node.append(e);
        });

        return this;
    };

    ENode.prototype.prepend = function (item) {
        var node = this.el[0];
        if (!node) return;

        var items = toNodeValue(item);
        items.forEach(function (e) {
            node.prepend(e);
        });

        return this;
    };
    ENode.prototype.beforeMe = function (item) {
        if (typeof item === 'string') {
            item = new ENode(item);
        }
        item.insertBefore(this);
        return this;
    };
    ENode.prototype.afterMe = function (item) {
        if (typeof item === 'string') {
            item = new ENode(item);
        }
        item.insertAfter(this);
        return this;
    };
    ENode.prototype.insertBefore = function (item) {
        var node = this.el[0];
        if (!node) {
            console.info('no content for insert');
            return this;
        }
        if (typeof item === 'string') {
            item = document.querySelectorAll(item);
        } else if (item.constructor === ENode) {
            item = item.el[0];
        }
        item.parentNode.insertBefore(node, item);
        return this;
    };
    ENode.prototype.insertAfter = function (item) {
        var node = this.el[0];
        if (!node) {
            console.info('no content for insert');
            return this;
        }
        if (typeof item === 'string') {
            item = document.querySelectorAll(item);
        } else if (item.constructor === ENode) {
            item = item.el[0];
        }
        item.parentNode.insertBefore(node, item.nextSibling);
        return this;
    };
    ENode.prototype.wrap = function (item) {
        return this.el.forEach(function (e) {
            new ENode(e).wrapAll(item);
        });
    };
    ENode.prototype.wrapAll = function (item) {
        if (typeof item === 'string') {
            item = new ENode(item);
        }
        var wrapper = item.firstDom();
        while (wrapper.children.length) {
            wrapper = wrapper.firstElementChild;
        }
        var innerItem = new ENode(wrapper);

        this.first().beforeMe(item);
        innerItem.append(this);
        return this;
    };

    //
    ENode.prototype.markOnce = function (attr) {
        var results = this.el.filter(function (e) {
            return !e.getAttribute(attr);
        });
        results.forEach(function (e) {
            e.setAttribute(attr, true);
        });
        return new ENode(results);
    };

    //listener
    ENode.prototype.on = function (tag, fnc) {
        this.el.forEach(function (e) {
            tag.split(' ').forEach(function (eventTag) {
                e.addEventListener(eventTag, fnc);
            });
        });
        return this;
    };

    //content
    ENode.prototype.html = function (str) {
        if (!str)
            return this.el
                .map(function (e) {
                    return e.innerHTML;
                })
                .join();

        this.el.forEach(function (e) {
            e.innerHTML = str;
        });
        return this;
    };
    ENode.prototype.text = function (str) {
        if (!str)
            return this.el
                .map(function (e) {
                    return e.textContent;
                })
                .join(' ');

        this.el.forEach(function (e) {
            e.textContent = str;
        });
        return this;
    };
    ENode.prototype.attr = function (attributes) {
        if (typeof attributes === 'string') {
            var prop = attributes;
            return this.el
                .map(function (e) {
                    return e.getAttribute(prop);
                })
                .join(' ');
        } else {
            this.el.forEach(function (e) {
                var keys = Object.keys(attributes);
                keys.forEach(function (key) {
                    e.setAttribute(key, attributes[key]);
                });
            });
            return this;
        }
    };

    // constructs
    ENode.prototype.each = function (fnc) {
        this.el.forEach(function (e) {
            var node = new ENode(e);
            fnc.apply(null, [node]);
        });
        return this;
    };

    ENode.prototype.watch = function (options) {
        var defaultConfig = {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
        };
        var config = Object.assign({}, defaultConfig, options || {});
        var cb;
        var observer = new MutationObserver(function (mutations) {
            if (cb) cb(mutations);
        });
        this.el.forEach(function (e) {
            observer.observe(e, config);
        });
        return {
            then: function (fnc) {
                cb = fnc;
            },
        };
    };

    //getting first and last elements
    ENode.prototype.firstDom = function () {
        return this.el[0];
    };
    ENode.prototype.lastDom = function () {
        return this.el.slice(-1)[0];
    };
    ENode.prototype.first = function () {
        return new ENode(this.firstDom());
    };
    ENode.prototype.last = function () {
        return new ENode(this.lastDom());
    };

    var $ = (select) => {
        return new ENode(select);
    };

    function debounce(func, timeout = 17) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func.apply(this, args);
            }, timeout);
        };
    }

    function initializeInstrument(sandbox) {
        const debug = sandbox.debug;
        const warn = sandbox.warn;
        const instrument = {};
        instrument._isProcessing = false;
        instrument._processCount = 0;
        instrument.definitions = {};
        instrument.items = {};
        instrument._onInstrument = [];
        instrument._didItemChange = false;

        function processItems(items, definitions) {
            for (const key in definitions) {
                processItem(key, items, definitions);
            }
        }

        function processItem(key, items, definitions) {
            // TODO: Refactor this block when restructure ENode
            if (items[key] === undefined)
                items[key] = { enode: $(), state: 'inactive' };
            const item = items[key];
            const enode = item.enode;
            // const className = item.asClass || 'evolv-' + key;
            const isOnPage = enode.isConnected();
            const hasClass = enode.hasClass('evolv-' + key);

            debug('process instrument:', `'${key}'`, [enode], isOnPage, hasClass);

            const definition = definitions[key];

            if (isOnPage && hasClass) {
                processItems(definition.children);
                return;
            }

            item.enode = definition['select']();

            const oldState = item.state;
            const newState = item.enode.doesExist() ? 'active' : 'inactive';
            item.state = newState;

            if (oldState === 'inactive' && newState === 'active') {
                item.enode.addClass('evolv-' + key);
                if (definition.onConnect)
                    definition.onConnect.forEach((func) => func());
                instrument._didItemChange = true;
                debug('process instrument: connect', `'${key}'`, item);
            } else if (oldState === 'active' && newState === 'inactive') {
                if (definition.onDisconnect)
                    definition.onDisconnect.forEach((func) => func());
                instrument._didItemChange = true;
                debug('process instrument: disconnect', `'${key}'`, item);
            }
        }

        instrument.process = debounce(() => {
            if (instrument._isProcessing) return;
            if (sandbox._evolvContext.state === 'inactive') return;

            instrument._isProcessing = true;
            instrument._processCount++;
            instrument._didItemChange = false;
            let then = performance.now();

            processItems(instrument.items, instrument.definitions);

            debug(
                'process instrument: complete',
                (performance.now() - then).toFixed(2),
                instrument._processCount
            );

            instrument._isProcessing = false;

            // Covers scenario where mutations are missed during long process
            if (instrument._didItemChange) instrument.process();
        });

        instrument.add = (key, select, options) => {
            function addItem(key, select, options) {
                debug('add instrument:', key, select, options);
                if (
                    typeof key !== 'string' &&
                    (typeof select !== 'function' || typeof select !== 'string')
                ) {
                    warn(
                        `add instrument: requires item key string and selector string or select function`
                    );
                    return;
                }

                const newDefinition = {};
                if (typeof select === 'string') {
                    newDefinition.select = () => $(select);
                } else {
                    newDefinition.select = select;
                }

                if (options) {
                    if (options.onConnect)
                        newDefinition.onConnect = [options.onConnect];
                    if (options.onDisconnect)
                        newDefinition.onDisconnect = [options.onDisconnect];
                    // if (options.asClass) newDefinition.asClass = options.asClass;
                }

                let parent = {};
                if (options && options.parent) {
                    parent = instrument.findDefinition(options.parent);

                    if (!parent)
                        warn(
                            `add instrument: parent '${options.parent}' not found`
                        );
                } else {
                    instrument.definitions[key] = newDefinition;
                }

                parent.children = parent.children || {};
                parent.children[key] = newDefinition;
            }

            if (Array.isArray(key)) {
                key.forEach((item) => {
                    addItem(...item);
                });
            } else {
                addItem(key, select, options);
            }

            instrument.process();
        };

        instrument.findDefinition = (searchKey) => {
            let result = null;

            function searchBlock(searchKey, block) {
                if (block[searchKey]) {
                    result = block[searchKey];
                    return;
                }

                for (const key in block) {
                    if (block[key].children) {
                        searchBlock(searchKey, block[key].children);
                    }
                }
            }

            searchBlock(searchKey, instrument.definitions);

            return result;
        };

        sandbox.store.instrumentDOM = (data) => {
            for (const key in data) {
                const dataItem = data[key];
                const select = Object.getOwnPropertyDescriptor(dataItem, 'dom').get;
                // const asClass = dataItem.asClass;
                // const options = {};
                // if (asClass) options.asClass = asClass;

                instrument.add(key, select);
            }
        };

        sandbox.instrument = instrument;
    }

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
            var node = $('body');
            var tracking = node.attr(trackKey);
            tracking = tracking ? tracking + ' ' + txt : txt;
            node.attr({ [trackKey]: tracking });
            return this;
        };
    }

    function initializeWhenContext(sandbox) {
        return (state) => {
            sandbox.debug(
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
            sandbox.debug('whenInstrument: add function to instrument queue');

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
            sandbox.debug('whenDOM:', select);
            const $$ = sandbox.$$;
            if (sandbox._whenDOMCount === undefined) sandbox._whenDOMCount = 0;
            let selectFunc;

            if (typeof select === 'string') selectFunc = () => $(select);
            else if (typeof select === 'object' && select.constructor === ENode)
                selectFunc = () => select;
            else if (typeof select === 'function') selectFunc = select;
            else {
                sandbox.warn(
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
        const $$ = sandbox.$$;

        return (key) => {
            sandbox.debug('whenItem:', key);

            const definition = sandbox.instrument.findDefinition(key);

            if (definition === null) {
                sandbox.warn(`whenItem: instrument item '${key}' not defined`);
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

    function initializeWhenElement(sandbox) {
        return (select) => {
            return {
                then: function (func) {
                    sandbox.whenDOM(select).then((el) => func(el.firstDom()));
                },
            };
        };
    }

    function initializeSandbox(name) {
        const sandbox = {};
        sandbox.name = name;

        initializeLogs(sandbox);
        sandbox.debug;
        const warn = sandbox.warn;
        if (name !== 'catalyst') sandbox.debug(`init context: ${name}`);

        sandbox.$ = $;
        sandbox.$$ = (name) => {
            const item = sandbox.instrument.items[name];

            if (!item) {
                warn(`$$: Item ${name} not found in instrument item list`);
                return $();
            } else if (item.state === 'inactive') {
                // warn(`$$: Item ${name} is not currently on the page.`);
                return $();
            }

            return item.enode;
        };

        sandbox.$$;

        sandbox.store = {};
        sandbox.app = {};

        initializeInstrument(sandbox);
        initializeEvolvContext(sandbox);

        sandbox.whenContext = initializeWhenContext(sandbox);
        sandbox.whenInstrument = initializeWhenInstrument(sandbox);
        sandbox.whenDOM = initializeWhenDOM(sandbox);
        sandbox.whenItem = initializeWhenItem(sandbox);
        sandbox.whenElement = initializeWhenElement(sandbox);

        // Backwards compatibility
        sandbox.reactivate = sandbox.instrument.process;

        return sandbox;
    }

    var version = "0.1.10";

    function initializeCatalyst() {
        var catalyst = initializeSandbox('catalyst');
        catalyst.version = version;
        catalyst.sandboxes = [];
        const debug = catalyst.debug;

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

    function processConfig(config) {
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

    processConfig();

})();
