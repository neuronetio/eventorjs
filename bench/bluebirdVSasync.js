const parallel = require("async/parallel");
const Promise = require("bluebird");
const microtime = require("microtime");

let len = 1000*1000;
console.log(`Testing: ${len}`);

new Promise((resolve)=>{
  resolve();
}).then(()=>{
  let astart=microtime.nowDouble();
  let fnsCallback = [];
  for(let i=0; i<len;i++){
    fnsCallback.push(function(callback){
      callback(null,"test");
    });
  }

  parallel(fnsCallback,function(err,res){
    let astop=microtime.nowDouble();
    console.log(`async: ${astop-astart}`);
  });
}).then(()=>{
  let pstart = microtime.nowDouble();
  let fnsPromise =[];
  for(let i=0; i<len;i++){
    let p=new Promise((resolve,reject)=>{
      resolve("test");
    })
    fnsPromise.push(p);
  }

  Promise.all(fnsPromise).then((results)=>{
    let pstop = microtime.nowDouble();
    console.log(`bluebird: ${pstop-pstart}`);
  });
}).then(()=>{
  let nstart = microtime.nowDouble();
  let fnsNative = [];
  for(let i=0; i<len;i++){
    fnsNative.push(function(){
      return "test";
    });
  }

  let result = fnsNative.map((fn)=>{
    return fn();
  });

  let nstop = microtime.nowDouble();
  console.log(`native: ${nstop-nstart}`);
}).then(()=>{
  let nstart = microtime.nowDouble();
  let fnsNative = [];
  for(let i=0; i<len;i++){
    fnsNative.push(function(){
      return "test";
    });
  }

  let result = [];
  for(let i=0,len=fnsNative.length; i<len;i++){
    result.push(fnsNative[i]());
  }

  let nstop = microtime.nowDouble();
  console.log(`native(for): ${nstop-nstart}`);
});
