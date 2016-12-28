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

//process.on('unhandledRejection', function (err) {throw err;});

describe("eventor async functions",()=>{


  it("should call listeners asynchronously and return result of all of them",()=>{
    let eventor = new Eventor();
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
    expect(eventor.allListeners.length).toBe(valueSize*valueSize);
    let all=[];
    eventNames.forEach((eventName)=>{
      let promises = eventor.emit(eventName);
      expect(promises instanceof Promise).toBe(true);
      promises=promises.then((results)=>{
        expect(results).toEqual(values);
      });
      all.push(promises);
    });
    return Promise.all(all).catch((e)=>{throw e;});
  });

  it("should call listeners in proper order (async)",()=>{
    let eventor = new Eventor();
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
    eventor.on("test",()=>{return 123;},0);
    eventor.on("test",()=>{return 321;},5);
    expect(eventor.allListeners.length).toBe(12);
    return eventor.emit("test","yeaahh").then((results)=>{
      expect(results).toEqual([123,0,1,2,3,321,4,5,6,7,8,9]);
    }).catch((e)=>{throw e;});
  });


  it("should handle the non Promise return from listener",()=>{

    let eventor = new Eventor();
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
    throw "TODO";
  });




});
