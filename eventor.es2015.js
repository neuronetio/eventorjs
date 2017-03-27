"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var pathToRegexp = require("path-to-regexp");
var generateuid = require("generate-uid");

var Eventor = function () {
  "use strict";

  function copyArray(source, array) {
    return array = source.slice();
  }

  function pushArray(source, array) {
    var index = -1;
    var length = source.length;
    array || (array = Array(length));
    var last = array.length;
    while (++index < length) {
      array[last] = source[index];
      last++;
    }
    return array;
  }

  function pushObjAsArray(source, array) {
    array || (array = Array(source.length));
    var last = array.length;
    for (var item in source) {
      array[last] = source[item];
      last++;
    }
    return array;
  }

  var EventorBasic = function () {
    function EventorBasic(opts) {
      _classCallCheck(this, EventorBasic);

      this._listeners = {};
      this._allListeners = {};
      this._wildcardListeners = {};
      this._allWildcardListeners = [];
      this.delimeter = ".";
      this._shared = opts._shared;
      if (typeof opts.errorEventsErrorHandler == "function") {
        this._errorEventsErrorHandler = opts.errorEventsErrorHandler;
        // if there was an error in 'error' event, now we can handle it
      } else {
        this._errorEventsErrorHandler = function () {}; //noop
      }
      this.root = opts.root;
      this.timeout = opts.timeout || 60 * 1000;
      if (typeof opts.promise == "undefined") {
        this.promise = Promise;
      } else {
        this.promise = opts.promise;
      }
      if (typeof opts.unique == "undefined") {
        this.unique = generateuid;
      } else {
        this.unique = opts.unique;
      }
      if (typeof opts.delimeter == "string") {
        if (opts.delimeter.length > 1) {
          throw new Error("Delimeter should be one character long.");
        }
        this.delimeter = opts.delimeter;
      }
    }

    _createClass(EventorBasic, [{
      key: "_generateListenerId",
      value: function _generateListenerId() {
        return ++this._shared.lastId;
      }

      /**
       * if there is no 'error' listener throw it
       * every internal eventor error should go through here
       */

    }, {
      key: "_internalError",
      value: function _internalError(error) {
        var errorListeners = this.root.listeners("error");
        if (errorListeners.length == 0) {
          throw error;
        } else {
          this._handleError({ error: error, event: {} });
        }
      }

      /**
       * start listening to an event
       * arguments:
       *  eventName {String}, callback {function}, position(optional) {integer}
       *  nameSpace {String}, eventName {string}, callback {function}, position (optional) {integer}
       *
       */

    }, {
      key: "on",
      value: function on() {
        var eventName = "";
        var callback = function callback() {};
        var nameSpace = "";
        var position = void 0;
        // by default nameSpace is "" because we later can call only those
        // listeners with no nameSpace by emit("","eventName"); nameSpace("")===nameSpace("")
        var emptyArgs = false;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        if (args.length == 0) {
          emptyArgs = true;
        }
        args.forEach(function (arg, index) {
          if (typeof arg === "undefined" || arg == null) {
            emptyArgs = index;
          }
        });
        if (emptyArgs !== false) {
          if (typeof emptyArgs == "number") {
            return this._internalError("Undefined argument at position " + emptyArgs + ".\n" + JSON.stringify(args));
          } else {
            return this._internalError("It seems like we have no arguments iside 'on' method?\n" + JSON.stringify(args));
          }
        }
        if (typeof args[0] !== "string" && args[0].constructor.name != "RegExp") {
          return this._internalError("First argument should be string or RegExp in Eventor.on method.\n" + JSON.stringify(args));
        }

        if ((typeof args[0] === "string" || args[0].constructor.name === "RegExp") && typeof args[1] === "function") {
          // eventName,callback [,position]
          eventName = args[0];
          callback = args[1];
          if (typeof args[2] === "number") {
            position = args[2];
          } else if (typeof args[2] !== "undefined") {
            return this._internalError("Third argument should be a number.\n" + JSON.stringify(args));
          }
        } else if (typeof args[0] === "string" && (typeof args[1] === "string" || args[1].constructor.name === "RegExp") && typeof args[2] === "function") {
          // nameSpace, eventName, callback [,position]
          nameSpace = args[0];
          eventName = args[1];
          callback = args[2];
          if (typeof args[3] === "number") {
            position = args[3];
          } else if (typeof args[3] !== "undefined") {
            return this._internalError("Fourth argument should be a number.\n" + JSON.stringify(args));
          }
        } else {
          // second argument is not a callback and not a eventname
          return this._internalError("Invalid arguments inside 'on' method.\n" + JSON.stringify(args));
        }

        // wildcard is when there is an asterisk '*' or there is a ':' inside eventName (for express-like routes)
        var wildcarded = eventName.constructor.name == "RegExp" || eventName.indexOf("*") >= 0 || eventName.charAt(0) == "%";

        var listenerId = this._generateListenerId();
        var wasPositioned = typeof position !== "undefined";
        var originalPosition = Object.keys(this._allListeners).length;
        if (typeof position === "undefined") {
          position = originalPosition;
        }

        var listener = {
          id: listenerId,
          eventName: eventName,
          callback: callback,
          nameSpace: nameSpace,
          isWildcard: wildcarded,
          position: position,
          originalPosition: originalPosition,
          wasPositioned: wasPositioned
        };

        if (!wildcarded) {
          if (typeof this._listeners[eventName] == "undefined") {
            this._listeners[eventName] = [];
          }
          this._listeners[eventName].push(listener);
        } else {
          var regstr = eventName.toString();
          if (typeof this._wildcardListeners[regstr] == "undefined") {
            this._wildcardListeners[regstr] = [];
          }
          this._wildcardListeners[regstr].push(listener);
          this._allWildcardListeners.push(listener);
        }

        this._allListeners[listenerId] = listener;

        return listenerId;
      }

      /**
       * listenerFn or id of the listener
       */

    }, {
      key: "removeListener",
      value: function removeListener(listenerFn) {
        var listenerId = void 0;
        if (typeof listenerFn == 'number') {
          listenerId = listenerFn;
        } else {
          var ids = Object.keys(this._allListeners);
          for (var i = 0, len = ids.length; i < len; i++) {
            var _listener = this._allListeners[ids[i]];
            if (_listener.callback === listenerFn) {
              listenerId = _listener.id;
              break;
            }
          }
        }

        var listener = this._allListeners[listenerId];
        if (typeof listener != "undefined") {
          var eventName = listener.eventName;
          if (!listener.isWildcard) {
            var pos = this._listeners[eventName].indexOf(listener);
            this._listeners[eventName].splice(pos, 1);
          } else {
            var _pos = this._wildcardListeners[eventName].indexOf(listener);
            this._wildcardListeners[eventName].splice(_pos, 1);
          }
          delete this._allListeners[listenerId];
          return 1;
        }
        return 0;
      }
    }, {
      key: "off",
      value: function off() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        return this.removeListener.apply(this, args);
      }
    }, {
      key: "removeListenersFromNamespace",
      value: function removeListenersFromNamespace(nameSpace) {
        var _this = this;

        var listeners = this.getListenersFromNamespace(nameSpace);
        var ids = [];
        listeners.forEach(function (listener) {
          ids.push(listener.id);
        });
        ids.forEach(function (id) {
          _this.removeListener(id);
        });
        return ids.length;
      }
    }, {
      key: "wildcardMatchEventName",
      value: function wildcardMatchEventName(wildcard, eventName) {
        if (typeof wildcard == "string") {
          if (wildcard.charAt(0) == "%") {
            var _ret = function () {
              // express-like route '%web-request:/user/:id/jobs' or '%user.:action'
              wildcard = wildcard.substr(1);
              var keys = [];
              var wildcardReg = pathToRegexp(wildcard, keys, {});
              var matches = eventName.match(wildcardReg);
              var params = {};
              if (matches != null && matches.length > 1) {
                keys.forEach(function (key, index) {
                  params[key.name] = decodeURIComponent(matches[index + 1]);
                });
              }
              return {
                v: { matches: matches, params: params }
              };
            }();

            if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
          } else {
            // user.*.jobs or user.** kind of wildcards
            var str = wildcard.replace(/[^a-z0-9]{1}/gi, "\\$&").replace(/\\\*\\\*/gi, ".*").replace(/\\\*/gi, "[^\\" + this.delimeter + "]*");
            str = "^" + str + "$";
            wildcard = new RegExp(str);
          }
        }
        //console.log("wildcard?",wildcard.toString(),wildcard.exec(eventName))
        // lastly wildcard if is not a string must be an RegExp
        return {
          matches: eventName.match(wildcard),
          params: {}
        };
      }
    }, {
      key: "_getListenersForEvent",
      value: function _getListenersForEvent(eventName) {
        var _this2 = this;

        if (this._allWildcardListeners.length > 0) {
          var listeners = [];
          if (typeof this._listeners[eventName] != "undefined") {
            listeners = copyArray(this._listeners[eventName]);
          }
          // now we must add wildcards
          // listener from now on will have _tempMatches property
          // which will change between different events when eventName argument change
          var wildcarded = this._allWildcardListeners.filter(function (listener) {
            listener._tempMatches = _this2.wildcardMatchEventName(listener.eventName, eventName);
            return listener._tempMatches.matches != null;
          });
          pushArray(wildcarded, listeners);
          //listeners.push(...wildcarded);

          return listeners;
        } else {
          if (typeof this._listeners[eventName] != "undefined") {
            return this._listeners[eventName];
          } else {
            return [];
          }
        }
      }
    }, {
      key: "_getListenersForEventFromArray",
      value: function _getListenersForEventFromArray(eventName, listeners) {
        var _this3 = this;

        // listeners may be list of all different listeners types (namespaced, wildcarded...)
        var filtered = [];

        filtered = listeners.filter(function (listener) {
          if (listener.isWildcard) {
            listener._tempMatches = _this3.wildcardMatchEventName(listener.eventName, eventName);
            return listener._tempMatches.matches != null;
          } else {
            return listener.eventName === eventName;
          }
        });

        return filtered;
      }
    }, {
      key: "_sortListeners",
      value: function _sortListeners(listeners) {
        // we are only prepend listeners - and will not position them (see commits before - in this place)
        var sorted = listeners.sort(function (a, b) {
          // positioned elements
          if (a.position === b.position) {

            if (a.wasPositioned && b.wasPositioned) {
              return b.id - a.id; // later defined listener will be the first one
            } else if (!a.wasPositioned && !b.wasPositioned) {
              this._internalError("Both listeners have same position, but were not positioned manually (internal error).");
            } else {
              if (a.wasPositioned) {
                return -1; // a was positioned so it will be first one
              } else {
                return 1; // b was positioned so a must move forward
              }
            }
          }
          return a.position - b.position;
        });

        return sorted;
      }
    }, {
      key: "listeners",
      value: function listeners() {
        var listeners = [];
        if (arguments.length === 0) {
          pushObjAsArray(this._allListeners, listeners);
        } else if (arguments.length == 1) {
          listeners = this._getListenersForEvent(arguments.length <= 0 ? undefined : arguments[0]);
        } else if (arguments.length == 2) {
          listeners = this.getListenersFromNamespace(arguments.length <= 0 ? undefined : arguments[0]);
          listeners = this._getListenersForEventFromArray(arguments.length <= 1 ? undefined : arguments[1], listeners);
        }
        return this._sortListeners(listeners);
      }
    }, {
      key: "getListenersFromNamespace",
      value: function getListenersFromNamespace(nameSpace) {
        var all = this.listeners();
        var result = all.filter(function (listener) {
          return listener.nameSpace === nameSpace;
        });
        return result;
      }

      // it is used to emit or cascade

    }, {
      key: "_parseArguments",
      value: function _parseArguments(args) {
        var result = {};
        result.eventName = "";
        result.data = undefined;
        result.nameSpace = undefined;
        // namepsace=undefined (not "") because we need to know if nameSpace was
        // in the argument list
        // if yes we will be filtering to match namespace
        // if no we return all listeners (with namespaces or not)
        // it is usefull when we need to get only those listeners that have no namespace assigned
        // because when no namespace is passed as argument for on("eventName") method - listener will have
        // empty string as namespace by default "" to easily search for listeners with no namepsace
        // by setting empty string as namespace to match
        //
        // for example:
        //    emit("","eventName") will call only those listeners that have no namespaces
        //    emit("eventName") will call all listeners including those with namespace
        //    emit("someNameSpace","eventName") will call only listeners with "someNameSpace" as namespace
        //
        // we could emit something like this emit(undefined,"eventName") to get listeners without namespaces
        // but it looks ugly and not intuitive
        // default namespace ("") is the better choice
        if (typeof args[0] == "string") {

          if (args.length == 2) {
            //eventName,data
            result.eventName = args[0];
            result.data = args[1];
          } else if (args.length == 3) {
            //nameSpace,eventName,data
            result.nameSpace = args[0];
            result.eventName = args[1];
            result.data = args[2];
          } else {
            this._internalError("Arguments length is incorrect\n" + JSON.stringify(args));
          }
        } else {
          return false;
        }

        return result;
      }
    }, {
      key: "_getListenersFromParsedArguments",
      value: function _getListenersFromParsedArguments(parsedArgs) {
        var listeners = [];
        if (typeof parsedArgs.nameSpace === "undefined") {
          listeners = this.listeners(parsedArgs.eventName);
        } else {
          listeners = this.listeners(parsedArgs.nameSpace, parsedArgs.eventName);
        }
        return listeners;
      }
    }, {
      key: "_handleError",
      value: function _handleError(errorObj) {
        var _this4 = this;

        var handleItOutsideTry = function handleItOutsideTry(e) {
          // we want to throw errors in errorEventsErrorHandler
          _this4._errorEventsErrorHandler(e);
        };

        try {
          this.root.emit("error", errorObj).catch(function (errorObj) {
            //handleItOutsideTry(errorObj.error);
            // do nothing because this errors are already handled inside _emit and _cascade
          });
        } catch (e) {
          handleItOutsideTry(e);
        }
      }

      /**
       * parsedArgs is an object with prepared data to emit like nameSpace, eventName and so on
       * inlineOn is to immediately execute before and after middlewares,
       * right before/after normal 'on' is fired
       * inlineOn is inlined with 'on'
       * inlineOn is optional argument and in most cases should not be used - only for Eventor.emit
       */

    }, {
      key: "_emit",
      value: function _emit(parsedArgs, inlineOn) {
        var _this5 = this;

        var listeners = this._getListenersFromParsedArguments(parsedArgs); // _tempMatches
        if (listeners.length == 0) {
          return this.promise.all([]);
        }
        var results = [];
        var len = listeners.length;
        var i = -1;

        var _loop = function _loop() {
          var promise = void 0;
          var promiseBefore = void 0;
          var promiseAfter = void 0;

          var errorInsideBefore = false;
          // useBefore immediately before normal 'on'
          if (typeof inlineOn != "undefined") {
            var parsed = Object.assign({}, inlineOn.beforeParsed);
            // we have an input from useBeforeAll here
            parsed.event = Object.assign({}, parsed.event);
            // after.parsedArgs will be passed after each listerner
            // so it must be cloned for each emit event
            promiseBefore = inlineOn._before._cascade(parsed);
          }

          // normal 'on'
          var listener = listeners[i];
          var eventObj = Object.assign({}, parsedArgs.event);
          eventObj.listener = listener;
          // _tempMatches are only temporairy data from _getListenersForEvent
          // becase we don't want to parse regex multiple times (performance)
          if (listener._tempMatches) {
            eventObj.matches = listener._tempMatches.matches;
            eventObj.params = listener._tempMatches.params;
            delete listener._tempMatches;
          } else {
            eventObj.matches = [];
            eventObj.params = {};
          }

          var normalOn = function normalOn(input) {
            /**
                why try catch?
                because all listener.callback should be catched this way
                when we catch (try-catch) errors inside listener we can
                emit them and handle them with error, and prepare errorObj
                with current event iside (not later event)
                so no matter where the listener callback is called it must be
                wrapped inside try-catch and emitted through _handleError
              */
            var promise = void 0;
            try {
              promise = listener.callback(input, eventObj);
              if (promise instanceof _this5.promise) {
                // we must catch an errors end emit them - error that are inside a promise
                promise = promise.catch(function (e) {
                  var errorObj = { error: e, event: eventObj };
                  if (parsedArgs.eventName != "error") {
                    _this5._handleError(errorObj); // for 'error' event
                  } else {
                    _this5._errorEventsErrorHandler(e);
                    // if we are emittin 'error' and there is error inside 'error' event :/:\:/
                  }
                  return _this5.promise.reject(e); // we must give error back to catch
                });
              }
            } catch (e) {
              var errorObj = { error: e, event: eventObj };
              if (parsedArgs.eventName != "error") {
                // we don't want to emit error from error (infinite loop)
                _this5._handleError(errorObj);
              } else {
                _this5._errorEventsErrorHandler(e);
              }
              promise = _this5.promise.reject(e);
            }
            return promise;
          };

          if (typeof promiseBefore != "undefined") {

            promise = promiseBefore.then(normalOn);
          } else {
            // if there is no useBefore we don't want to skip current tick (setImmediate, then)
            promise = normalOn(parsedArgs.data);
          }

          // useAfter immediately after normal 'on'
          if (typeof inlineOn != "undefined") {

            // we have an after job to do before all of the task resolves
            if (promise instanceof _this5.promise) {
              promiseAfter = promise.then(function (result) {
                var parsed = Object.assign({}, inlineOn.afterParsed);
                parsed.data = result;
                parsed.event = Object.assign({}, parsed.event);
                // after.parsedArgs will be passed after each listerner
                // so it must be cloned for each emit event
                return inlineOn._after._cascade(parsed);
              });
            } else {
              // if listener doesn't return a promise we must make it
              inlineOn.afterParsed.data = promise; // promise is a normal value
              promiseAfter = inlineOn._after._cascade(inlineOn.afterParsed);
            }
            results.push(promiseAfter);
          } else {
            results.push(promise);
          }
        };

        while (++i < len) {
          _loop();
        }
        return this.promise.all(results);
      }
    }, {
      key: "_validateArgs",
      value: function _validateArgs(args) {
        var parsedArgs = this._parseArguments(args);
        return parsedArgs;
      }

      /**
       * emit an event
       * arguments:
       *  eventName {string}, data {any}
       *  nameSpace {string}, eventName {string}, data {any}
       */

    }, {
      key: "emit",
      value: function emit() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var parsedArgs = this._validateArgs(args);

        parsedArgs.event = {
          type: "emit",
          eventName: parsedArgs.eventName,
          nameSpace: parsedArgs.nameSpace,
          isUseBeforeAll: parsedArgs.isUseBeforeAll,
          isUseBefore: parsedArgs.isUseBefore,
          isUseAfter: parsedArgs.isUseAfter,
          isUseAfterAll: parsedArgs.isUseAfterAll
        };

        return this._emit(parsedArgs);
      }
    }, {
      key: "_cascade",
      value: function _cascade(parsedArgs, inlineOn) {
        var _this6 = this;

        var listeners = this._getListenersFromParsedArguments(parsedArgs);
        var result = this.promise.resolve(parsedArgs.data);
        if (listeners.length == 0) {
          return result;
        }
        var len = listeners.length;
        var i = -1;

        var _loop2 = function _loop2() {
          var listener = listeners[i];

          /**
            for each listener we are going to execute useBefore and useAfter
            like in emit mode
            if there is no 'on' listeners ther will be no useBefore and useAfter
          */

          //useBefore
          if (typeof inlineOn != "undefined") {
            result = result.then(function (result) {
              var beforeParsed = Object.assign({}, inlineOn.beforeParsed);
              beforeParsed.data = result;
              beforeParsed.event = Object.assign({}, beforeParsed.event);
              return inlineOn._before._cascade(beforeParsed);
            });
          }

          //on listener
          result = result.then(function (currentData) {
            var eventObj = Object.assign({}, parsedArgs.event);
            eventObj.listener = listener;
            // _tempMatches are only temporairy data from _getListenersForEvent
            // becase we don't want to parse regex multiple times (performance)
            if (listener._tempMatches) {
              eventObj.matches = listener._tempMatches.matches;
              eventObj.params = listener._tempMatches.params;
              delete listener._tempMatches;
            } else {
              eventObj.matches = [];
              eventObj.params = {};
            }

            var promise = void 0;
            try {
              promise = listener.callback(currentData, eventObj);
              if (promise instanceof _this6.promise) {
                // we must catch an errors end emit them - error that are inside a promise
                // this is another branch so it will no affect normal listeners
                promise = promise.catch(function (e) {
                  var errorObj = { error: e, event: eventObj };
                  if (parsedArgs.eventName != "error") {
                    _this6._handleError(errorObj); // for 'error' event
                  } else {
                    _this6._errorEventsErrorHandler(e);
                  }
                  return _this6.promise.reject(e);
                });
              }
            } catch (e) {
              var errorObj = { error: e, event: eventObj };
              if (parsedArgs.eventName != "error") {
                _this6._handleError(errorObj);
              } else {
                _this6._errorEventsErrorHandler(e);
              }
              return _this6.promise.reject(e);
            }
            return promise;
          });

          //useAfter
          if (typeof inlineOn != "undefined") {
            result = result.then(function (result) {
              var afterParsed = Object.assign({}, inlineOn.afterParsed);
              afterParsed.data = result;
              afterParsed.event = Object.assign({}, afterParsed.event);
              return inlineOn._after._cascade(afterParsed);
            });
          }
        };

        while (++i < len) {
          _loop2();
        }

        return result;
      }

      /**
       * emit an event and put result of each one to next listener (waterfall)
       * arguments:
       *  eventName {string}, data {any}
       *  nameSpace {string}, eventName {string}, data {any}
       */

    }, {
      key: "cascade",
      value: function cascade() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var parsedArgs = this._validateArgs(args);
        parsedArgs.event = {
          type: "cascade",
          eventName: parsedArgs.eventName,
          nameSpace: parsedArgs.nameSpace,
          isUseBeforeAll: parsedArgs.isUseBeforeAll,
          isUseBefore: parsedArgs.isUseBefore,
          isUseAfter: parsedArgs.isUseAfter,
          isUseAfterAll: parsedArgs.isUseAfterAll
        };

        return this._cascade(parsedArgs);
      }
    }]);

    return EventorBasic;
  }();

  function Eventor(opts) {

    var root = {};

    opts = opts || {};
    var sharedData = {
      lastId: 0
    };
    opts._shared = sharedData;
    if (typeof opts.promise != "undefined") {
      root.promise = opts.promise;
    } else {
      root.promise = Promise;
    }
    if (typeof opts.timeout == "undefined") {
      opts.timeout = 60 * 1000; // 60sec timeout
    }
    root.timeout = opts.timeout;

    opts.root = root;

    root._useBeforeAll = new EventorBasic(opts);
    root._useBefore = new EventorBasic(opts);
    root._normal = new EventorBasic(opts);
    root._useAfter = new EventorBasic(opts);
    root._useAfterAll = new EventorBasic(opts);

    if (typeof opts.unique == "undefined") {
      root.unique = generateuid;
    } else {
      root.unique = opts.unique;
    }

    function generateEventId() {
      return root.unique();
    }

    root.on = function on() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return root._normal.on.apply(root._normal, args);
    };

    root.removeListener = root.off = function removeListener(listenerFn) {
      var result = 0;
      result += root._useBeforeAll.removeListener.apply(root._useBeforeAll, [listenerFn]);
      result += root._useBefore.removeListener.apply(root._useBefore, [listenerFn]);
      result += root._normal.removeListener.apply(root._normal, [listenerFn]);
      result += root._useAfter.removeListener.apply(root._useAfter, [listenerFn]);
      result += root._useAfterAll.removeListener.apply(root._useAfterAll, [listenerFn]);
      return result;
    };

    root.useBefore = function useBefore() {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      return root._useBefore.on.apply(root._useBefore, args);
    };

    root.useAfter = function useAfter() {
      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return root._useAfter.on.apply(root._useAfter, args);
    };

    root.useBeforeAll = function useBeforeAll() {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return root._useBeforeAll.on.apply(root._useBeforeAll, args);
    };

    root.useAfterAll = function useAfterAll() {
      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      return root._useAfterAll.on.apply(root._useAfterAll, args);
    };

    root.emit = function emit() {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      var timeoutObj = {
        arguments: args,
        type: "emit",
        error: new Error("timeout")
      };
      var finished = setTimeout(function () {
        root.emit("timeout", timeoutObj);
      }, root.timeout);

      var useBeforeAllParsed = root._normal._parseArguments(args);
      var eventName = useBeforeAllParsed.eventName;
      var nameSpace = useBeforeAllParsed.nameSpace;
      var eventId = generateEventId();

      // first we are emitting useBeforeAll
      useBeforeAllParsed.event = {
        eventId: eventId,
        type: "emit",
        eventName: useBeforeAllParsed.eventName,
        nameSpace: useBeforeAllParsed.nameSpace,
        isUseBefore: false,
        isUseAfter: false,
        isUseBeforeAll: true,
        isUseAfterAll: false
      };

      function normal(input) {

        var useBeforeParsed = Object.assign({}, useBeforeAllParsed);

        useBeforeParsed.data = input;
        useBeforeParsed.event = {
          eventId: eventId,
          type: "emit",
          eventName: useBeforeParsed.eventName,
          nameSpace: useBeforeParsed.nameSpace,
          isUseBefore: true,
          isUseAfter: false,
          isUseBeforeAll: false,
          isUseAfterAll: false
        };

        var normalParsed = Object.assign({}, useBeforeParsed);
        normalParsed.data = input;
        normalParsed.event = {
          eventId: eventId,
          type: "emit",
          eventName: normalParsed.eventName,
          nameSpace: normalParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: false,
          isUseBeforeAll: false,
          isUseAfterAll: false
        };

        var useAfterParsed = Object.assign({}, useBeforeParsed);
        useAfterParsed.data = undefined;
        useAfterParsed.event = {
          eventId: eventId,
          type: "emit",
          eventName: useAfterParsed.eventName,
          nameSpace: useAfterParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: true,
          isUseBeforeAll: false,
          isUseAfterAll: false
        };

        // this wil be glued to 'on' listeners (useBefore and useAfter)
        var inlineOn = {
          _before: root._useBefore,
          beforeParsed: useBeforeParsed,
          _after: root._useAfter,
          afterParsed: useAfterParsed
        };

        //check if there are after listeners
        var p = void 0;

        p = root._normal._emit(normalParsed, inlineOn);

        // check if there are some afterAll listeners
        var afterAllListeners = void 0;
        if (typeof nameSpace != "undefined") {
          afterAllListeners = root._useAfterAll.listeners(nameSpace, eventName);
        } else {
          afterAllListeners = root._useAfterAll.listeners(eventName);
        }
        if (afterAllListeners.length > 0) {
          p = p.then(function (results) {
            var useAfterParsed = Object.assign({}, useBeforeParsed);
            useAfterParsed.data = results;
            useAfterParsed.event = {
              eventId: eventId,
              type: "emit",
              eventName: useAfterParsed.eventName,
              nameSpace: useAfterParsed.nameSpace,
              isUseBefore: false,
              isUseAfter: false,
              isUseBeforeAll: false,
              isUseAfterAll: true
            };
            // in afterAll we are running one callback to array of all results
            return root._useAfterAll._cascade(useAfterParsed);
          });
        }

        return p;
      }

      // optimizations - we don't want to parse middlewares if there isn't one
      /* leaving optimisations for now
      let listeners;
      if(typeof nameSpace==="undefined"){
        listeners = root._useBefore.listeners(eventName);
      }else{
        listeners = root._useBefore.listeners(nameSpace,eventName);
      }
      let result;
      if(listeners.length==0){
        result = normal(useBeforeParsed.data);
      }else{
        result = root._useBefore._cascade(useBeforeParsed).then(normal);
      }*/
      var result = root._useBeforeAll._cascade(useBeforeAllParsed).then(normal).then(function (results) {
        clearTimeout(finished);
        return results;
      });
      return result;
    };

    root.cascade = function cascade() {
      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      var timeoutObj = {
        arguments: args,
        type: "cascade",
        error: new Error("timeout")
      };
      var finished = setTimeout(function () {
        root.emit("timeout", timeoutObj);
      }, root.timeout);

      var useBeforeAllParsed = root._normal._parseArguments(args);
      var nameSpace = useBeforeAllParsed.nameSpace;
      var eventName = useBeforeAllParsed.eventName;
      var eventId = generateEventId();

      useBeforeAllParsed.event = {
        eventId: eventId,
        type: "cascade",
        eventName: useBeforeAllParsed.eventName,
        nameSpace: useBeforeAllParsed.nameSpace,
        isUseBefore: false,
        isUseAfter: false,
        isUseBeforeAll: true,
        isUseAfterAll: false
      };

      var useBeforeParsed = Object.assign({}, useBeforeAllParsed);
      useBeforeParsed.event = {
        eventId: eventId,
        type: "cascade",
        eventName: useBeforeParsed.eventName,
        nameSpace: useBeforeParsed.nameSpace,
        isUseBefore: true,
        isUseAfter: false,
        isUseBeforeAll: false,
        isUseAfterAll: false
      };

      var normalParsed = Object.assign({}, useBeforeAllParsed);
      normalParsed.event = {
        eventId: eventId,
        type: "cascade",
        eventName: normalParsed.eventName,
        nameSpace: normalParsed.nameSpace,
        isUseBeforeAll: false,
        isUseBefore: false,
        isUseAfter: false,
        isUseAfterAll: false
      };

      var useAfterParsed = Object.assign({}, useBeforeAllParsed);
      useAfterParsed.event = {
        eventId: eventId,
        type: "cascade",
        eventName: useAfterParsed.eventName,
        nameSpace: useAfterParsed.nameSpace,
        isUseBeforeAll: false,
        isUseBefore: false,
        isUseAfter: true,
        isUseAfterAll: false
      };

      function afterAll(input) {
        var useAfterParsed = Object.assign({}, useBeforeAllParsed);
        useAfterParsed.data = input;
        useAfterParsed.event = {
          eventId: eventId,
          type: "cascade",
          eventName: useAfterParsed.eventName,
          nameSpace: useAfterParsed.nameSpace,
          isUseBeforeAll: false,
          isUseBefore: false,
          isUseAfter: false,
          isUseAfterAll: true
        };
        return root._useAfterAll._cascade(useAfterParsed);
      }

      var normalListeners = void 0;
      if (nameSpace) {
        normalListeners = root.listeners(nameSpace, eventName);
      } else {
        normalListeners = root.listeners(eventName);
      }

      var p = void 0;

      p = root._useBeforeAll._cascade(useBeforeAllParsed);

      // useBefore and useAfter are glued with 'on' listeners
      // inlineOn is needed to pass in before and after from root to eventorbasic
      var inlineOn = {
        _before: root._useBefore,
        beforeParsed: useBeforeParsed,
        _after: root._useAfter,
        afterParsed: useAfterParsed
      };

      p = p.then(function (result) {
        normalParsed.data = result;
        return root._normal._cascade(normalParsed, inlineOn);
      });

      p = p.then(afterAll);

      return p.then(function (result) {
        clearTimeout(finished);
        return result;
      });
    };

    root.listeners = function listeners() {
      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      return root._normal.listeners.apply(root._normal, args);
    };

    root.allListeners = function allListeners() {
      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
        args[_key13] = arguments[_key13];
      }

      return [].concat(_toConsumableArray(root._useBeforeAll.listeners.apply(root._useBeforeAll, args)), _toConsumableArray(root._useBefore.listeners.apply(root._useBefore, args)), _toConsumableArray(root._normal.listeners.apply(root._normal, args)), _toConsumableArray(root._useAfter.listeners.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.listeners.apply(root._useAfterAll, args)));
    };

    root.getListenersFromNamespace = function getListenersFromNamespace() {
      for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
        args[_key14] = arguments[_key14];
      }

      return root._normal.getListenersFromNamespace.apply(root._normal, args);
    };

    root.getAllListenersFromNamespace = function getAllListenersFromNamespace() {
      for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
        args[_key15] = arguments[_key15];
      }

      return [].concat(_toConsumableArray(root._useBeforeAll.getListenersFromNamespace.apply(root._useBeforeAll, args)), _toConsumableArray(root._useBefore.getListenersFromNamespace.apply(root._useBefore, args)), _toConsumableArray(root._normal.getListenersFromNamespace.apply(root._normal, args)), _toConsumableArray(root._useAfter.getListenersFromNamespace.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.getListenersFromNamespace.apply(root._useAfterAll, args)));
    };

    root.removeListenersFromNamespace = root.offNamespace = function removeListenersFromNamespace() {
      for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
        args[_key16] = arguments[_key16];
      }

      return root._normal.removeListenersFromNamespace.apply(root._normal, args);
    };

    root.removeAllListenersFromNamespace = root.offAllNamespace = function removeAllListenersFromNamespace() {
      for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
        args[_key17] = arguments[_key17];
      }

      return root._normal.removeListenersFromNamespace.apply(root._normal, args) + root._useBeforeAll.removeListenersFromNamespace.apply(root._useBeforeAll, args) + root._useBefore.removeListenersFromNamespace.apply(root._useBefore, args) + root._useAfter.removeListenersFromNamespace.apply(root._useAfter, args) + root._useAfterAll.removeListenersFromNamespace.apply(root._useAfterAll, args);
    };

    root.wildcardMatchEventName = function wildcardMatchEventName() {
      for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
        args[_key18] = arguments[_key18];
      }

      return root._normal.wildcardMatchEventName.apply(root._normal, args);
    };

    root.constructor = Eventor;

    return root;
  }

  function EventorConstructor(opts) {
    var eventor = Eventor(opts);
    eventor.before = Eventor(opts);
    eventor.after = eventor;
    return eventor;
  }

  return EventorConstructor;
}();

if (typeof module != "undefined") {
  if (typeof module.exports != "undefined") {
    module.exports = Eventor;
  }
}
if (typeof window != "undefined") {
  window.Eventor = Eventor;
}
