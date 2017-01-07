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

    expect(eventor.wildcardMatchEventName("t**","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**est","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("te**","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**st","test")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**","test")).toEqual(true);

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two.*three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.six.seven.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two**","one.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two**","one.two")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**our","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**our","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**.three.four","one.five.two.three.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("**three.four","one.five.two.three.four")).toEqual(true);

    expect(eventor.wildcardMatchEventName("o*.two.thr-ee.fo-ur","one.two.thr-ee.fo-ur")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o*.t*.thr//ee.fo\\ur","one.two.thr//ee.fo\\ur")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.*.thr?.four","one.two.thr?.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two.*three.fo$ur","one.two.three.fo$ur")).toEqual(true);
    expect(eventor.wildcardMatchEventName("one.two*.thr@ee.four","one.two.thr@ee.four")).toEqual(true);
    expect(eventor.wildcardMatchEventName("o**.two.thrę.fourś","one.two.thrę.fourś")).toEqual(true);

    expect(eventor.wildcardMatchEventName("o**.two.three.FOUR","one.five.six.seven.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.Two**","one.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.*.two**","one..two")).toEqual(true);

    expect(eventor.wildcardMatchEventName("to*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*ss","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o*","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);
    expect(eventor.wildcardMatchEventName("*a","test")).toEqual(false);

    expect(eventor.wildcardMatchEventName("o*.two.three.four","one.twooo.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two*three.four","one.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o*.t*.three.four","one.two.t.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two.three.*","one.two.three")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.*.three*","one.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two*.three.four","one.atwo.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","one.two.five.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("o**.two.three.four","bone.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two**","done.two.three.four")).toEqual(false);
    expect(eventor.wildcardMatchEventName("one.two**","one.tw")).toEqual(false);

    expect(eventor.wildcardMatchEventName(/test/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/^test$/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/te.*/gi,"test")).toEqual(true);
    expect(eventor.wildcardMatchEventName(/.*st/gi,"test")).toEqual(true);
  });

  it("should match -before eventNames with wildcard on emit/cascade",()=>{
    let eventor = new Eventor();
    let fn=jest.fn();
    eventor.before("one.*.three",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("before");
      });
    });
    eventor.before("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("before");
      });
    });
    eventor.on("*.two.three",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("before");
        fn();
        resolve("ok");
      });
    });
    return eventor.emit("one.two.three",{}).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual(["ok"]);
      return eventor.cascade("one.two.three",{});
    }).then((result)=>{
      expect(fn).toHaveBeenCalledTimes(6);
      expect(result).toEqual("ok");
    });

  });

  it("should match -after eventNames with wildcard on emit/cascade",()=>{
    let eventor = new Eventor();
    let fn=jest.fn();
    eventor.after("one.*.three",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("after1");
      });
    });
    eventor.after("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        fn();
        resolve("after2");
      });
    });
    eventor.on("*.two.three",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go!");
        fn();
        resolve("ok");
      });
    });
    return eventor.emit("one.two.three","go!").then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual("after2");
      return eventor.cascade("one.two.three","go!");
    }).then((result)=>{
      expect(fn).toHaveBeenCalledTimes(6);
      expect(result).toEqual("after2");
    });

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
    eventor.on("t**",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*");
    }).catch((e)=>{throw e;});
  });

  it("should contain matched regex groups in event object",()=>{
    // event.wildcardMatches? event.wildcard.groups?
    throw "TODO";
  });

  it("should emit event when wildcard asterisk is in the middle of eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("t*t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*t");
      });
    });
    eventor.on("t**t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("t*t");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("t*t");
    }).catch((e)=>{throw e;});
  });

  it("should emit an event when wildcard is in the beginning of the eventname",()=>{
    let eventor =  new Eventor();
    let fn = jest.fn();
    eventor.on("*t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("*t");
      });
    });
    eventor.on("**t",(data,event)=>{
      return new Promise((resolve)=>{
        // event.eventName can be an -before and -after event too
        resolve("*t");
      });
    });
    let allListeners = eventor.allListeners();
    expect(allListeners.length).toEqual(2);
    let wildcarded = allListeners.filter((listener)=>listener.isWildcard);
    expect(wildcarded.length).toEqual(2);
    let listeners = eventor.listeners("test");
    expect(listeners.length).toEqual(2);
    return eventor.cascade("test",{some:"data"}).then((result)=>{
      expect(result).toEqual("*t");
    }).catch((e)=>{throw e;});
  });

  it("should change event.eventName in callback to emitted eventName when wildcard match",()=>{
    let eventor = new Eventor();
    let fn = jest.fn();
    eventor.before("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test-before");
      })
    });
    eventor.on("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test");
      })
    });
    eventor.after("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.eventName).toEqual("one.two.three");
        fn();
        resolve("test-after");
      })
    });
    return eventor.emit("one.two.three",{}).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(3);
      expect(results).toEqual("test-after");
    });
  });

  it("should call wildcarded listeners in proper order",()=>{
    let eventor = new Eventor();
    eventor.before("one**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go");
        resolve(data+":first");
      });
    });
    eventor.on("one.two.**",(data,event)=>{
      return new Promise((resolve)=>{
        expect(data).toEqual("go:first");
        resolve(data+":second");
      });
    });
    eventor.on("one.**",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+":third");
      });
    });
    eventor.after("one.*.*",(data,event)=>{
      return new Promise((resolve)=>{
        if(event.type=="cascade"){
          resolve(data+":fourth");
        }else{
          let results = data.map((result)=>{
            return result+":fourth";
          });
          resolve(results);
        }
      });
    });
    return eventor.cascade("one.two.three","go").then((result)=>{
      expect(result).toEqual("go:first:second:third:fourth");
      return eventor.emit("one.two.three","go");
    }).then((results)=>{
      expect(results).toEqual(["go:first:second:fourth","go:first:third:fourth"]);
    });
  });

  it("should create and get namespaced middlewares with wildcards",()=>{
    let eventor = new Eventor();
    eventor.before("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    eventor.on("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    eventor.before("module","t*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.listener.nameSpace).toEqual("module");
        resolve(data+1);
      });
    });
    expect(eventor.listeners().length).toEqual(1);
    expect(eventor.listeners("test").length).toEqual(1);
    expect(eventor.allListeners().length).toEqual(3);
    expect(eventor.allListeners("test").length).toEqual(3);
    let all = eventor.allListeners();
    all.forEach((listener)=>{
      expect(listener.nameSpace).toEqual("module");
    });

    expect(eventor.getNameSpaceListeners("module").length).toEqual(1);
    expect(eventor.getAllNameSpaceListeners("module").length).toEqual(3);
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(3);
    });
  });

});
