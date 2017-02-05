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
const eventor = require("../index.js")();
const jsc=require("jscheck");
const microtime = require("microtime");
const Promise = require("bluebird");

let valueSize = 200;


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

let preparationTime;
describe("experiment",()=>{

    it("setTimeout",(done)=>{
      let areWeDone=0;
      new Promise((resolve)=>{
        resolve();
      }).then(()=>{
        return new Promise((resolve)=>{
          setTimeout(()=>{
            console.log("test 1 should be third");
            areWeDone++;
          },100);
          resolve();
        });
      }).then(()=>{
        setTimeout(()=>{
          console.log("test 2 should be second");
          areWeDone++;
        },50)
      }).then(()=>{
        console.log("test 3 should be first");
        areWeDone++
      });

      setTimeout(()=>{
        done();
      },200)
    });


});
