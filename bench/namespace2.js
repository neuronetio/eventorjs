const Eventor = require("../index.js");
const jsc=require("jscheck");
const microtime = require("microtime");
const Promise = require("bluebird");

let valueSize = 100;


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


let start;
let eventor = new Eventor({promise:Promise});

new Promise((resolve)=>{
  resolve();
}).then(()=>{

  start = microtime.nowDouble();


  let callbacks = {};
  let notTouched = {};

  nameSpaces.forEach((nameSpace)=>{
    eventNames.forEach((eventName)=>{
      eventor.on(nameSpace,eventName,()=>{
        return new Promise((resolve,reject)=>{
          resolve(null);
        });
      });
    });
  });
  let all=[];
  nameSpaces.forEach((nameSpace)=>{
    eventNames.forEach((eventName)=>{
      let r1=eventor.emit(nameSpace+"_notExistingNamespace",eventName,{})
      .then(()=>{
        return eventor.emit(nameSpace,eventName,null);
      });
      all.push(r1);
    });
  });
  return Promise.all(all);

}).then(()=>{
  let stop = microtime.nowDouble();
  let listeners = eventor.listeners().length;
  console.log(`${listeners} listeners; ${listeners*valueSize} Actions; Time: ${stop-start}`);
});
