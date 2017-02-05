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

let valueSize = 20;

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
let nameSpaces = jsc.array(valueSize,jsc.string(jsc.integer(1,100),jsc.character()))();

describe("order",()=>{

  it("should execute events in proper order with emit",(done)=>{
    let eventor = Eventor({promise:Promise});
    let iterations=0;

    nameSpaces.forEach((nameSpace,nsi)=>{
      eventNames.forEach((eventName,eni)=>{
        let times = 0;

        eventor.useBefore(nameSpace,eventName,(data,event)=>{
          expect(data).toEqual("test");
          return new Promise((resolve)=>{
            setTimeout(()=>{
              resolve("useBefore1");
              times++;
            },60);
          });
        });

        eventor.useBefore(nameSpace,eventName,(data,event)=>{
          expect(data).toEqual("useBefore1");
          return new Promise((resolve)=>{
            setTimeout(()=>{
              resolve("useBefore2");
              times++;
            },50);
          });
        });

        let on="";
        eventor.on(nameSpace,eventName,(data,event)=>{
          expect(on).toEqual("");
          expect(data).toEqual("useBefore2");
          return new Promise((resolve)=>{
            setTimeout(()=>{
              expect(on).toEqual("on2");
              on="on1";
              resolve("on1");
              times++;
            },100);
          });
        });
        eventor.on(nameSpace,eventName,(data,event)=>{
          expect(on).toEqual("");
          return new Promise((resolve)=>{
            expect(on).toEqual("");
            expect(data).toEqual("useBefore2");
            on="on2";
            resolve("on2");
            times++;
          });
        });
        eventor.on(nameSpace,eventName,(data,event)=>{
          return new Promise((resolve)=>{
            setTimeout(()=>{
              expect(on).toEqual("on1");
              on="on3";
              resolve("on3");
              times++;
            },150)
          });
        });


        eventor.useAfter(nameSpace,eventName,(data,event)=>{
          expect(typeof data).toEqual("string");
          expect(data).toEqual(jasmine.stringMatching(/on[0-3]{1}/gi));
          return new Promise((resolve)=>{
            setTimeout(()=>{
              resolve("useAfter1");
              times++;
            },50);
          });
        });


        eventor.emit(nameSpace,eventName,"test").then((results)=>{
          expect(results).toEqual(["useAfter1","useAfter1","useAfter1"])
        });

        function checkTimes(){
          setTimeout(()=>{
            //console.log("times",times)
            if(times==8){         // !!! should be updated each time new event is added
              iterations++;
            }else{
              checkTimes();
            }
          },100);
        }
        checkTimes();

      });
    });

    function checkIterations(){
      setTimeout(()=>{
        //console.log("iterations",iterations)
        if(iterations==valueSize*valueSize){
          done();
        }else{
          checkIterations();
        }
      },100);
    }
    checkIterations();
  });

});
