class Eventor {

  constructor(){
    this._listeners = {};
    this._allListeners = {};
    this._lastId=0;
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
    let all=[];
    for(let listenerId in this._allListeners){
      all.push(this._allListeners[listenerId]);
    }
    return all;
  }

  getNameSpaceListeners(nameSpace){
    let all = this.allListeners;
    let result=all.filter((listener)=>{
      return listener.nameSpace===nameSpace;
    });
    return result;
  }

  // before is namespaced too
  _before(parsedArgs){
    let copy = Object.assign({},parsedArgs);
    copy.eventName=copy.eventName+"-before";
    return this._cascade(copy);
  }

  // after is namespaced too
  _after(parsedArgs){
    let copy = Object.assign({},parsedArgs);
    copy.eventName=copy.eventName+"-after";
    return this._cascade(copy);
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
    listeners.forEach((listener)=>{
      let promise=listener.callback(parsedArgs.data,parsedArgs.result);
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
    let r=this._before(parsedArgs).then((input)=>{
      let parsedArgs2 = Object.assign({},parsedArgs);
      parsedArgs2.data=input;
      let result = this._emit(parsedArgs2);
      args.pop();//undefined
      let ret = new Promise((resolve,reject)=>{
        result.then((res)=>{
          args.push(res);
          let parsedArgs3 = Object.assign({},parsedArgs2);
          parsedArgs3.data=res;
          this._after(parsedArgs3).then((afterResult)=>{
            resolve(afterResult);
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

  _cascade(parsedArgs){
    let listeners = this._getListenersFromParsedArguments(parsedArgs);
    let result = Promise.resolve(parsedArgs.data);
    listeners.forEach((listener,index)=>{
      result=result.then((currentData)=>{
        return listener.callback(currentData,parsedArgs.data);
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
    let r = this._before(parsedArgs).then((input)=>{
      args.pop();
      let parsedArgs2=Object.assign({},parsedArgs);
      parsedArgs2.data=input;
      let result=this._cascade(parsedArgs2);
      let ret = new Promise((resolve,reject)=>{
        result.then((res)=>{
          args.push(res);
          let parsedArgs3=Object.assign({},parsedArgs2);
          parsedArgs3.data=res;
          this._after(parsedArgs3).then((afterResult)=>{
            resolve(afterResult);
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

  waterfall(){
    let args = Array.prototype.slice.call(arguments);
    return this.cascade.apply(this,args);
  }



}

module.exports = Eventor;
