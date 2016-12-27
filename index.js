let cuid = require("cuid");

class Eventor {

  constructor(){
    this._listeners = {};
    this._allListeners = {};
  }

  generateId(){
    return cuid();
  }

  on(eventName,callback,position=false){
    if(typeof callback!="function"){ return false; }
    if(typeof this._listeners[eventName] == "undefined"){
      this._listeners[eventName]=[];
    }
    const listenerId = this.generateId();
    let listener = {
      id:listenerId,
      eventName,
      callback
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

  _before(eventName,data){
    return this._emit(eventName+"-before",data);
  }

  _after(eventName,data,result){
    return this._emit(eventName+"-after",data,result);
  }

  _emit(eventName,data,result){
    let results = [];
    let listeners = this.getListenersForEvent(eventName);
    listeners.forEach((listener)=>{
      let promise=listener.callback(data,result);
      results.push(promise);
    });
    return Promise.all(results);
  }

  emit(eventName,data){
    this._before(eventName,data);
    let result = this._emit(eventName,data);
    let ret = new Promise((resolve,reject)=>{
      result.then((res)=>{
        this._after(eventName,data,res);
        resolve(res);
      }).catch((e)=>{
        reject(e);
      });
    });
    return ret;
  }

  cascade(eventName,data){
    this._before(eventName,data);
    let listeners = this.getListenersForEvent(eventName);
    let result = Promise.resolve(data);
    listeners.forEach((listener,index)=>{
      result=result.then((currentData)=>{
        return listener.callback(currentData,data);
      });
    });
    let ret = new Promise((resolve,reject)=>{
      result.then((res)=>{
        this._after(eventName,data,res);
        resolve(res);
      }).catch((e)=>{
        reject(e);
      });
    });
    return ret;
  }

}

module.exports = Eventor;
