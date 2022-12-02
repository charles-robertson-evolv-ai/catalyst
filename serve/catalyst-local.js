(function () {
    'use strict';

    var version = "0.1.22";

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

    ENode.prototype.isConnected = function () {
        return this.doesExist() && this.el.findIndex((e) => !e.isConnected) === -1;
    };

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
        instrument.definitions = {};
        instrument.queue = {};
        instrument._isProcessing = false;
        instrument._processCount = 0;
        instrument._onMutate = [];
        instrument._didItemChange = false;

        function processQueueItem(key, items, definitions) {
            const definition = definitions[key];

            if (items[key] === undefined) {
                let className;
                if (definition.hasOwnProperty('asClass')) {
                    let asClass = definition.asClass;
                    className = asClass ? 'evolv-' + asClass : null;
                } else className = 'evolv-' + key;

                items[key] = {
                    enode: $(),
                    // state: 'inactive',
                    className: className,
                };
            }

            const item = items[key];
            const enode = item.enode;
            const newEnode = definition['select']();
            const className = item.className;
            const wasConnected = enode.isConnected();
            const isConnected = newEnode.isConnected();
            const hasClass =
                newEnode.hasClass(className) ||
                (newEnode.doesExist() && className === null);
            // const newState = isConnected && hasClass ? 'active' : 'inactive';

            debug('process instrument:', `'${key}'`, {
                wasConnected,
                isConnected,
                hasClass,
            });

            if (
                (!wasConnected && isConnected) ||
                (isConnected && !hasClass) ||
                (isConnected && className === null && !enode.isEqualTo(newEnode))
            ) {
                item.enode = newEnode;
                if (className) item.enode.addClass(className);
                debug('process instrument: connect', `'${key}'`, item);
                if (definition.onConnect)
                    definition.onConnect.forEach((func) => func());
                instrument._didItemChange = true;
            } else if (wasConnected && !isConnected) {
                item.enode = newEnode;
                debug('process instrument: disconnect', `'${key}'`, item);
                if (definition.onDisconnect)
                    definition.onDisconnect.forEach((func) => func());
                instrument._didItemChange = true;
            } else if (wasConnected && isConnected && hasClass) {
                processQueueLoop(definition.children);
            }
        }

        function processQueueLoop(items, definitions) {
            for (const key in definitions) {
                processQueueItem(key, items, definitions);
            }
        }

        instrument.processQueue = (items, definitions) => {
            if (instrument._isProcessing) return;
            // if (sandbox._evolvContext.state === 'inactive') return;

            instrument._isProcessing = true;
            instrument._processCount++;
            instrument._didItemChange = false;
            let then = performance.now();

            processQueueLoop(items, definitions);

            debug(
                'process instrument: complete',
                (performance.now() - then).toFixed(2),
                instrument._processCount
            );

            instrument._isProcessing = false;

            // Covers scenario where mutations are missed during long process
            if (instrument._didItemChange) {
                debug('process instrument: item changed, reprocessing');
                instrument.debouncedProcessQueue();
            }

            instrument._onMutate.forEach((callback) => callback());
        };

        instrument.debouncedProcessQueue = debounce(() => {
            instrument.processQueue(instrument.queue, instrument.definitions);
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
                    if (options.hasOwnProperty('asClass'))
                        newDefinition.asClass = options.asClass;
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

            instrument.processQueue(instrument.queue, instrument.definitions);
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
            const argumentArray = [];

            for (const key in data) {
                const dataItem = data[key];
                const select = Object.getOwnPropertyDescriptor(dataItem, 'dom').get;
                const options = {};
                if (dataItem.hasOwnProperty('asClass'))
                    options.asClass = dataItem.asClass;

                argumentArray.push([key, select, options]);
            }

            instrument.add(argumentArray);
        };

        sandbox.instrument = instrument;
    }

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

    // Accepts select string or a select function like instrument does
    // TODO: Combine instrument items with identical select functions and
    // disallow duplicate onConnect functions.
    function initializeWhenDOM(sandbox) {
        const counts = {};
        const history = [];
        const debug = sandbox.debug;
        const warn = sandbox.warn;

        return (select, options) => {
            const logName =
                options && options.logName ? options.logName : 'whenDOM';
            const keyPrefix =
                options && options.keyPrefix ? options.keyPrefix : 'when-dom-';
            let selectFunc, count, key, foundPrevious;
            const previous = history.find((item) => item.select === select);

            if (previous && keyPrefix === previous.keyPrefix) {
                debug(`${logName}: ${select} found, adding on-connect callback`);
                selectFunc = previous.selectFunc;
                key = previous.key;
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
                        `${logName}: unrecognized input ${select}, requires string or enode`
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
                    sandbox.instrument.add(key, selectFunc, { asClass: null });
                sandbox.whenItem(key, { logName: logName }).then(callback);
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
        const $$ = sandbox.$$;
        const debug = sandbox.debug;
        const warn = sandbox.warn;

        return (key, options) => {
            const definition = sandbox.instrument.findDefinition(key);
            const logName =
                options && options.logName ? options.logName : 'whenItem';

            if (definition === null) {
                warn(`${logName}: instrument item '${key}' not defined`);
                return {
                    then: () => null,
                };
            }

            const thenFunc = (callback) => {
                debug(`${logName}: '${key}' add on-connect callback`, {
                    callback,
                });

                const newEntry = () => {
                    debug(`${logName}: '${key}'`, 'fire on connect:', callback);
                    callback($$(key));
                };

                newEntry.callbackString = callback.toString();

                if (!definition.onConnect) {
                    definition.onConnect = [];
                } else if (
                    definition.onConnect.findIndex(
                        (entry) => entry.callbackString === newEntry.callbackString
                    ) !== -1
                ) {
                    debug(
                        `${logName}: duplicate callback not assigned to item '${key}':`,
                        callback
                    );
                    return;
                }

                definition.onConnect.push(newEntry);
                if (
                    sandbox.instrument.queue[key] &&
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
                        .whenDOM(select, { keyPrefix: 'when-element-' })
                        .then((enode) => callback(enode.el[0]));
                },
            };
        };
    }

    // Add deduping
    function initializeWaitUntil(sandbox) {
        sandbox._intervalPoll = {
            queue: [],
        };

        return (condition, timeout) => {
            sandbox.debug(
                'waitUntil: add callback to interval poll queue, condition:',
                condition
            );
            return {
                then: (callback) => {
                    const entry = {
                        condition: condition,
                        callback: () => callback(condition()),
                        timeout: timeout || null,
                        startTime: performance.now(),
                    };
                    sandbox._intervalPoll.queue.push(entry);
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
        const warn = sandbox.warn;
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
        sandbox.$$ = (name) => {
            const item = sandbox.instrument.queue[name];

            if (!item) {
                if (!sandbox.instrument.findDefinition(name)) {
                    warn(`$$: '${name}' not found in instrument definitions list`);
                }
                return $();
            } else if (!item.enode.isConnected()) {
                return $();
            }

            return item.enode;
        };
        sandbox.select = select;
        sandbox.selectAll = selectAll;
        sandbox.store = {};
        sandbox.app = {};

        if (sandbox.name !== 'catalyst') {
            initializeInstrument(sandbox);
            sandbox._evolvContext = initializeEvolvContext(sandbox);
            sandbox.whenContext = initializeWhenContext(sandbox);
            sandbox.whenMutate = initializeWhenMutate(sandbox);
            sandbox.whenDOM = initializeWhenDOM(sandbox);
            sandbox.whenItem = initializeWhenItem(sandbox);
            sandbox.whenElement = initializeWhenElement(sandbox);
            sandbox.waitUntil = initializeWaitUntil(sandbox);
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
                            } else {
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

        // catalyst.initVariant = (context, variant) => {
        //     const sandbox = window.evolv.catalyst[context];
        //     sandbox.whenContext('active').then(() => {
        //         debug('variant active:', variant);
        //         document.body.classList.add(`evolv-${variant}`);
        //     });

        //     sandbox.whenContext('inactive').then(() => {
        //         debug('variant inactive:', variant);
        //         document.body.classList.remove(`evolv-${variant}`);
        //     });

        //     return sandbox;
        // };

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
