(function () {
    'use strict';

    var version = "0.1.24";

    function initializeLogs(sandbox) {
        // Uses console.info() because VBG blocks console.log();

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
        const localStorageItem = localStorage.getItem('evolv:catalyst-logs');
        const localStorageMatch = localStorageItem.match(/silent|normal|debug/i);
        const localStorageLogs = localStorageMatch ? localStorageMatch[0] : null;

        sandbox.logs = sandbox.logs || 'normal';
        if (environmentLogs) sandbox.logs = environmentLogs;
        if (localStorageLogs) sandbox.logs = localStorageLogs;

        sandbox.logColor = localStorageItem
            ? localStorageItem.includes('color')
            : null;

        const logPrefix = `[evolv-${sandbox.name}]`;
        const logPrefixColor = [
            `%c${logPrefix}`,
            'background-color: rgba(255, 122, 65, .5); border: 1px solid rgba(255, 122, 65, 1); border-radius: 2px',
        ];
        const debugPrefixColor = [
            `%c${logPrefix}`,
            'background-color: rgba(255, 122, 65, .25); border: 1px solid rgba(255, 122, 65, .5); border-radius: 2px',
        ];

        sandbox.log = (...args) => {
            const logs = sandbox.logs;
            if (logs === 'normal' || logs === 'debug') {
                if (sandbox.logColor) console.info(...logPrefixColor, ...args);
                else console.info(logPrefix, ...args);
            }
        };
        sandbox.warn = (...args) => {
            const logs = sandbox.logs;
            if (logs === 'normal' || logs === 'debug') {
                if (sandbox.logColor) console.warn(...logPrefixColor, ...args);
                else console.info(logPrefix, ...args);
            }
        };
        sandbox.debug = (...args) => {
            if (sandbox.logs === 'debug') {
                if (sandbox.logColor) console.info(...debugPrefixColor, ...args);
                else console.info(logPrefix, ...args);
            }
        };
    }

    function toSingleNodeValue(select, context) {
        context = context || document;
        if (!select) {
            return [];
        } else if (typeof select === 'string') {
            if (select[0] === '<') {
                var template = document.createElement('template');
                template.innerHTML = select.trim();
                return [template.content.firstChild];
            } else if (select[0] === '/') {
                var firstNode = document.evaluate(
                    select,
                    context,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                return [firstNode];
            } else return [context.querySelector(select)];
        } else if (select instanceof Element) return [select];
        else if (select.constructor === ENode) return select.el.slice(0, 1);
        else if (Array.isArray(select)) return select.slice(0, 1);
        else return [];
    }

    function toMultiNodeValue(select, context) {
        context = context || document;
        if (!select) {
            return [];
        } else if (typeof select === 'string') {
            if (select[0] === '<') {
                var template = context.createElement('template');
                template.innerHTML = select.trim();
                return Array.from(template.content.childNodes);
            } else if (select[0] === '/') {
                var snapshot = document.evaluate(
                    select,
                    context,
                    null,
                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                    null
                );
                var length = snapshot.snapshotLength;
                var el = new Array(length);
                for (var i = 0; i < length; i++) {
                    el[i] = snapshot.snapshotItem(i);
                }
                return el;
            } else {
                return Array.from(context.querySelectorAll(select));
            }
        } else if (select instanceof Element) return [select];
        else if (select.constructor === ENode) return select.el;
        else if (Array.isArray(select)) return select;
        else return [];
    }

    const ENode = function (select, context, toNodeValueFunc) {
        context = context || document;
        toNodeValueFunc = toNodeValueFunc || toMultiNodeValue;
        var el = toNodeValueFunc(select, context);
        this.el = Array.prototype.slice.call(el);
        this.length = this.el.length;
    };

    // Checks
    ENode.prototype.doesExist = function () {
        return this.length > 0 && this.el[0] !== null;
    };

    // Tests if all enodes are connected
    ENode.prototype.isConnected = function () {
        return this.doesExist() && this.el.findIndex((e) => !e.isConnected) === -1;
    };

    // Tests if all enodes have the indicated class
    ENode.prototype.hasClass = function (className) {
        return (
            this.doesExist() &&
            this.el.findIndex((e) => !e.classList.contains(className)) === -1
        );
    };

    ENode.prototype.isEqualTo = function (enode) {
        if (enode.constructor !== ENode) {
            return false;
        } else if (this.length !== enode.length) {
            return false;
        } else {
            for (let i = 0; i < this.length; i++) {
                if (this.el[i] !== enode.el[i]) return false;
            }
        }
        return true;
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
                    return Array.prototype.slice.call(toMultiNodeValue(sel, e));
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
            return (
                parents.indexOf(item) == pos &&
                item !== null &&
                item.nodeName !== '#document-fragment'
            );
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
            this.el
                .map(function (e) {
                    return e.nextElementSibling;
                })
                .filter((e) => e)
        );
    };
    ENode.prototype.prev = function () {
        return new ENode(
            this.el
                .map(function (e) {
                    return e.previousElementSibling || [];
                })
                .filter((e) => e)
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

        var items = toMultiNodeValue(item);
        items.forEach(function (e) {
            node.append(e);
        });

        return this;
    };

    ENode.prototype.prepend = function (item) {
        var node = this.el[0];
        if (!node) return;

        var items = toMultiNodeValue(item);
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
        if (!node) return this;
        if (typeof item === 'string') item = document.querySelectorAll(item);
        else if (item.constructor === ENode) item = item.el[0];
        if (!item) return this;
        item.insertAdjacentElement('beforebegin', node);
        return this;
    };
    ENode.prototype.insertAfter = function (item) {
        var node = this.el[0];
        if (!node) return this;
        if (typeof item === 'string') item = document.querySelectorAll(item);
        else if (item.constructor === ENode) item = item.el[0];
        if (!item) return this;
        item.insertAdjacentElement('afterend', node);
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
    ENode.prototype.firstDOM = function () {
        return this.el[0];
    };
    // Deprecated
    ENode.prototype.firstDom = function () {
        return this.el[0];
    };
    ENode.prototype.lastDOM = function () {
        return this.el.slice(-1)[0];
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

    var $ = (select, context) => {
        return new ENode(select, context);
    };

    var select = (select, context) => {
        return new ENode(select, context, toSingleNodeValue);
    };

    var selectAll = (select, context) => {
        return new ENode(select, context, toMultiNodeValue);
    };

    function initializeInstrument(sandbox) {
        const debug = sandbox.debug;
        const warn = sandbox.warn;
        let isProcessing = false;
        let processCount = 0;
        let didItemChange = false;

        const instrument = {};
        instrument.queue = {};
        instrument._onMutate = [];

        function debounce(func, timeout = 17) {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    func.apply(this, args);
                }, timeout);
            };
        }
        function processQueueItem(key) {
            const item = instrument.queue[key];
            const enode = item.enode;
            const className = item.className;
            const type = item.type;

            let wasConnected, isConnected, hasClass, newEnode;

            if (type === 'single') {
                newEnode = enode.isConnected() ? enode : item.select();
            } else {
                newEnode = item.select();
            }

            wasConnected = item.state === 'connected';
            isConnected = newEnode.isConnected();
            hasClass =
                newEnode.hasClass(className) ||
                (newEnode.doesExist() && className === null);

            // debug('process instrument:', `'${key}'`, {
            //     wasConnected,
            //     isConnected,
            //     hasClass,
            // });

            if (
                (!wasConnected && isConnected) ||
                (isConnected && !hasClass) ||
                (type !== 'single' &&
                    isConnected &&
                    className === null &&
                    !enode.isEqualTo(newEnode))
            ) {
                item.enode = newEnode;
                if (className) item.enode.addClass(className);
                item.state = 'connected';
                debug('process instrument: connect', `'${key}'`, item);
                item.onConnect.forEach((callback) => callback());
                didItemChange = true;
            } else if (wasConnected && !isConnected) {
                item.enode = newEnode;
                item.state = 'disconnected';
                debug('process instrument: disconnect', `'${key}'`, item);
                item.onDisconnect.forEach((callback) => callback());
                didItemChange = true;
            }
        }

        instrument.processQueue = () => {
            if (isProcessing) return;

            isProcessing = true;
            processCount++;
            didItemChange = false;
            let then = performance.now();

            for (const key in instrument.queue) {
                processQueueItem(key);
            }

            debug(
                'process instrument: complete',
                `${(performance.now() - then).toFixed(2)}ms`,
                processCount
            );

            isProcessing = false;

            // Covers scenario where mutations are missed during long process
            if (didItemChange) {
                debug('process instrument: item changed, reprocessing');
                instrument.debouncedProcessQueue();
            }

            instrument._onMutate.forEach((callback) => callback());
        };

        instrument.debouncedProcessQueue = debounce(() => {
            instrument.processQueue();
        });

        function addItem(key, select, options) {
            if (typeof key !== 'string' && typeof select !== 'function') {
                warn(
                    `add instrument: requires item key string and select function, input invalid:`,
                    { key, select, options }
                );
                return;
            } else if (instrument.queue.hasOwnProperty(key)) {
                debug(`add instrument: queue item '${key}' already exists`);
                return;
            }

            debug('add instrument:', key, select, options);

            const item = {
                select: select,
                onConnect: options && options.onConnect ? options.onConnect : [],
                onDisconnect:
                    options && options.onDisconnect ? options.onDisconnect : [],
                type: options && options.type === 'single' ? 'single' : 'multi',
                enode: $(),
                state: 'disconnected',
            };

            if (options && options.hasOwnProperty('asClass'))
                item.className = options.asClass
                    ? 'evolv-' + options.asClass
                    : null;
            else item.className = 'evolv-' + key;

            instrument.queue[key] = item;
        }

        instrument.add = (key, select, options) => {
            if (Array.isArray(key)) {
                key.forEach((item) => {
                    addItem(...item);
                });
            } else {
                addItem(key, select, options);
            }

            instrument.processQueue();
        };

        instrument.remove = (key) => {
            debug('remove instrument:', key);
            const queue = instrument.queue;
            const item = queue[key];
            item.enode.removeClass(item.className);
            delete queue[key];
        };

        instrument.deinstrument = () => {
            debug('deinstrument: removing classes and clearing instrument queue');
            for (const key in instrument.queue) {
                instrument.remove(key);
            }
        };

        return instrument;
    }

    function initialize$$(sandbox) {
        return (key) => {
            const item = sandbox.instrument.queue[key];

            if (!item) {
                warn(`$$: '${key}' not found in instrument queue`);
                return $();
            } else if (!item.enode.isConnected()) {
                return $();
            }

            return item.enode;
        };
    }

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
                        window.evolv.client
                            .getActiveKeys(`web.${value}`)
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

    function initializeStore(sandbox) {
        return {
            instrumentDOM: (data) => {
                const argumentArray = [];

                for (const key in data) {
                    const dataItem = data[key];
                    const select = Object.getOwnPropertyDescriptor(
                        dataItem,
                        'dom'
                    ).get;
                    const options = {};
                    if (dataItem.hasOwnProperty('asClass'))
                        options.asClass = dataItem.asClass;

                    argumentArray.push([key, select, options]);
                }

                sandbox.instrument.add(argumentArray);
            },
        };
    }

    function initializeWhenContext(sandbox) {
        const debug = sandbox.debug;

        return (state) => {
            let queueName;

            if (
                !(state === 'active' || state === undefined || state === 'inactive')
            ) {
                return {
                    then: () => {
                        warn(
                            `whenContext: unknown state, requires 'active' or 'inactive', default is 'active'`
                        );
                    },
                };
            } else if (state === 'active' || undefined) {
                queueName = 'onActivate';
            } else {
                queueName = 'onDeactivate';
            }

            return {
                then: (callback) => {
                    const newEntry = () => {
                        debug(
                            `whenContext: fire on ${
                            state === 'inactive' ? 'deactivate' : 'activate'
                        }`,
                            callback
                        );
                        callback();
                    };

                    newEntry.callbackString = callback.toString();

                    // Dedupe callbacks
                    if (
                        sandbox._evolvContext[queueName].findIndex(
                            (entry) =>
                                entry.callbackString === newEntry.callbackString
                        ) !== -1
                    ) {
                        debug(
                            `whenContext: duplicate callback not assigned to '${state}' state`,
                            callback
                        );
                        return;
                    }

                    debug(
                        `whenContext: queue callback for '${state}' state, current state: '${sandbox._evolvContext.state.current}'`,
                        callback
                    );
                    sandbox._evolvContext[queueName].push(newEntry);
                    if (
                        state === 'active' &&
                        sandbox._evolvContext.state.current === 'active'
                    ) {
                        newEntry();
                    } else if (
                        state === 'inactive' &&
                        sandbox._evolvContext.state.current === 'inactive'
                    ) {
                        newEntry();
                    }
                },
            };
        };
    }

    function initializeWhenMutate(sandbox) {
        const debug = sandbox.debug;

        return () => {
            return {
                then: (callback) => {
                    const newEntry = () => {
                        debug(`whenMutate: fire on mutate`, callback);
                        callback();
                    };

                    newEntry.callbackString = callback.toString();

                    // Dedupe callbacks
                    if (
                        sandbox.instrument._onMutate.findIndex(
                            (entry) =>
                                entry.callbackString === newEntry.callbackString
                        ) !== -1
                    ) {
                        debug(
                            `whenMutate: duplicate callback not assigned to on-mutate queue`,
                            callback
                        );
                        return;
                    }

                    debug('whenMutate: add callback to on-mutate queue', callback);
                    sandbox.instrument._onMutate.push(newEntry);
                },
            };
        };
    }

    function initializeWhenDOM(sandbox) {
        const counts = {};
        const history = [];
        const debug = sandbox.debug;
        const warn = sandbox.warn;

        return (select, options) => {
            const logPrefix =
                options && options.logPrefix ? options.logPrefix : 'whenDOM';
            const keyPrefix =
                options && options.keyPrefix ? options.keyPrefix : 'when-dom-';
            const type = options && options.type ? options.type : 'multi';
            let selectFunc, count, key, foundPrevious;
            const previous = history.find((item) => item.select === select);
            const whenItemOptions = { logPrefix };
            if (options && options.callbackString)
                whenItemOptions.callbackString = options.callbackString;

            if (previous && keyPrefix === previous.keyPrefix) {
                selectFunc = previous.selectFunc;
                key = previous.key;
                debug(`${logPrefix}: '${select}' found in item '${key}'`);
                foundPrevious = true;
            } else {
                // Increment keys with different prefixes separately;
                if (!counts[keyPrefix]) counts[keyPrefix] = 1;

                // Accept string or enode
                if (typeof select === 'string') selectFunc = () => $(select);
                else if (typeof select === 'object' && select.constructor === ENode)
                    selectFunc = () => select;
                else {
                    warn(
                        `${logPrefix}: unrecognized input ${select}, requires string or enode`
                    );
                    return {
                        then: () => null,
                    };
                }

                count = counts[keyPrefix]++;
                key = keyPrefix + count;

                history.push({
                    select: select,
                    selectFunc: selectFunc,
                    keyPrefix: keyPrefix,
                    key: key,
                });
            }

            const thenFunc = (callback) => {
                if (!foundPrevious)
                    sandbox.instrument.add(key, selectFunc, {
                        asClass: null,
                        type: type,
                    });
                sandbox.whenItem(key, whenItemOptions).then(callback);
            };

            return {
                then: thenFunc,
                // Deprecated
                thenInBulk: thenFunc,
                // Deprecated
                reactivateOnChange: () => {},
            };
        };
    }

    function initializeWhenItem(sandbox) {
        sandbox.$$;
        const debug = sandbox.debug;
        const warn = sandbox.warn;

        return (key, options) => {
            const item = sandbox.instrument.queue[key];
            const logPrefix =
                options && options.logPrefix ? options.logPrefix : 'whenItem';
            let queueName, action;
            if (options && options.disconnect) {
                queueName = 'onDisconnect';
                action = 'disconnect';
            } else {
                queueName = 'onConnect';
                action = 'connect';
            }

            if (!item) {
                warn(`${logPrefix}: instrument item '${key}' not defined`);
                return {
                    then: () => null,
                };
            }

            const thenFunc = (callback) => {
                const index = item[queueName].length + 1;

                debug(`${logPrefix}: '${key}' add on-${action} callback`, {
                    callback,
                });

                const newEntry = () => {
                    debug(`${logPrefix}: '${key}'`, `fire on ${action}:`, callback);
                    callback(item.enode.markOnce(`evolv-${key}-${index}`));
                };

                newEntry.callbackString =
                    options && options.callbackString
                        ? options.callbackString
                        : callback.toString();

                if (
                    item[queueName].findIndex(
                        (entry) => entry.callbackString === newEntry.callbackString
                    ) !== -1
                ) {
                    debug(
                        `${logPrefix}: duplicate on-${action} callback not assigned to item '${key}':`,
                        callback
                    );
                    return;
                }

                item[queueName].push(newEntry);

                if (
                    queueName === 'onConnect' &&
                    sandbox.instrument.queue[key].enode.isConnected()
                )
                    newEntry();
            };

            return {
                then: thenFunc,
                // Deprecated
                thenInBulk: thenFunc,
                // Deprecated
                reactivateOnChange: function () {},
            };
        };
    }

    function initializeWhenElement(sandbox) {
        return (select) => {
            return {
                then: (callback) => {
                    sandbox
                        .whenDOM(select, {
                            keyPrefix: 'when-element-',
                            logPrefix: 'whenElement',
                            type: 'single',
                            callbackString: callback.toString,
                        })
                        .then((enodes) => callback(enodes.el[0]));
                },
            };
        };
    }

    function initializeWhenElements(sandbox) {
        return (select) => {
            return {
                then: (callback) => {
                    sandbox
                        .whenDOM(select, {
                            keyPrefix: 'when-elements-',
                            logPrefix: 'whenElements',
                            callbackString: callback.toString,
                        })
                        .then((enodes) =>
                            enodes.each((enode) => callback(enode.el[0]))
                        );
                },
            };
        };
    }

    function initializeWaitUntil(sandbox) {
        sandbox._intervalPoll = {
            queue: [],
        };
        const debug = sandbox.debug;
        const warn = sandbox.warn;

        return (condition, timeout) => {
            if (typeof condition !== 'function') {
                warn(
                    'waitUntil: requires callback function that evaluates to true or false, input invalid',
                    condition
                );
            }
            debug('waitUntil: add callback to interval poll queue', {
                condition,
                timeout,
            });
            return {
                then: (callback) => {
                    const queue = sandbox._intervalPoll.queue;

                    const newEntry = {
                        condition: condition,
                        callback: () => callback(condition()),
                        timeout: timeout || null,
                        startTime: performance.now(),
                        callbackString: callback.toString(),
                    };

                    if (
                        queue.some(
                            (entry) =>
                                entry.callbackString === newEntry.callbackString
                        )
                    ) {
                        debug(
                            `waitUntil: duplicate callback not added to interval poll queue`,
                            callback
                        );
                        return;
                    }
                    queue.push(newEntry);
                    window.evolv.catalyst._intervalPoll.startPolling();
                },
            };
        };
    }

    function initializeSandbox(name) {
        const sandbox = {};
        sandbox.name = name;

        initializeLogs(sandbox);
        const log = sandbox.log;
        const debug = sandbox.debug;

        if (name === 'catalyst') {
            log(`init catalyst version ${version}`);
            log(`log level: ${sandbox.logs}`);
            sandbox.version = version;
        } else {
            debug(`init context sandbox: ${name}`);
            if (window.evolv.catalyst._globalObserver.state === 'inactive')
                window.evolv.catalyst._globalObserver.connect();
        }

        sandbox.$ = $;
        sandbox.select = select;
        sandbox.selectAll = selectAll;

        if (sandbox.name !== 'catalyst') {
            sandbox.$$ = initialize$$(sandbox);
            sandbox.store = initializeStore(sandbox);
            sandbox.app = {};
            sandbox.instrument = initializeInstrument(sandbox);
            sandbox._evolvContext = initializeEvolvContext(sandbox);
            sandbox.whenContext = initializeWhenContext(sandbox);
            sandbox.whenMutate = initializeWhenMutate(sandbox);
            sandbox.whenDOM = initializeWhenDOM(sandbox);
            sandbox.whenItem = initializeWhenItem(sandbox);
            sandbox.whenElement = initializeWhenElement(sandbox);
            sandbox.whenElements = initializeWhenElements(sandbox);
            sandbox.waitUntil = initializeWaitUntil(sandbox);
            sandbox.track = initializeTrack(sandbox);
        }

        // Backwards compatibility
        sandbox.reactivate = () => {};

        return sandbox;
    }

    function initializeIntervalPoll(catalyst) {
        function processQueue(sandbox) {
            const queue = sandbox._intervalPoll.queue;

            for (let i = 0; i < queue.length; i++) {
                const entry = queue[i];
                let timeElapsed = performance.now() - entry.startTime;

                if (entry.timeout && entry.timeout < timeElapsed) {
                    sandbox.debug('waitUntil: condition timed out', entry);
                    queue.splice(i, 1);
                    continue;
                }

                try {
                    if (entry.condition()) {
                        sandbox.debug(
                            'waitUntil: condition met:',
                            entry.condition,
                            entry.condition(),
                            `${(performance.now() - entry.startTime).toFixed(2)}ms`
                        );
                        entry.callback();
                        queue.splice(i, 1);
                    }
                } catch (error) {
                    // Prevents 60 error messages per second if the condition contains an error
                    sandbox.warn(
                        'waitUntil: error in condition, removing from queue',
                        error
                    );
                    queue.splice(i, 1);
                }
            }

            return queue.length;
        }

        function processQueues() {
            return new Promise((resolve) => {
                const processQueuesLoop = () => {
                    let anySandboxActive = false;
                    let queueTotal = 0;

                    for (const sandbox of catalyst.sandboxes) {
                        if (sandbox._evolvContext.state.current === 'inactive')
                            continue;
                        anySandboxActive = true;
                        queueTotal += processQueue(sandbox);
                    }

                    if (!anySandboxActive) {
                        catalyst.debug('interval poll: no active sandboxes');
                        return resolve(false);
                    } else if (queueTotal === 0) {
                        catalyst.debug('interval poll: all queues empty');
                        return resolve(false);
                    } else {
                        requestAnimationFrame(processQueuesLoop);
                    }
                };
                processQueuesLoop();
            });
        }

        return {
            isPolling: false,
            startPolling: async function () {
                const intervalPoll = catalyst._intervalPoll;
                if (intervalPoll.isPolling) return;
                catalyst.debug('interval poll: start polling');
                intervalPoll.isPolling = true;
                intervalPoll.isPolling = await processQueues();
                catalyst.debug('interval poll: stop polling');
            },
        };
    }

    function initializeCatalyst() {
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
                                (property === 'key' || property === 'isActive')
                            ) {
                                sandbox._evolvContext.initializeActiveKeyListener(
                                    value
                                );
                                hasInitializedActiveKeyListener = true;
                            } else if (
                                property === 'key' ||
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

    function processConfig(config) {
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

    processConfig();

})();
