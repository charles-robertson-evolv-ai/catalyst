function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var methodName = context.method, method = delegate.iterator[methodName]; if (undefined === method) return context.delegate = null, "throw" === methodName && delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel; var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var version = "0.1.21";
var environmentLogDefaults = {
  // VCG
  b02d16aa80: 'silent',
  // Prod
  add8459f1c: 'normal',
  // Staging
  '55e68a2ba9': 'normal',
  // Development
  eee20e49ae: 'normal',
  // Prototype
  b5d276c11b: 'normal',
  // verizon qa

  // VBG
  '13d2e2d4fb': 'silent',
  // Prod
  '4271e3bfc8': 'normal',
  // QA Testing
  '6bfb40849e': 'normal' // UAT
};

function initializeLogs(sandbox) {
  // Uses console.info() because VBG blocks console.log();

  var logPrefix = "[evolv-".concat(sandbox.name, "]");
  var participantsURL = document.querySelector('script[src^="https://participants.evolv.ai"]');
  var environmentMatch = participantsURL ? participantsURL.getAttribute('src').match(/(?<=https:\/\/participants\.evolv\.ai\/v1\/)[a-z0-9]*(?=\/)/) : null;
  var environmentId = environmentMatch ? environmentMatch[0] : null;
  var environmentLogs = environmentId ? environmentLogDefaults[environmentId] : null;
  var localStorageLogs = localStorage.getItem('evolv:catalyst-logs');
  sandbox.logs = sandbox.logs || 'normal';
  if (environmentLogs) sandbox.logs = environmentLogs;
  if (localStorageLogs) sandbox.logs = localStorageLogs;
  sandbox.log = function () {
    var _console;
    var logs = sandbox.logs;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    if (logs === 'normal' || logs === 'debug') (_console = console).info.apply(_console, [logPrefix].concat(args));
  };
  sandbox.warn = function () {
    var _console2;
    var logs = sandbox.logs;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    if (logs === 'normal' || logs === 'debug') (_console2 = console).warn.apply(_console2, [logPrefix].concat(args));
  };
  sandbox.debug = function () {
    var _console3;
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }
    if (sandbox.logs === 'debug') (_console3 = console).info.apply(_console3, ["".concat(logPrefix)].concat(args));
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
      var firstNode = document.evaluate(select, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      return [firstNode];
    } else return [context.querySelector(select)];
  } else if (select instanceof Element) return [select];else if (select.constructor === ENode) return select.el.slice(0, 1);else if (Array.isArray(select)) return select.slice(0, 1);else return [];
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
      var snapshot = document.evaluate(select, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      var length = snapshot.snapshotLength;
      var el = new Array(length);
      for (var i = 0; i < length; i++) {
        el[i] = snapshot.snapshotItem(i);
      }
      return el;
    } else {
      return Array.from(context.querySelectorAll(select));
    }
  } else if (select instanceof Element) return [select];else if (select.constructor === ENode) return select.el;else if (Array.isArray(select)) return select;else return [];
}
var ENode = function ENode(select, context, toNodeValueFunc) {
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
  return this.doesExist() && this.el.findIndex(function (e) {
    return !e.isConnected;
  }) === -1;
};
ENode.prototype.hasClass = function (className) {
  return this.doesExist() && this.el.findIndex(function (e) {
    return !e.classList.contains(className);
  }) === -1;
};
ENode.prototype.isEqualTo = function (enode) {
  if (enode.constructor !== ENode) {
    return false;
  } else if (this.length !== enode.length) {
    return false;
  } else {
    for (var i = 0; i < this.length; i++) {
      if (this.el[i] !== enode.el[i]) return false;
    }
  }
  return true;
};

// Filters
ENode.prototype.filter = function (sel) {
  var el = this.el;
  if (!sel) return this;
  return new ENode(el.filter(function (e) {
    return e.matches(sel);
  }));
};
ENode.prototype.contains = function (text) {
  var el = this.el;
  if (text instanceof RegExp) {
    return new ENode(el.filter(function (e) {
      return regex.test(e.textContent);
    }));
  } else {
    return new ENode(el.filter(function (e) {
      return e.textContent.includes(text);
    }));
  }
};

//navigation
ENode.prototype.find = function (sel) {
  var el = this.el;
  return new ENode(el.map(function (e) {
    return Array.prototype.slice.call(toMultiNodeValue(sel, e));
  }).flat(2));
};
ENode.prototype.closest = function (sel) {
  var el = this.el;
  return new ENode(el.map(function (e) {
    return e.closest(sel);
  }));
};
ENode.prototype.parent = function () {
  var el = this.el;
  var parents = el.map(function (e) {
    return e.parentNode;
  });
  parents = parents.filter(function (item, pos) {
    return parents.indexOf(item) == pos && item !== null && item.nodeName !== '#document-fragment';
  });
  return new ENode(parents);
};
ENode.prototype.children = function (sel) {
  var el = this.el;
  return new ENode(el.reduce(function (a, b) {
    return a.concat(Array.prototype.slice.call(b.children));
  }, [])).filter(sel);
};
ENode.prototype.next = function () {
  return new ENode(this.el.map(function (e) {
    return e.nextElementSibling;
  }).filter(function (e) {
    return e;
  }));
};
ENode.prototype.prev = function () {
  return new ENode(this.el.map(function (e) {
    return e.previousElementSibling || [];
  }).filter(function (e) {
    return e;
  }));
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
  if (typeof item === 'string') item = document.querySelectorAll(item);else if (item.constructor === ENode) item = item.el[0];
  if (!item) return this;
  item.insertAdjacentElement('beforebegin', node);
  return this;
};
ENode.prototype.insertAfter = function (item) {
  var node = this.el[0];
  if (!node) return this;
  if (typeof item === 'string') item = document.querySelectorAll(item);else if (item.constructor === ENode) item = item.el[0];
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
  if (!str) return this.el.map(function (e) {
    return e.innerHTML;
  }).join();
  this.el.forEach(function (e) {
    e.innerHTML = str;
  });
  return this;
};
ENode.prototype.text = function (str) {
  if (!str) return this.el.map(function (e) {
    return e.textContent;
  }).join(' ');
  this.el.forEach(function (e) {
    e.textContent = str;
  });
  return this;
};
ENode.prototype.attr = function (attributes) {
  if (typeof attributes === 'string') {
    var prop = attributes;
    return this.el.map(function (e) {
      return e.getAttribute(prop);
    }).join(' ');
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
    subtree: true
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
    then: function then(fnc) {
      cb = fnc;
    }
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
var $ = function $(select, context) {
  return new ENode(select, context);
};
var select = function select(_select, context) {
  return new ENode(_select, context, toSingleNodeValue);
};
var selectAll = function selectAll(select, context) {
  return new ENode(select, context, toMultiNodeValue);
};
function debounce(func) {
  var _this = this;
  var timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 17;
  var timer;
  return function () {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }
    clearTimeout(timer);
    timer = setTimeout(function () {
      func.apply(_this, args);
    }, timeout);
  };
}
function initializeInstrument(sandbox) {
  var debug = sandbox.debug;
  var warn = sandbox.warn;
  var instrument = {};
  instrument.definitions = {};
  instrument.queue = {};
  instrument._isProcessing = false;
  instrument._processCount = 0;
  instrument._onInstrument = [];
  instrument._didItemChange = false;
  function processQueueItem(key, items, definitions) {
    var definition = definitions[key];
    if (items[key] === undefined) {
      var _className;
      if (definition.hasOwnProperty('asClass')) {
        var asClass = definition.asClass;
        _className = asClass ? 'evolv-' + asClass : null;
      } else _className = 'evolv-' + key;
      items[key] = {
        enode: $(),
        // state: 'inactive',
        className: _className
      };
    }
    var item = items[key];
    var enode = item.enode;
    var newEnode = definition['select']();
    var className = item.className;
    var wasConnected = enode.isConnected();
    var isConnected = newEnode.isConnected();
    var hasClass = newEnode.hasClass(className) || newEnode.doesExist() && className === null;
    // const newState = isConnected && hasClass ? 'active' : 'inactive';

    debug('process instrument:', "'".concat(key, "'"), {
      wasConnected: wasConnected,
      isConnected: isConnected,
      hasClass: hasClass
    });
    if (!wasConnected && isConnected || isConnected && !hasClass || isConnected && className === null && !enode.isEqualTo(newEnode)) {
      item.enode = newEnode;
      if (className) item.enode.addClass(className);
      debug('process instrument: connect', "'".concat(key, "'"), item);
      if (definition.onConnect) definition.onConnect.forEach(function (func) {
        return func();
      });
      instrument._didItemChange = true;
    } else if (wasConnected && !isConnected) {
      item.enode = newEnode;
      debug('process instrument: disconnect', "'".concat(key, "'"), item);
      if (definition.onDisconnect) definition.onDisconnect.forEach(function (func) {
        return func();
      });
      instrument._didItemChange = true;
    } else if (wasConnected && isConnected && hasClass) {
      processQueueLoop(definition.children);
    }
  }
  function processQueueLoop(items, definitions) {
    for (var key in definitions) {
      processQueueItem(key, items, definitions);
    }
  }
  instrument.processQueue = function (items, definitions) {
    if (instrument._isProcessing) return;
    // if (sandbox._evolvContext.state === 'inactive') return;

    instrument._isProcessing = true;
    instrument._processCount++;
    instrument._didItemChange = false;
    var then = performance.now();
    processQueueLoop(items, definitions);
    debug('process instrument: complete', (performance.now() - then).toFixed(2), instrument._processCount);
    instrument._isProcessing = false;

    // Covers scenario where mutations are missed during long process
    if (instrument._didItemChange) {
      debug('process instrument: item changed, reprocessing');
      instrument.debouncedProcessQueue();
    }
  };
  instrument.debouncedProcessQueue = debounce(function () {
    instrument.processQueue(instrument.queue, instrument.definitions);
  });
  instrument.add = function (key, select, options) {
    function addItem(key, select, options) {
      debug('add instrument:', key, select, options);
      if (typeof key !== 'string' && (typeof select !== 'function' || typeof select !== 'string')) {
        warn("add instrument: requires item key string and selector string or select function");
        return;
      }
      var newDefinition = {};
      if (typeof select === 'string') {
        newDefinition.select = function () {
          return $(select);
        };
      } else {
        newDefinition.select = select;
      }
      if (options) {
        if (options.onConnect) newDefinition.onConnect = [options.onConnect];
        if (options.onDisconnect) newDefinition.onDisconnect = [options.onDisconnect];
        if (options.hasOwnProperty('asClass')) newDefinition.asClass = options.asClass;
      }
      var parent = {};
      if (options && options.parent) {
        parent = instrument.findDefinition(options.parent);
        if (!parent) warn("add instrument: parent '".concat(options.parent, "' not found"));
      } else {
        instrument.definitions[key] = newDefinition;
      }
      parent.children = parent.children || {};
      parent.children[key] = newDefinition;
    }
    if (Array.isArray(key)) {
      key.forEach(function (item) {
        addItem.apply(void 0, _toConsumableArray(item));
      });
    } else {
      addItem(key, select, options);
    }
    instrument.processQueue(instrument.queue, instrument.definitions);
  };
  instrument.findDefinition = function (searchKey) {
    var result = null;
    function searchBlock(searchKey, block) {
      if (block[searchKey]) {
        result = block[searchKey];
        return;
      }
      for (var key in block) {
        if (block[key].children) {
          searchBlock(searchKey, block[key].children);
        }
      }
    }
    searchBlock(searchKey, instrument.definitions);
    return result;
  };
  sandbox.store.instrumentDOM = function (data) {
    var argumentArray = [];
    for (var key in data) {
      var dataItem = data[key];
      var _select2 = Object.getOwnPropertyDescriptor(dataItem, 'dom').get;
      var options = {};
      if (dataItem.hasOwnProperty('asClass')) options.asClass = dataItem.asClass;
      argumentArray.push([key, _select2, options]);
    }
    instrument.add(argumentArray);
  };
  sandbox.instrument = instrument;
}
function initializeEvolvContext(sandbox) {
  var debug = sandbox.debug;

  // Backward compatibility
  sandbox.track = function (txt) {
    var trackKey = 'evolv-' + this.name;
    var node = $('body');
    var tracking = node.attr(trackKey);
    tracking = tracking ? tracking + ' ' + txt : txt;
    node.attr(_defineProperty({}, trackKey, tracking));
    return this;
  };
  return {
    state: {
      current: 'active',
      previous: 'active'
    },
    onActivate: [function () {
      return debug("activate context: ".concat(sandbox.name));
    }, window.evolv.catalyst._globalObserver.connect, window.evolv.catalyst._intervalPoll.startPolling],
    onDeactivate: [function () {
      return debug("deactivate context: ".concat(sandbox.name));
    }],
    initializeActiveKeyListener: function initializeActiveKeyListener(contextId) {
      debug('init active key listener: waiting for window.evolv.client');
      sandbox.waitUntil(function () {
        return window.evolv && window.evolv.client && window.evolv.client.getActiveKeys;
      }).then(function () {
        window.evolv.client.getActiveKeys('web.' + contextId).listen(function (keys) {
          debug('active key listener:', keys);
          // if (keys)
        });
      });
    },

    initializeIsActiveListener: function initializeIsActiveListener(isActive) {
      sandbox.waitUntil(function () {
        return window.evolv && window.evolv.client && window.evolv.client.getActiveKeys;
      }).then(function () {
        window.evolv.client.getActiveKeys().listen(function (keys) {
          sandbox._evolvContext.state.previous = sandbox._evolvContext.state.current;
          sandbox._evolvContext.state.current = isActive() ? 'active' : 'inactive';
          var current = sandbox._evolvContext.state.current;
          var previous = sandbox._evolvContext.state.previous;
          if (previous === 'inactive' && current === 'active') {
            debug('active key listener: activate');
            sandbox._evolvContext.onActivate.forEach(function (callback) {
              return callback();
            });
          } else if (previous === 'active' && current === 'inactive') {
            debug('active key listener: deactivate');
            sandbox._evolvContext.onDeactivate.forEach(function (callback) {
              return callback();
            });
          } else {
            debug("active key listener: no change, current state '".concat(current, "'"));
          }
        });
      });
    }
  };
  // sandbox._evolvContext = {};
  // const evolvContext = sandbox._evolvContext;

  // evolvContext.updateState = () => {
  //     // Defaults the Evolv context state to active so you can run an experiment
  //     // even without the benefit of SPA handling.
  //     if (!sandbox.id && !sandbox.isActive) {
  //         evolvContext.state = 'active';
  //         return 'active';
  //     }

  //     if (sandbox.id) {
  //         evolvContext.state = document.documentElement.classList.contains(
  //             'evolv_web_' + sandbox.id
  //         )
  //             ? 'active'
  //             : 'inactive';
  //     } else if (sandbox.isActive) {
  //         // Deprecated
  //         evolvContext.state = sandbox.isActive() ? 'active' : 'inactive';
  //     }

  //     return evolvContext.state;
  // };

  // evolvContext.updateState();
  // evolvContext.onActivate = [
  //     () =>
  //         debug(
  //             `evolv context: ${sandbox.name} activate, ${(
  //                 performance.now() - sandbox.perf
  //             ).toFixed(2)}ms`
  //         ),
  // ];
  // evolvContext.onDeactivate = [
  //     () => debug(`evolv context: ${sandbox.name} deactivate`),
  // ];
}

function initializeWhenContext(sandbox) {
  return function (state) {
    if (state === 'active' || undefined) {
      return {
        then: function then(callback) {
          sandbox.debug("whenContext: queue callback", callback, "for 'active' state, current state: '".concat(sandbox._evolvContext.state.current, "'"));
          sandbox._evolvContext.onActivate.push(callback);
          if (sandbox._evolvContext.state.current === 'active') {
            callback();
          }
        }
      };
    } else if (state === 'inactive') {
      return {
        then: function then(callback) {
          sandbox.debug("whenContext: queue callback", callback, "for 'inactive' state, current state: '".concat(sandbox._evolvContext.state.current, "'"));
          if (callback) sandbox._evolvContext.onDeactivate.push(callback);
          if (sandbox._evolvContext.state === 'inactive') {
            callback();
          }
        }
      };
    } else {
      return {
        then: function then() {
          warn("whenContext: unknown state, requires 'active' or 'inactive', default is 'active'");
        }
      };
    }
  };
}
function initializeWhenInstrument(sandbox) {
  return function () {
    sandbox.debug('whenInstrument: add function to instrument queue');
    return {
      then: function then(func) {
        sandbox.instrument._onInstrument.push(func);
      }
    };
  };
}

// Accepts select string or a select function like instrument does
// TODO: Combine instrument items with identical select functions and
// disallow duplicate onConnect functions.
function initializeWhenDOM(sandbox) {
  sandbox._whenDOMCount = {};
  return function (select, options) {
    sandbox.debug('whenDOM:', select);
    var $$ = sandbox.$$;
    var selectFunc;
    var keyPrefix = options && options.keyPrefix ? options.keyPrefix : 'when-dom-';

    // Increment keys with different prefixes separately;
    if (!sandbox._whenDOMCount[keyPrefix]) sandbox._whenDOMCount[keyPrefix] = 1;

    // Accept string, enode, or select function
    if (typeof select === 'string') selectFunc = function selectFunc() {
      return $(select);
    };else if (_typeof(select) === 'object' && select.constructor === ENode) selectFunc = function selectFunc() {
      return select;
    };else {
      sandbox.warn("whenDOM: unrecognized input ".concat(select, ", requires string, enode, or selection function"));
      return {
        then: function then() {
          return null;
        }
      };
    }
    var thenFunc = function thenFunc(callback) {
      var count = sandbox._whenDOMCount[keyPrefix]++;
      var key = keyPrefix + count;
      sandbox.instrument.definitions[key] = {
        select: selectFunc,
        onConnect: [function () {
          callback($$(key));
        }],
        asClass: null
      };
      sandbox.instrument.debouncedProcessQueue();
    };
    return {
      then: thenFunc,
      // Deprecated
      thenInBulk: thenFunc,
      // Deprecated
      reactivateOnChange: function reactivateOnChange() {}
    };
  };
}
function initializeWhenItem(sandbox) {
  var $$ = sandbox.$$;
  return function (key) {
    var definition = sandbox.instrument.findDefinition(key);
    if (definition === null) {
      sandbox.warn("whenItem: instrument item '".concat(key, "' not defined"));
      return {
        then: function then() {
          return null;
        }
      };
    }
    var thenFunc = function thenFunc(callback) {
      sandbox.debug("whenItem: '".concat(key, "'"), 'add on connect', {
        callback: callback
      });
      var newEntry = function newEntry() {
        sandbox.debug("whenItem: '".concat(key, "'"), 'fire on connect:', callback);
        callback($$(key));
      };
      newEntry.callbackString = callback.toString();
      if (!definition.onConnect) {
        definition.onConnect = [];
      } else if (definition.onConnect.findIndex(function (entry) {
        return entry.callbackString === newEntry.callbackString;
      }) !== -1) {
        sandbox.debug("whenItem: duplicate callback '".concat(newEntry.callbackString, "' not assigned to item '").concat(key, "'"));
        return;
      }
      definition.onConnect.push(newEntry);
      if (sandbox.instrument.queue[key].enode.isConnected()) newEntry();
    };
    return {
      then: thenFunc,
      // Deprecated
      thenInBulk: thenFunc,
      // Deprecated
      reactivateOnChange: function reactivateOnChange() {}
    };
  };
}
function initializeWhenElement(sandbox) {
  return function (select) {
    return {
      then: function then(callback) {
        sandbox.whenDOM(select, {
          keyPrefix: 'when-element-'
        }).then(function (enode) {
          return callback(enode.el[0]);
        });
      }
    };
  };
}

// Add deduping
function initializeWaitUntil(sandbox) {
  sandbox._intervalPoll = {
    queue: []
  };
  return function (condition, timeout) {
    sandbox.debug('waitUntil: add callback to interval poll queue, condition:', condition);
    return {
      then: function then(_callback) {
        var entry = {
          condition: condition,
          callback: function callback() {
            return _callback(condition());
          },
          timeout: timeout || null,
          startTime: performance.now()
        };
        sandbox._intervalPoll.queue.push(entry);
        window.evolv.catalyst._intervalPoll.usePolling = true;
        window.evolv.catalyst._intervalPoll.startPolling();
      }
    };
  };
}
function initializeSandbox(name) {
  var sandbox = {};
  sandbox.name = name;
  initializeLogs(sandbox);
  var debug = sandbox.debug;
  var warn = sandbox.warn;
  if (name === 'catalyst') {
    debug("init catalyst version ".concat(version));
    debug("log level: ".concat(sandbox.logs));
    sandbox.version = version;
  } else {
    debug("init context sandbox: ".concat(name));
  }
  sandbox.$ = $;
  sandbox.$$ = function (name) {
    var item = sandbox.instrument.queue[name];
    if (!item) {
      if (!sandbox.instrument.findDefinition(name)) {
        warn("$$: '".concat(name, "' not found in instrument definitions list"));
      }
      return $();
    } else if (!item.enode.isConnected()) {
      // warn(`$$: Item ${name} is not currently on the page.`);
      return $();
    }
    return item.enode;
  };
  sandbox.select = select;
  sandbox.selectAll = selectAll;
  sandbox.$$;
  sandbox.store = {};
  sandbox.app = {};
  initializeInstrument(sandbox);
  if (sandbox.name !== 'catalyst') sandbox._evolvContext = initializeEvolvContext(sandbox);
  sandbox.whenContext = initializeWhenContext(sandbox);
  sandbox.whenInstrument = initializeWhenInstrument(sandbox);
  sandbox.whenDOM = initializeWhenDOM(sandbox);
  sandbox.whenItem = initializeWhenItem(sandbox);
  sandbox.whenElement = initializeWhenElement(sandbox);
  sandbox.waitUntil = initializeWaitUntil(sandbox);

  // Backwards compatibility
  sandbox.reactivate = sandbox.instrument.processQueue;
  return sandbox;
}
function initializeIntervalPoll(catalyst) {
  function processQueue(sandbox) {
    var queue = sandbox._intervalPoll.queue;
    for (var i = 0; i < queue.length; i++) {
      var entry = queue[i];
      var timeElapsed = performance.now() - entry.startTime;
      if (entry.timeout && entry.timeout < timeElapsed) {
        sandbox.debug('waitUntil: condition timed out', entry);
        queue.splice(i, 1);
        continue;
      }
      try {
        if (entry.condition()) {
          sandbox.debug('waitUntil: condition met:', entry.condition, entry.condition(), "".concat((performance.now() - entry.startTime).toFixed(2), "ms"));
          entry.callback();
          queue.splice(i, 1);
        }
      } catch (error) {
        // Prevents 60 error messages per second if the condition contains an error
        sandbox.warn('waitUntil: error in condition, removing from queue', error);
        queue.splice(i, 1);
      }
    }
    return queue.length;
  }
  function processQueues() {
    return new Promise(function (resolve) {
      var processQueuesLoop = function processQueuesLoop() {
        var anySandboxActive = false;
        var queueTotal = 0;
        var _iterator = _createForOfIteratorHelper(catalyst.sandboxes),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var sandbox = _step.value;
            if (sandbox._evolvContext.state.current === 'inactive') continue;
            anySandboxActive = true;
            queueTotal += processQueue(sandbox);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        if (!anySandboxActive) {
          catalyst.debug('interval poll: no active sandboxes');
          resolve(false);
        } else if (queueTotal === 0) {
          catalyst.debug('interval poll: all queues empty');
          resolve(false);
        } else {
          requestAnimationFrame(processQueuesLoop);
        }
      };
      processQueuesLoop();
    });
  }
  return {
    isPolling: false,
    usePolling: false,
    startPolling: function () {
      var _startPolling = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
        var intervalPoll;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                intervalPoll = catalyst._intervalPoll;
                if (!intervalPoll.isPolling) {
                  _context.next = 3;
                  break;
                }
                return _context.abrupt("return");
              case 3:
                catalyst.debug('interval poll: start polling');
                intervalPoll.isPolling = true;
                _context.next = 7;
                return processQueues();
              case 7:
                intervalPoll.isPolling = _context.sent;
                catalyst.debug('interval poll: stop polling');
              case 9:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));
      function startPolling() {
        return _startPolling.apply(this, arguments);
      }
      return startPolling;
    }()
  };
}
function initializeCatalyst() {
  var catalyst = initializeSandbox('catalyst');
  var debug = catalyst.debug;
  catalyst.sandboxes = [];

  // Creates proxy for window.evolv.catalyst that adds a new sandbox whenever
  // a new property is accessed.
  var catalystProxy = new Proxy(catalyst, {
    get: function get(target, name, receiver) {
      var catalystReflection = Reflect.get(target, name, receiver);
      if (!catalystReflection) {
        var sandbox = initializeSandbox(name);

        // Updates the context state to enable SPA handling if either
        // property is set. isActive() is deprecated.
        var sandboxProxy = new Proxy(sandbox, {
          set: function set(target, property, value) {
            target[property] = value;
            if (property === 'key') {
              sandbox._evolvContext.initializeActiveKeyListener(value);
            } else if (property === 'isActive') {
              sandbox._evolvContext.initializeIsActiveListener(value);
            }
            return true;
          }
        });
        target[name] = sandboxProxy;
        catalystReflection = Reflect.get(target, name, receiver);
        catalyst.sandboxes.push(sandboxProxy);
      }
      return catalystReflection;
    }
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

  // SPA mutation observer for all sandboxes
  // debug('init evolv context observer: watching html');
  // new MutationObserver(() => {
  //     catalyst.log(
  //         'SPA:',
  //         Array.from(document.documentElement.classList).join(', ')
  //     );
  //     catalyst.sandboxes.forEach((sandbox) => {
  //         const oldState = sandbox._evolvContext.state;
  //         const newState = sandbox._evolvContext.updateState();
  //         if (
  //             (oldState === 'inactive' || oldState === undefined) &&
  //             newState === 'active'
  //         ) {
  //             sandbox._evolvContext.onActivate.forEach((func) => func());
  //         } else if (oldState === 'active' && newState === 'inactive') {
  //             sandbox._evolvContext.onDeactivate.forEach((func) => func());
  //         }
  //     });
  // }).observe(document.documentElement, {
  //     attributes: true,
  //     attributeFilter: ['class'],
  // });

  // The main mutation observer for all sandboxes
  debug('init global observer');
  catalyst._globalObserver = {
    observer: new MutationObserver(function () {
      var anySandboxActive = false;
      var _iterator2 = _createForOfIteratorHelper(catalyst.sandboxes),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var sandbox = _step2.value;
          if (sandbox._evolvContext.state.current === 'inactive') continue;
          anySandboxActive = true;
          sandbox.instrument.debouncedProcessQueue();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if (!anySandboxActive) catalyst._globalObserver.disconnect();
    }),
    connect: function connect() {
      debug('global observer: observe');
      catalyst._globalObserver.observer.observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true
      });
    },
    disconnect: function disconnect() {
      debug('global observer: disconnect');
      catalyst._globalObserver.observer.disconnect();
    }
  };
  catalyst._globalObserver.connect();
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
module.exports = processConfig;
