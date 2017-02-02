/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Eventor = function () {

	  "use strict";

	  var EventorBasic = function () {
	    function EventorBasic(opts) {
	      _classCallCheck(this, EventorBasic);

	      this._listeners = {};
	      this._allListeners = {};
	      this._wildcardListeners = {};
	      this._allWildcardListeners = [];
	      this.delimeter = ".";
	      this._shared = opts._shared;
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
	        var args = new Array(arguments.length);
	        for (var i = 0; i < args.length; ++i) {
	          args[i] = arguments[i];
	        }
	        var isUseBefore = false;
	        var isUseAfter = false;
	        var isUseAfterAll = false;
	        var emptyArgs = false;
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
	        var args = new Array(arguments.length);
	        for (var i = 0; i < args.length; ++i) {
	          args[i] = arguments[i];
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

	        var listeners = [];
	        if (typeof this._listeners[eventName] != "undefined") {
	          listeners = [].concat(_toConsumableArray(this._listeners[eventName]));
	        }

	        // now we must add wildcards
	        // listener from now on will have _tempMatches property
	        // which will change between different events when eventName argument change

	        if (this._allWildcardListeners.length > 0) {
	          var _listeners;

	          var wildcarded = this._allWildcardListeners.filter(function (listener) {
	            listener._tempMatches = _this2.wildcardMatchEventName(listener.eventName, eventName);
	            return listener._tempMatches != null;
	          });
	          (_listeners = listeners).push.apply(_listeners, _toConsumableArray(wildcarded));

	          // it is better to sort couple of events instead of changing core structure
	          listeners.sort(function (a, b) {
	            return a.id - b.id;
	          });
	        }

	        return listeners;
	      }
	    }, {
	      key: "_getListenersForEventFromArray",
	      value: function _getListenersForEventFromArray(eventName, listeners) {
	        var _this3 = this;

	        // listeners may be list of all different listeners types (namespaced, wildcarded...)
	        return listeners.filter(function (listener) {
	          if (listener.isWildcard) {
	            listener._tempMatches = _this3.wildcardMatchEventName(listener.eventName, eventName);
	            return listener._tempMatches != null;
	          } else {
	            return listener.eventName === eventName;
	          }
	        }).sort(function (a, b) {
	          return a.id - b.id;
	        });
	      }
	    }, {
	      key: "listeners",
	      value: function listeners() {
	        if (arguments.length === 0) {
	          var all = [];
	          for (var listenerId in this._allListeners) {
	            all.push(this._allListeners[listenerId]);
	          }
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
	          listeners = this.listeners(parsedArgs.eventName);
	          listeners = listeners.filter(function (listener) {
	            return listener.nameSpace === parsedArgs.nameSpace;
	          });
	        }
	        return listeners;
	      }

	      /**
	       * after is optional argument and in most cases should not be used
	       * after is an object with _after EventorBasic and parsedArgs to emit
	       * after._after , after.parsedArgs
	       */

	    }, {
	      key: "_emit",
	      value: function _emit(parsedArgs, after) {
	        var listeners = this._getListenersFromParsedArguments(parsedArgs); // _tempMatches
	        if (listeners.length == 0) {
	          return [];
	        }
	        var stopped = undefined;
	        var stoppedTimes = 0;
	        var results = [];
	        var eventObj = parsedArgs.event;
	        for (var i = 0, len = listeners.length; i < len; i++) {
	          var listener = listeners[i];
	          //eventObj=Object.assign({},eventObj);
	          //// we cannot clone eventObj because we loose reference to stopped in _addStopMethod
	          eventObj.listener = listener;
	          // _tempMatches are only temporairy data from _getListenersForEvent
	          // becase we don't want to parse regex multiple times (performance)
	          eventObj.matches = listener._tempMatches;
	          delete listener._tempMatches;

	          var promise = void 0;
	          if (typeof stopped == "undefined") {
	            promise = listener.callback(parsedArgs.data, eventObj);
	          }

	          if (typeof after != "undefined") {
	            // we have an after job to do before all of the task resolves
	            if (promise instanceof this.promise) {
	              promise = promise.then(function (result) {
	                var parsed = Object.assign({}, after.parsedArgs);
	                parsed.data = result;
	                parsed.event = Object.assign({}, parsed.event);
	                if (_typeof(parsed.event.stopped) === "object") {
	                  parsed.event.stopped = Object.assign({}, parsed.event.stopped);
	                }
	                // after.parsedArgs will be passed after each listerner
	                // so it must be cloned for each emit event
	                return after._after._cascade(parsed);
	              });
	            } else {
	              // if listener doesn't return a promise we must make it
	              after.parsedArgs.data = promise; // promise is a normal value
	              promise = after._after._cascade(after.parsedArgs);
	            }
	          }

	          if (stoppedTimes === 0) {
	            results.push(promise);
	          }
	          if (typeof eventObj.stopped != "undefined") {
	            stopped = eventObj.stopped;
	            stoppedTimes++;
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
	        var args = Array.prototype.slice.call(arguments);
	        var parsedArgs = this._validateArgs(args);

	        parsedArgs.event = {
	          type: "emit",
	          eventName: parsedArgs.eventName,
	          nameSpace: parsedArgs.nameSpace,
	          isUseBefore: parsedArgs.isUseBefore,
	          isUseAfter: parsedArgs.isUseAfter,
	          isUseAfterAll: parsedArgs.isUseAfterAll
	        };

	        this._addStopMethod(parsedArgs.event);

	        return this._emit(parsedArgs);
	      }
	    }, {
	      key: "_cascade",
	      value: function _cascade(parsedArgs) {
	        var listeners = this._getListenersFromParsedArguments(parsedArgs);
	        var result = this.promise.resolve(parsedArgs.data);
	        if (listeners.length == 0) {
	          return result;
	        }
	        var stoppedCounter = 0;
	        var eventObj = parsedArgs.event; // we are not cloning because _addStopMethod will lose reference
	        listeners.forEach(function (listener, index) {
	          result = result.then(function (currentData) {
	            // we cannot clone event because _addStopMethod will loose reference
	            eventObj.listener = listener;
	            // _tempMatches are only temporairy data from _getListenersForEvent
	            // becase we don't want to parse regex multiple times (performance)
	            eventObj.matches = listener._tempMatches;
	            delete listener._tempMatches;
	            if (stoppedCounter === 0) {
	              var promise = listener.callback(currentData, eventObj);
	              if (typeof eventObj.stopped != "undefined") {
	                stoppedCounter++;
	              }
	              return promise;
	            } else {
	              return currentData;
	            }
	          });
	        });
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
	        var args = Array.prototype.slice.call(arguments);
	        var parsedArgs = this._validateArgs(args);
	        parsedArgs.event = {
	          type: "cascade",
	          eventName: parsedArgs.eventName,
	          nameSpace: parsedArgs.nameSpace,
	          isUseBefore: parsedArgs.isUseBefore,
	          isUseAfter: parsedArgs.isUseAfter,
	          isUseAfterAll: parsedArgs.isUseAfterAll
	        };

	        this._addStopMethod(parsedArgs.event);

	        return this._cascade(parsedArgs);
	      }
	    }, {
	      key: "_addStopMethod",
	      value: function _addStopMethod(event) {
	        function stop(reason) {
	          this.stopped = reason || true;
	        }
	        event.stopped = undefined;
	        event.stop = stop;
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
	    root._useBefore = new EventorBasic(opts);
	    root._normal = new EventorBasic(opts);
	    root._useAfter = new EventorBasic(opts);
	    root._useAfterAll = new EventorBasic(opts);

	    root.on = function on() {
	      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	        args[_key] = arguments[_key];
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
	      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        args[_key2] = arguments[_key2];
	      }

	      return root._useBefore.on.apply(root._useBefore, args);
	    };

	    root.useAfter = function after() {
	      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
	        args[_key3] = arguments[_key3];
	      }

	      return root._useAfter.on.apply(root._useAfter, args);
	    };

	    root.useAfterAll = function afterAll() {
	      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
	        args[_key4] = arguments[_key4];
	      }

	      return root._useAfterAll.on.apply(root._useAfterAll, args);
	    };

	    root.emit = function emit() {
	      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
	        args[_key5] = arguments[_key5];
	      }

	      var useBeforeParsed = root._normal._parseArguments(args);
	      useBeforeParsed.event = {
	        type: "emit",
	        eventName: useBeforeParsed.eventName,
	        nameSpace: useBeforeParsed.nameSpace,
	        isUseBefore: true,
	        isUseAfter: false,
	        isUseAfterAll: false
	      };

	      root._useBefore._addStopMethod(useBeforeParsed.event);
	      return root._useBefore._cascade(useBeforeParsed).then(function (input) {

	        //let normalParsed = Object.assign({},useBeforeParsed);
	        useBeforeParsed.data = input;
	        useBeforeParsed.event = {
	          type: "emit",
	          eventName: useBeforeParsed.eventName,
	          nameSpace: useBeforeParsed.nameSpace,
	          isUseBefore: false,
	          isUseAfter: false,
	          isUseAfterAll: false
	        };
	        root._normal._addStopMethod(useBeforeParsed.event);

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
	        root._useAfter._addStopMethod(useAfterParsedArgs.event);
	        var after = {
	          _after: root._useAfter,
	          parsedArgs: useAfterParsedArgs
	        };

	        return root._normal._emit(useBeforeParsed, after);
	      }).then(function (results) {
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
	        root._useAfterAll._addStopMethod(useAfterParsed.event);
	        // in afterAll we are running one callback to array of all results
	        return root._useAfterAll._cascade(useAfterParsed);
	      });
	    };

	    root.cascade = function cascade() {
	      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
	        args[_key6] = arguments[_key6];
	      }

	      var useBeforeParsed = root._normal._parseArguments(args);
	      useBeforeParsed.event = {
	        type: "cascade",
	        eventName: useBeforeParsed.eventName,
	        nameSpace: useBeforeParsed.nameSpace,
	        isUseBefore: true,
	        isUseAfter: false,
	        isUseAfterAll: false
	      };
	      root._useBefore._addStopMethod(useBeforeParsed.event);
	      return root._useBefore._cascade(useBeforeParsed).then(function (input) {
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
	        root._normal._addStopMethod(normalParsed.event);
	        return root._normal._cascade(normalParsed);
	      }).then(function (results) {
	        var useAfterParsed = Object.assign({}, useBeforeParsed);
	        useAfterParsed.data = results;
	        useAfterParsed.event = {
	          type: "cascade",
	          eventName: useAfterParsed.eventName,
	          nameSpace: useAfterParsed.nameSpace,
	          isUseBefore: false,
	          isUseAfter: true,
	          isUseAfterAll: false
	        };
	        root._useAfter._addStopMethod(useAfterParsed.event);
	        return root._useAfter._cascade(useAfterParsed);
	      }).then(function (results) {
	        var useAfterParsed = Object.assign({}, useBeforeParsed);
	        useAfterParsed.data = results;
	        useAfterParsed.event = {
	          type: "cascade",
	          eventName: useAfterParsed.eventName,
	          nameSpace: useAfterParsed.nameSpace,
	          isUseBefore: false,
	          isUseAfter: false,
	          isUseAfterAll: true
	        };
	        root._useAfterAll._addStopMethod(useAfterParsed.event);
	        return root._useAfterAll._cascade(useAfterParsed);
	      });
	    };

	    root.listeners = function listeners() {
	      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
	        args[_key7] = arguments[_key7];
	      }

	      return root._normal.listeners.apply(root._normal, args);
	    };

	    root.allListeners = function allListeners() {
	      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
	        args[_key8] = arguments[_key8];
	      }

	      return [].concat(_toConsumableArray(root._useBefore.listeners.apply(root._useBefore, args)), _toConsumableArray(root._normal.listeners.apply(root._normal, args)), _toConsumableArray(root._useAfter.listeners.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.listeners.apply(root._useAfterAll, args)));
	    };

	    root.getNameSpaceListeners = function getNameSpaceListeners() {
	      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
	        args[_key9] = arguments[_key9];
	      }

	      return root._normal.getNameSpaceListeners.apply(root._normal, args);
	    };

	    root.getAllNameSpaceListeners = function getAllNameSpaceListeners() {
	      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
	        args[_key10] = arguments[_key10];
	      }

	      return [].concat(_toConsumableArray(root._useBefore.getNameSpaceListeners.apply(root._useBefore, args)), _toConsumableArray(root._normal.getNameSpaceListeners.apply(root._normal, args)), _toConsumableArray(root._useAfter.getNameSpaceListeners.apply(root._useAfter, args)), _toConsumableArray(root._useAfterAll.getNameSpaceListeners.apply(root._useAfterAll, args)));
	    };

	    root.removeNameSpaceListeners = function removeNameSpaceListeners() {
	      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
	        args[_key11] = arguments[_key11];
	      }

	      return root._normal.removeNameSpaceListeners.apply(root._normal, args);
	    };

	    root.removeAllNameSpaceListeners = function removeAllNameSpaceListeners() {
	      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
	        args[_key12] = arguments[_key12];
	      }

	      return root._normal.removeNameSpaceListeners.apply(root._normal, args) + root._useBefore.removeNameSpaceListeners.apply(root._useBefore, args) + root._useAfter.removeNameSpaceListeners.apply(root._useAfter, args) + root._useAfterAll.removeNameSpaceListeners.apply(root._useAfterAll, args);
	    };

	    root.wildcardMatchEventName = function wildcardMatchEventName() {
	      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
	        args[_key13] = arguments[_key13];
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

	if (true) {
	  if (typeof module.exports != "undefined") {
	    module.exports = Eventor;
	  }
	}
	if (typeof window != "undefined") {
	  window.Eventor = Eventor;
	}

/***/ }
/******/ ]);