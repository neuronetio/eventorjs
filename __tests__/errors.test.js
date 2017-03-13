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
jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;

const Eventor = require("../index.js");
const jsc=require("jscheck");
const Promise = require("bluebird");
const promiseLoop = require("promiseloop")(Promise);

let valueSize = 1;

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

describe("error handling",()=>{

  it("should catch and error thrown outside a promise in emit",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(data,event)=>{
      err1();
      return "ok";
    });
    eventor.on("test",(data,event)=>{
      throw new Error("test throw");
      return new Promise((resolve)=>{
        resolve("ok");
      })
    });
    let notFired = jest.fn();
    let catched = jest.fn();
    return eventor.emit("test",{}).then((results)=>{
      expect(err1).toHaveBeenCalledTimes(1);
      notFired();
    }).catch((e)=>{
      catched();
      expect(e.message).toEqual("test throw");
    }).then(()=>{
      expect(notFired).toHaveBeenCalledTimes(0);
      expect(catched).toHaveBeenCalledTimes(1);
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });

  it("should catch and error thrown outside a promise in cascade",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(data,event)=>{
      err1();
      return "ok";
    });
    eventor.on("test",(data,event)=>{
      throw new Error("test throw");
      return new Promise((resolve)=>{
        resolve("ok");
      })
    });
    let notFired = jest.fn();
    let catched = jest.fn();
    return eventor.cascade("test",{}).then((results)=>{
      expect(err1).toHaveBeenCalledTimes(1);
      notFired();
    }).catch((e)=>{
      catched();
      expect(e.message).toEqual("test throw");
    }).then(()=>{
      expect(notFired).toHaveBeenCalledTimes(0);
      expect(catched).toHaveBeenCalledTimes(1);
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });

  it("should catch an error thrown inside a promise in emit",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(data,event)=>{
      err1();
      return "ok";
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        throw new Error("test throw");
        resolve("ok");
      })
    });
    let notFired = jest.fn();
    let catched = jest.fn();
    return eventor.emit("test",{}).then((results)=>{
      expect(err1).toHaveBeenCalledTimes(1);
      notFired();
    }).catch((e)=>{
      catched();

      expect(e.message).toEqual("test throw");
    }).then(()=>{
      expect(notFired).toHaveBeenCalledTimes(0);
      expect(catched).toHaveBeenCalledTimes(1);
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });

  it("should catch an error thrown inside a promise in cascade",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(data,event)=>{
      err1();
      return "ok";
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        throw new Error("test throw");
        resolve("test throw");
      })
    });
    let notFired = jest.fn();
    let catched = jest.fn();
    return eventor.cascade("test",{}).then((results)=>{
      expect(err1).toHaveBeenCalledTimes(1);
      notFired();
    }).catch((e)=>{
      catched();
      expect(e.message).toEqual("test throw");
    }).then(()=>{
      expect(notFired).toHaveBeenCalledTimes(0);
      expect(catched).toHaveBeenCalledTimes(1);
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });




  it("should emit all 'errors' in a loop with namespaces in reject (emit)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            reject(nameSpace+"-"+eventName);
          });
        });
        /* we cannot stop other tasks because they are already fired up
        we can only stop "then" after emit and go immediately to "catch"
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            throw "this should not be visible";
          });
        });*/
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.emit(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });

  it("should emit all 'errors' in a loop with namespaces in promise (emit)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            throw nameSpace+"-"+eventName;
          });
        });
        /* we cannot stop other tasks because they are already fired up
        we can only stop "then" after emit and go immediately to "catch"
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            throw "this should not be visible";
          });
        });*/
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.emit(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });

  it("should emit all 'errors' in a loop with namespaces outside promise (emit)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          throw nameSpace+"-"+eventName;
        });
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.emit(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });

  it("should emit all 'errors' in a loop with namespaces in reject (cascade)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            reject(nameSpace+"-"+eventName);
          });
        });
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.cascade(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });

  it("should emit all 'errors' in a loop with namespaces in promise (cascade)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve,reject)=>{
            throw nameSpace+"-"+eventName;
          });
        });
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.cascade(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });

  it("should emit all 'errors' in a loop with namespaces outside promise (cascade)",()=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      throw error.error;
    });
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        eventor.on(nameSpace,eventName,(data,event)=>{
          throw nameSpace+"-"+eventName;
        });
      });
    });
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
      eventNames.forEach((eventName)=>{
        let p=eventor.cascade(nameSpace,eventName,{})
        .then((results)=>{
          throw "this should not be thrown";
        }).catch((e)=>{
          expect(e).toEqual(nameSpace+"-"+eventName);
        });
        all.push(p);
      });
    });
    return Promise.all(all).then(()=>{
      expect(errors.length).toEqual(valueSize*valueSize);
      let index = 0;
      nameSpaces.forEach((nameSpace,nsi)=>{
        eventNames.forEach((eventName,eni)=>{
          expect(errors[index]).toEqual(nameSpace+"-"+eventName);
          index++;
        });
      });
    }).catch((e)=>{throw e;});
  });



  it("should use middlewares in error event (emit)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledTimes = 0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      expect(error.error).toEqual("test error");
      return new Promise((resolve)=>{
        resolve(error.error+" useBeforeAll");
      });
    });
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll");
      return new Promise((resolve)=>{
        resolve(error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll useBefore");
      // only error (without error) because useBefore resolved flat string
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(4);
      handledTimes++;
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("test error useBeforeAll useBefore onError useAfter useAfterAll");
      expect(handledTimes).toEqual(5);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should use middlewares in error event (cascade)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      console(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      expect(error.error).toEqual("test error");
      return new Promise((resolve)=>{
        resolve(error.error+" useBeforeAll");
      });
    });
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll");
      return new Promise((resolve)=>{
        resolve(error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      expect(error).toEqual("test error useBeforeAll useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(4);
      handledTimes++;
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.cascade("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("test error useBeforeAll useBefore onError useAfter useAfterAll");
      expect(handledTimes).toEqual(5);
      done();// we must wait for error handler to resolve?
    },100);
  });




  it("should catch errors inside 'error' middlewares (useBeforeAll)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;

    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      currentError="useBeforeAll";
      expect(error.error).toEqual("test error");
      tooMany++;
      if(tooMany>=10){
        done();
      }
      throw "useBeforeAll";
    });
    eventor.useBefore("error",(error)=>{
      throw "should not be executed";
    });
    eventor.on("error",(error)=>{
      throw "should not be executed";
    });
    eventor.useAfter("error",(error)=>{
      throw "should not be executed";
    });
    eventor.useAfterAll("error",(results)=>{
      throw "should not be executed";
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    promiseLoop(20,()=>{
      setTimeout(()=>{
        expect(currentError).toEqual("useBeforeAll");
        expect(errors).toEqual(["useBeforeAll"]);
        done();// we must wait for error handler to resolve?
      },100);
    });
  });
  it("should catch errors inside 'error' middlewares (useBeforeAll-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      currentError="useBeforeAll";
      tooMany++;
      if(tooMany>=10){
        done();
      }
      return new Promise((resolve,reject)=>{
        throw "useBeforeAll";
      });
    });
    eventor.on("error",(error)=>{
      throw "should not be executed";
    })
    eventor.on("error",(error)=>{
      throw "should not be executed";
    });
    eventor.useAfter("error",(error)=>{
     throw "should not be executed";
    });
    eventor.useAfterAll("error",(results)=>{
      throw "should not be executed";
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useBeforeAll");
      expect(handledTimes).toEqual(0);
      expect(errors).toEqual(["useBeforeAll"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useBeforeAll-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      currentError="useBeforeAll";
      tooMany++;
      if(tooMany>=10){
        done();
      }
      return new Promise((resolve,reject)=>{
        reject("useBeforeAll");
      });
    });
    eventor.useBefore("error",(error)=>{
      throw "should not be executed";
    });
    eventor.on("error",(error)=>{
      throw "should not be executed";
    });
    eventor.useAfter("error",(error)=>{
      throw "should not be executed";
    });
    eventor.useAfterAll("error",(results)=>{
      throw "should not be executed";
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be thrown";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useBeforeAll");
      expect(handledTimes).toEqual(0);
      expect(errors).toEqual(["useBeforeAll"]);
      done();// we must wait for error handler to resolve?
    },100);
  });


  it("should catch errors inside 'error' middlewares (useBefore)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;

    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      return new Promise((resolve)=>{
        resolve(error.error+" useBeforeAll");
      });
    })
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      expect(error).toEqual("test error useBeforeAll");
      currentError="useBefore";
      tooMany++;
      if(tooMany>=10){
        done();
      }
      throw "useBefore";
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useBefore");
      expect(handledTimes).toEqual(1);
      expect(errors).toEqual(["useBefore"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useBefore-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      currentError="useBeforeAll";
      handledTimes++;
      return new Promise((resolve)=>{
        resolve(error.error+" useBeforeAll");
      });
    });
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      expect(error).toEqual("test error useBeforeAll");
      currentError="useBefore";
      tooMany++;
      if(tooMany>=10){
        done();
      }
      return new Promise((resolve,reject)=>{
        throw "useBefore";
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useBefore");
      expect(handledTimes).toEqual(1);
      expect(errors).toEqual(["useBefore"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useBefore-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBeforeAll";
      return error+" useBeforeAll";
    });
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      currentError="useBefore";
      tooMany++;
      if(tooMany>=10){
        done();
      }
      return new Promise((resolve,reject)=>{
        reject("useBefore");
      });
    });
    eventor.on("error",(error)=>{
      throw "should not be executed";
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error.error+" onError";
    });
    eventor.useAfter("error",(error)=>{// should not be executed
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{ // should not be executed
      expect(handledTimes).toEqual(4);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useBefore");
      expect(handledTimes).toEqual(1);
      expect(errors).toEqual(["useBefore"]);
      done();// we must wait for error handler to resolve?
    },100);
  });




  it("should catch errors inside 'error' middlewares (useAfter)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBefore";
      return error.error+" useBefore";
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      //return error+" useAfter";
      throw "useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfter");
      expect(handledTimes).toEqual(3);
      expect(errors).toEqual(["useAfter"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfter-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBefore";
      return error.error+" useBefore";
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      //return error+" useAfter";
      return new Promise((resolve, reject)=>{
        throw "useAfter";
      });
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfter");
      expect(handledTimes).toEqual(3);
      expect(errors).toEqual(["useAfter"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfter-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBefore";
      return new Promise((resolve,reject)=>{
        resolve(error.error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      return new Promise((resolve,reject)=>{
        reject("useAfter");
      });
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfter");
      expect(handledTimes).toEqual(3);
      expect(errors).toEqual(["useAfter"]);
      done();// we must wait for error handler to resolve?
    },100);
  });



  it("should catch errors inside 'error' middlewares (useAfterAll)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBeforeAll";
      return error.error+" useBeforeAll";
    })
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="useBefore";
      return error+" useBefore";
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBeforeAll useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBeforeAll useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(4);
      handledTimes++;
      currentError="useAfterAll";
      throw "useAfterAll";
      results = results.map((result)=>{
        currentError=result+" useAfterAll";
        return result+" useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfterAll");
      expect(handledTimes).toEqual(5);
      expect(errors).toEqual(["useAfterAll"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfterAll-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBefore";
      return error.error+" useBefore";
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBefore onError");
      //return error+" useAfter";
      return new Promise((resolve, reject)=>{
        resolve(error+" useAfter");
      });
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfterAll";
      return new Promise((resolve,reject)=>{
        throw "useAfterAll";
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfterAll");
      expect(handledTimes).toEqual(4);
      expect(errors).toEqual(["useAfterAll"]);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfterAll-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
      errors.push(e);
      if(tooMany>=10){
        throw new Error("Too many errors");
        done();
      }
      //console.log("error",e)
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError=false;
    let handledTimes=0;
    eventor.useBeforeAll("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      currentError="useBeforeAll";
      return new Promise((resolve,reject)=>{
        resolve(error.error+" useBeforeAll");
      });
    });
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      currentError="useBefore";
      return new Promise((resolve,reject)=>{
        resolve(error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      currentError="onError";
      expect(error).toEqual("test error useBeforeAll useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(3);
      handledTimes++;
      currentError="useAfter";
      expect(error).toEqual("test error useBeforeAll useBefore onError");
      return new Promise((resolve,reject)=>{
        resolve(error+" useAfter");
      });
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(4);
      handledTimes++;
      currentError="useAfterAll";
      return new Promise((resolve,reject)=>{
        reject("useAfterAll");
      });
    });
    eventor.on("test","test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test error");
      });
    });
    eventor.emit("test",{}).then(()=>{
      throw "this should not be throwed";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(currentError).toEqual("useAfterAll");
      expect(handledTimes).toEqual(5);
      expect(errors).toEqual(["useAfterAll"]);
      done();// we must wait for error handler to resolve?
    },100);
  });





  it("should emit errors with useBefore outside Promise and stop later middlewares (emit)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      throw "test error";
    });
    eventor.on("test",(data,event)=>{
      throw "this should not be thrown";
    });
    eventor.useAfter("test",(data,event)=>{
      throw "this should not be thrown";
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.emit("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });

  it("should emit errors with useBefore and stop later middlewares (cascade)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      throw "test error";
    });
    eventor.on("test",(data,event)=>{
      throw "this should not be thrown";
    });
    eventor.useAfter("test",(data,event)=>{
      throw "this should not be thrown";
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.cascade("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });

  it("should emit errors with on and stop later middleware listeners (emit)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    let once = 0;
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("proper one");
      })
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        throw "test error";
      });
    });
    eventor.useAfter("test",(data,event)=>{
      // this code should be executed once because we have one good listener in emit context
      once++;
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.emit("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
      expect(once).toEqual(1);
    });
  });

  it("should emit errors with on and stop later middleware listeners (cascade)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("proper one");
      })
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        throw "test error";
      });
    });
    eventor.useAfter("test",(data,event)=>{
      if(data!="proper one"){
        throw "this should not be thrown";
      }
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.cascade("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });

  it("should emit errors with useAfter and stop later middlewares (emit)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    let useAfterTimes = 0;
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        useAfterTimes++;
        resolve("useAfter1");
      });
    })
    eventor.useAfter("test",(data,event)=>{
      throw "test error";
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        useAfterTimes++;
        resolve("useAfter3");
      });
    })
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.emit("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error","test error"]);
      expect(useAfterTimes).toEqual(2);
    });
  });

  it("should emit errors with useAfter and stop later middlewares (cascade)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.useAfter("test",(data,event)=>{
      throw "test error";
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "this should not be thrown";
    });
    return eventor.cascade("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });

  it("should emit errors with useAfterAll (emit)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("after");
      });
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "test error";
    });
    return eventor.emit("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });

  it("should emit errors with useAfterAll (cascade)",()=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledErrors = [];
    eventor.on("error",(error)=>{
      currentError=error.error;
      handledErrors.push(error.error);
    })
    eventor.useBefore("test",'test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("before");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("on");
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        resolve("after");
      });
    });
    eventor.useAfterAll("test",(data,event)=>{
      throw "test error";
    });
    return eventor.cascade("test",{}).then(()=>{
      throw "this should not be thrown also";
    }).catch((e)=>{
      expect(e).toEqual("test error");
      expect(errors.length).toEqual(0);
      expect(currentError).toEqual("test error");
      expect(handledErrors).toEqual(["test error"]);
    });
  });


  it("should not exceed call stack when 'error' event throws an error outside promise (emit)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1 = jest.fn();
    let errorEventErrors = [];
    eventor.on("error",(error,event)=>{
      err1();
      errorEventErrors.push(error.message);
      throw new Error("yeah");
    });
    eventor.on("test",(data,event)=>{
      throw new Error("test thrown");
    });
    let fn = jest.fn();
    return eventor.emit("test",{}).then((results)=>{
      fn();
    }).catch((e)=>{
      expect(e.message).toEqual("test thrown");
      expect(err1).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(0);
    });
  });

  it("should not exceed call stack when 'error' event throws an error outside promise(cascade)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1 = jest.fn();
    eventor.on("error",(error,event)=>{
      err1();
      throw new Error("yeah");
    });
    eventor.on("test",(data,event)=>{
      throw new Error("test thrown");
    });
    let fn = jest.fn();
    return eventor.cascade("test",{}).then((results)=>{
      fn();
    }).catch((e)=>{
      expect(e.message).toEqual("test thrown");
      expect(err1).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(0);
    });
  });

  it("should not exceed call stack when 'error' event throws an error inside promise (emit)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1 = jest.fn();
    eventor.on("error",(error,event)=>{
      err1();
      return new Promise((resolve, reject)=>{
        throw new Error("yeah");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        throw new Error("test thrown");
      });
    });
    let fn = jest.fn();
    return eventor.emit("test",{}).then((results)=>{
      fn();
    }).catch((e)=>{
      expect(e.message).toEqual("test thrown");
      expect(err1).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(0);
    });
  });

  it("should not exceed call stack when 'error' event throws an error inside promise(cascade)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1 = jest.fn();
    eventor.on("error",(error,event)=>{
      err1();
      throw new Error("yeah");
    });
    eventor.on("test",(data,event)=>{
      throw new Error("test thrown");
    });
    let fn = jest.fn();
    return eventor.cascade("test",{}).then((results)=>{
      fn();
    }).catch((e)=>{
      expect(e.message).toEqual("test thrown");
      expect(err1).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledTimes(0);
    });
  });

  it("should not catch error that was thrown inside error listener (inside Promise)",()=>{
    function mustThrow(){
      let eventor = Eventor({promise:Promise});
      let err1=jest.fn();
      eventor.on("error",(error,event)=>{
        err1();
        throw new Error("this should be thrown");
      });
      eventor.on("test",(data,event)=>{
        return new Promise((resolve,reject)=>{
          throw new Error("test throw");
        })
      });
      let then = jest.fn();
      return eventor.emit("test",{}).then(()=>{
        then();
      }).catch((e)=>{
        // test error is catched, but 'error' error should throw
        expect(then).toHaveBeenCalledTimes(0);
        expect(e.message).toEqual("test throw");
        expect(err1).toHaveBeenCalledTimes(1);
      });
    }

    return mustThrow();
  });

  it("should emit error when promise is rejected inside a listener (emit)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(error,event)=>{
      err1();
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test reject");
      });
    });
    let fn = jest.fn();
    return eventor.emit("test",{}).then((results)=>{
      fn();
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test reject");
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });

  it("should emit error when promise is rejected inside a listener (cascade)",()=>{
    let eventor = Eventor({promise:Promise});
    let err1=jest.fn();
    eventor.on("error",(error,event)=>{
      err1();
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        reject("test reject");
      });
    });
    let fn = jest.fn();
    return eventor.cascade("test",{}).then((results)=>{
      fn();
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test reject");
      expect(err1).toHaveBeenCalledTimes(1);
    });
  });


  it("should handle error events errors (emit) - all of them from emit",(done)=>{
    // we mus catch all errors - not only first one because
    // in emit all of listerners was fired and all can have different errors
    // that we must know
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        reject("error1");
      });
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        throw "error2";
      });
    });
    eventor.on("error",(error)=>{
      throw "error3";
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.emit("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    promiseLoop(10,()=>{
      setTimeout(()=>{
        // error3 is first because it is not wrapped with promise
        expect(errors).toEqual(["error3","error1","error2"]);
        done();
      },1);
    });

  });

  it("should handle error events errors inside promise reject (emit)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        reject("error1");
      });
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.emit("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    setTimeout(()=>{
      expect(errors).toEqual(["error1"]);
      done();
    },100);
  });

  it("should handle error events errors inside promise throw (emit)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        throw "error1";
      });
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.emit("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });
    promiseLoop(10,()=>{
      expect(errors).toEqual(["error1"]);
      done();
    })
  });

  it("should handle error events errors (cascade)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        reject("error1");
      });
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        throw "error2";
      });
    });
    eventor.on("error",(error)=>{
      throw "error3";
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });

    promiseLoop(10,()=>{
      // error3 is first because it is not wrapped with promise
      expect(errors).toEqual(["error3","error1","error2"]);
      done();
    });

  });

  it("should handle error events errors inside promise reject (cascade)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        reject("error1");
      });
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });

    promiseLoop(10,()=>{
      expect(errors).toEqual(["error1"]);
      done();
    });
  });

  it("should handle error events errors inside promise throw (cascade)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({
      promise:Promise,
      errorEventsErrorHandler
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve,reject)=>{
        throw "error1";
      });
    });
    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    });

    promiseLoop(10,()=>{
      expect(errors).toEqual(["error1"]);
      done();
    })
  });



  it("should not stop listeners when thrown emit (outside)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "0";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "1";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      throw "test";
      return "2";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "3";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "4";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "5";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "6";
    });
    return eventor.emit("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(7);
    })
  });

  it("should not stop listeners when thrown emit (inside)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        throw "test";
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    return eventor.emit("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(7);
    })
  });

  it("should not stop listeners when thrown inside emit (reject)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        reject("test");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    return eventor.emit("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(7);
    })
  });

  it("should stop listeners when thrown cascade (outside)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "0";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "1";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      throw "test";
      return "2";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "3";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "4";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "5";
    });
    eventor.on("test",(data,event)=>{
      result.push("+1");
      return "6";
    });
    return eventor.cascade("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(3);
    })
  });

  it("should stop listeners when thrown cascade (inside)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        throw "test";
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    return eventor.cascade("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(3);
    })
  });

  it("should stop listeners when thrown cascade (reject)",()=>{
    let eventor = Eventor({promise:Promise});
    let result = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        reject("test");
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        result.push("+1");
        resolve("+1");
      });

    });
    return eventor.cascade("test",0).then(()=>{
      throw new Error("This should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test");
      expect(result.length).toEqual(3);
    })
  });



  it("should not emit error inside setTimeout outside a promise",(done)=>{
    // what if error will be thrown after promise resolve?

    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      shouldBeThrown.push(e);
    }
    function _setTimeout(fn,time){
      return setTimeout(function(){
        try{
          fn();
        }catch(e){
          processError(e);
        }
      },time);
    }

    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      currentError=error;
    });
    eventor.on("test",(data,event)=>{
      _setTimeout(()=>{
        throw "test error";
      },1);
      return new Promise((resolve,reject)=>{
        resolve("test");
      });
    });
    eventor.emit("test",{}).then((results)=>{
      expect(results).toEqual(["test"]);
      thenExecuted++;
    }).catch((e)=>{
      throw "should not be thrown";
    });

    promiseLoop(10,()=>{
      setTimeout(()=>{
        process.removeListener("uncaughtException",processError);
        expect(shouldBeThrown).toEqual(["test error"]);
        expect(thenExecuted).toEqual(1);
        done();
      },50);
    })
  });

  it("should not stop emit when error was thrown in setTimeout",(done)=>{

    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      shouldBeThrown.push(e);
    }
    function _setTimeout(fn,time){
      return setTimeout(function(){
        try{
          fn();
        }catch(e){
          processError(e);
        }
      },time);
    }

    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      currentError=error;
    });
    let stack = [];
    eventor.on("test",(data,event)=>{
      _setTimeout(()=>{
        throw "test error";
      },1);
      return new Promise((resolve,reject)=>{
        stack.push("test");
        resolve("test");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("original");
      return new Promise((resolve,reject)=>{
        stack.push("test2");
        resolve("test2");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("original");
      stack.push("test3");
      return "test3";
    });
    eventor.emit("test","original").then((results)=>{
      expect(results).toEqual(["test","test2","test3"]);
      thenExecuted++;
    }).catch((e)=>{
      throw "should not be thrown";
    });
    promiseLoop(10,()=>{
      setTimeout(()=>{
        expect(shouldBeThrown).toEqual(["test error"]);
        expect(thenExecuted).toEqual(1);
        expect(stack).toEqual(["test","test2","test3"]);
        done();
      },1);
    });
  });

  it("should not stop cascade when error was thrown in setTimeout",(done)=>{

    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      shouldBeThrown.push(e);
    }
    function _setTimeout(fn,time){
      return setTimeout(function(){
        try{
          fn();
        }catch(e){
          processError(e);
        }
      },time);
    }

    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      currentError=error;
    });
    let stack = [];
    eventor.on("test",(data,event)=>{
      _setTimeout(()=>{
        throw "test error";
      },1);
      return new Promise((resolve,reject)=>{
        stack.push("test");
        resolve("test");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("test");
      return new Promise((resolve,reject)=>{
        stack.push("test2");
        resolve("test2");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("test2");
      stack.push("test3");
      return "test3";
    });
    eventor.cascade("test","original").then((result)=>{
      expect(result).toEqual("test3");
      thenExecuted++;
    }).catch((e)=>{
      console.log("error:",e);
      throw "should not be thrown";
    });

    promiseLoop(10,()=>{
      setTimeout(()=>{
        process.removeListener("uncaughtException",processError);
        expect(shouldBeThrown).toEqual(["test error"]);
        expect(thenExecuted).toEqual(1);
        expect(stack).toEqual(["test","test2","test3"]);
        done();
      },2);
    });
  });

  it("should not stop emit (and not throw) when error was thrown after resolve",(done)=>{
    // errors after resolve are silenced
    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      //shouldBeThrown.push(e);
      console.log("processError",e);
    }
    process.on("uncaughtException",processError);

    function errorEventsErrorHandler(e){
      console.log("error",e)
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      console.log("error2",error)
      currentError=error;
    });
    let stack = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        stack.push("test");
        resolve("test");
        throw "test error";// errors after resolve are silenced
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("original");
      return new Promise((resolve,reject)=>{
        stack.push("test2");
        resolve("test2");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("original");
      stack.push("test3");
      return "test3";
    });

    eventor.emit("test","original").then((results)=>{
      expect(results).toEqual(["test","test2","test3"]);
      thenExecuted++;
    }).catch((e)=>{
      console.log("errror3",e)
      throw "should not be thrown";
    });

    setTimeout(()=>{
      process.removeListener('uncaughtException',processError);
      expect(shouldBeThrown).toEqual([]);// errors after resolve are silenced
      expect(thenExecuted).toEqual(1);
      expect(stack).toEqual(["test","test2","test3"]);
      done();
    },100);

  });

  it("should not stop cascade (and not throw) when error is thrown after resolve",(done)=>{
    // errors after resolve are silenced
    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      //shouldBeThrown.push(e);
      console.log("processError",e);
    }
    process.on("uncaughtException",processError);

    function errorEventsErrorHandler(e){
      console.log("error",e)
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      console.log("error2",error)
      currentError=error;
    });
    let stack = [];
    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        stack.push("test");
        resolve("test");
        throw "test error";// errors after resolve are silenced
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("test");
      return new Promise((resolve,reject)=>{
        stack.push("test2");
        resolve("test2");
      });
    });
    eventor.on("test",(data,event)=>{
      expect(data).toEqual("test2");
      stack.push("test3");
      return "test3";
    });

    eventor.cascade("test","original").then((result)=>{
      expect(result).toEqual("test3");
      expect(stack).toEqual(["test","test2","test3"]);
      thenExecuted++;
    }).catch((e)=>{
      console.log("errror3",e)
      throw "should not be thrown";
    });

    promiseLoop(15,()=>{},()=>{
      process.removeListener('uncaughtException',processError);
      expect(shouldBeThrown).toEqual([]);// errors after resolve are silenced
      expect(thenExecuted).toEqual(1);
      expect(stack).toEqual(["test","test2","test3"]);
      done();
    });

  });

  // what if we catch errors and then do next then? catch().then(throw error)
  it("should do nothing with later errors inside promise chain that was already catched (emit)",()=>{
    let errors = [];
    let thenExecuted=0;

    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;

    eventor.on("error",(error)=>{
      errors.push(error.error);
      currentError=error.error;
    });

    eventor.on("test",(data,event)=>{
      return new Promise((resolve,reject)=>{
        throw "test error";
      });
    });

    return eventor.emit("test","original").then((results)=>{
      throw "should not be thrown";
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      throw "next error";
    }).catch((e)=>{
      expect(e).toEqual("next error");
      expect(errors).toEqual(["test error"]);
      expect(currentError).toEqual("test error");
    });

  });

  it("should have proper eventId inside errorObj inside catch",(done)=>{
    let eventor = Eventor();
    let eventId,eventIdBefore;
    let onFiredUp=false,errorEventFiredUp=false,cascadeFiredUp=false;
    let errorEventObj,catchObj; // errorObj should be equal in catch and 'error' event

    eventor.useBeforeAll("test",(data,event)=>{
      eventIdBefore=event.eventId;
    })
    eventor.useBefore("test",(data,event)=>{
      expect(eventIdBefore).toEqual(event.eventId);
    });
    eventor.on("test",(data,event)=>{
      eventId=event.eventId;
      onFiredUp=true;
      throw new Error("test error");
    });

    eventor.on("error",(errorObj)=>{
      expect(errorObj.error.message).toEqual("test error");
      expect(errorObj.event.eventId).toEqual(eventId);
      expect(errorObj.event.eventId).toEqual(eventIdBefore);
      errorEventFiredUp=true;
      errorEventObj=errorObj;
    });

    eventor.cascade("test",{}).then(()=>{
      throw new Error("should not be fired");
    }).catch((errorObj)=>{
      cascadeFiredUp=true;
      catchObj=errorObj;
      expect(errorObj.message).toEqual("test error");
    });

    promiseLoop(10,()=>{},()=>{
      expect(onFiredUp).toBe(true);
      expect(cascadeFiredUp).toBe(true);
      expect(errorEventFiredUp).toBe(true);
      expect(catchObj.message).toEqual("test error");
      done();
    });

  });


  it("should catch up exact eventObj that throw an error (not later objects)",(done)=>{
    // for example if useBefore thrown an error errorObj.event.useBefore should be true
    let e0 = Eventor(), e0results=[];
    let e1 = Eventor(), e1results=[];
    let e2 = Eventor(), e2results=[];
    let e3 = Eventor(), e3results=[];
    let e4 = Eventor(), e4results=[];

    e0.useBeforeAll("test",(data,event)=>{
      e0results.push("useBeforeAll");
      throw new Error("test error");
    });
    e0.useBefore("test",(data,event)=>{
      e0results.push("useBefore");
    });
    e0.on("test",(data,event)=>{
      e0results.push("on");
    });
    e0.useAfter("test",(data,event)=>{
      e0results.push("useAfter");
    });
    e0.useAfterAll("test",(data,event)=>{
      e0results.push("useAfterAll");
    })
    e0.on("error",(errorObj)=>{
      e0results.push("onError");
      expect(errorObj.event.isUseBeforeAll).toBe(true);
      expect(errorObj.event.isUseBefore).toBe(false);
      expect(errorObj.event.isUseAfter).toBe(false);
      expect(errorObj.event.isUseAfterAll).toBe(false);
    });
    e0.emit("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });
    e0.cascade("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });

    e1.useBefore("test",(data,event)=>{
      e1results.push("useBefore");
      throw new Error("test error");
    });
    e1.on("test",(data,event)=>{
      e1results.push("on");
    });
    e1.on("error",(errorObj)=>{
      e1results.push("onError");
      expect(errorObj.event.isUseBeforeAll).toBe(false);
      expect(errorObj.event.isUseBefore).toBe(true);
      expect(errorObj.event.isUseAfter).toBe(false);
      expect(errorObj.event.isUseAfterAll).toBe(false);
    });
    e1.emit("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });
    e1.cascade("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });


    e2.on("test",(data,event)=>{
      e2results.push("on");
      throw new Error("test error");
    });
    e2.on("error",(errorObj)=>{
      e2results.push("onError");
      expect(errorObj.event.isUseBeforeAll).toBe(false);
      expect(errorObj.event.isUseBefore).toBe(false);
      expect(errorObj.event.isUseAfter).toBe(false);
      expect(errorObj.event.isUseAfterAll).toBe(false);
    });
    e2.emit("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });
    e2.cascade("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });


    e3.useAfter("test",(data,event)=>{
      e3results.push("useAfter");
      throw new Error("test error");
    });
    e3.on("test",(data,event)=>{
      e3results.push("on");
    });
    e3.on("error",(errorObj)=>{
      e3results.push("onError");
      expect(errorObj.event.isUseBeforeAll).toBe(false);
      expect(errorObj.event.isUseBefore).toBe(false);
      expect(errorObj.event.isUseAfter).toBe(true);
      expect(errorObj.event.isUseAfterAll).toBe(false);
    });
    e3.emit("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });
    e3.cascade("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });


    e4.useAfterAll("test",(data,event)=>{
      e4results.push("useAfterAll");
      throw new Error("test error");
    });
    e4.on("error",(errorObj)=>{
      e4results.push("onError");
      expect(errorObj.event.isUseBeforeAll).toBe(false);
      expect(errorObj.event.isUseBefore).toBe(false);
      expect(errorObj.event.isUseAfter).toBe(false);
      expect(errorObj.event.isUseAfterAll).toBe(true);
    });
    e4.emit("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });
    e4.cascade("test","").then(()=>{
      throw new Error("should not be executed");
    }).catch((errorObj)=>{
      expect(errorObj.message).toEqual("test error")
    });


    promiseLoop(20,()=>{
      expect(e0results).toEqual(["useBeforeAll","useBeforeAll","onError","onError"]);
      expect(e1results).toEqual(["useBefore","useBefore","onError","onError"]);// this error is due to lack of useBeforeAll
      expect(e2results).toEqual(["on","on","onError","onError"]);
      expect(e3results).toEqual(["on","on","useAfter","useAfter","onError","onError"]);
      done();
    })

  });


  it("should manually emit an error event",(done)=>{
    let errors=[];
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({errorEventsErrorHandler});
    eventor.on("error",(error)=>{
      return new Promise((resolve)=>{
        expect(error).toEqual("test error");
        resolve(error+" caught");
      });
    });
    eventor.on("error",(error)=>{
      return new Promise((resolve)=>{
        expect(error).toEqual("test error");
        resolve(error+" caught");
      });
    });
    eventor.emit("error","test error").then((results)=>{
      expect(results).toEqual(["test error caught","test error caught"]);
      expect(errors.length).toEqual(0);
      done();
    });

  });

  it("should throw an error when there are no listeners listening",(done)=>{
    let eventor = Eventor();
    let errors = [];
    let notThrown =[];

    try{
      eventor.on();
    }catch(e){
      errors.push(e);
    }

    // from now on, eventor should not throw an error

    eventor.on("error",(errorO,event)=>{
      notThrown.push(errorO.error);
    });

    eventor.on();

    eventor.on("test",(data,event)=>{
      throw "test error";
    });
    eventor.emit("test","no data").then((results)=>{

    }).catch((e)=>{

    }).then(()=>{
      expect(errors.length).toEqual(1);
      expect(notThrown.length).toEqual(2);
      done();
    });

  });

});
