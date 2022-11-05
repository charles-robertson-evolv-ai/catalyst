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

export { ENode };
