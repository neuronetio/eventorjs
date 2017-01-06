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
      let listeners = eventor.getNameSpaceListeners(nameSpace);
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
      callbacks[nameSpace]=[];
      eventNames.forEach((eventName)=>{
        let fn = jest.fn();
        callbacks[nameSpace].push(fn);
        eventor.on(nameSpace,eventName,()=>{
          return new Promise((resolve,reject)=>{
            fn();
            resolve();
          });
        });
      });
    });
    expect(eventor.allListeners.length).toEqual(nameSpaces.length*eventNames.length);
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      let fns=callbacks[nameSpace];
      fns.forEach((callback)=>{
        expect(callback).toHaveBeenCalledTimes(0);
      });
      eventNames.forEach((eventName)=>{
        let r1=eventor.emit(nameSpace+"_notExistingNamespace",eventName,{}).then(()=>{
          callbacks[nameSpace].forEach((fn)=>{
            expect(fn).toHaveBeenCalledTimes(0);
          });
        }).then(()=>{
          return eventor.emit(nameSpace,eventName,{}).then(()=>{
            callbacks[nameSpace].forEach((fn)=>{
              expect(fn).toHaveBeenCalledTimes(1);
            });
          });
        });
        all.push(r1);
      });
    });

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
    let p1=eventor.emit("nameSpace1","test",{}).then(()=>{
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
    });
    all.push(p1);

    return Promise.all(all).catch((e)=>{throw e;});
  });


  it("should cascade event only for specified nameSpace",()=>{
    let eventor = new Eventor();
    let callbacks = {};
    let notTouched = {};
    nameSpaces.forEach((nameSpace)=>{
      callbacks[nameSpace]=[];
      eventNames.forEach((eventName)=>{
        let fn = jest.fn();
        callbacks[nameSpace].push(fn);
        eventor.on(nameSpace,eventName,()=>{
          return new Promise((resolve,reject)=>{
            fn();
            resolve();
          });
        });
      });
    });
    expect(eventor.allListeners.length).toEqual(nameSpaces.length*eventNames.length);
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      let fns=callbacks[nameSpace];
      fns.forEach((callback)=>{
        expect(callback).toHaveBeenCalledTimes(0);
      });
      eventNames.forEach((eventName)=>{
        let r1=eventor.cascade(nameSpace+"_notExistingNamespace",eventName,{}).then(()=>{
          callbacks[nameSpace].forEach((fn)=>{
            expect(fn).toHaveBeenCalledTimes(0);
          });
        }).then(()=>{
          return eventor.cascade(nameSpace,eventName,{}).then(()=>{
            callbacks[nameSpace].forEach((fn)=>{
              expect(fn).toHaveBeenCalledTimes(1);
            });
          });
        });
        all.push(r1);
      });
    });

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
  });

  it("should remove all listeners from specified nameSpace",()=>{
    let eventor = new Eventor();
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,()=>{});
      });
    });
    expect(eventor.allListeners.length).toEqual(nameSpaces.length*eventNames.length);
    let removed = 0;
    nameSpaces.forEach((nameSpace)=>{
      let rm = eventor.removeNameSpaceListeners(nameSpace);
      removed++;
      expect(rm).toEqual(eventNames.length);
      expect(eventor.allListeners.length).toEqual((nameSpaces.length-removed)*eventNames.length);
    });
  });


});
