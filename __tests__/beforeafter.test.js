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

//process.on('unhandledRejection', function (err) { throw err; });

describe("-before and -after events",()=>{

  it("should fire an -before and -after events with emit",()=>{
    let eventor = new Eventor();
    let fns = [];
    eventNames.forEach((eventName)=>{
      eventor.on(eventName,()=>{});
      let before = jest.fn();
      fns.push(before);
      eventor.on(eventName+"-before",before);
      let after = jest.fn();
      fns.push(after);
      eventor.on(eventName+"-after",after);
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


  it("should fire an -before and -after events with cascade",()=>{
    let eventor = new Eventor();
    let fns = [];
    eventNames.forEach((eventName)=>{
      eventor.on(eventName,()=>{});
      let before = jest.fn();
      fns.push(before);
      eventor.on(eventName+"-before",before);
      let after = jest.fn();
      fns.push(after);
      eventor.on(eventName+"-after",after);
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

  it("should not add an event with -before -after suffixes",()=>{
    let eventor = new Eventor();
    eventNames.forEach((eventName)=>{
      function before(){
        eventor.emit(eventName+"-before",()=>{});
      }
      function after(){
        eventor.emit(eventName+"-after")
      }
      expect(before).toThrow();
      expect(after).toThrow();
    });

  });

  it("should cascade -before events and pass result as input data for real events",()=>{
    let eventor = new Eventor();

    eventNames.forEach((eventName)=>{
      eventor.on(eventName+"-before",(data,original)=>{
        return new Promise((resolve,reject)=>{
          let _data=Object.assign({},data);
          _data[eventName]=1;
          resolve(_data);
        });
      });
      eventor.on(eventName+"-before",(data,original)=>{
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

      eventor.on(eventName+"-before",(data)=>{
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.before1="before1value";
          resolve(_data);
        });
      });
      eventor.on(eventName+"-before",(data)=>{
        return new Promise((resolve,reject)=>{
          let _data = Object.assign({},data);
          _data.before2="before2value";
          resolve(_data);
        });
      });

      eventor.on(eventName+"-after",(data)=>{
        return new Promise((resolve,reject)=>{
          // data should be an array of results if this is emit
          // and object if this is cascade
          resolve({newItem:"new item","data":data});
        });
      });
      eventor.on(eventName+"-after",(data)=>{
        return new Promise((resolve,reject)=>{
          expect(data.newItem).toEqual("new item");
          let _data = Object.assign({},data);
          _data.secondOne="second";
          resolve(_data);
        });
      });

      eventor.on(eventName,(data)=>{
        return new Promise((resolve,reject)=>{
          expect(Object.keys(data)).toEqual(["test","before1","before2"]);
          expect(data.test).toEqual("passed");
          expect(data.before1).toEqual("before1value");
          expect(data.before2).toEqual("before2value");
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
    throw "TODO";
  });


});
