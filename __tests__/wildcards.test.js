const Eventor = require("../index.js");
const jsc=require("jscheck");


let valueSize = 50;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  if(eventNames.indexOf(name)>=0){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();

describe("wildcards",()=>{

  it("should match wildcards with event names",()=>{
    const eventor = new Eventor();
    expect(eventor.wildcardMatchEventName("t*","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*est","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("te*","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*st","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("*","test")).toEqual(true);

    expect(eventor.wildcardMatchEventName("to*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*ss","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);
  });

  it("should match -before and -after eventNames with wildcard",()=>{

  });

  it("should listen wildcarded events when asterisk is in the end of eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("t*",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(1);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(1);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(1);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*");
    }).catch((e)=>{throw e;});
  });

  it("should contain matched regex groups in event object",()=>{
    // event.wildcardMatches? event.wildcard.groups?
  });

  it("should emit event when wildcard asterisk is in the middle of eventname",()=>{

  });

  it("should emit an event when wildcard is in the beginning of the eventname",()=>{

  });

  it("should change event.eventName in callback to emitted eventName when wildcard match",()=>{

  });

  it("should call listeners in proper order",()=>{

  });

  it("should emit t* event",()=>{

  });

  it("should create and get namespaced middlewares",()=>{

  });

});
