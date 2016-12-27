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

    
});
