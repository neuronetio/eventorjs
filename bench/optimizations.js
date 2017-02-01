function printStatus(fn) {
    switch(%GetOptimizationStatus(fn)) {
        case 1: console.log("Function is optimized"); break;
        case 2: console.log("Function is not optimized"); break;
        case 3: console.log("Function is always optimized"); break;
        case 4: console.log("Function is never optimized"); break;
        case 6: console.log("Function is maybe deoptimized"); break;
        case 7: console.log("Function is optimized by TurboFan"); break;
        default: console.log("Unknown optimization status"); break;
    }
}

//Fill type-info
// 2 calls are needed to go from uninitialized -> pre-monomorphic -> monomorphic

let Eventor = require("../index.js");
let eventor = Eventor();

eventor.on("test",(data,event)=>{
  return "ok";
});

eventor.cascade("test",{});
eventor.cascade("test",{});

%OptimizeFunctionOnNextCall(eventor.cascade);
//The next call
eventor.cascade("test",{});

//Check
printStatus(eventor.cascade);
