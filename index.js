var Eventor = (function(){

"use strict";

class EventorBasic {

  constructor(opts){
    this._listeners = {};
    this._allListeners = {};
    this._wildcardListeners = {};
    this._allWildcardListeners = [];
    this.delimeter=".";
    this._shared = opts._shared;
    if(typeof opts.promise=="undefined"){
      this.promise = Promise;
    }else{
      this.promise = opts.promise;
    }
    if(typeof opts.delimeter=="string"){
      if(opts.delimeter.length>1){
        throw new Error("Delimeter should be one character long.");
      }
      this.delimeter=opts.delimeter;
    }

  }

  generateId(){
    return ++this._shared.lastId;
  }
  /**
   * start listening to an event
   * arguments:
   *  eventName {String}, callback {function}, position(optional) {integer}
   *  nameSpace {String}, eventName {string}, callback {function}, position (optional) {integer}
   *
   */
  on(){
    let eventName="";
    let callback = ()=>{};
    let nameSpace = "";
    // by default nameSpace is "" because we later can call only those
    // listeners with no nameSpace by emit("","eventName"); nameSpace("")===nameSpace("")
    var args = new Array(arguments.length);
    for(var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
    }
    let isUseBefore=false;
    let isUseAfter=false;
    let isUseAfterAll=false;
    let emptyArgs=false;
    args.forEach((arg)=>{
      if(typeof arg==="undefined" || arg==null){emptyArgs=true;}
    })
    if(emptyArgs){return false;}
    if(typeof args[0]!=="string" && args[0].constructor.name!="RegExp"){
      throw new TypeError("First argument should be string or RegExp in Eventor.on method");
    }
    if(typeof args[1]==="function"){// eventName,callback, "before" or "after"
      eventName=args[0];
      callback=args[1];
      if(typeof args[2]==="string"){
        if(args[2]==="before"){isUseBefore=true;}
        if(args[2]==="after"){isUseAfter=true;}
        if(args[2]==="afterAll"){isUseAfterAll=true;}
      }
    }else if(
      typeof args[0]==="string" &&
      (typeof args[1]==="string" || args[1].constructor.name==="RegExp") &&
      typeof args[2]==="function"
    ){// nameSpace, eventName, callback,"before" or "after"
      nameSpace=args[0];
      eventName=args[1];
      callback=args[2];
      if(typeof args[3]==="string"){
        if(args[3]==="before"){isUseBefore=true;}
        if(args[3]==="after"){isUseAfter=true;}
        if(args[2]==="afterAll"){isUseAfterAll=true;}
      }
    }else{ // second argument is not a callback and not a eventname
      throw new TypeError("Second argument should be string or function (callback) in Eventor.on method");
    }

    const wildcarded=eventName.constructor.name=="RegExp" || eventName.indexOf("*")>=0;
    const listenerId = this.generateId();
    let listener = {
      id:listenerId,
      eventName,
      callback,
      nameSpace,
      isWildcard:wildcarded,
      isUseBefore,
      isUseAfter,
      isUseAfterAll
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

  off(){
    var args = new Array(arguments.length);
    for(var i = 0; i < args.length; ++i) {
        args[i] = arguments[i];
    }
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
    let listeners = [];
    if(typeof this._listeners[eventName]!="undefined"){
      listeners = [...this._listeners[eventName]];
    }

    // now we must add wildcards
    // listener from now on will have _tempMatches property
    // which will change between different events when eventName argument change

    if(this._allWildcardListeners.length>0){
      let wildcarded = this._allWildcardListeners.filter((listener)=>{
        listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
        return listener._tempMatches!=null;
      });
      listeners.push(...wildcarded);

      // it is better to sort couple of events instead of changing core structure
      listeners.sort(function(a,b){
        return a.id - b.id;
      });
    }

    return listeners;
  }

  _getListenersForEventFromArray(eventName,listeners){
    // listeners may be list of all different listeners types (namespaced, wildcarded...)
    return listeners.filter((listener)=>{
      if(listener.isWildcard){
        listener._tempMatches = this.wildcardMatchEventName(listener.eventName,eventName);
        return listener._tempMatches!=null;
      }else{
        return listener.eventName===eventName;
      }
    }).sort(function(a,b){
      return a.id - b.id;
    });
  }

  listeners(...args){
    if(args.length===0){
      let all=[];
      for(let listenerId in this._allListeners){
        all.push(this._allListeners[listenerId]);
      }
      return all;
    }else if(args.length==1){
      return this._getListenersForEvent(args[0]);
    }else if(args.length==2){
      let listeners=this.getNameSpaceListeners(args[0]);
      return this._getListenersForEventFromArray(args[1],listeners);
    }
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

      if(args.length==1){//eventName
        return false; // emitted event must have a data to emit
      }else if(args.length==2){//eventName,data
        result.eventName = args[0];
        result.data = args[1];
      }else if(args.length==3){//nameSpace,eventName,data
        result.nameSpace = args[0];
        result.eventName = args[1];
        result.data = args[2];
      }else{
        throw new Error(`Argument length is incorrect\n`+JSON.stringify(args));
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

  /**
   * after is optional argument and in most cases should not be used
   * after is an object with _after EventorBasic and parsedArgs to emit
   * after._after , after.parsedArgs
   */
  _emit(parsedArgs,after){
    let listeners = this._getListenersFromParsedArguments(parsedArgs);// _tempMatches
    if(listeners.length==0){return this.promise.all([]);}
    let results = [];
    for(let i=0,len=listeners.length;i<len;i++){
      let listener = listeners[i];
      let eventObj = Object.assign({},parsedArgs.event);
      eventObj.listener = listener;
      // _tempMatches are only temporairy data from _getListenersForEvent
      // becase we don't want to parse regex multiple times (performance)
      eventObj.matches = listener._tempMatches;
      delete listener._tempMatches;
      let promise=listener.callback(parsedArgs.data,eventObj);

      if(typeof after!="undefined"){

          let promiseAfter;
          // we have an after job to do before all of the task resolves
          if(promise instanceof this.promise){
            promiseAfter = promise.then((result)=>{
              let parsed = Object.assign({},after.parsedArgs);
              parsed.data=result;
              parsed.event = Object.assign({},parsed.event);
              // after.parsedArgs will be passed after each listerner
              // so it must be cloned for each emit event
              return after._after._cascade(parsed);
            });
          }else{
            // if listener doesn't return a promise we must make it
            after.parsedArgs.data=promise;// promise is a normal value
            promiseAfter=after._after._cascade(after.parsedArgs);
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
  emit(){
    let args = Array.prototype.slice.call(arguments);
    let parsedArgs=this._validateArgs(args);

    parsedArgs.event={
      type:"emit",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
      isUseBefore:parsedArgs.isUseBefore,
      isUseAfter:parsedArgs.isUseAfter,
      isUseAfterAll:parsedArgs.isUseAfterAll,
    }


    return this._emit(parsedArgs);
  }

  _cascade(parsedArgs){
    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let result = this.promise.resolve(parsedArgs.data);
    if(listeners.length==0){return result;}

    listeners.forEach((listener,index)=>{
      result=result.then((currentData)=>{
        let eventObj=Object.assign({},parsedArgs.event);
        eventObj.listener = listener;
        // _tempMatches are only temporairy data from _getListenersForEvent
        // becase we don't want to parse regex multiple times (performance)
        eventObj.matches = listener._tempMatches;
        delete listener._tempMatches;
        let promise = listener.callback(currentData,eventObj);
        return promise;
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
  cascade(){
    let args = Array.prototype.slice.call(arguments);
    let parsedArgs = this._validateArgs(args);
    parsedArgs.event={
      type:"cascade",
      eventName:parsedArgs.eventName,
      nameSpace:parsedArgs.nameSpace,
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
  root._useBefore = new EventorBasic(opts);
  root._normal = new EventorBasic(opts);
  root._useAfter = new EventorBasic(opts);
  root._useAfterAll = new EventorBasic(opts);


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

  root.useAfterAll=function afterAll(...args){
    return root._useAfterAll.on.apply(root._useAfterAll,args);
  }

  root.emit = function emit(...args){

    let useBeforeParsed = root._normal._parseArguments(args);
    let eventName = useBeforeParsed.eventName;
    let nameSpace = useBeforeParsed.nameSpace;

    useBeforeParsed.event={
      type:"emit",
      eventName:useBeforeParsed.eventName,
      nameSpace:useBeforeParsed.nameSpace,
      isUseBefore:true,
      isUseAfter:false,
      isUseAfterAll:false
    }

    function normal(input){

      useBeforeParsed.data=input;
      useBeforeParsed.event={
        type:"emit",
        eventName:useBeforeParsed.eventName,
        nameSpace:useBeforeParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:false,
        isUseAfterAll:false,
      }

      let useAfterParsedArgs = Object.assign({},useBeforeParsed);
      useAfterParsedArgs.data=undefined;
      useAfterParsedArgs.event={
        type:"emit",
        eventName:useAfterParsedArgs.eventName,
        nameSpace:useAfterParsedArgs.nameSpace,
        isUseBefore:false,
        isUseAfter:true,
        isUseAfterAll:false,
      }

      let after={
        _after:root._useAfter,
        parsedArgs:useAfterParsedArgs
      }

      //check if there are after listeners
      let p;
      let afterListeners;
      if(typeof nameSpace!="undefined"){
        afterListeners = root._useAfter.listeners(nameSpace,eventName);
      }else{
        afterListeners = root._useAfter.listeners(eventName);
      }
      if(afterListeners.length===0){
        p = root._normal._emit(useBeforeParsed);
      }else{
        p = root._normal._emit(useBeforeParsed,after);
      }

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
            type:"emit",
            eventName:useAfterParsed.eventName,
            nameSpace:useAfterParsed.nameSpace,
            isUseBefore:false,
            isUseAfter:false,
            isUseAfterAll:true
          }
          // in afterAll we are running one callback to array of all results
          return root._useAfterAll._cascade(useAfterParsed);
        });
      }

      return p;
    }

    // optimizations - we don't want to parse middlewares if there isn't one
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
    }
    return result;
  }

  root.cascade = function cascade(...args){
    let useBeforeParsed = root._normal._parseArguments(args);
    useBeforeParsed.event={
      type:"cascade",
      eventName:useBeforeParsed.eventName,
      nameSpace:useBeforeParsed.nameSpace,
      isUseBefore:true,
      isUseAfter:false,
      isUseAfterAll:false,
    }

    return root._useBefore._cascade(useBeforeParsed)
    .then((input)=>{
      let normalParsed = Object.assign({},useBeforeParsed);
      normalParsed.data=input;
      normalParsed.event={
        type:"cascade",
        eventName:normalParsed.eventName,
        nameSpace:normalParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:false,
        isUseAfterAll:false,
      }
      return root._normal._cascade(normalParsed);
    }).then((results)=>{
      let useAfterParsed = Object.assign({},useBeforeParsed);
      useAfterParsed.data=results;
      useAfterParsed.event={
        type:"cascade",
        eventName:useAfterParsed.eventName,
        nameSpace:useAfterParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:true,
        isUseAfterAll:false
      }
      return root._useAfter._cascade(useAfterParsed);
    }).then((results)=>{
      let useAfterParsed = Object.assign({},useBeforeParsed);
      useAfterParsed.data=results;
      useAfterParsed.event={
        type:"cascade",
        eventName:useAfterParsed.eventName,
        nameSpace:useAfterParsed.nameSpace,
        isUseBefore:false,
        isUseAfter:false,
        isUseAfterAll:true
      }
      return root._useAfterAll._cascade(useAfterParsed);
    });
  }

  root.listeners=function listeners(...args){
    return root._normal.listeners.apply(root._normal,args);
  }

  root.allListeners=function allListeners(...args){
    return [
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
