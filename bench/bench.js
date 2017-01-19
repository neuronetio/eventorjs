const eventor = require("../index.js")();

const EventEmitter = require('events');
const events = new EventEmitter();

const Emiter2 = require("eventemitter2").EventEmitter2;
const emiter2 = new Emiter2();

const microtime = require("microtime");
const jsc = require("jscheck");


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


function start(){

  let eventorStart = microtime.nowDouble();

  eventNames.forEach((eventName)=>{
      eventor.on(eventName,(data,event)=>{
        return "test";
      });
  });

  let eventorMiddle = microtime.nowDouble();

  let all = [];
  eventNames.forEach((eventName)=>{
    values.forEach((value)=>{
      let p=eventor.emit(eventName,value);
      all.push(p);
    });
  });

  Promise.all(all).then(()=>{
    let eventorStop = microtime.nowDouble();
    console.log(`\nEventor Time: \n${eventorMiddle - eventorStart}\nTotal: ${eventorStop - eventorStart}\n\n`);
  }).then(()=>{

    let eStart = microtime.nowDouble();
    let all = [];
    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        let p=eventor.cascade(eventName,value);
        all.push(p);
      });
    });

    return Promise.all(all).then(()=>{
      let eStop = microtime.nowDouble();
      console.log(`Eventor Cascade Time: \nTotal: ${eStop - eStart}\n\n`);
    });

  }).then(()=>{

    let eStart = microtime.nowDouble();

    eventNames.forEach((eventName)=>{
        emiter2.on(eventName,(data)=>{
          return "test";
        });
    });
    let eMiddle = microtime.nowDouble();
    let all = [];
    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        let p=emiter2.emitAsync(eventName,value);
        all.push(p);
      });
    });

    return Promise.all(all).then(()=>{
      let eStop = microtime.nowDouble();
      console.log(`Emiter2 Time: \n${eMiddle-eStart}\nTotal: ${eStop - eStart}\n\n`);
    });

  }).then(()=>{

    let eStart = microtime.nowDouble();
    let all = [];

    eventNames.forEach((eventName)=>{
        events.on(eventName,(data)=>{
          all.push(new Promise((resolve)=>{
            resolve("test");
          }))
        });
    });
    let eMiddle = microtime.nowDouble();
    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        events.emit(eventName,value);
      });
    });

    return Promise.all(all).then(()=>{
      let eStop = microtime.nowDouble();
      console.log(`EventEmiter Time: \n${eMiddle-eStart}\nTotal: ${eStop - eStart}\n\n`);
    })

  }).catch((e)=>{throw e;});

}
module.exports=start;

start();
