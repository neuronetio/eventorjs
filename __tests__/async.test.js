const Eventor = require("../index.js");
const jsc=require("jscheck");

let valueSize = 40;


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

describe("eventor async functions",()=>{

  jest.useFakeTimers();

  it("should call listeners asynchronously and return result of all of them",()=>{
    let eventor = new Eventor();
    eventNames.forEach((eventName)=>{
      values.forEach((val)=>{
        let time = Math.round(Math.random()*100);

        function callback(){
          return new Promise((resolve,reject)=>{
            setTimeout(()=>{
              resolve(val);
            },time);
          });
        }

        eventor.on(eventName,callback);
      });
    });
    expect(eventor.allListeners.length).toBe(valueSize*valueSize);
    eventNames.forEach((eventName)=>{
      let promises = eventor.emit(eventName);
      expect(promises instanceof Promise).toBe(true);
      promises.then((results)=>{
        expect(results).toEqual(values);
      });
    });

    jest.runAllTimers();
  });


});
