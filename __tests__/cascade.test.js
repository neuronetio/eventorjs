const Eventor = require("../eventor.js");
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

//process.on('unhandledRejection', function (err) { throw err; });

describe("cascade - result of one listener as argument for next one",()=>{

  it("should return proper cumulative result from async listeners",()=>{
    let eventor = new Eventor();
    let called = 0;
    let calledfn=jest.fn();
    eventor.on("test",(data)=>{
      expect(data).toEqual(0);
      return new Promise((resolve,reject)=>{
          calledfn();
          resolve(data+10);
      });
    });
    eventor.on("test",(data)=>{
      expect(data).toEqual(10);
      return new Promise((resolve,reject)=>{
          calledfn();
          resolve(data+2);
      });
    });
    eventor.on("test",(data)=>{
      expect(data).toEqual(12);
      return new Promise((resolve,reject)=>{
          calledfn();
          resolve(data+3);
      });
    });

    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(15);
      expect(calledfn).toHaveBeenCalledTimes(3);
    }).catch((e)=>{
      throw e;
    });

  });


  it("should handle non promise result from listener",()=>{
    let eventor = new Eventor();
    eventor.on("test",(data)=>{
      return data+1;
    });
    eventor.on("test",(data)=>{
      return new Promise((resolve,reject)=>{
        resolve(data+1);
      });
    });
    eventor.on("test",(data)=>{
      return data+1;
    });
    return eventor.cascade("test",0).then((result)=>{
      expect(result).toEqual(3);
    }).catch((e)=>{
      throw e;
    });
  });

});
