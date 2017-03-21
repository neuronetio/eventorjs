const pathToRegexp = require("path-to-regexp");
const generateuid = require("generate-uid");

var Eventor = (function(){
"use strict";

function copyArray(source, array) {
  return array = source.slice();
}

function pushArray(source, array) {
  let index = -1
  const length = source.length
  array || (array = Array(length))
  let last=array.length;
  while (++index < length) {
    array[last] = source[index]
    last++
  }
  return array
}

function pushObjAsArray(source,array){
  array || (array = Array(source.length));
  let last = array.length;
  for(let item in source){
    array[last]=source[item];
    last++
  }
  return array;
}

class EventorBasic {

  constructor(opts){
    this._listeners = {};
    this._allListeners = {};
    this._wildcardListeners = {};
    this._allWildcardListeners = [];
    this.delimeter=".";
    this._shared = opts._shared;
    if(typeof opts.errorEventsErrorHandler=="function"){
      this._errorEventsErrorHandler = opts.errorEventsErrorHandler;
      // if there was an error in 'error' event, now we can handle it
    }else{
      this._errorEventsErrorHandler = function(){};//noop
    }
    this.root=opts.root;
    this.timeout=opts.timeout || 60*1000;
    if(typeof opts.promise=="undefined"){
      this.promise = Promise;
    }else{
      this.promise = opts.promise;
    }
    if(typeof opts.unique=="undefined"){
      this.unique = generateuid;
    }else{
      this.unique = opts.unique;
    }
    if(typeof opts.delimeter=="string"){
      if(opts.delimeter.length>1){
        throw new Error("Delimeter should be one character long.");
      }
      this.delimeter=opts.delimeter;
    }
  }

  _generateListenerId(){
    return ++this._shared.lastId;
  }

  /**
   * if there is no 'error' listener throw it
   * every internal eventor error should go through here
   */
  _internalError(error){
    let errorListeners = this.root.listeners("error");
    if(errorListeners.length==0){
      throw error;
    }else{
      this._handleError({error,event:{}});
    }
  }

  /**
   * start listening to an event
   * arguments:
   *  eventName {String}, callback {function}, position(optional) {integer}
   *  nameSpace {String}, eventName {string}, callback {function}, position (optional) {integer}
   *
   */
  on(...args){
    let eventName="";
    let callback = ()=>{};
    let nameSpace = "";
    let position;
    // by default nameSpace is "" because we later can call only those
    // listeners with no nameSpace by emit("","eventName"); nameSpace("")===nameSpace("")
    let emptyArgs=false;
    if(args.length==0){emptyArgs=true;}
    args.forEach((arg,index)=>{
      if(typeof arg==="undefined" || arg==null){emptyArgs=index;}
    });
    if(emptyArgs!==false){
      if(typeof emptyArgs=="number"){
        return this._internalError("Undefined argument at position "+emptyArgs+".\n"+JSON.stringify(args));
      }else{
        return this._internalError("It seems like we have no arguments iside 'on' method?\n"+JSON.stringify(args));
      }
    }
    if(typeof args[0]!=="string" && args[0].constructor.name!="RegExp"){
      return this._internalError("First argument should be string or RegExp in Eventor.on method.\n"+JSON.stringify(args));
    }

    if(
      (typeof args[0]==="string" || args[0].constructor.name==="RegExp") &&
      typeof args[1]==="function"
    ){// eventName,callback [,position]
      eventName=args[0];
      callback=args[1];
      if(typeof args[2]==="number"){
        position=args[2];
      }else if(typeof args[2]!=="undefined"){
        return this._internalError("Third argument should be a number.\n"+JSON.stringify(args));
      }
    }else if(
      typeof args[0]==="string" &&
      (typeof args[1]==="string" || args[1].constructor.name==="RegExp") &&
      typeof args[2]==="function"
    ){// nameSpace, eventName, callback [,position]
      nameSpace=args[0];
      eventName=args[1];
      callback=args[2];
      if(typeof args[3]==="number"){
        position=args[3];
      }else if(typeof args[3]!=="undefined"){
        return this._internalError("Fourth argument should be a number.\n"+JSON.stringify(args));
      }
    }else{ // second argument is not a callback and not a eventname
      return this._internalError("Invalid arguments inside 'on' method.\n"+JSON.stringify(args));
    }

    // wildcard is when there is an asterisk '*' or there is a ':' inside eventName (for express-like routes)
    const wildcarded = eventName.constructor.name=="RegExp" || eventName.indexOf("*")>=0 || eventName.charAt(0)=="%";

    const listenerId = this._generateListenerId();
    let wasPositioned = typeof position!=="undefined";
    let originalPosition = Object.keys(this._allListeners).length;
    if(typeof position==="undefined"){
      position = originalPosition;
    }

    let listener = {
      id:listenerId,
      eventName,
      callback,
      nameSpace,
      isWildcard:wildcarded,
      position,
      originalPosition,
      wasPositioned
    };


    if(!wildcarded){
      if(typeof this._listeners[eventName] == "undefined"){
        this._listeners[eventName]=[];
      }
      this._listeners[eventName].push(listener);
    }else{
      const regstr=eventName.toString();
      if(typeof this._wildcardListeners[regstr]=="undefined"){
        this._wildcardListeners[regstr]=[];
      }
      this._wildcardListeners[regstr].push(listener);
      this._allWildcardListeners.push(listener);
    }

    this._allListeners[listenerId]=listener;

    return listenerId;
  }

  /**
   * listenerFn or id of the listener
   */
  removeListener(listenerFn){
    let listenerId;
    if(typeof listenerFn == 'number'){
      listenerId=listenerFn;
    }else{
      let ids = Object.keys(this._allListeners);
      for(let i=0,len=ids.length;i<len;i++){
        let listener = this._allListeners[ ids[i] ];
        if(listener.callback === listenerFn){
          listenerId=listener.id;
          break;
        }
      }
    }

    let listener = this._allListeners[listenerId];
    if(typeof listener!="undefined"){
      let eventName = listener.eventName;
      if(!listener.isWildcard){
        let pos = this._listeners[eventName].indexOf(listener);
        this._listeners[eventName].splice(pos,1);
      }else{
        let pos = this._wildcardListeners[eventName].indexOf(listener);
        this._wildcardListeners[eventName].splice(pos,1);
      }
      delete this._allListeners[listenerId];
      return 1;
    }
    return 0;
  }

  off(...args){
    return this.removeListener.apply(this,args);
  }

  removeListenersFromNamespace(nameSpace){
    let listeners = this.getListenersFromNamespace(nameSpace);
    let ids = [];
    listeners.forEach((listener)=>{
      ids.push(listener.id);
    });
    ids.forEach((id)=>{
      this.removeListener(id);
    });
    return ids.length;
  }

  wildcardMatchEventName(wildcard,eventName){
    if(typeof wildcard=="string"){
      if(wildcard.charAt(0)=="%"){// express-like route '%web-request:/user/:id/jobs' or '%user.:action'
        wildcard=wildcard.substr(1);
        let keys = [];
        let wildcardReg = pathToRegexp(wildcard,keys,{});
        let matches = eventName.match(wildcardReg);
        let params = {};
        if(matches!=null && matches.length>1){
          keys.forEach((key,index)=>{
            params[key.name]=decodeURIComponent(matches[index+1]);
          });
        }
        return {matches,params}
      }else{ // user.*.jobs or user.** kind of wildcards
        let str=wildcard
        .replace(/[^a-z0-9]{1}/gi,"\\$&")
        .replace(/\\\*\\\*/gi,".*")
        .replace(/\\\*/gi,"[^\\"+this.delimeter+"]*");
        str="^"+str+"$";
        wildcard=new RegExp(str);
      }
    }
    //console.log("wildcard?",wildcard.toString(),wildcard.exec(eventName))
    // lastly wildcard if is not a string must be an RegExp
    return {
      matches:eventName.match(wildcard),
      params:{}
    };
  }

  _getListenersForEvent(eventName){

    if(this._allWildcardListeners.length>0){
      let listeners = [];
      if(typeof this._listeners[eventName]!="undefined"){
        listeners = copyArray(this._listeners[eventName]);
      }
      // now we must add wildcards
      // listener from now on will have _tempMatches property
      // which will change between different events when eventName argument change
      let wildcarded = this._allWildcardListeners.filter((listener)=>{
        listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
        return listener._tempMatches.matches!=null;
      });
      pushArray(wildcarded,listeners);
      //listeners.push(...wildcarded);

      return listeners;
    }else{
      if(typeof this._listeners[eventName]!="undefined"){
        return this._listeners[eventName];
      }else{
        return [];
      }
    }

  }

  _getListenersForEventFromArray(eventName,listeners){
    // listeners may be list of all different listeners types (namespaced, wildcarded...)
    let filtered = [];

    filtered = listeners.filter((listener)=>{
      if(listener.isWildcard){
        listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
        return listener._tempMatches.matches!=null;
      }else{
        return listener.eventName===eventName;
      }
    });

    return filtered;
  }

  _sortListeners(listeners){
    // we are only prepend listeners - and will not position them (see commits before - in this place)
    let sorted=listeners.sort(function(a,b){
      // positioned elements
      if(a.position === b.position){

        if(a.wasPositioned && b.wasPositioned){
          return b.id - a.id; // later defined listener will be the first one
        }else if(!a.wasPositioned && !b.wasPositioned){
          this._internalError("Both listeners have same position, but were not positioned manually (internal error).");
        }else{
          if(a.wasPositioned){
            return -1; // a was positioned so it will be first one
          }else{
            return 1; // b was positioned so a must move forward
          }
        }

      }
      return a.position - b.position;
    });

    return sorted;
  }

  listeners(...args){
    let listeners=[];
    if(args.length===0){
      pushObjAsArray(this._allListeners,listeners);
    }else if(args.length==1){
      listeners = this._getListenersForEvent(args[0]);
    }else if(args.length==2){
      listeners = this.getListenersFromNamespace(args[0]);
      listeners = this._getListenersForEventFromArray(args[1],listeners);
    }
    return this._sortListeners(listeners);
  }

  getListenersFromNamespace(nameSpace){
    let all = this.listeners();
    let result=all.filter((listener)=>{
      return listener.nameSpace===nameSpace;
    });
    return result;
  }

  // it is used to emit or cascade
  _parseArguments(args){
    let result = {};
    result.eventName="";
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
    if(typeof args[0] == "string"){

      if(args.length==2){//eventName,data
        result.eventName = args[0];
        result.data = args[1];
      }else if(args.length==3){//nameSpace,eventName,data
        result.nameSpace = args[0];
        result.eventName = args[1];
        result.data = args[2];
      }else{
        this._internalError(`Arguments length is incorrect\n`+JSON.stringify(args));
      }

    }else{
      return false;
    }

    return result;
  }

  _getListenersFromParsedArguments(parsedArgs){
    let listeners = [];
    if(typeof parsedArgs.nameSpace==="undefined"){
      listeners = this.listeners(parsedArgs.eventName);
    }else{
      listeners = this.listeners(parsedArgs.nameSpace,parsedArgs.eventName);
    }
    return listeners;
  }

  _handleError(errorObj){
    let handleItOutsideTry=(e)=>{// we want to throw errors in errorEventsErrorHandler
      this._errorEventsErrorHandler(e);
    }

    try{
      this.root.emit("error",errorObj)
      .catch((errorObj)=>{
        //handleItOutsideTry(errorObj.error);
        // do nothing because this errors are already handled inside _emit and _cascade
      });
    }catch(e){
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
  _emit(parsedArgs,inlineOn){

    let listeners = this._getListenersFromParsedArguments(parsedArgs);// _tempMatches
    if(listeners.length==0){return this.promise.all([]);}
    let results = [];
    let len = listeners.length;
    let i=-1;
    while(++i<len){
      let promise;
      let promiseBefore;
      let promiseAfter;

      let errorInsideBefore=false;
      // useBefore immediately before normal 'on'
      if(typeof inlineOn!="undefined"){
        let parsed = Object.assign({},inlineOn.beforeParsed);
        // we have an input from useBeforeAll here
        parsed.event = Object.assign({},parsed.event);
        // after.parsedArgs will be passed after each listerner
        // so it must be cloned for each emit event
        promiseBefore=inlineOn._before._cascade(parsed);
      }

      // normal 'on'
      let listener = listeners[i];
      let eventObj = Object.assign({},parsedArgs.event);
      eventObj.listener = listener;
      // _tempMatches are only temporairy data from _getListenersForEvent
      // becase we don't want to parse regex multiple times (performance)
      if(listener._tempMatches){
        eventObj.matches = listener._tempMatches.matches;
        eventObj.params = listener._tempMatches.params;
        delete listener._tempMatches;
      }else{
        eventObj.matches=[];
        eventObj.params={};
      }

      let normalOn=(input)=>{
        /**
            why try catch?
            because all listener.callback should be catched this way
            when we catch (try-catch) errors inside listener we can
            emit them and handle them with error, and prepare errorObj
            with current event iside (not later event)
            so no matter where the listener callback is called it must be
            wrapped inside try-catch and emitted through _handleError
          */
        let promise;
        try{
          promise=listener.callback(input,eventObj);
          if(promise instanceof this.promise){
            // we must catch an errors end emit them - error that are inside a promise
            promise=promise.catch((e)=>{
              let errorObj = {error:e,event:eventObj};
              if(parsedArgs.eventName!="error"){
                this._handleError(errorObj);// for 'error' event
              }else{
                this._errorEventsErrorHandler(e);
                // if we are emittin 'error' and there is error inside 'error' event :/:\:/
              }
              return this.promise.reject(e); // we must give error back to catch
            });
          }
        }catch(e){
          let errorObj = {error:e,event:eventObj};
          if(parsedArgs.eventName!="error"){ // we don't want to emit error from error (infinite loop)
            this._handleError(errorObj);
          }else{
            this._errorEventsErrorHandler(e);
          }
          promise = this.promise.reject(e);
        }
        return promise;
      }

      if(typeof promiseBefore!="undefined"){

          promise=promiseBefore.then(normalOn);

      }else{
        // if there is no useBefore we don't want to skip current tick (setImmediate, then)
        promise=normalOn(parsedArgs.data);

      }

      // useAfter immediately after normal 'on'
      if(typeof inlineOn!="undefined"){

          // we have an after job to do before all of the task resolves
          if(promise instanceof this.promise){
            promiseAfter = promise.then((result)=>{
              let parsed = Object.assign({},inlineOn.afterParsed);
              parsed.data=result;
              parsed.event = Object.assign({},parsed.event);
              // after.parsedArgs will be passed after each listerner
              // so it must be cloned for each emit event
              return inlineOn._after._cascade(parsed);
            });
          }else{
            // if listener doesn't return a promise we must make it
            inlineOn.afterParsed.data=promise;// promise is a normal value
            promiseAfter=inlineOn._after._cascade(inlineOn.afterParsed);
          }
          results.push(promiseAfter);

      }else{
        results.push(promise);
      }

    }
    return this.promise.all(results);
  }

  _validateArgs(args){
    let parsedArgs=this._parseArguments(args);
    return parsedArgs;
  }

  /**
   * emit an event
   * arguments:
   *  eventName {string}, data {any}
   *  nameSpace {string}, eventName {string}, data {any}
   */
  emit(...args){
    let parsedArgs=this._validateArgs(args);

    parsedArgs.event={
      type:"emit",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
      isUseBeforeAll:parsedArgs.isUseBeforeAll,
      isUseBefore:parsedArgs.isUseBefore,
      isUseAfter:parsedArgs.isUseAfter,
      isUseAfterAll:parsedArgs.isUseAfterAll,
    }

    return this._emit(parsedArgs);
  }

  _cascade(parsedArgs,inlineOn){

    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let result = this.promise.resolve(parsedArgs.data);
    if(listeners.length==0){return result;}
    let len = listeners.length;
    let i=-1;
    while(++i<len){
      let listener = listeners[i];

      /**
        for each listener we are going to execute useBefore and useAfter
        like in emit mode
        if there is no 'on' listeners ther will be no useBefore and useAfter
      */

      //useBefore
      if(typeof inlineOn!="undefined"){
        result=result.then((result)=>{
          let beforeParsed=Object.assign({},inlineOn.beforeParsed);
          beforeParsed.data=result;
          beforeParsed.event=Object.assign({},beforeParsed.event);
          return inlineOn._before._cascade(beforeParsed);
        });
      }

      //on listener
      result=result.then((currentData)=>{
        let eventObj=Object.assign({},parsedArgs.event);
        eventObj.listener = listener;
        // _tempMatches are only temporairy data from _getListenersForEvent
        // becase we don't want to parse regex multiple times (performance)
        if(listener._tempMatches){
          eventObj.matches = listener._tempMatches.matches;
          eventObj.params = listener._tempMatches.params;
          delete listener._tempMatches;
        }else{
          eventObj.matches=[];
          eventObj.params={};
        }

        let promise;
        try{
          promise = listener.callback(currentData,eventObj);
          if(promise instanceof this.promise){
            // we must catch an errors end emit them - error that are inside a promise
            // this is another branch so it will no affect normal listeners
            promise=promise.catch((e)=>{
              let errorObj = {error:e,event:eventObj};
              if(parsedArgs.eventName!="error"){
                this._handleError(errorObj);// for 'error' event
              }else{
                this._errorEventsErrorHandler(e);
              }
              return this.promise.reject(e);
            });
          }
        }catch(e){
          let errorObj = {error:e,event:eventObj};
          if(parsedArgs.eventName!="error"){
            this._handleError(errorObj);
          }else{
            this._errorEventsErrorHandler(e);
          }
          return this.promise.reject(e);
        }
        return promise;
      });


      //useAfter
      if(typeof inlineOn!="undefined"){
        result=result.then((result)=>{
          let afterParsed=Object.assign({},inlineOn.afterParsed);
          afterParsed.data=result;
          afterParsed.event=Object.assign({},afterParsed.event);
          return inlineOn._after._cascade(afterParsed);
        });
      }
    }

    return result;
  }


  /**
   * emit an event and put result of each one to next listener (waterfall)
   * arguments:
   *  eventName {string}, data {any}
   *  nameSpace {string}, eventName {string}, data {any}
   */
  cascade(...args){
    let parsedArgs = this._validateArgs(args);
    parsedArgs.event={
      type:"cascade",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
      isUseBeforeAll:parsedArgs.isUseBeforeAll,
      isUseBefore:parsedArgs.isUseBefore,
      isUseAfter:parsedArgs.isUseAfter,
      isUseAfterAll:parsedArgs.isUseAfterAll,
    }

    return this._cascade(parsedArgs);
  }

}


function Eventor(opts){

  let root={};

  opts = opts || {};
  let sharedData={
    lastId:0
  };
  opts._shared=sharedData;
  if(typeof opts.promise!="undefined"){
    root.promise=opts.promise;
  }else{
    root.promise=Promise;
  }
  if(typeof opts.timeout == "undefined"){
    opts.timeout = 60*1000; // 60sec timeout
  }
  root.timeout = opts.timeout;

  opts.root = root;

  root._useBeforeAll = new EventorBasic(opts);
  root._useBefore = new EventorBasic(opts);
  root._normal = new EventorBasic(opts);
  root._useAfter = new EventorBasic(opts);
  root._useAfterAll = new EventorBasic(opts);

  if(typeof opts.unique=="undefined"){
    root.unique = generateuid;
  }else{
    root.unique = opts.unique;
  }

  function generateEventId(){
    return root.unique();
  }

  root.on=function on(...args){
    return root._normal.on.apply(root._normal,args);
  }

  root.removeListener = root.off = function removeListener(listenerFn){
    let result = 0;
    result+=root._useBeforeAll.removeListener.apply(root._useBeforeAll,[listenerFn]);
    result+=root._useBefore.removeListener.apply(root._useBefore,[listenerFn]);
    result+=root._normal.removeListener.apply(root._normal,[listenerFn]);
    result+=root._useAfter.removeListener.apply(root._useAfter,[listenerFn]);
    result+=root._useAfterAll.removeListener.apply(root._useAfterAll,[listenerFn]);
    return result;
  }

  root.useBefore=function useBefore(...args){
    return root._useBefore.on.apply(root._useBefore,args);
  }

  root.useAfter=function useAfter(...args){
    return root._useAfter.on.apply(root._useAfter,args);
  }

  root.useBeforeAll=function useBeforeAll(...args){
    return root._useBeforeAll.on.apply(root._useBeforeAll,args);
  }

  root.useAfterAll=function useAfterAll(...args){
    return root._useAfterAll.on.apply(root._useAfterAll,args);
  }

  root.emit = function emit(...args){

    let timeoutObj = {
      arguments:args,
      type:"emit",
      error:new Error("timeout")
    };
    let finished = setTimeout(()=>{
      root.emit("timeout",timeoutObj);
    },root.timeout);

    let useBeforeAllParsed = root._normal._parseArguments(args);
    let eventName = useBeforeAllParsed.eventName;
    let nameSpace = useBeforeAllParsed.nameSpace;
    let eventId = generateEventId();

    // first we are emitting useBeforeAll
    useBeforeAllParsed.event={
      eventId,
      type:"emit",
      eventName:useBeforeAllParsed.eventName,
      nameSpace:useBeforeAllParsed.nameSpace,
      isUseBefore:false,
      isUseAfter:false,
      isUseBeforeAll:true,
      isUseAfterAll:false
    }

    function normal(input){

      let useBeforeParsed = Object.assign({},useBeforeAllParsed);

      useBeforeParsed.data=input;
      useBeforeParsed.event={
        eventId,
        type:"emit",
        eventName:useBeforeParsed.eventName,
        nameSpace:useBeforeParsed.nameSpace,
        isUseBefore:true,
        isUseAfter:false,
        isUseBeforeAll:false,
        isUseAfterAll:false,
      }

      let normalParsed = Object.assign({},useBeforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        eventId,
        type:"emit",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:false,
        isUseBeforeAll:false,
        isUseAfterAll:false,
      }

      let useAfterParsed = Object.assign({},useBeforeParsed);
      useAfterParsed.data=undefined;
      useAfterParsed.event={
        eventId,
        type:"emit",
        eventName:useAfterParsed.eventName,
        nameSpace:useAfterParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:true,
        isUseBeforeAll:false,
        isUseAfterAll:false,
      }

      // this wil be glued to 'on' listeners (useBefore and useAfter)
      let inlineOn={
        _before:root._useBefore,
        beforeParsed:useBeforeParsed,
        _after:root._useAfter,
        afterParsed:useAfterParsed
      };

      //check if there are after listeners
      let p;

      p=root._normal._emit(normalParsed,inlineOn);

      // check if there are some afterAll listeners
      let afterAllListeners;
      if(typeof nameSpace!="undefined"){
        afterAllListeners = root._useAfterAll.listeners(nameSpace,eventName);
      }else{
        afterAllListeners = root._useAfterAll.listeners(eventName);
      }
      if(afterAllListeners.length>0){
        p=p.then((results)=>{
          let useAfterParsed = Object.assign({},useBeforeParsed);
          useAfterParsed.data=results;
          useAfterParsed.event={
            eventId,
            type:"emit",
            eventName:useAfterParsed.eventName,
            nameSpace:useAfterParsed.nameSpace,
            isUseBefore:false,
            isUseAfter:false,
            isUseBeforeAll:false,
            isUseAfterAll:true
          }
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
    let result = root._useBeforeAll._cascade(useBeforeAllParsed)
    .then(normal)
    .then((results)=>{
      clearTimeout(finished);
      return results;
    });
    return result;
  }

  root.cascade = function cascade(...args){

    let timeoutObj = {
      arguments:args,
      type:"cascade",
      error:new Error("timeout")
    };
    let finished = setTimeout(()=>{
      root.emit("timeout",timeoutObj);
    },root.timeout);

    let useBeforeAllParsed = root._normal._parseArguments(args);
    let nameSpace = useBeforeAllParsed.nameSpace;
    let eventName = useBeforeAllParsed.eventName;
    let eventId = generateEventId();

    useBeforeAllParsed.event={
      eventId,
      type:"cascade",
      eventName:useBeforeAllParsed.eventName,
      nameSpace:useBeforeAllParsed.nameSpace,
      isUseBefore:false,
      isUseAfter:false,
      isUseBeforeAll:true,
      isUseAfterAll:false,
    }



    let useBeforeParsed = Object.assign({},useBeforeAllParsed);
    useBeforeParsed.event={
      eventId,
      type:"cascade",
      eventName:useBeforeParsed.eventName,
      nameSpace:useBeforeParsed.nameSpace,
      isUseBefore:true,
      isUseAfter:false,
      isUseBeforeAll:false,
      isUseAfterAll:false,
    }

    let normalParsed = Object.assign({},useBeforeAllParsed);
    normalParsed.event={
      eventId,
      type:"cascade",
      eventName:normalParsed.eventName,
      nameSpace:normalParsed.nameSpace,
      isUseBeforeAll:false,
      isUseBefore:false,
      isUseAfter:false,
      isUseAfterAll:false,
    }

    let useAfterParsed = Object.assign({},useBeforeAllParsed);
    useAfterParsed.event={
      eventId,
      type:"cascade",
      eventName:useAfterParsed.eventName,
      nameSpace:useAfterParsed.nameSpace,
      isUseBeforeAll:false,
      isUseBefore:false,
      isUseAfter:true,
      isUseAfterAll:false
    }


    function afterAll(input){
      let useAfterParsed = Object.assign({},useBeforeAllParsed);
      useAfterParsed.data=input;
      useAfterParsed.event={
        eventId,
        type:"cascade",
        eventName:useAfterParsed.eventName,
        nameSpace:useAfterParsed.nameSpace,
        isUseBeforeAll:false,
        isUseBefore:false,
        isUseAfter:false,
        isUseAfterAll:true
      }
      return root._useAfterAll._cascade(useAfterParsed);
    }


    let normalListeners;
    if(nameSpace){
      normalListeners=root.listeners(nameSpace,eventName);
    }else{
      normalListeners=root.listeners(eventName);
    }

    let p;

    p=root._useBeforeAll._cascade(useBeforeAllParsed);

    // useBefore and useAfter are glued with 'on' listeners
    // inlineOn is needed to pass in before and after from root to eventorbasic
    let inlineOn={
      _before:root._useBefore,
      beforeParsed:useBeforeParsed,
      _after:root._useAfter,
      afterParsed:useAfterParsed
    }

    p=p.then((result)=>{
      normalParsed.data=result;
      return root._normal._cascade(normalParsed,inlineOn);
    });


    p = p.then(afterAll);


    return p.then((result)=>{
      clearTimeout(finished);
      return result;
    });
  }

  root.listeners=function listeners(...args){
    return root._normal.listeners.apply(root._normal,args);
  }

  root.allListeners=function allListeners(...args){
    return [
      ...root._useBeforeAll.listeners.apply(root._useBeforeAll,args),
      ...root._useBefore.listeners.apply(root._useBefore,args),
      ...root._normal.listeners.apply(root._normal,args),
      ...root._useAfter.listeners.apply(root._useAfter,args),
      ...root._useAfterAll.listeners.apply(root._useAfterAll,args)
    ];
  }

  root.getListenersFromNamespace=function getListenersFromNamespace(...args){
    return root._normal.getListenersFromNamespace.apply(root._normal,args);
  }

  root.getAllListenersFromNamespace=function getAllListenersFromNamespace(...args){
    return [
      ...root._useBeforeAll.getListenersFromNamespace.apply(root._useBeforeAll,args),
      ...root._useBefore.getListenersFromNamespace.apply(root._useBefore,args),
      ...root._normal.getListenersFromNamespace.apply(root._normal,args),
      ...root._useAfter.getListenersFromNamespace.apply(root._useAfter,args),
      ...root._useAfterAll.getListenersFromNamespace.apply(root._useAfterAll,args)
    ];
  }

  root.removeListenersFromNamespace=function removeListenersFromNamespace(...args){
    return root._normal.removeListenersFromNamespace.apply(root._normal,args);
  }

  root.removeAllListenersFromNamespace=function removeAllListenersFromNamespace(...args){
    return root._normal.removeListenersFromNamespace.apply(root._normal,args)+
    root._useBeforeAll.removeListenersFromNamespace.apply(root._useBeforeAll,args)+
    root._useBefore.removeListenersFromNamespace.apply(root._useBefore,args)+
    root._useAfter.removeListenersFromNamespace.apply(root._useAfter,args)+
    root._useAfterAll.removeListenersFromNamespace.apply(root._useAfterAll,args);
  }

  root.wildcardMatchEventName=function wildcardMatchEventName(...args){
    return root._normal.wildcardMatchEventName.apply(root._normal,args);
  }

  root.constructor = Eventor;

  return root;
}

function EventorConstructor(opts){
  let eventor = Eventor(opts);
  eventor.before = Eventor(opts);
  eventor.after = eventor;
  return eventor;
}

return EventorConstructor;

}());

if(typeof module!="undefined"){
  if(typeof module.exports!="undefined"){
    module.exports = Eventor;
  }
}
if(typeof window!="undefined"){
  window.Eventor = Eventor;
}
