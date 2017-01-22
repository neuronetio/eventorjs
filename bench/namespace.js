const eventor = require("../index.js")();
const jsc=require("jscheck");
const microtime = require("microtime");
const Promise = require("bluebird");

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

let nameSpaces = jsc.array(valueSize,jsc.string(jsc.integer(1,100),jsc.character()))();


let preparationTime = microtime.nowDouble();

nameSpaces.forEach((nameSpace)=>{
  eventNames.forEach((eventName)=>{
    eventor.on(nameSpace,eventName,()=>{});
  });
});

let oneTime = microtime.nowDouble();

let all = [];
nameSpaces.forEach((nameSpace)=>{
  eventNames.forEach((eventName)=>{
      let p = eventor.emit(nameSpace,eventName,{});
      all.push(p);
  });
});

Promise.all(all).then(()=>{
  let endTime = microtime.nowDouble();
  let len = eventor.listeners().length;
  console.log(`Emission time for ${len} listeners: ${endTime - preparationTime}`);

});
