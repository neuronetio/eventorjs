const Eventor = require("../index.js");
const jsc=require("jscheck");

let valueSize = 100;


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



describe("basic events",()=>{

  it("should create an eventor instance",()=>{
    let eventor = new Eventor();
    expect(eventor instanceof Eventor).toBe(true);
  });

  it("should create a list of listeners",()=>{
    let eventor = new Eventor();
    eventNames.forEach((name)=>{
      eventor.on(name,function(){});
    });
    expect(Object.keys(eventor.listeners).length).toBe(valueSize);
    eventNames.forEach((name)=>{
      expect(Object.keys(eventor.listeners[name]).length).toBe(1);
    });
  });

  it("should get all of the listerners no matter what event",()=>{
    let eventor = new Eventor();
    eventNames.forEach((name)=>{
      eventor.on(name,function(){});
    });
    expect(eventor.allListeners.length).toBe(valueSize);
  });

  it("should handle empty event names",()=>{
    let eventor = new Eventor();
    eventor.on("",()=>{});
    expect(eventor.allListeners.length).toBe(1);
    eventor.on(null,()=>{});
    expect(eventor.allListeners.length).toBe(2);
    eventor.on(undefined,()=>{});
    expect(eventor.allListeners.length).toBe(3);
  });

  it("should handle empty callbacks",()=>{
    let eventor = new Eventor();
    eventor.on("",null);
    eventor.on("test",undefined);
    expect(eventor.allListeners.length).toEqual(0);
  });

  it("should return listener id and later delete this listener",()=>{
    let eventor = new Eventor();
    let listenersIds=[];
    eventNames.forEach((name)=>{
      listenersIds.push(eventor.on(name,()=>{}));
    });
    expect(eventor.allListeners.length).toBe(valueSize);
    listenersIds.forEach((listenerId)=>{
      eventor.removeListener(listenerId);
    });
    expect(eventor.allListeners.length).toBe(0);

    let id1=eventor.on("test",()=>{});
    let id2=eventor.on("test",()=>{});
    let id3=eventor.on("test",()=>{});
    expect(eventor.allListeners.length).toBe(3);
    eventor.removeListener(id1);
    eventor.removeListener(id3);
    expect(eventor.allListeners.length).toBe(1);
    let all = eventor.allListeners;
    expect(all[0].id).toEqual(id2);
  });

  it("should call listeners in proper order, and insert listener into stack",()=>{
    let eventor = new Eventor();
    let callbacks = [];
    for(let i=0;i<10;i++){
      let fn = (function(index){
        return function(){
          return index;
        }
      }(i));
      callbacks.push(fn);
    }
    callbacks.forEach((callback)=>{
      eventor.on("test",callback);
    });
    eventor.on("test",()=>{return 123;},0);
    eventor.on("test",()=>{return 321;},5);
    expect(eventor.allListeners.length).toBe(12);
    let results = eventor.emitSync("test","yeaahh");
    expect(results).toEqual([123,0,1,2,3,321,4,5,6,7,8,9]);
  });

  it("should emitSync an event",()=>{
    let eventor = new Eventor();
    let fns = [];
    for(let i=0;i<valueSize*3;i++){ fns.push(jest.fn()); }
    eventNames.forEach((eventName,index)=>{
      eventor.on(eventName,fns[index]);
      eventor.on(eventName,fns[index+valueSize]);
      eventor.on(eventName,fns[index+valueSize*2]);
    });
    expect(eventor.allListeners.length).toBe(valueSize*3);
    eventNames.forEach((eventName,index)=>{
      eventor.emitSync(eventName,"event fired!");
    });
    fns.forEach((fn)=>{
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  it("should emitSync events with proper data in the callback",()=>{
    let eventor = new Eventor();
    let callbacks = [];
    for(let i = 0; i<valueSize; i++){
      let fn = (function(i){
        return function(){
          var args = Array.prototype.slice.call(arguments);
          let str = JSON.stringify(args)+":"+i;
          return str;
        }
      }(i));
      callbacks.push(fn);
    }
    eventNames.forEach((eventName)=>{
      values.forEach((value,index)=>{
        eventor.on(eventName,callbacks[index]);
      });
    });
    eventNames.forEach((eventName)=>{
      values.forEach((value,index)=>{
        let results = eventor.emitSync(eventName,value);
        expect(results.length).toBe(valueSize);
        results.forEach((result,index)=>{
          expect(result).toEqual(JSON.stringify([value])+":"+index);
        });
      });
    });
    eventNames.forEach((eventName)=>{
      values.forEach((value,index)=>{
        let results = eventor.emitSync(eventName,value,value);
        expect(results.length).toBe(valueSize);
        results.forEach((result,index)=>{
          expect(result).toEqual(JSON.stringify([value,value])+":"+index);
        });
      });
    });

  });



});
