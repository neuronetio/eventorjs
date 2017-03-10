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
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0 || name.charAt(0)=="^"){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();

//process.on('unhandledRejection', function (err) {throw err;});

describe("eventor async functions",()=>{


  it("should call listeners asynchronously and return result of all of them",()=>{
    let eventor = new Eventor({promise:Promise});
    eventNames.forEach((eventName)=>{
      values.forEach((val)=>{
        let time = Math.round(Math.random()*100);

        function callback(){
          return new Promise((resolve,reject)=>{
            resolve(val);
          });
        }

        eventor.on(eventName,callback);
      });
    });
    expect(eventor.listeners().length).toBe(valueSize*valueSize);
    let all=[];
    eventNames.forEach((eventName)=>{
      let promises = eventor.emit(eventName,null);
      //expect(promises instanceof Promise).toBe(true);
      promises=promises.then((results)=>{
        expect(results).toEqual(values);
      });
      all.push(promises);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should call listeners in proper order (async)",()=>{
    let eventor = new Eventor({promise:Promise});
    let callbacks = [];
    for(let i=0;i<10;i++){
      let fn = (function(index){
        return function(){
          return index;
        }
      }(i));
      callbacks.push(fn);
    }
    callbacks.forEach((callback)=>{
      eventor.on("test",callback);
    });
    eventor.on("test",()=>{return 123;});
    eventor.on("test",()=>{return 321;});
    expect(eventor.listeners().length).toBe(12);
    return eventor.emit("test","yeaahh").then((results)=>{
      expect(results).toEqual([0,1,2,3,4,5,6,7,8,9,123,321]);
    }).catch((e)=>{throw e;});
  });


  it("should handle the non Promise return from listener",()=>{

    let eventor = new Eventor({promise:Promise});
    eventor.on("test",(data)=>{
      return data+1;
    });
    eventor.on("test",(data)=>{
      return new Promise((res,rej)=>{
        res(data+2);
      });
    });
    eventor.on("test",(data)=>{
      return data+3;
    });

    return eventor.emit("test",0).then((result)=>{
      expect(result).toEqual([1,2,3]);
    }).catch((e)=>{
      throw e;
    });

  });

  it("should return input data as result when there is no listeners when cascading",()=>{
    let eventor = new Eventor({promise:Promise});
    let all=[];
    values.forEach((value)=>{
      let p=eventor.cascade("test",{val:value}).then((result)=>{
        expect(result).toEqual({val:value});
      });
      all.push(p);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should return empty array as result when there is no listeners when emitting",()=>{
    let eventor = new Eventor({promise:Promise});
    let all=[];
    values.forEach((value)=>{
      let p=eventor.emit("test",{val:value}).then((result)=>{
        expect(result).toEqual([]);
      }).catch((e)=>{throw e;});
      all.push(p);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should have an event object inside listener",()=>{
    let eventor = new Eventor({promise:Promise});

    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    eventor.on("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    eventor.useBefore("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    eventor.useAfter("test",(data,event)=>{
      return new Promise((resolve)=>{
        expect(typeof event).toBe("object");
        expect(event.eventName).toEqual("test");
        expect(event.type).toMatch(/cascade|emit/gi);
        resolve(data);
      });
    });

    let all=[];
    values.forEach((value)=>{
      let p1=eventor.emit("test",value).then((results)=>{
        expect(results).toEqual([value,value]);
      });
      let p2=eventor.cascade("test",value).then((result)=>{
        expect(result).toEqual(value);
      });
      all.push(p1);
      all.push(p2);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });




});
