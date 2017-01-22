const Eventor = require("../index.js");
const jsc=require("jscheck");

let valueSize = 1000;


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

describe("eventor.before eventor.after",()=>{

  it("should emit before events separately from normal and after ones",()=>{
    let eventor = Eventor();



    eventor.on("test",(data,event)=>{

    });

  });

});
