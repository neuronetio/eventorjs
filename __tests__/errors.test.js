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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
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
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      expect(error).toEqual("test error");
      return new Promise((resolve)=>{
        resolve(error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      expect(error).toEqual("test error useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
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
      expect(currentError).toEqual("test error useBefore onError useAfter useAfterAll");
      expect(handledTimes).toEqual(4);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should use middlewares in error event (cascade)",(done)=>{
    let errors = [];
    function errorEventsErrorHandler(e){
      console.error(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    let handledTimes=0;
    eventor.useBefore("error",(error)=>{
      expect(handledTimes).toEqual(0);
      handledTimes++;
      expect(error).toEqual("test error");
      return new Promise((resolve)=>{
        resolve(error+" useBefore");
      });
    });
    eventor.on("error",(error)=>{
      expect(handledTimes).toEqual(1);
      handledTimes++;
      expect(error).toEqual("test error useBefore");
      return error+" onError";
    });
    eventor.useAfter("error",(error)=>{
      expect(handledTimes).toEqual(2);
      handledTimes++;
      expect(error).toEqual("test error useBefore onError");
      return error+" useAfter";
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
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
      expect(currentError).toEqual("test error useBefore onError useAfter useAfterAll");
      expect(handledTimes).toEqual(4);
      done();// we must wait for error handler to resolve?
    },100);
  });





  it("should catch errors inside 'error' middlewares (useBefore)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      expect(handledTimes).toEqual(0);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useBefore-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      expect(handledTimes).toEqual(0);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useBefore-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      expect(handledTimes).toEqual(0);
      done();// we must wait for error handler to resolve?
    },100);
  });




  it("should catch errors inside 'error' middlewares (useAfter)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      return error+" useBefore";
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
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfter-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      return error+" useBefore";
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
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfter-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
        resolve(error+" useBefore");
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
      done();// we must wait for error handler to resolve?
    },100);
  });



  it("should catch errors inside 'error' middlewares (useAfterAll)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      return error+" useBefore";
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
      expect(handledTimes).toEqual(4);
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfterAll-inpromise)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
      return error+" useBefore";
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
      done();// we must wait for error handler to resolve?
    },100);
  });

  it("should catch errors inside 'error' middlewares (useAfterAll-reject)",(done)=>{
    let errors = [];
    let tooMany=0;
    function errorEventsErrorHandler(e){
      tooMany++;
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
        resolve(error+" useBefore");
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
        resolve(error+" useAfter");
      });
    });
    eventor.useAfterAll("error",(results)=>{
      expect(handledTimes).toEqual(3);
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
      expect(handledTimes).toEqual(4);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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
      currentError=error;
      handledErrors.push(error);
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

  it("should handle error events errors (emit)",()=>{
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
    return eventor.emit("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      expect(errors).toEqual(["error3"]);
      // only error3 because later errors are in promisses so they will
      // be fired after next tick,
      // but when error is thrown there will be no next errors
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

  it("should handle error events errors inside promise throw (emit)",()=>{
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
    return eventor.emit("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      expect(errors).toEqual(["error1"]);
    })
  });

  it("should handle error events errors (cascade)",()=>{
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
    return eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      expect(errors).toEqual(["error3"]);
      // only error3 because later errors are in promisses so they will
      // be fired after next tick,
      // but when error is thrown there will be no next errors
    });

  });

  it("should handle error events errors inside promise reject (cascade)",()=>{
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
    return eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      expect(errors).toEqual(["error1"]);
    })
  });

  it("should handle error events errors inside promise throw (cascade)",()=>{
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
    return eventor.cascade("test","test")
    .then((results)=>{
      throw new Error("this should not be thrown");
    }).catch((e)=>{
      expect(e).toEqual("test error");
    }).then(()=>{
      expect(errors).toEqual(["error1"]);
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

  it("should not stop listeners when thrown emit (reject)",()=>{
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
    jasmine.clock().install();
    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;
    function errorEventsErrorHandler(e){
      errors.push(e);
    }
    let eventor = Eventor({promise:Promise,errorEventsErrorHandler});
    let currentError = false;
    eventor.on("error",(error)=>{
      currentError=error;
    });
    eventor.on("test",(data,event)=>{
      setTimeout(()=>{
        throw "test error";
      },50);
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

    try{
      jasmine.clock().tick(51);
    }catch(e){
      shouldBeThrown.push(e);
    }
    jasmine.clock().uninstall();

    setTimeout(()=>{
      expect(shouldBeThrown).toEqual(["test error"]);
      expect(thenExecuted).toEqual(1);
      done();
    },100)
  });

  it("should not stop emit when error was thrown in setTimeout",(done)=>{
    jasmine.clock().install();
    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;
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
      setTimeout(()=>{
        throw "test error";
      },50);
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

    try{
      jasmine.clock().tick(51);
    }catch(e){
      shouldBeThrown.push(e);
    }
    jasmine.clock().uninstall();

    setTimeout(()=>{
      expect(shouldBeThrown).toEqual(["test error"]);
      expect(thenExecuted).toEqual(1);
      expect(stack).toEqual(["test","test2","test3"]);
      done();
    },100);
  });

  it("should not stop cascade when error was thrown in setTimeout",(done)=>{
    jasmine.clock().install();
    let errors = [];
    let shouldBeThrown = [];
    let thenExecuted=0;

    function processError(e){
      shouldBeThrown.push(e);
    }
    process.on("uncaughtException",processError);

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
      setTimeout(()=>{
        throw "test error";
        // we cannot catch this error because it is inside promise (cascade)
        // we must use process.on("error") temporairy to not destroy
      },50);
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

    try{
      jasmine.clock().tick(51);
    }catch(e){
      // !!! this will not work because in cascade setTimeout will be in a promise
      // and will be throwed at the next event loop (like nextTick)
    }
    jasmine.clock().uninstall();

    setTimeout(()=>{
      process.removeListener("uncaughtException",processError);
      expect(shouldBeThrown).toEqual(["test error"]);
      expect(thenExecuted).toEqual(1);
      expect(stack).toEqual(["test","test2","test3"]);
      done();
    },100);
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

    setTimeout(()=>{
      process.removeListener('uncaughtException',processError);
      expect(shouldBeThrown).toEqual([]);// errors after resolve are silenced
      expect(thenExecuted).toEqual(1);
      expect(stack).toEqual(["test","test2","test3"]);
      done();
    },100);
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
      errors.push(error);
      currentError=error;
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


});
