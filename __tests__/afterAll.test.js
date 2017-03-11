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

describe("afterAll feature",()=>{

  it("should iterate through array of results from emit and apply after calback to each",()=>{
    let eventor = new Eventor();
    eventor.useBefore("*",(data,event)=>{
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
    eventor.useAfter(/.*/i,(data,event)=>{
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
    eventor.useBefore("*",(data,event)=>{
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
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isUseAfterAll).toBe(false);
        expect(event.isUseAfter).toBe(true);
        expect(Array.isArray(data)).toBe(false);
        expect(data).toEqual(2);
        resolve(data+1);
      });
    });
    eventor.useAfterAll(/.*/i,(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(true);
        expect(data).toEqual([3,3,3]);
        expect(event.isUseAfterAll).toBe(true);
        expect(event.isUseAfter).toBe(false);
        resolve(data.map((item)=>item+1));
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([4,4,4]);
    });
  });

  it("should pass result from cascade as one variable",()=>{
    let eventor = new Eventor();
    eventor.useBefore("*",(data,event)=>{
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
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isUseAfterAll).toBe(false);
        expect(event.isUseAfter).toBe(true);
        if(data!=2 && data!=5 && data!=8)throw "data should equal 2, 5 or 8";
        resolve(data+1);
      });
    });
    eventor.useAfterAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(false);
        expect(event.isUseAfterAll).toBe(true);
        expect(event.isUseAfter).toBe(false);
        expect(data).toEqual(9);
        resolve(data+1);
      });
    });
    return eventor.cascade("test",0).then((results)=>{
      expect(results).toEqual(10);
    });
  });

  it("should emit events in proper order in emit",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.useBeforeAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        fn();
        resolve("beforeAll");
      })
    })
    eventor.useBefore("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("beforeAll");
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
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toMatch(/on1|on2/gi);
        fn(); // fn is called two times because of two "on" listeners
        resolve("after");
      });
    });
    eventor.useAfterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual(["after","after"]);
        fn();
        resolve("afterAll");
      });
    });
    return eventor.emit("test","go").then((results)=>{
      expect(results).toEqual("afterAll");
      expect(fn).toHaveBeenCalledTimes(8);
    })
  });

  it("should emit events in proper order in cascade",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.useBefore("*",(data,event)=>{
      return new Promise((resolve)=>{
        if(data!="go" && data!="after")throw "data should equal 'go' or 'after'";
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
        if(data!="before" && data!="after")throw "data should equal 'before' or 'after'";
        fn();
        resolve("on2");
      });
    });
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        if(data!="on1" && data!="on2")throw "data should equal 'on1' or 'on2'";
        fn();
        resolve("after");
      });
    });
    eventor.useAfterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after");
        fn();
        resolve("afterAll");
      });
    });
    return eventor.cascade("test","go").then((results)=>{
      expect(results).toEqual("afterAll");
      expect(fn).toHaveBeenCalledTimes(7);
    })
  });

  it("should call afterAll after 'after' events at the end of process",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.useBefore("*",(data,event)=>{
      return new Promise((resolve)=>{
        if(data!="go" && data!="after2")throw "data should be equal 'go' or 'after2'";
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
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        if(data!="on1" && data!="on2")throw "data should be equal 'on1' or 'on2'";
        fn();
        resolve("after1");
      });
    });
    eventor.useAfterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after2");
        fn();
        resolve("afterAll1");
      });
    });
    eventor.useAfter("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("after1");
        fn();
        resolve("after2");
      });
    });
    eventor.useAfterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("afterAll1");
        fn();
        resolve("afterAll2");
      });
    });
    return eventor.cascade("test","go").then((results)=>{
      expect(results).toEqual("afterAll2");
      expect(fn).toHaveBeenCalledTimes(10);
    })
  });


  it("should call namespaced afterAll and after middlewares with cascade",()=>{
    let eventor = new Eventor();
    let callbackStack=[];
    eventor.useBefore("test",(data,event)=>{//1
      return new Promise((resolve)=>{
        // it depends on current iteration
        if(callbackStack.indexOf(3)>=0){// second iteration
          expect(data).toEqual("module2after2");
        }else{// first iteration
          expect(data).toEqual("go");
        }
        callbackStack.push(event.listener.id);
        resolve("before");
      });
    });
    eventor.useBefore("module1","*",(data,event)=>{//2
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
    eventor.on("module1","test",(data,event)=>{//3
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        expect(data).toEqual("before2");
        resolve("module1test");
      });
    });
    eventor.on("test",(data,event)=>{//4
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
    eventor.on("module2","test",(data,event)=>{//5
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("before2");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("go");
        }
        resolve("module2test");
      });
    });
    eventor.on("module2","test",(data,event)=>{//6
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("before2");
        }else if(event.nameSpace=="module2"){
          expect(data).toEqual("module2after2");
        }
        resolve("module2test2");
      });
    });

    eventor.useAfter("test",(data,event)=>{//7
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          // it can be one of 4 'on' iterations
          if(callbackStack.indexOf(6)>=0){// 4 iteration - id 6
            expect(data).toEqual("module2test2");
          }else if(callbackStack.indexOf(5)>=0){// 3 iteration id 5
            expect(data).toEqual("module2test")
          }else if(callbackStack.indexOf(4)>=0){// 2 iteration id 4
            expect(data).toEqual("test");
          }else if(callbackStack.indexOf(3)>=0){// 1 iteration id 3
            expect(data).toEqual("module1test");
          }

        }else if(event.nameSpace==""){
          expect(data).toEqual("test");
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("after");
      });
    });
    eventor.useAfter("test",(data,event)=>{//8
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
    eventor.useAfter("module1","test",(data,event)=>{//9
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
    eventor.useAfter("module1","test",(data,event)=>{//10
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
    eventor.useAfter("module2","test",(data,event)=>{//11
      return new Promise((resolve)=>{
        callbackStack.push(event.listener.id);
        if(typeof event.nameSpace=="undefined"){
          expect(data).toEqual("after2-module1");
        }else if(event.nameSpace=="module2"){
          // it can be firs or second iteration
          if(callbackStack.indexOf(6)>=0){//second iteration
            expect(data).toEqual("module2test2");
          }else{//first iteration
            expect(data).toEqual("module2test");
          }
        }else{
          throw new Error("we should not have an namespace here");
        }
        resolve("module2after");
      });
    });
    eventor.useAfter("module2","test",(data,event)=>{//12
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

    eventor.useAfterAll("test",(data,event)=>{//13
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
    eventor.useAfterAll("test",(data,event)=>{//14
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
    eventor.useAfterAll("module1","test",(data,event)=>{//15
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
    eventor.useAfterAll("module1","test",(data,event)=>{//16
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
    eventor.useAfterAll("module2","test",(data,event)=>{//17
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
    eventor.useAfterAll("module2","test",(data,event)=>{//18
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
      expect(callbackStack).toEqual([
        1,2,3,7,8,9,10,11,12,
        1,2,4,7,8,9,10,11,12,
        1,2,5,7,8,9,10,11,12,
        1,2,6,7,8,9,10,11,12,
        13,14,15,16,17,18
      ]);
      callbackStack=[];
      return eventor.cascade("module1","test","go");
    }).then((result)=>{
      expect(result).toEqual("afterAll2-module1");
      expect(callbackStack).toEqual([2,3,9,10,15,16]);
      callbackStack=[];
      return eventor.cascade("module2","test","go");
    }).then((result)=>{
      expect(result).toEqual("module2finished");
      expect(callbackStack).toEqual([5,11,12,6,11,12,17,18]);
      callbackStack=[];
      return eventor.cascade("","test","go");
    }).then((result)=>{
      expect(callbackStack).toEqual([1,4,7,8,13,14]);
      expect(result).toEqual("afterAll2");
    });
  });


  it("should get,call and remove namespaced afterAll and after middlewares with emit",()=>{
    let eventor = new Eventor();
    let stack = [];

    eventor.useBefore("test",(data,event)=>{//1
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useBefore("test",(data,event)=>{//2
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("test",(data,event)=>{//3
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("test",(data,event)=>{//4
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useAfter("test",(data,event)=>{//5
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfter("test",(data,event)=>{//6
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("test",(data,event)=>{//7
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("test",(data,event)=>{//8
      stack.push(event.listener.id);
      return data;
    });

    eventor.useBefore("module1","test",(data,event)=>{//9
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useBefore("module1","test",(data,event)=>{//10
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module1","test",(data,event)=>{//11
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module1","test",(data,event)=>{//12
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useAfter("module1","test",(data,event)=>{//13
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfter("module1","test",(data,event)=>{//14
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("module1","test",(data,event)=>{//15
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("module1","test",(data,event)=>{//16
      stack.push(event.listener.id);
      return data;
    });

    eventor.useBefore("module2","test",(data,event)=>{//17
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useBefore("module2","test",(data,event)=>{//18
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module2","test",(data,event)=>{//19
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.on("module2","test",(data,event)=>{//20
      stack.push(event.listener.id);
      return event.listener.id;
    });
    eventor.useAfter("module2","test",(data,event)=>{//21
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfter("module2","test",(data,event)=>{//22
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("module2","test",(data,event)=>{//23
      stack.push(event.listener.id);
      return data;
    });
    eventor.useAfterAll("module2","test",(data,event)=>{//24
      stack.push(event.listener.id);
      return data;
    });
    eventor.useBeforeAll("module1","test",(data,event)=>{//25
      stack.push(event.listener.id);
      return data;
    });
    eventor.useBeforeAll("module2","test",(data,event)=>{//26
      stack.push(event.listener.id);
      return data;
    });

    expect(eventor.listeners().length).toEqual(6);
    expect(eventor.allListeners().length).toEqual(26);
    expect(eventor.listeners("","test").length).toEqual(2);
    expect(eventor.allListeners("","test").length).toEqual(8);
    expect(eventor.listeners("module1","test").length).toEqual(2);
    expect(eventor.allListeners("module1","test").length).toEqual(9);
    expect(eventor.listeners("module2","test").length).toEqual(2);
    expect(eventor.allListeners("module2","test").length).toEqual(9);

    stack=[];
    return eventor.emit("","test",0).then((results)=>{
      expect(results).toEqual([3,4]);
      expect(stack).toEqual([1,1,2,2,3,4,5,5,6,6,7,8]);
      stack=[];
      return eventor.emit("module1","test",0);
    }).then((results)=>{
      expect(results).toEqual([11,12]);
      expect(stack).toEqual([25,9,9,10,10,11,12,13,13,14,14,15,16]);
      stack=[];
      return eventor.emit("module2","test",0);
    }).then((results)=>{
      expect(results).toEqual([19,20]);
      expect(stack).toEqual([26,17,17,18,18,19,20,21,21,22,22,23,24])
      stack=[];
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4,11,12,19,20]);
      expect(stack).toEqual([
        25,26,
        1,1,1,1,1,1
        ,2,2,2,2,2,2
        ,9,9,9,9,9,9
        ,10,10,10,10,10,10
        ,17,17,17,17,17,17
        ,18,18,18,18,18,18, // before
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
      expect(eventor.removeAllNameSpaceListeners("module1")).toEqual(7);
      return eventor.emit("module1","test",0);
    }).then((results)=>{
      expect(results).toEqual([]);
      expect(stack).toEqual([]);
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4,19,20]);
      expect(stack).toEqual([
        26,
        1,1,1,1,
        2,2,2,2,
        17,17,17,17,
        18,18,18,18, // before
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
      expect(stack).toEqual([26,17,17,18,18,19,20,21,21,22,22,23,24])
      stack=[];
      return eventor.emit("","test",0);
    }).then((results)=>{
      expect(results).toEqual([3,4]);
      expect(stack).toEqual([1,1,2,2,3,4,5,5,6,6,7,8]);
      stack=[];
    });

  });


  it("should call after - before all promises are resolved (individualy)",(done)=>{
    let eventor = new Eventor();
    let order = [];

    let match = eventor.wildcardMatchEventName("*","test");
    expect(match.matches).toBeTruthy();
    // this one will be fired second
    eventor.on("*",()=>{
      return new Promise((resolve)=>{
        process.nextTick(()=>{
          process.nextTick(()=>{
            resolve("first-as-second");
          });
        });
      })
    });
    eventor.on("test",()=>{
      return new Promise((resolve)=>{
        process.nextTick(()=>{
          resolve("second-as-first");
        });
      });
    });
    eventor.useAfter("someNameSpace",/test/gi,(data,event)=>{
      order.push(data+":after");
      return new Promise((resolve)=>{
        resolve(data);
      });
    });
    eventor.useAfterAll("test",(data,event)=>{

      return new Promise((resolve)=>{
        if(event.type=="emit"){
          expect(data).toEqual(["first-as-second","second-as-first"]);
          expect(order).toEqual(["second-as-first:after","first-as-second:after"]);
        }else{
          expect(data).toEqual("second-as-first");
          expect(order).toEqual(["first-as-second:after","second-as-first:after"]); // sequence
        }
        resolve(data);
      });
    });

    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual(["first-as-second","second-as-first"]);
      expect(order).toEqual(["second-as-first:after","first-as-second:after"]);
      order=[];
      return eventor.cascade("test",0);
    }).then((result)=>{
      expect(result).toEqual("second-as-first");
      expect(order).toEqual(["first-as-second:after","second-as-first:after"]);
      done();
    });

  });

});
