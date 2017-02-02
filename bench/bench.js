const Promise = require("bluebird");
const eventor = require("../index.js")({promise:Promise});

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

let eventorStart,e2Start,e3Start,syncTime,eventorMiddle,e4Middle;

function start(){
  new Promise((resolve)=>{
    resolve();
  }).then(()=>{
    eventorStart = microtime.nowDouble();

    eventNames.forEach((eventName)=>{
        eventor.on(eventName,(data,event)=>{
          return "test";
        });
    });
    let len =eventor.listeners().length;
    console.log(`Listeners: ${len}; Actions: ${len*len}\n\n`);

    eventorMiddle = microtime.nowDouble();

    let all = [];

    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        let p=eventor.emit(eventName,value);
        all.push(p);
      });
    });

    syncTime=microtime.nowDouble();

    return Promise.all(all);
}).then(()=>{

    let eventorStop = microtime.nowDouble();
    console.log(`\nEventor Time: \nsync: ${syncTime-eventorStart}\n${eventorMiddle - eventorStart}\nTotal: ${eventorStop - eventorStart}\n\n`);
    all=[];

}).then(()=>{

    e2Start = microtime.nowDouble();
    let all = [];
    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        let p=eventor.cascade(eventName,value);
        all.push(p);
      });
    });

    return Promise.all(all);

}).then(()=>{

      let e2Stop = microtime.nowDouble();
      console.log(`Eventor Cascade Time: \nTotal: ${e2Stop - e2Start}\n\n`);
      /*
      let listeners = eventor.listeners();
      listeners.forEach((listener)=>{
        eventor.removeListener(listener.id);
      });*/
      all=[];

  }).then(()=>{

    function rand(){
      return Math.round(Math.random()*valueSize);
    }

    e3Start = microtime.nowDouble();
    return eventor.emit(eventNames[rand()],{}).then(()=>{
      let e3Stop = microtime.nowDouble();
      console.log(`Eventor One Time*${valueSize}: \nTotal: ${(e3Stop-e3Start)*valueSize}\n\n`);
    });

  }).then(()=>{

    e4Start = microtime.nowDouble();
    eventNames.forEach((eventName)=>{
        emiter2.on(eventName,(data)=>{
          return "test";
        });
    });
    e4Middle = microtime.nowDouble();
    let all = [];
    eventNames.forEach((eventName)=>{
      values.forEach((value)=>{
        let p=emiter2.emitAsync(eventName,value);
        all.push(p);
      });
    });

    return Promise.all(all).then(()=>{
      let e4Stop = microtime.nowDouble();
      console.log(`Emiter2 Time: \n${e4Middle-e4Start}\nTotal: ${e4Stop - e4Start}\n\n`);
      emiter2.removeAllListeners();
      all=[];
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
