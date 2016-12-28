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
    Promise.all(all).then(()=>{
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
    Promise.all(all).then(()=>{
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

    

  });


});
