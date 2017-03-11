if(typeof jest=="undefined"){

  jest={
    fn:function(){
      let _test={
        test:function _test(){}
      }
      spyOn(_test,'test');
      return _test.test;
    }
  }
  global.jasmineRequire = {
      interface: function() {}
  };
  require("jasmine-promises");

}
const Eventor = require("../index.js");
const jsc=require("jscheck");
const Promise = require("bluebird");

let valueSize = 1000;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  // no duplicates, no wildcards
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0 || name.charAt(0)=="%"){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();



describe("basic events",()=>{

  it("should create an eventor instance",()=>{
    let eventor = new Eventor({promise:Promise});
    expect(eventor).toBeTruthy();
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
    expect(function(){
      eventor.on(null,()=>{});
    }).toThrow();
    expect(eventor.listeners().length).toBe(1);
    expect(function(){
      eventor.on(undefined,()=>{});
    }).toThrow();
    expect(eventor.listeners().length).toBe(1);
  });

  it("should handle empty callbacks",()=>{
    let eventor = new Eventor();
    expect(function(){
      eventor.on("",null);
    }).toThrow();
    expect(function(){
      eventor.on("test",undefined);
    }).toThrow();
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

  it("should remove listeners based on function",(done)=>{
    let eventor = Eventor();
    let order=[];
    function onTestFn(data,event){
      order.push("ontest")
      return "ontest";
    }
    function beforeAllTestFn(data,event){
      order.push("beforealltest")
      return "beforealltest";
    }
    function beforeTestFn(data,event){
      order.push("beforetest")
      return "beforetest";
    }
    function afterTestFn(data,event){
      order.push("aftertest")
      return "aftertest";
    }
    function afterAllTestFn(data,event){
      order.push("afteralltest")
      return "afteralltest";
    }
    eventor.on("test",onTestFn);
    eventor.useBeforeAll("test",beforeAllTestFn);
    eventor.useBefore("test",beforeTestFn);
    eventor.useAfter("test",afterTestFn);
    eventor.useAfterAll("test",afterAllTestFn);
    expect(eventor.listeners().length).toEqual(1);
    expect(eventor.allListeners().length).toEqual(5);

    eventor.emit("test","").then((results)=>{
      expect(order).toEqual(["beforealltest","beforetest","ontest","aftertest","afteralltest"]);
      let removed = eventor.off(afterTestFn);
      expect(removed).toEqual(1);
      order=[];
      return eventor.emit("test","");
    }).then((results)=>{
      expect(order).toEqual(["beforealltest","beforetest","ontest","afteralltest"]);
      let removed = eventor.off(afterAllTestFn);
      expect(removed).toEqual(1);
      order=[];
      return eventor.emit("test","");
    }).then((results)=>{
      expect(order).toEqual(["beforealltest","beforetest","ontest"]);
      let removed = eventor.off(beforeTestFn);
      expect(removed).toEqual(1);
      order=[];
      return eventor.emit("test","");
    }).then((results)=>{
      expect(order).toEqual(["beforealltest","ontest"]);
      let removed = eventor.off(beforeAllTestFn);
      expect(removed).toEqual(1);
      order=[];
      return eventor.emit("test","");
    }).then((results)=>{
      expect(order).toEqual(["ontest"]);
      let removed = eventor.off(onTestFn);
      expect(removed).toEqual(1);
      order=[];
      return eventor.emit("test","");
    }).then((results)=>{
      expect(order).toEqual([]);
      done();
    });

  })

  it("should return empty array from getListenersForEvent if there is no listener",()=>{
    let eventor=new Eventor();
    expect(eventor.listeners("test")).toEqual([]);
  });

  it("should override and decorate listener callback",()=>{
    let eventor = new Eventor({promise:Promise});
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
    let eventor = new Eventor({promise:Promise});
    let all = [];
    eventor.useBeforeAll("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[0]);
        resolve(data+1);
      });
    });
    eventor.useBefore("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[1]);
        resolve(data+1);
      });
    });
    eventor.on("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[2]);
        resolve(data+1);
      });
    });
    eventor.useAfter("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[3]);
        resolve(data+1);
      });
    });
    eventor.useAfterAll("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener).toEqual(all[4]);
        resolve(data+1);
      });
    });
    all = eventor.allListeners();
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(5);
    });
  });

  it("should have different listeners and events inside different instances",(done)=>{
    let e1=Eventor();
    let e2=Eventor();
    let e1results=[];
    let e2results=[];
    let allResults=[];

    e1.useBefore("test",(data,event)=>{
      e1results.push("useBefore1");
      allResults.push("useBefore1");
    });
    e2.useBefore("test",(data,event)=>{
      e2results.push("useBefore2");
      allResults.push("useBefore2");
    });

    e1.on("test",(data,event)=>{
      e1results.push("on1");
      allResults.push("on1");
    });
    e2.on("test",(data,event)=>{
      e2results.push("on2");
      allResults.push("on2");
    });

    e1.useAfter("test",(data,event)=>{
      e1results.push("useAfter1");
      allResults.push("useAfter1");
    });
    e2.useAfter("test",(data,event)=>{
      e2results.push("useAfter2");
      allResults.push("useAfter2");
    });

    e1.useAfterAll("test",(data,event)=>{
      e1results.push("useAfterAll1");
      allResults.push("useAfterAll1");
    });
    e2.useAfterAll("test",(data,event)=>{
      e2results.push("useAfterAll2");
      allResults.push("useAfterAll2");
    });

    e1.cascade("test",{}).then(()=>{
      expect(e1results).toEqual(["useBefore1","on1","useAfter1","useAfterAll1"]);
      expect(allResults).toEqual(["useBefore1","on1","useAfter1","useAfterAll1"]);
      return e2.cascade("test",{});
    }).then(()=>{
      expect(e2results).toEqual(["useBefore2","on2","useAfter2","useAfterAll2"]);
      expect(allResults).toEqual([
        "useBefore1","on1","useAfter1","useAfterAll1",
        "useBefore2","on2","useAfter2","useAfterAll2"
      ]);
      done();
    });

  });


  it("should remove listener with specified id (we must check id's of listeners that left)",(done)=>{
    let eventor = Eventor();
    let order = [];

    let id1=eventor.on("test",(data,event)=>{
      order.push("id1");
      return event.listener.id;
    });
    let id2=eventor.on("test",(data,event)=>{
      order.push("id2");
      return event.listener.id;
    });
    let id3=eventor.useBefore("test",(data,event)=>{
      order.push("id3");
      return event.listener.id;
    });
    let id4=eventor.useBeforeAll("test",(data,event)=>{
      order.push("id4");
      return event.listener.id;
    });
    let id5=eventor.useAfterAll("test",(data,event)=>{
      order.push("id5");
      return event.listener.id;
    });
    let id6=eventor.useAfter("test",(data,event)=>{
      order.push("id6");
      return event.listener.id;
    });
    let id7=eventor.on("test",(data,event)=>{
      order.push("id7");
      return event.listener.id;
    });

    let listeners = eventor.listeners();
    expect(listeners.length).toEqual(3);
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(7);

    eventor.emit("test","testData").then((results)=>{
      expect(order).toEqual([
        "id4",
        "id3","id3","id3",
        "id1","id2","id7",
        "id6","id6","id6",
        "id5",
      ]);
      order=[];
      return eventor.cascade("test","testData")
    }).then((result)=>{
      expect(order).toEqual([
        "id4",
        "id3","id1","id6",
        "id3","id2","id6",
        "id3","id7","id6",
        "id5"
      ]);

      eventor.removeListener(id5);
      let allListeners=eventor.allListeners();
      expect(allListeners.length).toEqual(6);
      allListeners.forEach((listener)=>{
        if(listener.id==id5){done.fail("removed listener should not be inside listeners array");}
      });
      eventor.removeListener(id2);
      allListeners=eventor.allListeners();
      expect(allListeners.length).toEqual(5);
      allListeners.forEach((listener)=>{
        if(listener.id==id2){done.fail("removed listener should not be inside listeners array");}
      });

      order = [];
      return eventor.emit("test","testData");
    }).then(()=>{
       expect(order).toEqual([
        "id4",
        "id3","id3",
        "id1","id7",
        "id6","id6",
      ]);
      order=[];
      return eventor.cascade("test","testData")
    }).then((result)=>{
      expect(order).toEqual([
        "id4",
        "id3","id1","id6",
        "id3","id7","id6",
      ]);
      done()
    }).catch((e)=>{
      if(e instanceof Error){
        done.fail(e.message);
      }else if(e instanceof Eventor.Error){
        done.fail(e.error.message);
      }else{
        done.fail(e);
      }
    })


  });


});
