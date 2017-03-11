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

jasmine.DEFAULT_TIMEOUT_INTERVAL = 40000;

const Eventor = require("../index.js");
const jsc=require("jscheck");
const Promise = require("bluebird");

//jasmine.getEnv().defaultTimeoutInterval=20*1000;


let valueSize = 20;


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

let nameSpaces = jsc.array(valueSize,jsc.string(jsc.integer(1,100),jsc.character()))();

//process.on('unhandledRejection', function (err) { throw err; });

describe("namespaces",()=>{

  it("should create an listener with specified namespace",()=>{
    let eventor = new Eventor();
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,()=>{});
      });
    });
    expect(eventor.listeners().length).toEqual(nameSpaces.length*eventNames.length);
    nameSpaces.forEach((nameSpace)=>{
      let listeners = eventor.getListenersFromNamespace(nameSpace);
      expect(listeners.length).toEqual(eventNames.length);
      listeners.forEach((listener)=>{
        expect(listener.nameSpace).toEqual(nameSpace);
      });
    });
  });

  it("should emit event only in specified nameSpace",()=>{
    let eventor = new Eventor();
    let callbacks = {};
    let notTouched = {};
    nameSpaces.forEach((nameSpace)=>{
      callbacks[nameSpace]={};
      eventNames.forEach((eventName)=>{
        let fn = jest.fn();
        callbacks[nameSpace][eventName]=fn;
        eventor.on(nameSpace,eventName,()=>{
          return new Promise((resolve,reject)=>{
            fn();
            resolve(1);
          });
        });
      });
    });
    expect(eventor.listeners().length).toEqual(nameSpaces.length*eventNames.length);
    let all=[];
    let then=0;
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let ns = nameSpace+"_notExistingNamespace";
        let r1=eventor.emit(ns,eventName,{})
        .then((results)=>{
          expect(results).toEqual([]);
          expect(callbacks[nameSpace][eventName]).toHaveBeenCalledTimes(0);
          then++;
          return eventor.emit(nameSpace,eventName,null).then(()=>{
            then++;
            expect(callbacks[nameSpace][eventName]).toHaveBeenCalledTimes(1);
          });
        }).catch((e)=>{throw e;});
        all.push(r1);
      });
    });

    return Promise.all(all).then(()=>{
      expect(then).toEqual(valueSize*valueSize*2);
    }).catch((e)=>{throw e;});
  });

  it("should execute 'then' only once",()=>{
    let eventor = Eventor();
    eventor.on("test",()=>{
      return new Promise((resolve)=>{
        resolve(0);
      });
    });
    eventor.on("ns","test",()=>{
      return new Promise((resolve)=>{
        resolve(1);
      });
    });
    let fn = jest.fn();
    let all = [];
    let p = eventor.emit("test",{}).then((results)=>{
      fn();
      expect(fn).toHaveBeenCalledTimes(1);
      return eventor.emit("ns","test",{});
    }).then(()=>{
      fn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
    all.push(p);
    return Promise.all(all).then(()=>{
      expect(fn).toHaveBeenCalledTimes(2);
    }).catch((e)=>{throw e;})
  });

  it("should execute 'then' only once",()=>{
    let eventor=Eventor();
    let fns = {};
    nameSpaces.forEach((nameSpace)=>{
      fns[nameSpace]={};
      eventNames.forEach((eventName)=>{
        let fn = jest.fn();
        fns[nameSpace][eventName]=fn;
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve)=>{
            fn();
            resolve("ns1test");
          });
        });
      });
    });
    let all = [];
    let thens={};
    nameSpaces.forEach((nameSpace)=>{
      thens[nameSpace]={};
      eventNames.forEach((eventName)=>{
        thens[nameSpace][eventName]=jest.fn();
        let p=eventor.emit(nameSpace,eventName,{}).then((results)=>{
          expect(fns[nameSpace][eventName]).toHaveBeenCalledTimes(1);
          thens[nameSpace][eventName]();
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      nameSpaces.forEach((nameSpace)=>{
        eventNames.forEach((eventName)=>{
          expect(thens[nameSpace][eventName]).toHaveBeenCalledTimes(1);
        });
      })
    }).catch((e)=>{throw e;});
  });

  it("should not call any listener",()=>{
    let eventor = Eventor();
    let fn = jest.fn();
    eventor.on("ns1","test",()=>{
      return new Promise((resolve)=>{
        fn();
        resolve("ns1");
      });
    });
    eventor.on("ns2","test",()=>{
      return new Promise((resolve)=>{
        fn();
        resolve("ns2");
      });
    });
    eventor.on("ns3","test",()=>{
      return new Promise((resolve)=>{
        fn();
        resolve("ns3");
      });
    });
    eventor.on("test",()=>{
      return new Promise((resolve)=>{
        fn();
        resolve("test");
      });
    });
    return eventor.emit("not_existing","test",{}).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(0);
      expect(results).toEqual([]);
      return eventor.emit("ns6","test",{});
    }).then((results)=>{
      expect(fn).toHaveBeenCalledTimes(0);
      expect(results).toEqual([]);
    });
  })

  it("should emit in specified namespace2",()=>{
    let eventor = Eventor();
    expect(eventor.allListeners().length).toEqual(0);
    //manual
    let fn1=jest.fn();
    eventor.on("nameSpace1","test",()=>{
      return new Promise((resolve,reject)=>{
        fn1();
        resolve();
      });
    });
    let fn2=jest.fn();
    eventor.on("nameSpace2","test",()=>{
      return new Promise((resolve,reject)=>{
        fn2();
        resolve();
      });
    });
    let fn3=jest.fn();
    eventor.on("nameSpace3","test",()=>{
      return new Promise((resolve,reject)=>{
        fn3();
        resolve();
      });
    });
    let fn4=jest.fn();
    eventor.on("nameSpace4","test",()=>{
      return new Promise((resolve,reject)=>{
        fn4();
        resolve();
      });
    });

    return eventor.emit("nameSpace1","test",{}).then(()=>{
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(0);
      expect(fn3).toHaveBeenCalledTimes(0);
      expect(fn4).toHaveBeenCalledTimes(0);
    }).then(()=>{
      return eventor.emit("nameSpace2","test",{}).then(()=>{
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(0);
        expect(fn4).toHaveBeenCalledTimes(0);
      });
    }).then(()=>{
      return eventor.emit("nameSpace4","test",{}).then(()=>{
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(0);
        expect(fn4).toHaveBeenCalledTimes(1);
      });
    }).catch((e)=>{throw e;});
  });


  it("should cascade event only for specified nameSpace",()=>{
    let eventor = new Eventor();
    let callbacks = {};
    let notTouched = {};
    let thens = 0;
    nameSpaces.forEach((nameSpace)=>{
      callbacks[nameSpace]={};
      eventNames.forEach((eventName)=>{
        let fn = jest.fn();
        callbacks[nameSpace][eventName]=fn;
        eventor.on(nameSpace,eventName,()=>{
          return new Promise((resolve,reject)=>{
            fn();
            resolve();
          });
        });
      });
    });
    expect(eventor.listeners().length).toEqual(nameSpaces.length*eventNames.length);
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        expect(callbacks[nameSpace][eventName]).toHaveBeenCalledTimes(0);
        let r1=eventor.cascade(nameSpace+"_notExistingNamespace",eventName,{}).then(()=>{
          thens++;
          expect(callbacks[nameSpace][eventName]).toHaveBeenCalledTimes(0);
        }).then(()=>{
          return eventor.cascade(nameSpace,eventName,{}).then(()=>{
            thens++;
            expect(callbacks[nameSpace][eventName]).toHaveBeenCalledTimes(1);
          });
        });
        all.push(r1);
      });
    });
    return Promise.all(all).then(()=>{
      expect(thens).toEqual(valueSize*valueSize*2);
    }).catch((e)=>{throw e});
  });

  it("should cascade event only in specified namespace 2",()=>{
    let eventor = new Eventor();
    let all=[];
    //manual
    let fn1=jest.fn();
    eventor.on("nameSpace1","test",()=>{
      return new Promise((resolve,reject)=>{
        fn1();
        resolve();
      });
    });
    let fn2=jest.fn();
    eventor.on("nameSpace2","test",()=>{
      return new Promise((resolve,reject)=>{
        fn2();
        resolve();
      });
    });
    let fn3=jest.fn();
    eventor.on("nameSpace3","test",()=>{
      return new Promise((resolve,reject)=>{
        fn3();
        resolve();
      });
    });
    let fn4=jest.fn();
    eventor.on("nameSpace4","test",()=>{
      return new Promise((resolve,reject)=>{
        fn4();
        resolve();
      });
    });
    let p1=eventor.cascade("nameSpace1","test",{}).then(()=>{
      expect(fn1).toHaveBeenCalledTimes(1);
      expect(fn2).toHaveBeenCalledTimes(0);
      expect(fn3).toHaveBeenCalledTimes(0);
      expect(fn4).toHaveBeenCalledTimes(0);
    }).then(()=>{
      return eventor.cascade("nameSpace2","test",{}).then(()=>{
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(0);
        expect(fn4).toHaveBeenCalledTimes(0);
      });
    }).then(()=>{
      return eventor.cascade("nameSpace4","test",{}).then(()=>{
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(0);
        expect(fn4).toHaveBeenCalledTimes(1);
      });
    });
    all.push(p1);

    return Promise.all(all).catch((e)=>{throw e;});
  })

  it("should remove all listeners from specified nameSpace",()=>{
    let eventor = new Eventor();
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,()=>{});
      });
    });
    expect(eventor.listeners().length).toEqual(nameSpaces.length*eventNames.length);
    let removed = 0;
    nameSpaces.forEach((nameSpace)=>{
      let rm = eventor.removeListenersFromNamespace(nameSpace);
      removed++;
      expect(rm).toEqual(eventNames.length);
      expect(eventor.listeners().length).toEqual((nameSpaces.length-removed)*eventNames.length);
    });
  });

  it("should return list of listeners from specific namespace and specific eventName",()=>{
    let eventor = new Eventor();
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("module1","*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("module2","*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    expect(eventor.listeners("test").length).toEqual(6);
    expect(eventor.listeners("module1","test").length).toEqual(2);
    expect(eventor.listeners("module2","test").length).toEqual(2);
    expect(eventor.listeners("","test").length).toEqual(2);
    let p= eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(6);
      return eventor.cascade("module1","test",0);
    }).then((result)=>{
      expect(result).toEqual(2);
      return eventor.cascade("module2","test",0);
    }).then((result)=>{
      expect(result).toEqual(2);
      return eventor.cascade("","test",0);
    }).then((result)=>{
      expect(result).toEqual(2);
      return eventor.emit("test",0);
    }).then((results)=>{
      expect(results).toEqual([1,1,1,1,1,1]);
      return eventor.emit("module1","test",0);
    }).then((results)=>{
      expect(results).toEqual([1,1]);
      return eventor.emit("module2","test",0);
    }).then((results)=>{
      expect(results).toEqual([1,1]);
      return eventor.emit("","test",0);
    }).then((results)=>{
      expect(results).toEqual([1,1]);
    });
    return p;
  });

/*
  it("should call listeners that have no nameSpace declared only",()=>{
    let eventor = new Eventor();
    eventor.on("module1","test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve("module1test");
      });
    });
    eventor.on("module2","test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve("module2test");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        resolve("test");
      });
    });
    expect(eventor.listeners("test"))
  });
*/

});
