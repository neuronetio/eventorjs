const eventor = require("../index.js")();

const EventEmitter = require('events');
const events = new EventEmitter();

const Emiter2 = require("eventemitter2").EventEmitter2;
const emiter2 = new Emiter2();

const microtime = require("microtime");
const jsc = require("jscheck");

const Promise = require("bluebird");

let valueSize = 10000;
emiter2.setMaxListeners(valueSize);

let start = microtime.nowDouble();

for(let i=0;i<valueSize;i++){
  eventor.on("test",()=>{
    return "test";
  });
}

eventor.emit("test",{}).then(()=>{
  let stop = microtime.nowDouble();
  console.log(`eventor emit: ${stop-start}\n`);
  eventor.allListeners().forEach((listener)=>{
    eventor.removeListener(listener.id);
  });
}).then(()=>{

  let start = microtime.nowDouble();

  for(let i=0;i<valueSize;i++){
    eventor.on("test",()=>{
      return "test";
    });
  }

  return eventor.cascade("test",{}).then(()=>{
    let stop = microtime.nowDouble();
    console.log(`eventor cascade: ${stop-start}\n`);
    eventor.allListeners().forEach((listener)=>{
      eventor.removeListener(listener.id);
    });
  });

}).then(()=>{

  let start = microtime.nowDouble();

  for(let i=0;i<valueSize;i++){
    emiter2.on("test",()=>{
      return "test";
    });
  }

  return emiter2.emitAsync("test",{}).then(()=>{
    let stop = microtime.nowDouble();
    console.log(`emiter2: ${stop-start}\n`);
  });

});
