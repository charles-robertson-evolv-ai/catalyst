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

export { $, ENode, select, selectAll };
