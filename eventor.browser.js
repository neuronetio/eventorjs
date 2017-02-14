"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
      if (typeof opts.promise == "undefined") {
        this.promise = Promise;
      } else {
        this.promise = opts.promise;
      }
      if (typeof opts.delimeter == "string") {
        if (opts.delimeter.length > 1) {
          throw new Error("Delimeter should be one character long.");
        }
        this.delimeter = opts.delimeter;
      }
    }

    _createClass(EventorBasic, [{
      key: "generateId",
      value: function generateId() {
        return ++this._shared.lastId;
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
        // by default nameSpace is "" because we later can call only those
        // listeners with no nameSpace by emit("","eventName"); nameSpace("")===nameSpace("")
        var isUseBefore = false;
        var isUseAfter = false;
        var isUseAfterAll = false;
        var emptyArgs = false;

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        args.forEach(function (arg) {
          if (typeof arg === "undefined" || arg == null) {
            emptyArgs = true;
          }
        });
        if (emptyArgs) {
          return false;
        }
        if (typeof args[0] !== "string" && args[0].constructor.name != "RegExp") {
          throw new TypeError("First argument should be string or RegExp in Eventor.on method");
        }
        if (typeof args[1] === "function") {
          // eventName,callback, "before" or "after"
          eventName = args[0];
          callback = args[1];
          if (typeof args[2] === "string") {
            if (args[2] === "before") {
              isUseBefore = true;
            }
            if (args[2] === "after") {
              isUseAfter = true;
            }
            if (args[2] === "afterAll") {
              isUseAfterAll = true;
            }
          }
        } else if (typeof args[0] === "string" && (typeof args[1] === "string" || args[1].constructor.name === "RegExp") && typeof args[2] === "function") {
          // nameSpace, eventName, callback,"before" or "after"
          nameSpace = args[0];
          eventName = args[1];
          callback = args[2];
          if (typeof args[3] === "string") {
            if (args[3] === "before") {
              isUseBefore = true;
            }
            if (args[3] === "after") {
              isUseAfter = true;
            }
            if (args[2] === "afterAll") {
              isUseAfterAll = true;
            }
          }
        } else {
          // second argument is not a callback and not a eventname
          throw new TypeError("Second argument should be string or function (callback) in Eventor.on method");
        }

        var wildcarded = eventName.constructor.name == "RegExp" || eventName.indexOf("*") >= 0;
        var listenerId = this.generateId();
        var listener = {
          id: listenerId,
          eventName: eventName,
          callback: callback,
          nameSpace: nameSpace,
          isWildcard: wildcarded,
          isUseBefore: isUseBefore,
          isUseAfter: isUseAfter,
          isUseAfterAll: isUseAfterAll
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
    }, {
      key: "removeListener",
      value: function removeListener(listenerId) {
        var listener = this._allListeners[listenerId];
        var eventName = listener.eventName;
        if (!listener.isWildcard) {
          var pos = this._listeners[eventName].indexOf(listener);
          this._listeners[eventName].splice(pos, 1);
        } else {
          var _pos = this._wildcardListeners[eventName].indexOf(listener);
          this._wildcardListeners[eventName].splice(_pos, 1);
        }
        delete this._allListeners[listenerId];
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
      key: "removeNameSpaceListeners",
      value: function removeNameSpaceListeners(nameSpace) {
        var _this = this;

        var listeners = this.getNameSpaceListeners(nameSpace);
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
          var str = wildcard.replace(/[^a-z0-9]{1}/gi, "\\$&").replace(/\\\*\\\*/gi, ".*").replace(/\\\*/gi, "[^\\" + this.delimeter + "]*");
          str = "^" + str + "$";
          wildcard = new RegExp(str);
        }
        return eventName.match(wildcard);
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
            return listener._tempMatches != null;
          });
          pushArray(wildcarded, listeners);
          //listeners.push(...wildcarded);

          // it is better to sort couple of events instead of changing core structure
          listeners.sort(function (a, b) {
            return a.id - b.id;
          });
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
            return listener._tempMatches != null;
          } else {
            return listener.eventName === eventName;
          }
        });

        return filtered.sort(function (a, b) {
          return a.id - b.id;
        });
      }
    }, {
      key: "listeners",
      value: function listeners() {
        if (arguments.length === 0) {
          var all = [];
          pushObjAsArray(this._allListeners, all);
          return all;
        } else if (arguments.length == 1) {
          return this._getListenersForEvent(arguments.length <= 0 ? undefined : arguments[0]);
        } else if (arguments.length == 2) {
          var listeners = this.getNameSpaceListeners(arguments.length <= 0 ? undefined : arguments[0]);
          return this._getListenersForEventFromArray(arguments.length <= 1 ? undefined : arguments[1], listeners);
        }
      }
    }, {
      key: "getNameSpaceListeners",
      value: function getNameSpaceListeners(nameSpace) {
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

          if (args.length == 1) {
            //eventName
            return false; // emitted event must have a data to emit
          } else if (args.length == 2) {
            //eventName,data
            result.eventName = args[0];
            result.data = args[1];
          } else if (args.length == 3) {
            //nameSpace,eventName,data
            result.nameSpace = args[0];
            result.eventName = args[1];
            result.data = args[2];
          } else {
            throw new Error("Argument length is incorrect\n" + JSON.stringify(args));
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
      value: function _handleError(error) {
        var _this4 = this;

        var handleItOutsideTry = function handleItOutsideTry(e) {
          // we want to throw errors in errorEventsErrorHandler
          _this4._errorEventsErrorHandler(e);
        };
        try {
          this.root.emit("error", error).catch(handleItOutsideTry);
        } catch (e) {
          handleItOutsideTry(e);
        }
      }

      /**
       * after is to immediately execute after middlewares, right after normal is fired
       * after is optional argument and in most cases should not be used
       * after is an object with _after EventorBasic and parsedArgs to emit
       * after._after , after.parsedArgs
       */

    }, {
      key: "_emit",
      value: function _emit(parsedArgs, after) {
        var _this5 = this;

        var listeners = this._getListenersFromParsedArguments(parsedArgs); // _tempMatches
        if (listeners.length == 0) {
          return this.promise.all([]);
        }
        var results = [];
        var len = listeners.length;
        var i = -1;
        while (++i < len) {
          var listener = listeners[i];
          var eventObj = Object.assign({}, parsedArgs.event);
          eventObj.listener = listener;
          // _tempMatches are only temporairy data from _getListenersForEvent
          // becase we don't want to parse regex multiple times (performance)
          eventObj.matches = listener._tempMatches;
          delete listener._tempMatches;

          var promise = void 0;
          try {
            promise = listener.callback(parsedArgs.data, eventObj);
            if (promise instanceof this.promise) {
              // we must catch an errors end emit them - error that are inside a promise
              promise.catch(function (e) {
                if (parsedArgs.eventName != "error") {
                  _this5._handleError(e); // for 'error' event
                }
              });
            }
          } catch (e) {
            if (parsedArgs.eventName != "error") {
              // we don't want to emit error from error (infinite loop)
              this._handleError(e);
              promise = new this.promise(function (resolve, reject) {
                reject(e);
              });
            } else {
              throw e;
            }
          }

          if (typeof after != "undefined") {

            var promiseAfter = void 0;
            // we have an after job to do before all of the task resolves
            if (promise instanceof this.promise) {
              promiseAfter = promise.then(function (result) {
                var parsed = Object.assign({}, after.parsedArgs);
                parsed.data = result;
                parsed.event = Object.assign({}, parsed.event);
                // after.parsedArgs will be passed after each listerner
                // so it must be cloned for each emit event
                return after._after._cascade(parsed);
              });
            } else {
              // if listener doesn't return a promise we must make it
              after.parsedArgs.data = promise; // promise is a normal value
              promiseAfter = after._after._cascade(after.parsedArgs);
            }
            results.push(promiseAfter);
          } else {
            results.push(promise);
          }
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
          isUseBefore: parsedArgs.isUseBefore,
          isUseAfter: parsedArgs.isUseAfter,
          isUseAfterAll: parsedArgs.isUseAfterAll
        };

        return this._emit(parsedArgs);
      }
    }, {
      key: "_cascade",
      value: function _cascade(parsedArgs) {
        var _this6 = this;

        var listeners = this._getListenersFromParsedArguments(parsedArgs);
        var result = this.promise.resolve(parsedArgs.data);
        if (listeners.length == 0) {
          return result;
        }
        var len = listeners.length;
        var i = -1;

        var _loop = function _loop() {
          var listener = listeners[i];
          result = result.then(function (currentData) {
            var eventObj = Object.assign({}, parsedArgs.event);
            eventObj.listener = listener;
            // _tempMatches are only temporairy data from _getListenersForEvent
            // becase we don't want to parse regex multiple times (performance)
            eventObj.matches = listener._tempMatches;
            delete listener._tempMatches;
            var promise = void 0;
            try {
              promise = listener.callback(currentData, eventObj);
              if (promise instanceof _this6.promise) {
                // we must catch an errors end emit them - error that are inside a promise
                // this is another branch so it will no affect normal listeners
                promise.catch(function (e) {
                  if (parsedArgs.eventName != "error") {
                    _this6._handleError(e); // for 'error' event
                  }
                });
              }
            } catch (e) {
              if (parsedArgs.eventName != "error") {
                _this6._handleError(e);
              }
              return new _this6.promise(function (resolve, reject) {
                reject(e);
              });
            }
            return promise;
          });
        };

        while (++i < len) {
          _loop();
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
    opts.root = root;
    root._useBefore = new EventorBasic(opts);
    root._normal = new EventorBasic(opts);
    root._useAfter = new EventorBasic(opts);
    root._useAfterAll = new EventorBasic(opts);

    root.on = function on() {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return root._normal.on.apply(root._normal, args);
    };

    root.removeListener = function removeListener(listenerId) {
      listenerId = listenerId.toString();
      if (Object.keys(root._normal._allListeners).indexOf(listenerId) >= 0) {
        return root._normal.removeListener.apply(root._normal, [listenerId]);
      } else if (Object.keys(root._useBefore._allListeners).indexOf(listenerId) >= 0) {
        return root._useBefore.removeListener.apply(root._useBefore, [listenerId]);
      } else if (Object.keys(root._useAfter._allListeners).indexOf(listenerId) >= 0) {
        return root._useAfter.removeListener.apply(root._useAfter, [listenerId]);
      } else if (Object.keys(root._useAfterAll._allListeners).indexOf(listenerId) >= 0) {
        return root._useAfterAll.removeListener.apply(root._useAfterAll, [listenerId]);
      } else {
        var error = new Error("No listener found with specified id [" + listenerId + "]");
        //root._normal.emit("error",error);
        throw error;
      }
    };

    root.useBefore = function before() {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      return root._useBefore.on.apply(root._useBefore, args);
    };

    root.useAfter = function after() {
      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return root._useAfter.on.apply(root._useAfter, args);
    };

    root.useAfterAll = function afterAll() {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return root._useAfterAll.on.apply(root._useAfterAll, args);
    };

    root.emit = function emit() {
      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      var useBeforeParsed = root._normal._parseArguments(args);
      var eventName = useBeforeParsed.eventName;
      var nameSpace = useBeforeParsed.nameSpace;

      useBeforeParsed.event = {
        type: "emit",
        eventName: useBeforeParsed.eventName,
        nameSpace: useBeforeParsed.nameSpace,
        isUseBefore: true,
        isUseAfter: false,
        isUseAfterAll: false
      };

      function normal(input) {

        useBeforeParsed.data = input;
        useBeforeParsed.event = {
          type: "emit",
          eventName: useBeforeParsed.eventName,
          nameSpace: useBeforeParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: false,
          isUseAfterAll: false
        };

        var useAfterParsedArgs = Object.assign({}, useBeforeParsed);
        useAfterParsedArgs.data = undefined;
        useAfterParsedArgs.event = {
          type: "emit",
          eventName: useAfterParsedArgs.eventName,
          nameSpace: useAfterParsedArgs.nameSpace,
          isUseBefore: false,
          isUseAfter: true,
          isUseAfterAll: false
        };

        var after = {
          _after: root._useAfter,
          parsedArgs: useAfterParsedArgs
        };

        //check if there are after listeners
        var p = void 0;
        var afterListeners = void 0;
        if (typeof nameSpace != "undefined") {
          afterListeners = root._useAfter.listeners(nameSpace, eventName);
        } else {
          afterListeners = root._useAfter.listeners(eventName);
        }
        if (afterListeners.length === 0) {
          p = root._normal._emit(useBeforeParsed);
        } else {
          p = root._normal._emit(useBeforeParsed, after);
        }

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
              type: "emit",
              eventName: useAfterParsed.eventName,
              nameSpace: useAfterParsed.nameSpace,
              isUseBefore: false,
              isUseAfter: false,
              isUseAfterAll: true
            };
            // in afterAll we are running one callback to array of all results
            return root._useAfterAll._cascade(useAfterParsed);
          });
        }

        return p;
      }

      // optimizations - we don't want to parse middlewares if there isn't one
      var listeners = void 0;
      if (typeof nameSpace === "undefined") {
        listeners = root._useBefore.listeners(eventName);
      } else {
        listeners = root._useBefore.listeners(nameSpace, eventName);
      }
      var result = void 0;
      if (listeners.length == 0) {
        result = normal(useBeforeParsed.data);
      } else {
        result = root._useBefore._cascade(useBeforeParsed).then(normal);
      }
      return result;
    };

    root.cascade = function cascade() {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      var useBeforeParsed = root._normal._parseArguments(args);
      var nameSpace = useBeforeParsed.nameSpace;
      var eventName = useBeforeParsed.eventName;

      useBeforeParsed.event = {
        type: "cascade",
        eventName: useBeforeParsed.eventName,
        nameSpace: useBeforeParsed.nameSpace,
        isUseBefore: true,
        isUseAfter: false,
        isUseAfterAll: false
      };

      function normal(input) {
        var normalParsed = Object.assign({}, useBeforeParsed);
        normalParsed.data = input;
        normalParsed.event = {
          type: "cascade",
          eventName: normalParsed.eventName,
          nameSpace: normalParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: false,
          isUseAfterAll: false
        };
        return root._normal._cascade(normalParsed);
      }

      function after(input) {
        var useAfterParsed = Object.assign({}, useBeforeParsed);
        useAfterParsed.data = input;
        useAfterParsed.event = {
          type: "cascade",
          eventName: useAfterParsed.eventName,
          nameSpace: useAfterParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: true,
          isUseAfterAll: false
        };
        return root._useAfter._cascade(useAfterParsed);
      }

      function afterAll(input) {
        var useAfterParsed = Object.assign({}, useBeforeParsed);
        useAfterParsed.data = input;
        useAfterParsed.event = {
          type: "cascade",
          eventName: useAfterParsed.eventName,
          nameSpace: useAfterParsed.nameSpace,
          isUseBefore: false,
          isUseAfter: false,
          isUseAfterAll: true
        };
        return root._useAfterAll._cascade(useAfterParsed);
      }

      var doBefore = false;
      var doAfter = false;
      var doAfterAll = false;

      if (typeof nameSpace == "undefined") {
        var beforeListeners = root._useBefore.listeners(eventName);
        if (beforeListeners.length > 0) {
          doBefore = true;
        }

        var afterListeners = root._useAfter.listeners(eventName);
        if (afterListeners.length > 0) {
          doAfter = true;
        }

        var afterAllListeners = root._useAfterAll.listeners(eventName);
        if (afterAllListeners.length > 0) {
          doAfterAll = true;
        }
      } else {
        var _beforeListeners = root._useBefore.listeners(nameSpace, eventName);
        if (_beforeListeners.length > 0) {
          doBefore = true;
        }

        var _afterListeners = root._useAfter.listeners(nameSpace, eventName);
        if (_afterListeners.length > 0) {
          doAfter = true;
        }

        var _afterAllListeners = root._useAfterAll.listeners(nameSpace, eventName);
        if (_afterAllListeners.length > 0) {
          doAfterAll = true;
        }
      }

      var p = void 0;

      if (doBefore) {
        p = root._useBefore._cascade(useBeforeParsed).then(normal);
      } else {
        p = normal(useBeforeParsed.data);
      }

      if (doAfter) {
        p = p.then(after);
      }
      if (doAfterAll) {
        p = p.then(afterAll);
      }

      return p;
    };

    root.listeners = function listeners() {
      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      return root._normal.listeners.apply(root._normal, args);
    };

    root.allListeners = function allListeners() {
      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      return [].concat(_toConsumableArray(root._useBefore.listeners.apply(root._useBefore, args)), _toConsumableArray(root._normal.listeners.apply(root._normal, args)), _toConsumableArray(root._useAfter.listeners.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.listeners.apply(root._useAfterAll, args)));
    };

    root.getNameSpaceListeners = function getNameSpaceListeners() {
      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
        args[_key13] = arguments[_key13];
      }

      return root._normal.getNameSpaceListeners.apply(root._normal, args);
    };

    root.getAllNameSpaceListeners = function getAllNameSpaceListeners() {
      for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
        args[_key14] = arguments[_key14];
      }

      return [].concat(_toConsumableArray(root._useBefore.getNameSpaceListeners.apply(root._useBefore, args)), _toConsumableArray(root._normal.getNameSpaceListeners.apply(root._normal, args)), _toConsumableArray(root._useAfter.getNameSpaceListeners.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.getNameSpaceListeners.apply(root._useAfterAll, args)));
    };

    root.removeNameSpaceListeners = function removeNameSpaceListeners() {
      for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
        args[_key15] = arguments[_key15];
      }

      return root._normal.removeNameSpaceListeners.apply(root._normal, args);
    };

    root.removeAllNameSpaceListeners = function removeAllNameSpaceListeners() {
      for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
        args[_key16] = arguments[_key16];
      }

      return root._normal.removeNameSpaceListeners.apply(root._normal, args) + root._useBefore.removeNameSpaceListeners.apply(root._useBefore, args) + root._useAfter.removeNameSpaceListeners.apply(root._useAfter, args) + root._useAfterAll.removeNameSpaceListeners.apply(root._useAfterAll, args);
    };

    root.wildcardMatchEventName = function wildcardMatchEventName() {
      for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
        args[_key17] = arguments[_key17];
      }

      return root._normal.wildcardMatchEventName.apply(root._normal, args);
    };

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
