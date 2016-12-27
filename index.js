let cuid = require("cuid");

class Eventor {

  constructor(){
    this._listeners = {};
    this._allListeners = {};
  }

  generateId(){
    return cuid();
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
    let position = false;
    let nameSpace = "";
    let args = Array.prototype.slice.call(arguments);
    if(typeof args[0]!="string"){ return false; }
    if(typeof args[1]=="function"){// eventName,callback [,position]
      eventName=args[0];
      callback=args[1];
      if(typeof args[2]=="number"){
        position=args[2];
      }
    }else if(typeof args[1]=="string"){// nameSpace, eventName, callback [,position]
      nameSpace=args[0];
      eventName=args[1];
      if(typeof args[2]=="function"){
        callback=args[2];
        if(typeof args[3]=="number"){
          position=args[3];
        }
      }else{
        return false;
      }
    }else{ // second argument is not a callback and not a eventname
      return false;
    }
    if(typeof callback!="function"){ return false; }
    if(typeof this._listeners[eventName] == "undefined"){
      this._listeners[eventName]=[];
    }
    const listenerId = this.generateId();
    let listener = {
      id:listenerId,
      eventName,
      callback,
      nameSpace,
    };
    if(position===false){
      this._listeners[eventName].push(listener);
    }else{
      this._listeners[eventName].splice(position,0,listener);
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

  get eventNames(){
    return Object.keys(this._listeners);
  }

  get listeners(){
    return this._listeners;
  }

  getListenersForEvent(eventName){
    let listeners = this._listeners[eventName];
    if(typeof listeners == "undefined"){ return []; }
    return listeners;
  }

  get allListeners(){
    let eventNames=this.eventNames;
    let all=[];
    eventNames.forEach((name)=>{
      let listeners = this.getListenersForEvent(name);
      all=[...all,...listeners];
    });
    return all;
  }

  getNameSpaceListeners(nameSpace){
    let all = this.allListeners;
    let result=all.filter((listener)=>{
      return listener.nameSpace===nameSpace;
    });
    return result;
  }

  _before(eventName,data,result){
    return this._emit(eventName+"-before",data,undefined);
  }

  _after(eventName,data,result){
    return this._emit(eventName+"-after",data,result);
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
  _emit(){
    let args = Array.prototype.slice.call(arguments);
    let parsedArgs = this._parseArguments(args);
    let results = [];
    let listeners = this._getListenersFromParsedArguments(parsedArgs);

    listeners.forEach((listener)=>{
      let promise=listener.callback(parsedArgs.data,parsedArgs.result);
      results.push(promise);
    });
    return Promise.all(results);
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
    let r=this._before.apply(this,args).then(()=>{
      let result = this._emit.apply(this,args);
      args.pop();//undefined
      let ret = new Promise((resolve,reject)=>{
        result.then((res)=>{
          args.push(res);
          this._after.apply(this,args).then(()=>{
            resolve(res);
          }).catch((e)=>{
            reject(e);
          });
        }).catch((e)=>{
          reject(e);
        });
      });
      return ret;
    });
    return r;
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
    let parsedArgs = this._parseArguments(args);
    // -before event doesn't return any value so no need to run it in cascading manner
    let r = this._before.apply(this,args).then(()=>{
      args.pop();
      let listeners = this._getListenersFromParsedArguments(parsedArgs);
      let result = Promise.resolve(parsedArgs.data);
      listeners.forEach((listener,index)=>{
        result=result.then((currentData)=>{
          return listener.callback(currentData,parsedArgs.data);
        });
      });
      let ret = new Promise((resolve,reject)=>{
        result.then((res)=>{
          args.push(res);
          this._after.apply(this,args).then(()=>{
            resolve(res);
          }).catch((e)=>{
            reject(e);
          });
        }).catch((e)=>{
          reject(e);
        });
      });
      return ret;
    });
    return r;
  }

}

module.exports = Eventor;
