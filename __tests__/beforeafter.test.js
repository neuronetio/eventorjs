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
      });
      all.push(p);
    });


    return Promise.all(all).catch((e)=>{throw e;});

  });


});
