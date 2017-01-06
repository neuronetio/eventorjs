class EventorBasic {

  constructor(opts){
    this._listeners = {};
    this._allListeners = {};
    this._wildcardListeners = {};
    this._allWildcardListeners = [];
    this._lastId=0;
    this.delimeter=".";
    if(typeof opts=="object"){
      if(typeof opts.delimeter=="string"){
        this.delimeter=opts.delimeter;
      }
    }
  }

  generateId(){
    return ++this._lastId;
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
    let args = Array.prototype.slice.call(arguments);
    let emptyArgs=false;
    args.forEach((arg)=>{
      if(typeof arg=="undefined" || arg==null){emptyArgs=true;}
    })
    if(emptyArgs){return false;}
    if(typeof args[0]!="string" && typeof args[0].constructor.name!="RegExp"){ return false; }
    if(typeof args[1]=="function"){// eventName,callback [,position]
      eventName=args[0];
      callback=args[1];
    }else if(
      typeof args[0]=="string" &&
      (typeof args[1]=="string" || args[1].constructor.name=="RegExp") &&
      typeof args[2]=="function"
    ){// nameSpace, eventName, callback
      nameSpace=args[0];
      eventName=args[1];
      callback=args[2];
    }else{ // second argument is not a callback and not a eventname
      return false;
    }

    const wildcarded=eventName.indexOf("*")>=0 || eventName.constructor.name=="RegExp";
    const listenerId = this.generateId();
    let listener = {
      id:listenerId,
      eventName,
      callback,
      nameSpace,
      wildcard:wildcarded
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
    let pos = this._listeners[eventName].indexOf(listener);
    this._listeners[eventName].splice(pos,1);
    delete this._allListeners[listenerId];
  }

  off(){
    let args = Array.prototype.slice.call(arguments);
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
        .replace("\\*\\*",".*")
        .replace("\\*","[^\\"+this.delimeter+"]+");
      str="^"+str+"$";
      wildcard=new RegExp(str);
    }
    return wildcard.test(eventName);
  }

  get allWildcardedListeners(){
    let all=[];
    for(let listenerId in this._allWildcardListeners){
      all.push(this._allWildcardListeners[listenerId]);
    }
    return all;
  }

  _getListenersForEvent(eventName){
    let listeners = [];
    if(typeof this._listeners[eventName]!="undefined"){
      listeners = this._listeners[eventName];
    }
    // now we must add wildcards
    let wildcarded = this.allWildcardedListeners.filter((listener)=>{
      return this.wildcardMatchEventName(listener.eventName,eventName);
    });
    listeners = [...listeners,...wildcarded];
    // it is better to sort couple of events instead of changing core structure
    listeners.sort(function(a,b){
      return a.id - b.id;
    });
    return listeners;
  }

  listeners(...args){
    if(args.length==0){
      let all=[];
      for(let listenerId in this._allListeners){
        all.push(this._allListeners[listenerId]);
      }
      return all;
    }else{
      return this._getListenersForEvent(args[0]);
    }
  }

  getNameSpaceListeners(nameSpace){
    let all = this.allListeners;
    let result=all.filter((listener)=>{
      return listener.nameSpace===nameSpace;
    });
    return result;
  }

  _parseArguments(args){
    let result = {};
    result.eventName="";
    result.data = undefined;
    result.result =  undefined;
    result.nameSpace = false;
    if(typeof args[0] == "string"){

      if(args.length==2){//eventName,result
        result.eventName = args[0];
      }else if(args.length==3){//eventName,data,result
        result.eventName = args[0];
        result.data = args[1];
        result.result = args[2];
      }else if(args.length==4){//nameSpace,eventName,data,result
        result.nameSpace = args[0];
        result.eventName = args[1];
        result.data = args[2];
        result.result = args[3];
      }else{
        return false;
      }

    }else{
      return false;
    }

    return result;
  }

  _getListenersFromParsedArguments(parsedArgs){
    let listeners = [];
    if(!parsedArgs.nameSpace){
      listeners = this.getListenersForEvent(parsedArgs.eventName);
    }else{
      listeners = this.getListenersForEvent(parsedArgs.eventName);
      listeners=listeners.filter((listener)=>{
        return listener.nameSpace===parsedArgs.nameSpace;
      });
    }
    return listeners;
  }

  /**
   * emit an event
   * arguments:
   *  eventName {string}, data {any} ,result {any}
   *  nameSpace {string}, eventName {string}, data {any} ,result {any}
   */
  _emit(parsedArgs){
    //let args = Array.prototype.slice.call(arguments);
    //let parsedArgs = this._parseArguments(args);
    let results = [];
    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let eventObj = Object.assign({},parsedArgs.event);

    listeners.forEach((listener)=>{
      let promise=listener.callback(parsedArgs.data,eventObj);
      results.push(promise);
    });
    return Promise.all(results);
  }

  _validateArgs(args){
    let parsedArgs=this._parseArguments(args);
    if(parsedArgs.eventName.indexOf("-before")>=0 ||
      parsedArgs.eventName.indexOf("-after")>=0){
        throw new Error("Eventor: emitted event name should not contain \"-before\" and \"-after\" reserved keywords.");
      }
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
    args.push(undefined); //result is only private not for public use
    let parsedArgs=this._validateArgs(args);
    parsedArgs.event={
      type:"emit",
      eventName:parsedArgs.eventName,
      isBefore:false,
      isAfter:false,
    }
    return this._emit(parsedArgs);
  }

  _cascade(parsedArgs){
    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let result = Promise.resolve(parsedArgs.data);
    let eventObj = Object.assign({},parsedArgs.event);
    eventObj.originalData=parsedArgs.data;
    listeners.forEach((listener,index)=>{
      result=result.then((currentData)=>{
        return listener.callback(currentData,eventObj);
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
    args.push(undefined);// result is private
    let parsedArgs = this._validateArgs(args);
    args.pop();
    parsedArgs.event={
      type:"waterfall",
      eventName:parsedArgs.eventName,
      isBefore:false,
      isAfter:false,
    }
    return this._cascade(parsedArgs);
  }

  waterfall(){
    let args = Array.prototype.slice.call(arguments);
    return this.cascade.apply(this,args);
  }

}


class Eventor {

  constructor(opts){
    this._normal = new EventorBasic(opts);
    this._before = new EventorBasic(opts);
    this._after = new EventorBasic(opts);
  }

  on(...args){
    return this._normal.apply(this._normal,...args);
  }

  before(...args){
    return this._before.on.apply(this._before,args);
  }

  after(...args){
    return this._after.on.apply(this._before,args);
  }

  emit(...args){
    return this._before.cascade.apply(this._before,args).then((input)=>{

    });
  }

  cascade(...args){

  }

  waterfall(...args){

  }

  listeners(...args){
    return this._normal.listeners.apply(this._normal,args);
  }

  allListeners(...args){
    return [...this._before.listeners.apply(this._before,args),
      ...this._normal.listeners.apply(this._normal,args),
      ...this._after.listeners.apply(this._after,args)];
  }

  getNameSpaceListeners(...args){
    return this._normal.getNameSpaceListeners.apply(this._normal,args);
  }

  getAllNameSpaceListeners(...args){
    return [...this._before.getListenersForEvent.apply(this._before,args),
        ...this._normal.getListenersForEvent.apply(this._normal,args),
        ...this._after.getListenersForEvent.apply(this._after,args)];
  }

  removeNameSpaceListeners(...args){
    this._normal.removeNameSpaceListeners.apply(this._normal,args);
  }

  removeAllNameSpaceListeners(...args){
    this._normal.removeNameSpaceListeners.apply(this._normal,args);
    this._before.removeNameSpaceListeners.apply(this._before,args);
    this._after.removeNameSpaceListeners.apply(this._after,args);
  }

  wildcardMatchEventName(...args){
    return this._normal.wildcardMatchEventName.apply(this._normal,args);
  }

}

module.exports = Eventor;
