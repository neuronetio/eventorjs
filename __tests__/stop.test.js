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

let valueSize = 100;

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

describe("stop events",()=>{

  it("should have stop method in event",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.stop).toBe("function");
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.stop).toBe("function");
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stop).toBe("function");
    });
    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.stop).toBe("function");
    });
    return eventor.emit("test","test").then((results)=>{
      return eventor.cascade("test","test");
    });
  });

  it("should stop event propagation in emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return new Promise((resolve)=>{
        resolve("before_stop");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("just for fun");
      expect(event.stopped).toEqual("just for fun");
      return new Promise((resolve)=>{
        resolve("stopped");
      });
    });
    eventor.on("test",(data,event)=>{
      throw new Error("This should not be fired");
    });
    return eventor.emit("test","test").then((results)=>{
      expect(results).toEqual(["before_stop","stopped"]);
    })
  });//it

  it("should stop event propagation with middlewares in emit",()=>{
    let eventor = Eventor({promise:Promise});

    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useBefore1";
    });
    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("yeah");
      return data+"_useBefore2";
    });
    eventor.useBefore("test",(data,event)=>{
      throw new Error("This should not be fired");
      return data+"_useBefore3";
    });

    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      expect(data).toEqual("test_useBefore1_useBefore2");
      return new Promise((resolve)=>{
        resolve(data+"_on1");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      expect(data).toEqual("test_useBefore1_useBefore2");
      event.stop("yeah2");
      return new Promise((resolve)=>{
        resolve(data+"_on2");
      });
    });
    eventor.on("test",(data,event)=>{
      throw new Error("This should not be fired");
    });

    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useAfter1";
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useAfter2";
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("after2Stopped");
      return data+"_useAfter3";
    });
    eventor.useAfter("test",(data,event)=>{
      throw new Error("This should not be fired");
    });

    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      data.push("afterAll1");
      return data;
    });
    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("yeah");
      data.push("afterAll2");
      return data;
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw new Error("This should not be fired");
    });

    return eventor.emit("test","test").then((results)=>{
      expect(results).toEqual([
        'test_useBefore1_useBefore2_on1_useAfter1_useAfter2_useAfter3',
        'test_useBefore1_useBefore2_on2_useAfter1_useAfter2_useAfter3',
        'afterAll1','afterAll2'
      ]);
    });
  });//it

  it("should stop event propagation in cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      expect(data).toEqual("test");
      return new Promise((resolve)=>{
        resolve("before_stop");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("before_stop");
      expect(typeof event.stopped).toBe("undefined");
      event.stop("just for fun");
      expect(event.stopped).toEqual("just for fun");
      return new Promise((resolve)=>{
        resolve(data+"_stopped");
      });
    });
    eventor.on("test",(data,event)=>{
      throw new Error("This should not be fired");
    });
    return eventor.cascade("test","test").then((result)=>{
      expect(result).toEqual("before_stop_stopped");
    })
  });//it

  it("should stop event propagation with middlewares in cascade",()=>{
    let eventor = Eventor({promise:Promise});

    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useBefore1";
    });
    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("yeah");
      return data+"_useBefore2";
    });
    eventor.useBefore("test",(data,event)=>{
      throw new Error("This should not be fired");
      return data+"_useBefore3";
    });

    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      expect(data).toEqual("test_useBefore1_useBefore2");
      return new Promise((resolve)=>{
        resolve(data+"_on1");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      expect(data).toEqual("test_useBefore1_useBefore2_on1");
      event.stop("yeah2");
      return new Promise((resolve)=>{
        resolve(data+"_on2");
      });
    });
    eventor.on("test",(data,event)=>{
      throw new Error("This should not be fired");
    });

    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useAfter1";
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useAfter2";
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("after2Stopped");
      return data+"_useAfter3";
    });
    eventor.useAfter("test",(data,event)=>{
      throw new Error("This should not be fired");
    });

    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      return data+"_useAfterAll1"
    });
    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.stopped).toBe("undefined");
      event.stop("yeah");
      return data+"_useAfterAll2"
      return data;
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw new Error("This should not be fired");
    });
    return eventor.cascade("test","test").then((results)=>{
      expect(results).toEqual(
        'test_useBefore1_useBefore2_on1_on2_useAfter1_useAfter2_useAfter3_useAfterAll1_useAfterAll2'
      );
    });
  });//it

});
