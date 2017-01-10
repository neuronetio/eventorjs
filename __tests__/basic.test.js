const Eventor = require("../eventor.js");
const jsc=require("jscheck");

let valueSize = 50;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  // no duplicates, no wildcards
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();



describe("basic events",()=>{

  it("should create an eventor instance",()=>{
    let eventor = new Eventor();
    // we are not using class anymore
    //expect(eventor instanceof Eventor).toBe(true);
  });

  it("should create a list of listeners",()=>{
    let eventor = new Eventor();
    eventNames.forEach((name)=>{
      eventor.on(name,function(){});
    });
    expect(Object.keys(eventor.listeners()).length).toBe(valueSize);
    eventNames.forEach((name)=>{
      expect(Object.keys(eventor.listeners(name)).length).toBe(1);
    });
  });

  it("should get all of the listerners no matter what event",()=>{
    let eventor = new Eventor();
    eventNames.forEach((name)=>{
      eventor.on(name,function(){});
    });
    expect(eventor.listeners().length).toBe(valueSize);
  });

  it("should handle empty event names",()=>{
    let eventor = new Eventor();
    eventor.on("",()=>{});
    expect(eventor.listeners().length).toBe(1);
    eventor.on(null,()=>{});
    expect(eventor.listeners().length).toBe(1);
    eventor.on(undefined,()=>{});
    expect(eventor.listeners().length).toBe(1);
  });

  it("should handle empty callbacks",()=>{
    let eventor = new Eventor();
    eventor.on("",null);
    eventor.on("test",undefined);
    expect(eventor.listeners().length).toEqual(0);
  });

  it("should return listener id and later delete this listener",()=>{
    let eventor = new Eventor();
    let listenersIds=[];
    eventNames.forEach((name)=>{
      listenersIds.push(eventor.on(name,()=>{}));
    });
    expect(eventor.listeners().length).toBe(valueSize);
    listenersIds.forEach((listenerId)=>{
      eventor.removeListener(listenerId);
    });
    expect(eventor.listeners().length).toBe(0);

    let id1=eventor.on("test",()=>{});
    let id2=eventor.on("test",()=>{});
    let id3=eventor.on("test",()=>{});
    expect(eventor.listeners().length).toBe(3);
    eventor.removeListener(id1);
    eventor.removeListener(id3);
    expect(eventor.listeners().length).toBe(1);
    let all = eventor.listeners();
    expect(all[0].id).toEqual(id2);
  });

  it("should return empty array from getListenersForEvent if there is no listener",()=>{
    let eventor=new Eventor();
    expect(eventor.listeners("test")).toEqual([]);
  });

  it("should override and decorate listener callback",()=>{
    let eventor = new Eventor();
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("yeah");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("buck");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("bunny");
      });
    });
    let listeners = eventor.listeners();
    expect(listeners.length).toEqual(3);
    let fn=jest.fn();
    listeners.forEach((listener)=>{
      listener.callback=(data,event)=>{
        return new Promise((resolve)=>{
          fn();
          resolve("that's right");
        });
      }
    });
    return eventor.emit("test","mhm").then((results)=>{
      expect(results).toEqual(["that's right","that's right","that's right"]);
      expect(fn).toHaveBeenCalledTimes(3);
    }).catch((e)=>{ throw e;});
  });


  it("should contain listener object in event argument",()=>{
    let eventor = new Eventor();
    let all = [];
    eventor.before("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[0]);
        resolve(data+1);
      });
    });
    eventor.on("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[1]);
        resolve(data+1);
      });
    });
    eventor.after("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[2]);
        resolve(data+1);
      });
    });
    all = eventor.allListeners();
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(3);
    });
  });


});
