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

let uid=(function () {
  'use strict';

  let isNode=typeof process != 'undefined' && typeof process.pid == 'number';

  if(isNode){
    var crypto = require('crypto');
  }

  function random(count) {
    if (isNode) {
      return nodeRandom(count)
    } else {
      var crypto = window.crypto || window.msCrypto
      if (!crypto) throw new Error("Your browser does not support window.crypto.")
      return browserRandom(count)
    }
  }

  function nodeRandom(count) {
    var buf = crypto.randomBytes(count);
    return [].slice.call(buf)
  }

  function browserRandom(count) {
    var nativeArr = new Uint8Array(count)
    var crypto = window.crypto || window.msCrypto
    crypto.getRandomValues(nativeArr)
    return [].slice.call(nativeArr)
  }

  function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
  }

  function nodePrint() {
    var os = require('os'),
      padding = 2,
      pid = pad((process.pid).toString(36), padding),
      hostname = os.hostname(),
      length = hostname.length,
      hostId = pad((hostname)
        .split('')
        .reduce(function (prev, char) {
          return +prev + char.charCodeAt(0);
        }, +length + 36)
        .toString(36),
      padding);
    return pid + hostId;
  }

  function browserPrint() {
    var i, count = 0;
    for (i in window) {
      count++;
    }
    var globalCount=count.toString(36);
    return pad((navigator.mimeTypes.length +
      navigator.userAgent.length).toString(36) +
      globalCount, 4);
  }

  var fingerprint = isNode ? nodePrint() : browserPrint();

  var c=0;
  var blockSize = 4;
  var base = 256;
  var discreteValues = Math.pow(256, 2);//65536 ffff

  function randomBlock(cryptoBytes) {
    if(cryptoBytes){
      let randomNrs = random(4); // 0-255
      let r1=randomNrs[0].toString(16);
      let r2=randomNrs[1].toString(16);
      let r3=randomNrs[2].toString(16);
      let r4=randomNrs[3].toString(16);
      return r1+r2+r3+r4;
    }else{
      let rand=Math.floor(Math.random()*Math.pow(256,4)).toString(16);
      return pad(rand,8);
    }
  }

  function safeCounter() {
    c = (c < discreteValues) ? c : 0;
    c++; // this is not subliminal
    return c - 1;
  }

  function _uid() {
    let cryptoBytes=false;
    let now = Date.now();
    let timestamp = now;//(now).toString(16);
    let random = randomBlock(cryptoBytes)+randomBlock(cryptoBytes);
    let counter = pad(safeCounter().toString(16), 4);
    // 8 is (Math.pow(256, 4)-1).toString(16).length
    // so counter will always be 8 characters long
    return  (timestamp +"-"+ random +"-"+ fingerprint + "-" + counter);
  }

  return _uid;
}());



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
    if(typeof opts.promise=="undefined"){
      this.promise = Promise;
    }else{
      this.promise = opts.promise;
    }
    if(typeof opts.unique=="undefined"){
      this.unique = uid;
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
    args.forEach((arg,index)=>{
      if(typeof arg==="undefined" || arg==null){emptyArgs=index;}
    });
    if(emptyArgs!==false){
      throw new TypeError("Undefined argument at position "+emptyArgs);
    }
    if(typeof args[0]!=="string" && args[0].constructor.name!="RegExp"){
      throw new TypeError("First argument should be string or RegExp in Eventor.on method");
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
        throw new TypeError("Third argument should be a number.");
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
        throw new TypeError("Fourth argument should be a number.");
      }
    }else{ // second argument is not a callback and not a eventname
      throw new TypeError("Invalid arguments inside 'on' method.");
    }

    const wildcarded = eventName.constructor.name=="RegExp" || eventName.indexOf("*")>=0;
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


  removeListener(listenerId){
    let listener = this._allListeners[listenerId];
    let eventName = listener.eventName;
    if(!listener.isWildcard){
      let pos = this._listeners[eventName].indexOf(listener);
      this._listeners[eventName].splice(pos,1);
    }else{
      let pos = this._wildcardListeners[eventName].indexOf(listener);
      this._wildcardListeners[eventName].splice(pos,1);
    }
    delete this._allListeners[listenerId];
  }

  off(...args){
    return this.removeListener.apply(this,args);
  }

  removeNameSpaceListeners(nameSpace){
    let listeners = this.getNameSpaceListeners(nameSpace);
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
      let str=wildcard
      .replace(/[^a-z0-9]{1}/gi,"\\$&")
      .replace(/\\\*\\\*/gi,".*")
      .replace(/\\\*/gi,"[^\\"+this.delimeter+"]*");
      str="^"+str+"$";
      wildcard=new RegExp(str);
    }
    return eventName.match(wildcard);
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
        return listener._tempMatches!=null;
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
        return listener._tempMatches!=null;
      }else{
        return listener.eventName===eventName;
      }
    });

    return filtered;
  }

  _sortListeners(listeners){
    /**
      thinking process:
      
      notation:(#id->pos)

      1. traditional sorting was not good here
      because at some point there where situations that we cannot
      guess where to put listeners
      for example
      we have three listeners and we are moving from 0 pos to 1 pos
      for example [#1->1,#2,#3] if we move 0pos to 1pos it will be [#2,#1,#3]
      but sorting algorithm will have two listeners with position 1
      one moved from 0 and second original
      which should go first? if we put first the moved one - order will not change [#1,#2,#3]
      so result will be wrong
      but if we decide to first should be original one - in this case everything will be ok [#2,#1,#3]
      but when we want move from 2pos to 0pos and we decide to do same way [#1,#2,#3->0]
      we will have two listeners with 0pos and and we move original one as first as above
      then we will have [#1,#3,#2] which is not good result

      2.(see sorting below, i've tryed to sort work again)
      ok, code below(arrays) was good but inefficient,
      so we added originalPosition to the listeners (use sorting again)
      and when moving(positioning) listener was declared after original one it should be first
      but when it was declared before original it should run after original

      3. there is another problem below so we cannot use sorting algorithm anymore :/
      we must use arrays instead (abort sorting again)
    
      first delete all moving parts,and then add moved ones  (two iterations) - it is important
      for example we have 4 listeners where two are moving to position 1
      we have [#1->1,#2->1,#3,#4] we need [#3,#2->1,#1->1,#4]
      first and second listener are positioned to 1pos so if we delete first one
      and we put him at 1pos we will have [#2->1,#1->1,#3,#4] again but with switched places 0
      then we delete 0pos and move it to 1pos we agan will be have [#1->1,#2->1,#3,#4] again switched
      we need to delete all of moving one first and then insert at right place
      [#3,#4] => [#3,#2,#1,#4]

      4. another problem is when we want have 3 listeners with 0,0,1 positions specified
      first will be at 0 position, second will be moved to 0 (so first is now at 1pos),
      and third will be moved at 1pos (so second will move again to 2pos - and have 0 position specified)
      so we will end up with first with specified pos 0, second with specified pos 1
      and third with specified pos 0!! 1->0,2->1,3->0 = 0,1,0 positions and we don't want that
      It seems that when we override positon by later defined listener we will have a problem.
      Maybe before inserting at pos we should check if there is a positioned listener and
      then decide where to put new listener based on actual position - yes
      we will search from current position to first not positioned element or first positioned that have
      position greater than our

      5. another problem is when something is declared at first #1->2 then reorder happened 
      things were moved but first element is not in the place anymore, but it is positioned
      already so it will stay at wrong position arrgghhh
      so we must first sort positioned elements by position(from 0 to inifinity) and then by id (from 0 to infinity)
      so we will have later elements that should be positioned later because of greater position
      we cannot move elements to the end from the beginnig because this way we cannot move once moved listener
      after when positions were change

      art. 5. was commited and saved now we can move on to another method 6:

      6. more secure(and simplest) way is to extract positioned elements -remove from array (left array name=original)
      sort them(positioned) by position and reversed id, then group them(object) by position 
      then slice original array in places where we want to insert groups
      and then glue/join all toghether (with grouped positioned)
      but we can end up with - we want move like this:[#1,#2,#3,#4,#5->1,#6->1,#7,#8->3,#9-3]
      when we remove positioned we will have [#1,#2,#3,#4,#7]
      after slice and join [#1,(positioned->1),#2,#3,(positioned->3),#4,#7]
      and end up with [#1(0),#6->1,#5->1,#2(1),#3(2),#9->3,#8->3,#4(3),#7(6)] - look at #2 it is original position
      all depends on what we want
      i think this is the best way, because we can normally use eventor.on, eventor.on ... and depend on order
      but later we can inject some element before some position like before or after
      this way we could use positioning like middlewares to original positions
      for example middleware before and after position 1 and 3
      [#1,#2,#3,#4,#5->1,#6->2,#7->3,#8->4] #5 will be before 1,#6 after 1, #7 before 3 and #8 after 3
      left:[#1,#2,#3,#4]
      [#1,(positioned->1),#2,(positioned->2),#3,(positioned->3),#4,(positioned->4)]
      [#1,(#5),#2,(#6),#3,(#7),#4,(#8)]

      6.b. this is stupid. if we define position in most of the time we want to be nearest posible position
      not after some other "normal" listeners. we are rollback changes to art.5.

      7. we should not depend on positions because when we move our module to other system
      it will stop working

    */
    let sorted=listeners.sort(function(a,b){
      return a.id - b.id;
    });
    let positioned = [];
    sorted.forEach((listener,index)=>{
      if(listener.wasPositioned)positioned.push(listener);
    });
    

    if(positioned.length>0){
      positioned.sort(function(a,b){
        if(a.position==b.position){
          return b.id - a.id;
        }
        return a.position-b.position;
      });
      sorted = sorted.filter((listener,index)=>{
        return !listener.wasPositioned;
      });

      // group by position
      let grouped = {};
      for(let i=0,len=positioned.length;i<len;i++){
        let listener = positioned[i];
        let pos = listener.position;
        if(typeof grouped[pos]=="undefined"){grouped[pos]=[];}
        grouped[pos].push(listener);
      }
      // slicing
      let sliceAt=Object.keys(grouped);
      let start = 0;
      let sliced = [];
      sliceAt.forEach((end)=>{
        let sub = sorted.slice(start,end);
        start=end;
        sliced.push(sub);
        //adding positioned group
        sliced.push(grouped[end]);
      });
      sliced.push(sorted.slice(start,sorted.length));// adding last items
      let merged=[];
      sliced.forEach((arr)=>{
        merged=merged.concat(arr);
      });

      return merged;
    }
    return sorted;/*
    // we no longer can do this, this way (sort), because in situation where there are multiple
    // listeners with same position selected there will be problems (see above)
    // this approach is good when there is only one moved(positioned) listener
    return listeners.sort(function(a,b){
      if(a.position==b.position){
        let result=0;
        if(a.originalPosition==a.position){
          // a is in place, b is moved one
          // 1 is forward, -1 is backward for a element
          if(a.originalPosition<b.originalPosition){
            // b is originally after a - we must prepend
            // b before a = a forward = 1
            result=1;
          }else if(a.originalPosition>b.originalPosition){
            // b is before a - we must append
            // b after a = a backward = -1
            result=-1;
          }
        }else if(b.originalPosition==b.position){
          // a is moved one
          if(b.originalPosition<a.originalPosition){
            // a should be first so b is moving forward and a is moving backward -1
            result = -1;
          }else if(b.originalPosition>a.originalPosition){
            // a(moving) is before b so should be moved forward 1
            result = 1;
          }
        }else{
          // at last if two of listeners were moved the second
          // one is going to be first (override, prepend)
          result=b.id - a.id;
        }
        return result;
      }
      return a.position - b.position;
    });*/
  }

  listeners(...args){
    let listeners=[];
    if(args.length===0){
      pushObjAsArray(this._allListeners,listeners);
    }else if(args.length==1){
      listeners = this._getListenersForEvent(args[0]);
    }else if(args.length==2){
      listeners = this.getNameSpaceListeners(args[0]);
      listeners = this._getListenersForEventFromArray(args[1],listeners);
    }
    return this._sortListeners(listeners);
  }

  getNameSpaceListeners(nameSpace){
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
        throw new Error(`Arguments length is incorrect\n`+JSON.stringify(args));
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
      eventObj.matches = listener._tempMatches;
      delete listener._tempMatches;

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
              let errorObj={error:e,event:eventObj};
              if(parsedArgs.eventName!="error"){
                this._handleError(errorObj);// for 'error' event
              }else{
                this._errorEventsErrorHandler(e);
                // if we are emittin 'error' and there is error inside 'error' event :/:\:/
              }
              return this.promise.reject(errorObj); // we must give error back to catch
            });
          }
        }catch(e){
          let errorObj={error:e,event:eventObj};
          if(parsedArgs.eventName!="error"){ // we don't want to emit error from error (infinite loop)
            this._handleError(errorObj);
          }else{
            this._errorEventsErrorHandler(e);
          }
          promise = this.promise.reject(errorObj);
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
        eventObj.matches = listener._tempMatches;
        delete listener._tempMatches;

        let promise;
        try{
          promise = listener.callback(currentData,eventObj);
          if(promise instanceof this.promise){
            // we must catch an errors end emit them - error that are inside a promise
            // this is another branch so it will no affect normal listeners
            promise=promise.catch((e)=>{
              let errorObj={error:e,event:eventObj};
              if(parsedArgs.eventName!="error"){
                this._handleError(errorObj);// for 'error' event
              }else{
                this._errorEventsErrorHandler(e);
              }
              return this.promise.reject(errorObj);
            });
          }
        }catch(e){
          let errorObj={error:e,event:eventObj};
          if(parsedArgs.eventName!="error"){
            this._handleError(errorObj);
          }else{
            this._errorEventsErrorHandler(e);
          }
          return this.promise.reject(errorObj);
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
  opts.root = root;
  root._useBeforeAll = new EventorBasic(opts);
  root._useBefore = new EventorBasic(opts);
  root._normal = new EventorBasic(opts);
  root._useAfter = new EventorBasic(opts);
  root._useAfterAll = new EventorBasic(opts);
  if(typeof opts.unique=="undefined"){
    root.unique = uid;
  }else{
    root.unique = opts.unique;
  }

  function generateEventId(){
    return root.unique();
  }

  root.on=function on(...args){
    return root._normal.on.apply(root._normal,args);
  }

  root.removeListener=function removeListener(listenerId){
    listenerId=listenerId.toString();
    if( Object.keys(root._normal._allListeners).indexOf(listenerId)>=0 ){
      return root._normal.removeListener.apply(root._normal,[listenerId]);
    }else if( Object.keys(root._useBefore._allListeners).indexOf(listenerId)>=0 ){
      return root._useBefore.removeListener.apply(root._useBefore,[listenerId]);
    }else if( Object.keys(root._useAfter._allListeners).indexOf(listenerId)>=0 ){
      return root._useAfter.removeListener.apply(root._useAfter,[listenerId]);
    }else if( Object.keys(root._useAfterAll._allListeners).indexOf(listenerId)>=0 ){
      return root._useAfterAll.removeListener.apply(root._useAfterAll,[listenerId]);
    }else{
      let error=new Error("No listener found with specified id ["+listenerId+"]");
      //root._normal.emit("error",error);
      throw error;
    }
  }

  root.useBefore=function before(...args){
    return root._useBefore.on.apply(root._useBefore,args);
  }

  root.useAfter=function after(...args){
    return root._useAfter.on.apply(root._useAfter,args);
  }

  root.useBeforeAll=function useBeforeAll(...args){
    return root._useBeforeAll.on.apply(root._useBeforeAll,args);
  }

  root.useAfterAll=function afterAll(...args){
    return root._useAfterAll.on.apply(root._useAfterAll,args);
  }

  root.emit = function emit(...args){

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
    let result = root._useBeforeAll._cascade(useBeforeAllParsed).then(normal);
    return result;
  }

  root.cascade = function cascade(...args){

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
    

    return p;
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

  root.getNameSpaceListeners=function getNameSpaceListeners(...args){
    return root._normal.getNameSpaceListeners.apply(root._normal,args);
  }

  root.getAllNameSpaceListeners=function getAllNameSpaceListeners(...args){
    return [
      ...root._useBeforeAll.getNameSpaceListeners.apply(root._useBeforeAll,args),
      ...root._useBefore.getNameSpaceListeners.apply(root._useBefore,args),
      ...root._normal.getNameSpaceListeners.apply(root._normal,args),
      ...root._useAfter.getNameSpaceListeners.apply(root._useAfter,args),
      ...root._useAfterAll.getNameSpaceListeners.apply(root._useAfterAll,args)
    ];
  }

  root.removeNameSpaceListeners=function removeNameSpaceListeners(...args){
    return root._normal.removeNameSpaceListeners.apply(root._normal,args);
  }

  root.removeAllNameSpaceListeners=function removeAllNameSpaceListeners(...args){
    return root._normal.removeNameSpaceListeners.apply(root._normal,args)+
    root._useBeforeAll.removeNameSpaceListeners.apply(root._useBeforeAll,args)+
    root._useBefore.removeNameSpaceListeners.apply(root._useBefore,args)+
    root._useAfter.removeNameSpaceListeners.apply(root._useAfter,args)+
    root._useAfterAll.removeNameSpaceListeners.apply(root._useAfterAll,args);
  }

  root.wildcardMatchEventName=function wildcardMatchEventName(...args){
    return root._normal.wildcardMatchEventName.apply(root._normal,args);
  }

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
