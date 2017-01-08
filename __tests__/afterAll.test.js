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

/*
  it("should call namespaced afterAll and after middlewares",()=>{
    let eventor = new Eventor();
    eventor.before("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        resolve("before");
      });
    });
    eventor.before("module1","*",(data,event)=>{
      return new Promise((resolve)=>{
        if(event.nameSpace=="module1"){
          expect(data).toEqual("go");
        }else if(event.nameSpace==""){
          expect(data).toEqual("before");
        }else{
          throw new Error("this nameSpace should not be here "+event.nameSpace);
        }
        resolve("before2");
      });
    });
    eventor.on("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before2");
        resolve("moduel1test");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        if(event.nameSpace=="module1"){
          expect(data).toEqual("module1test");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("module2test");
        }
        resolve("test");
      });
    });
    eventor.on("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        if(event.nameSpace==""){
          expect(data).toEqual("test");
        }else if(event.nameSpace=="module1"){
          expect(data).toEqual();
        }
        resolve("moduel2test");
      });
    });

  });

  it("should get, call and remove namespaced afterAll and after middlewares",()=>{
    throw "TODO";
  });

  it("should contain afterAll listeners in allListeners",()=>{
    throw "TODO";
  });
*/

});
