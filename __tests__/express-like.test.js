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


describe("express-like eventNames",()=>{

  it("should have id param inside event.params",(done)=>{
    let eventor = Eventor();
    eventor.useBeforeAll("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useBefore("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.on("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useAfter("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useAfterAll("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.cascade("web-request:/user/10/create","someData").then((result)=>{
      return eventor.emit("web-request:/user/10/create","someData");
    }).then((results)=>{
      done();
    }).catch((e)=>{
      done.fail(e.message);
    })
  });


  it("should not have id param inside event.params",(done)=>{
    let eventor = Eventor();
    eventor.useBeforeAll("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params).toEqual({});
      expect(event.matches).toEqual(null);
    });
    eventor.useBefore("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params).toEqual({});
      expect(event.matches).toEqual(null);
    });
    eventor.on("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params).toEqual({});
      expect(event.matches).toEqual(null);
    });
    eventor.useAfter("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params).toEqual({});
      expect(event.matches).toEqual(null);
    });
    eventor.useAfterAll("web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params).toEqual({});
      expect(event.matches).toEqual(null);
    });
    eventor.cascade("web-request:/user/test/create","someData").then((result)=>{
      return eventor.emit("web-request:/user/test/create","someData");
    }).then((results)=>{
      done();
    }).catch((e)=>{
      done.fail(e.message);
    })
  });

});
