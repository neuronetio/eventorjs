const Eventor = require("../index.js");
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

describe("afterAll feature",()=>{

  it("should iterate through array of results from emit and apply after calback to each",()=>{
    let eventor = new Eventor();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.after(/.*/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(false);
        expect(data).toEqual(2);
        resolve(data+1);
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([3,3,3]);
    });
  });

  it("should pass results from emit as one array of results",()=>{
    let eventor = new Eventor();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isAfterAll).toBe(false);
        expect(event.isAfter).toBe(true);
        expect(Array.isArray(data)).toBe(false);
        expect(data).toEqual(2);
        resolve(data+1);
      });
    });
    eventor.afterAll(/.*/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(true);
        expect(data).toEqual([3,3,3]);
        expect(event.isAfterAll).toBe(true);
        expect(event.isAfter).toBe(false);
        resolve(data.map((item)=>item+1));
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([4,4,4]);
    });
  });

  it("should pass result from cascade as one variable",()=>{
    let eventor = new Eventor();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isAfterAll).toBe(false);
        expect(event.isAfter).toBe(true);
        expect(data).toEqual(4);
        resolve(data+1);
      });
    });
    eventor.afterAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(false);
        expect(event.isAfterAll).toBe(true);
        expect(event.isAfter).toBe(false);
        expect(data).toEqual(5);
        resolve(data+1);
      });
    });
    return eventor.cascade("test",0).then((results)=>{
      expect(results).toEqual(6);
    });
  });

  it("should emit events in proper order in emit",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        fn();
        resolve("before");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before");
        fn();
        resolve("on1");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before");
        fn();
        resolve("on2");
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toMatch(/on1|on2/gi);
        fn(); // fn is called two times because of two "on" listeners
        resolve("after");
      });
    });
    eventor.afterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual(["after","after"]);
        fn();
        resolve("afterAll");
      });
    });
    return eventor.emit("test","go").then((results)=>{
      expect(results).toEqual("afterAll");
      expect(fn).toHaveBeenCalledTimes(6);
    })
  });

  it("should emit events in proper order in cascade",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        fn();
        resolve("before");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before");
        fn();
        resolve("on1");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("on1");
        fn();
        resolve("on2");
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("on2");
        fn();
        resolve("after");
      });
    });
    eventor.afterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after");
        fn();
        resolve("afterAll");
      });
    });
    return eventor.cascade("test","go").then((results)=>{
      expect(results).toEqual("afterAll");
      expect(fn).toHaveBeenCalledTimes(5);
    })
  });

  it("should call afterAll after 'after' events at the end of process",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        fn();
        resolve("before");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before");
        fn();
        resolve("on1");
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("on1");
        fn();
        resolve("on2");
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("on2");
        fn();
        resolve("after1");
      });
    });
    eventor.afterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after2");
        fn();
        resolve("afterAll1");
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after1");
        fn();
        resolve("after2");
      });
    });
    eventor.afterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("afterAll1");
        fn();
        resolve("afterAll2");
      });
    });
    return eventor.cascade("test","go").then((results)=>{
      expect(results).toEqual("afterAll2");
      expect(fn).toHaveBeenCalledTimes(7);
    })
  });


  it("should call namespaced afterAll and after middlewares with cascade",()=>{
    let eventor = new Eventor();
    let callbackStack=[];
    eventor.before("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        callbackStack.push(event.listener.id);
        resolve("before");
      });
    });
    eventor.before("module1","*",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(event.nameSpace=="module1"){
          expect(data).toEqual("go");
        }else if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("before");
        }else{
          throw new Error("this nameSpace should not be here "+event.nameSpace);
        }
        resolve("before2");
      });
    });
    eventor.on("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("before2");
        resolve("module1test");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace!="undefined"){
          if(event.nameSpace!=""){
            throw new Error("we should not have an namespace here '"+event.nameSpace+"'");
          }
        }
        resolve("test");
      });
    });
    eventor.on("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("test");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("go");
        }
        resolve("module2test");
      });
    });
    eventor.on("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("module2test");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("module2test");
        }
        resolve("module2test2");
      });
    });

    eventor.after("test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("module2test2");
        }else if(event.nameSpace==""){
          expect(data).toEqual("test");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("after");
      });
    });
    eventor.after("test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("after");
        }else if(event.nameSpace==""){
          expect(data).toEqual("after");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("after2");
      });
    });
    eventor.after("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("after2");
        }else if(event.nameSpace=="module1"){
          expect(data).toEqual("module1test");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("after-module1");
      });
    });
    eventor.after("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("after-module1");
        if(typeof event.nameSpace!="undefined"){
          if(event.nameSpace!="module1"){
            throw new Error("We should not have an "+event.nameSpace+" here");
          }
        }
        resolve("after2-module1");
      });
    });
    eventor.after("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("after2-module1");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("module2test2");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("module2after");
      });
    });
    eventor.after("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("module2after");
        if(typeof event.nameSpace!="undefined"){
          if(event.nameSpace!="module2"){
            throw new Error("We should not have an "+event.nameSpace+" here");
          }
        }
        resolve("module2after2");
      });
    });

    eventor.afterAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("module2after2");
        }else if(event.nameSpace==""){
          expect(data).toEqual("after2");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("afterAll");
      });
    });
    eventor.afterAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("afterAll");
        }else if(event.nameSpace==""){
          expect(data).toEqual("afterAll");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("afterAll2");
      });
    });
    eventor.afterAll("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("afterAll2");
        }else if(event.nameSpace=="module1"){
          expect(data).toEqual("after2-module1");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("afterAll-module1");
      });
    });
    eventor.afterAll("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("afterAll-module1");
        if(typeof event.nameSpace!="undefined"){
          if(event.nameSpace!="module1"){
            throw new Error("We should not have an "+event.nameSpace+" here");
          }
        }
        resolve("afterAll2-module1");
      });
    });
    eventor.afterAll("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("afterAll2-module1");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("module2after2");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("module2afterAll");
      });
    });
    eventor.afterAll("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("module2afterAll");
        if(typeof event.nameSpace!="undefined"){
          if(event.nameSpace!="module2"){
            throw new Error("We should not have an "+event.nameSpace+" here");
          }
        }
        resolve("module2finished");
      });
    });

    expect(eventor.allListeners().length).toEqual(18);
    expect(eventor.listeners("test").length).toEqual(4);
    expect(eventor.listeners().length).toEqual(4);

    expect(eventor.getAllNameSpaceListeners("").length).toEqual(6);
    eventor.getAllNameSpaceListeners("").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("");
    });
    expect(eventor.allListeners("","test").length).toEqual(6);
    eventor.allListeners("","test").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("");
    });
    expect(eventor.getAllNameSpaceListeners("module1").length).toEqual(6);
    eventor.getAllNameSpaceListeners("module1").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module1");
    });
    expect(eventor.allListeners("module1","test").length).toEqual(6);
    eventor.allListeners("module1","test").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module1");
    });
    expect(eventor.getAllNameSpaceListeners("module2").length).toEqual(6);
    eventor.getAllNameSpaceListeners("module2").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module2");
    });
    expect(eventor.allListeners("module2","test").length).toEqual(6);
    eventor.allListeners("module2","test").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module2");
    });

    expect(eventor.getNameSpaceListeners("").length).toEqual(1);
    expect(eventor.listeners("","test").length).toEqual(1);
    expect(eventor.getNameSpaceListeners("module1").length).toEqual(1);
    expect(eventor.listeners("module1","test").length).toEqual(1);
    expect(eventor.getNameSpaceListeners("module2").length).toEqual(2);
    eventor.getNameSpaceListeners("module2").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module2");
    });
    expect(eventor.listeners("module2","test").length).toEqual(2);
    eventor.listeners("module2","test").forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module2");
    });

    callbackStack=[];
    return eventor.cascade("test","go").then((result)=>{
      expect(result).toEqual("module2finished");
      expect(callbackStack).toEqual([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18]);
      callbackStack=[];
      return eventor.cascade("module1","test","go");
    }).then((result)=>{
      expect(result).toEqual("afterAll2-module1");
      expect(callbackStack).toEqual([2,3,9,10,15,16]);
      callbackStack=[];
      return eventor.cascade("module2","test","go");
    }).then((result)=>{
      expect(result).toEqual("module2finished");
      expect(callbackStack).toEqual([5,6,11,12,17,18]);
      callbackStack=[];
      return eventor.cascade("","test","go");
    }).then((result)=>{
      expect(callbackStack).toEqual([1,4,7,8,13,14]);
      expect(result).toEqual("afterAll2");
    });
  });


  it("should call namespaced afterAll and after middlewares with emit",()=>{
    let eventor = new Eventor();
    let stack = [];

    eventor.before("test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.before("test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.after("test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.after("test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });

    eventor.before("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.before("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.after("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.after("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("module1","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });

    eventor.before("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.before("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.after("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.after("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });
    eventor.afterAll("module2","test",(data,event)=>{
      stack.push(event.listener.id);
      return data;
    });

    expect(eventor.listeners().length).toEqual(6);
    expect(eventor.allListeners().length).toEqual(24);
    expect(eventor.listeners("","test").length).toEqual(2);
    expect(eventor.allListeners("","test").length).toEqual(8);
    expect(eventor.listeners("module1","test").length).toEqual(2);
    expect(eventor.allListeners("module1","test").length).toEqual(8);
    expect(eventor.listeners("module2","test").length).toEqual(2);
    expect(eventor.allListeners("module2","test").length).toEqual(8);

    stack=[];
    return eventor.emit("","test",0).then((results)=>{
      expect(results).toEqual([3,4]);
      expect(stack).toEqual([1,2,3,4,5,5,6,6,7,8]);
      stack=[];
      return eventor.emit("module1","test",0);
    }).then((results)=>{
      expect(results).toEqual([11,12]);
      expect(stack).toEqual([9,10,11,12,13,13,14,14,15,16]);
      stack=[];
      return eventor.emit("module2","test",0);
    }).then((results)=>{
      expect(results).toEqual([19,20]);
      expect(stack).toEqual([17,18,19,20,21,21,22,22,23,24])
      stack=[];
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4,11,12,19,20]);
      expect(stack).toEqual([
        1,2,9,10,17,18, // before
        3,4,11,12,19,20, // on
        5,5,5,5,5,5,
        6,6,6,6,6,6,
        13,13,13,13,13,13,
        14,14,14,14,14,14,
        21,21,21,21,21,21,
        22,22,22,22,22,22, // after
        7,8,15,16,23,24 // afterAll
      ]);
      stack=[];

      // removing module1
      expect(eventor.removeNameSpaceListeners("module1")).toEqual(2);
      expect(eventor.removeAllNameSpaceListeners("module1")).toEqual(6);
      return eventor.emit("module1","test",0);
    }).then((results)=>{
      expect(results).toEqual([]);
      expect(stack).toEqual([]);
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4,19,20]);
      expect(stack).toEqual([
        1,2,17,18, // before
        3,4,19,20, // on
        5,5,5,5,
        6,6,6,6,
        21,21,21,21,
        22,22,22,22, // after
        7,8,23,24 // afterAll
      ]);
      stack=[];
      return eventor.emit("module2","test",0);
    }).then((results)=>{
      expect(results).toEqual([19,20]);
      expect(stack).toEqual([17,18,19,20,21,21,22,22,23,24])
      stack=[];
      return eventor.emit("","test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4]);
      expect(stack).toEqual([1,2,3,4,5,5,6,6,7,8]);
      stack=[];
    });

  });

  /*
  it("should get, call and remove namespaced afterAll and after middlewares",()=>{
    throw "TODO";
  });

  it("should contain afterAll listeners in allListeners",()=>{
    throw "TODO";
  });
  */

});
