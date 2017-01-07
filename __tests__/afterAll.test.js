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

describe("afterAll feature",()=>{

  it("should iterate through array of results from emit and apply after calback to each",()=>{
    let eventor = new Eventor();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.after("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(false);
        expect(data).toEqual(2);
        resolve(data+1);
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([3,3,3]);
    });
  });

  it("should pass results from emit as one array of results",()=>{
    let eventor = new Eventor();
    eventor.before("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.on("*",(data,event)=>{
      return new Promise((resolve)=>{
        resolve(data+1);
      });
    });
    eventor.afterAll("*",(data,event)=>{
      return new Promise((resolve)=>{
        expect(Array.isArray(data)).toEqual(true);
        expect(data).toEqual([2,2,2]);
        resolve(data.map((item)=>item+1));
      });
    });
    return eventor.emit("test",0).then((results)=>{
      expect(results).toEqual([3,3,3]);
    });
  });

});
