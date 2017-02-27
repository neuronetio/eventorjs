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
const promiseLoop=require("promiseloop")(Promise);

let valueSize = 1000;


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

//process.on('unhandledRejection', function (err) { throw err; });

describe("before and after middlewares",()=>{

  it("should fire an before and after events with emit",()=>{
    let eventor = new Eventor();
    let fns = [];
    eventNames.forEach((eventName)=>{
      eventor.on(eventName,()=>{});
      let before = jest.fn();
      fns.push(before);
      eventor.useBefore(eventName,before);
      let after = jest.fn();
      fns.push(after);
      eventor.useAfter(eventName,after);
    });
    let all = [];
    eventNames.forEach((eventName)=>{
      all.push(eventor.emit(eventName,{}));
    });

    return Promise.all(all).then(()=>{
      fns.forEach((fn)=>{
        expect(fn).toHaveBeenCalledTimes(1);
      });
    }).catch((e)=>{
      throw e;
    });

  });


  it("should fire an before and after events with cascade",()=>{
    let eventor = new Eventor();
    let fns = [];
    eventNames.forEach((eventName)=>{
      eventor.on(eventName,()=>{});
      let before = jest.fn();
      fns.push(before);
      eventor.useBefore(eventName,before);
      let after = jest.fn();
      fns.push(after);
      eventor.useAfter(eventName,after);
    });
    let all=[];
    eventNames.forEach((eventName)=>{
      let p=eventor.cascade(eventName,{});
      all.push(p);
    });
    return Promise.all(all).then(()=>{
      fns.forEach((fn)=>{
        expect(fn).toHaveBeenCalledTimes(1);
      });
    }).catch((e)=>{
      throw e;
    });
  });


  it("should cascade before events and pass result as input data for real events",()=>{
    let eventor = new Eventor();

    eventNames.forEach((eventName)=>{
      eventor.useBefore(eventName,(data,original)=>{
        return new Promise((resolve,reject)=>{
          let _data=Object.assign({},data);
          _data[eventName]=1;
          resolve(_data);
        });
      });
      eventor.useBefore(eventName,(data,original)=>{
        return new Promise((resolve,reject)=>{
          expect(data[eventName]).toEqual(1);
          let _data=Object.assign({},data);
          _data[eventName]++;
          resolve(_data);
        });
      });
    });

    let all = [];
    let collected = {};
    eventNames.forEach((eventName)=>{
      let p=eventor.emit(eventName,{}).then((results)=>{
        expect(results.length).toEqual(0); // no emiter is listening right now
      }).then(()=>{
        // then - because promises in jest are executed at the same tick
        eventor.on(eventName,(data)=>{
          return new Promise((resolve,reject)=>{
            expect(data[eventName]).toEqual(2);
            resolve(data);
          });
        });

        return eventor.emit(eventName,{}).then((results)=>{
          results.forEach((result)=>{
            expect(result[eventName]).toEqual(2);
            expect(Object.keys(result)).toEqual([eventName]);
          });
        });
      }).then(()=>{

        return eventor.cascade(eventName,{}).then((result)=>{
          expect(result[eventName]).toEqual(2);
          expect(Object.keys(result)).toEqual([eventName]);
          // only one because we are in loop and we are emitin new object for each eventName
        });
      });
      all.push(p);
    });


    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should modify result (with -before and -after) right before returning it to the promise",()=>{
    let eventor = new Eventor();
    let all = [];
    eventNames.forEach((eventName)=>{

      eventor.useBefore(eventName,(data)=>{
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.before1="before1value";
          resolve(_data);
        });
      });
      eventor.useBefore(eventName,(data)=>{
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.before2="before2value";
          resolve(_data);
        });
      });

      eventor.useAfterAll(eventName,(data)=>{
        return new Promise((resolve,reject)=>{
          // data should be an array of results if this is emit
          // and object if this is cascade
          resolve({newItem:"new item","data":data});
        });
      });
      eventor.useAfterAll(eventName,(data)=>{
        expect(data.newItem).toEqual("new item");
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.secondOne="second";
          resolve(_data);
        });
      });

      eventor.on(eventName,(data)=>{
        expect(Object.keys(data)).toEqual(["test","before1","before2"]);// because we are inside "on" and before "after"
        expect(data.test).toEqual("passed");
        expect(data.before1).toEqual("before1value");
        expect(data.before2).toEqual("before2value");
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.something="something";
          resolve(_data);
        });
      });


      let p1 = eventor.emit(eventName,{test:"passed"}).then((results)=>{
        // in -after we changed the result from array to object
        expect(Object.keys(results)).toEqual(["newItem","data","secondOne"]);
        expect(results.data[0].test).toEqual("passed");
        expect(results.newItem).toEqual("new item");
        expect(results.secondOne).toEqual("second");
      });
      all.push(p1);

      let p2 = eventor.cascade(eventName,{test:"passed"}).then((result)=>{
        expect(result.data.test).toEqual("passed");
        expect(Object.keys(result)).toEqual(["newItem","data","secondOne"]);
        expect(result.newItem).toEqual("new item");
        expect(result.secondOne).toEqual("second");
      });
      all.push(p2);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });


  it("should return data from -before -after if there is no normal listeners when cascading",()=>{
    let eventor = new Eventor();
    function modify(val){
      if(val==null || typeof val=="undefined"){
        return "empty";
      }
      return val.toString();
    }
    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        let res = modify(data)+"-before";
        resolve(res);
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        let res = modify(data)+"-after";
        resolve(res);
      });
    });
    let all = [];
    values.forEach((value)=>{
      let p= eventor.cascade("test",value).then((result)=>{
        let modified = modify(value);
        expect(result).toEqual(modified+"-before-after");
      });
      all.push(p);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should have an event object in -before and -after listeners",()=>{
    // already checked in async but...
    let eventor = new Eventor();
    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.isUseBefore).toEqual(true);
        expect(event.isUseAfter).toEqual(false);
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.isUseBefore).toEqual(false);
        expect(event.isUseAfter).toEqual(true);
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    let all=[];
    values.forEach((value)=>{
      let p1=eventor.emit("test",value).then((results)=>{
        expect(results).toEqual([]);
      });
      let p2=eventor.cascade("test",value).then((result)=>{
        expect(result).toEqual(value);
      });
      all.push(p1);
      all.push(p2);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should have 'cascade' event.type",()=>{
    let eventor =  new Eventor();
    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("cascade");
        resolve(data+1);
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("cascade");
        resolve(data+1);
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("cascade");
        resolve(data+1);
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("cascade");
        resolve(data+1);
      });
    });
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(4);
    });
  });

  it("should have 'emit' event.type",()=>{
    let eventor =  new Eventor();
    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("emit");
        resolve(data+1);
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("emit");
        resolve(data+1);
      });
    });
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("emit");
        resolve(data+1);
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.type).toEqual("emit");
        resolve(data+1);
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([3,3]);// before+1,on+1,after+1
    });
  });


  it("should contain information about type of event -before, -after",()=>{
    let eventor = new Eventor();
    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isUseBefore).toEqual(false);
        expect(event.isUseAfter).toEqual(false);
        resolve("ok");
      });
    });
    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isUseBefore).toEqual(true);
        expect(event.isUseAfter).toEqual(false);
        resolve("ok");
      });
    });
    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(event.isUseBefore).toEqual(false);
        expect(event.isUseAfter).toEqual(true);
        resolve("ok");
      });
    });
    return eventor.emit("test","yeah").then((results)=>{
      expect(results).toEqual(["ok"]);// only string "ok" because of -after modification
    }).catch((e)=>{throw e;});
  });

  it("should not execute a useBefore,useAfter and execute useAfterAll when there is no 'on' listeners",(done)=>{
    let e1=Eventor(),e1res=[];
    let e2=Eventor(),e2res=[];
    let e3=Eventor(),e3res=[];
    let e4=Eventor(),e4res=[];
    let all=[];

    e1.useAfter("test",(data,event)=>{
      e1res.push("useAfter");
      expect(data).toEqual("");
      return new Promise((resolve)=>{
        resolve("e1UseAfter");
      });
    });
    let p1e=e1.emit("test","").then((results)=>{
      expect(results).toEqual([]);
    });
    all.push(p1e);
    let p1c=e1.cascade("test","").then((result)=>{
      expect(result).toEqual("");
    });
    all.push(p1c);


    e2.useBefore("test",(data,event)=>{
      e2res.push("useBefore");
      expect(data).toEqual("");
      return new Promise((resolve)=>{
        resolve("e2UseBefore");
      });
    });
    let p2e=e2.emit("test","").then((results)=>{
      expect(results).toEqual([]);
    });
    all.push(p2e);
    let p2c=e2.cascade("test","").then((result)=>{
      expect(result).toEqual("");
    });
    all.push(p2c);


    e3.useAfterAll("test",(data,event)=>{
      e3res.push("useAfterAll");
      return new Promise((resolve)=>{
        resolve(["e3UseAfterAll"]);
      });
    });
    let p3e=e3.emit("test","").then((results)=>{
      expect(results).toEqual(["e3UseAfterAll"]);
    });
    all.push(p3e);
    let p3c=e3.cascade("test","").then((result)=>{
      expect(result).toEqual(["e3UseAfterAll"]);
    });
    all.push(p3c);


    e4.useBeforeAll("test",(data,event)=>{
      e4res.push("useBeforeAll");
      return new Promise((resolve)=>{
        resolve(["e4UseBeforeAll"]);
      });
    });
    let p4e=e4.emit("test","").then((results)=>{
      expect(results).toEqual(["e4UseBeforeAll"]);
    });
    all.push(p4e);
    let p4c=e4.cascade("test","").then((result)=>{
      expect(result).toEqual(["e4UseBeforeAll"]);
    });
    all.push(p4c);

    Promise.all(all).then(()=>{
      done();
    });

  });


});
