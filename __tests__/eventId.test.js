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
const cuid = require("cuid");

let valueSize = 50;

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
let nameSpaces = jsc.array(valueSize,jsc.string(jsc.integer(1,100),jsc.character()))();

describe("event.eventId",()=>{

  it("should have a event.eventId in 'on' listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.emit("test",0);
  });

  it("should have a event.eventId in 'on' listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.cascade("test",0);
  });

  it("should have a event.eventId in 'useBeforeAll' listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.useBeforeAll("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.emit("test",0);
  });

  it("should have a event.eventId in 'useBeforeAll' listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.useBeforeAll("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.cascade("test",0);
  });

  it("should have a event.eventId in 'useBefore' listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    })
    return eventor.emit("test",0);
  });

  it("should have a event.eventId in 'useBefore' listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.useBefore("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    })
    return eventor.cascade("test",0);
  });

  it("should have a event.eventId in 'useAfter' listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.emit("test",0);
  });

  it("should have a event.eventId in 'useAfter' listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.useAfter("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.cascade("test",0);
  });

  it("should have a event.eventId in 'useAfterAll' listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.emit("test",0);
  });

  it("should have a event.eventId in 'useAfterAll' listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    eventor.on("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    eventor.useAfterAll("test",(data,event)=>{
      expect(typeof event.eventId).toEqual("string");
    });
    return eventor.cascade("test",0);
  });

  it("should have a same event.eventId in each type of listeners/middlewares inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    let ids = {};
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
    eventNames.forEach((eventName)=>{
      eventor.useBeforeAll(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(typeof ids[event.eventId]).toEqual("undefined");
        ids[event.eventId]=1;
      });
      eventor.useBefore(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(1);
        ids[event.eventId]++;
      });
      eventor.on(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(2);
        ids[event.eventId]++;
      });
      eventor.useAfter(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(3);
        ids[event.eventId]++;
      });
      eventor.useAfterAll(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(4);
        ids[event.eventId]++;
      });
      let p=eventor.emit(nameSpace,eventName,0);
      all.push(p);
    });
    });

    return Promise.all(all).then(()=>{
      expect(Object.keys(ids).length).toEqual(eventNames.length*nameSpaces.length);
    }).catch((e)=>{throw e;});
  });

  it("should have a same event.eventId in each type of listeners/middlewares inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    let ids = {};
    let all=[];
    nameSpaces.forEach((nameSpace)=>{
    eventNames.forEach((eventName)=>{
      eventor.useBeforeAll(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(typeof ids[event.eventId]).toEqual("undefined");
        ids[event.eventId]=1;
      });
      eventor.useBefore(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(1);
        ids[event.eventId]++;
      });
      eventor.on(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(2);
        ids[event.eventId]++;
      });
      eventor.useAfter(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(3);
        ids[event.eventId]++;
      });
      eventor.useAfterAll(nameSpace,eventName,(data,event)=>{
        expect(typeof event.eventId).toEqual("string");
        expect(ids[event.eventId]).toEqual(4);
        ids[event.eventId]++;
      });
      let p=eventor.cascade(nameSpace,eventName,0);
      all.push(p);
    });
    });

    return Promise.all(all).then(()=>{
      expect(Object.keys(ids).length).toEqual(eventNames.length*nameSpaces.length);
    }).catch((e)=>{throw e;});
  });


  it("should have same eventId inside different parallel listeners inside emit",()=>{
    let eventor = Eventor({promise:Promise});
    let ids = [];
    let all = [];
    eventNames.forEach((eventName,index)=>{
      ids[index]={};
      eventor.useBeforeAll(eventName,(data,event)=>{
        ids[index][event.eventId]=1;
      });
      eventor.useBefore(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.on(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.on(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.useAfter(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.useAfterAll(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      let p=eventor.emit(eventName,0).then(()=>{
        expect(Object.keys(ids[index]).length).toEqual(1);
        let keys = Object.keys(ids[index]);// array of ids
        expect(ids[index][keys[0]]).toEqual(8);
      });
      all.push(p);
    });
    return Promise.all(all).then(()=>{
      expect(ids.length).toEqual(eventNames.length);
      ids.forEach((ido)=>{
        expect(Object.keys(ido).length).toEqual(1);
      })
    }).catch((e)=>{throw e;});
  });

  it("should have same eventId inside listeners inside cascade",()=>{
    let eventor = Eventor({promise:Promise});
    let ids = [];
    let all = [];
    eventNames.forEach((eventName,index)=>{
      ids[index]={};
      eventor.useBeforeAll(eventName,(data,event)=>{
        if(typeof ids[index][event.eventId]=="undefined")ids[index][event.eventId]=0;
        ids[index][event.eventId]++;
      })
      eventor.useBefore(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.on(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.on(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.useAfter(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      eventor.useAfterAll(eventName,(data,event)=>{
        ids[index][event.eventId]++;
      });
      let p=eventor.cascade(eventName,0).then(()=>{
        expect(Object.keys(ids[index]).length).toEqual(1);
        let keys = Object.keys(ids[index]);
        expect(ids[index][keys[0]]).toEqual(8);
      });
      all.push(p);
    });
    return Promise.all(all).then(()=>{
      expect(ids.length).toEqual(eventNames.length);
      ids.forEach((ido)=>{
        expect(Object.keys(ido).length).toEqual(1);
      })
    }).catch((e)=>{throw e;});
  });

  it("should use custom unique id generation method",()=>{
    function uniq(){
      let result = "custom"+"@"+cuid();
      return result;
    }
    let eventor = Eventor({unique:uniq});
    eventor.useBeforeAll("test",(data,event)=>{
      let ids=event.eventId.split("@");
      expect(ids[0]).toEqual("custom");
    });
    eventor.useBefore("test",(data,event)=>{
      let ids=event.eventId.split("@");
      expect(ids[0]).toEqual("custom");
    });
    eventor.on("test",(data,event)=>{
      let ids=event.eventId.split("@");
      expect(ids[0]).toEqual("custom");
    });
    eventor.useAfter("test",(data,event)=>{
      let ids=event.eventId.split("@");
      expect(ids[0]).toEqual("custom");
    });
    eventor.useAfterAll("test",(data,event)=>{
      let ids=event.eventId.split("@");
      expect(ids[0]).toEqual("custom");
    });
    return eventor.emit("test",{}).then(()=>{
      return eventor.cascade("test",{});
    });
  });

});
