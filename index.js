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

  emit(eventName,...data){
    let results = [];
    let listeners = this.getListenersForEvent(eventName);
    listeners.forEach((listener)=>{
      let result=listener.callback.apply(null,data);
      results.push(result);
    });
    return results;
  }

}

module.exports = Eventor;
