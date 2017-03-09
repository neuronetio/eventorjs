const Eventor = require("../index.js");
const jsc=require("jscheck");
const Promise = require("bluebird");

let valueSize = 1000;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  // no duplicates, no wildcards
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0 || name.indexOf("\/")>=0){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();
let promiseLoop=require("promiseloop")(Promise);


function inArray(array,item){
	let count=0;
	for(let i=0,len=array.length;i<len;i++){
		if(array[i]==item)count++;
	}
	return count;
}

describe("useBefore - on - useAfter : glued thogeter",()=>{

	it("should not execute useBefore and useAfter when there is no (on) listeners",(done)=>{
		let e1=Eventor(),a1=[];
		let e2=Eventor(),a2=[];

		e1.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				a1.push("useBeforeAll");
				resolve(data+" useBeforeAll");
			});
		});
		e1.useBefore("test",(data,event)=>{
			a1.push("useBefore");
			return new Promise((resolve,reject)=>{
				throw "this should not be fired";
			});
		});
		e1.useAfter("test",(data,event)=>{
			a1.push("useAfter");
			return new Promise((resolve,reject)=>{
				throw "this should not be fired";
			});
		});
		e1.useAfterAll("test",(data,event)=>{
			a1.push("useAfterAll");
			if(event.type=="cascade"){
				expect(data).toEqual("test useBeforeAll");
				return data+" useAfterAll";
			}else{
				expect(data).toEqual([]);
				return [];
			}
		});
		e1.emit("test","test").then((results)=>{
			expect(results).toEqual([]);
			a1.push("emit");
		});
		e1.cascade("test","test").then((result)=>{
			expect(result).toEqual("test useBeforeAll useAfterAll");
			a1.push("cascade");
		});

		// with nameSpace
		e2.useBeforeAll("namespace","test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				a2.push("useBeforeAll");
				resolve(data+" useBeforeAll");
			});
		});
		e2.useBefore("namespace","test",(data,event)=>{
			a2.push("useBefore");
			return new Promise((resolve,reject)=>{
				throw "this should not be fired";
			});
		});
		e2.useAfter("namespace","test",(data,event)=>{
			a2.push("useAfter");
			return new Promise((resolve,reject)=>{
				throw "this should not be fired";
			});
		});
		e2.useAfterAll("namespace","test",(data,event)=>{
			a2.push("useAfterAll");
			if(event.type=="cascade"){
				expect(data).toEqual("test useBeforeAll");
				return data+" useAfterAll";
			}else{
				expect(data).toEqual([]);
				return [];
			}
		});
		e2.emit("namespace","test","test").then((results)=>{
			expect(results).toEqual([]);
			a2.push("emit");
		});
		e2.cascade("namespace","test","test").then((result)=>{
			expect(result).toEqual("test useBeforeAll useAfterAll");
			a2.push("cascade");
		});

		promiseLoop(100,()=>{
			setTimeout(()=>{
				expect(a1).toEqual(["useBeforeAll","useBeforeAll","useAfterAll","useAfterAll","cascade","emit"]);
				expect(a2).toEqual(["useBeforeAll","useBeforeAll","useAfterAll","useAfterAll","cascade","emit"]);
				done();
			},100);
		})
	});




	it("should cascade through useBefore and useAfter for each listener",(done)=>{
		let e1=Eventor(),a1=[];
		let e2=Eventor(),a2=[];

		e1.on("test",(data,event)=>{
			a1.push("on");
			return new Promise((resolve,reject)=>{
				expect(data).toEqual("test useBeforeAll useBefore1 useBefore2");
				resolve(data+" on");
			});
		});
		e1.on("test",(data,event)=>{
			a1.push("on");
			return new Promise((resolve,reject)=>{
				if(event.type=="emit"){
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2");
				}else{
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1 useBefore2");
				}
				resolve(data+" on");
			});
		});
		e1.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				a1.push("useBeforeAll");
				resolve(data+" useBeforeAll");
			});
		});
		e1.useBefore("test",(data,event)=>{
			if(event.type=="emit"){
				expect(data).toEqual("test useBeforeAll");
			}else{
				// we are in cascade mode so this can be second iteration for on2
				// so useBefore could be executed already for on1
				if(inArray(a1,"on")==1){// second iteration
					// there is on already
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2");
				}else{// first iteration
					// there is no on1
					expect(data).toEqual("test useBeforeAll");
				}
			}
			a1.push("useBefore1");
			return new Promise((resolve,reject)=>{
				resolve(data+" useBefore1");
			});
		});
		e1.useBefore("test",(data,event)=>{
			a1.push("useBefore2");
			if(event.type=="emit"){
				expect(data).toEqual("test useBeforeAll useBefore1");
			}else{
				// we are in cascade mode so this can be second iteration for on2
				// so useBefore could be executed already for on1
				if(inArray(a1,"on")==1){// second iteration
					// there is on1 already
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1");
				}else{// first iteration
					// there is no on1
					expect(data).toEqual("test useBeforeAll useBefore1");
				}
			}
			return new Promise((resolve,reject)=>{
				resolve(data+" useBefore2");
			});
		});
		e1.useAfter("test",(data,event)=>{
			a1.push("useAfter1");
			if(event.type=="emit"){
				expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on");
			}else{
				// we are in cascade mode so this can be second iteration for on2
				// so useBefore could be executed already for on1
				if(inArray(a1,"on")==2){// second iteration - we are after and there was two 'on'
					// there is on1 already
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1 useBefore2 on");
				}else{// first iteration
					// there is no on1
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on");
				}
			}
			return new Promise((resolve,reject)=>{
				resolve(data+" useAfter1");
			});
		});
		e1.useAfter("test",(data,event)=>{
			a1.push("useAfter2");
			if(event.type=="emit"){
				expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1");
			}else{
				// we are in cascade mode so this can be second iteration for on2
				// so useBefore could be executed already for on1
				if(inArray(a1,"on")==2){// second iteration
					// there is on1 already
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1 useBefore2 on useAfter1");
				}else{// first iteration
					// there is no on1
					expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1");
				}
			}
			return new Promise((resolve,reject)=>{
				resolve(data+" useAfter2");
			});
		});
		e1.useAfterAll("test",(data,event)=>{
			a1.push("useAfterAll");
			if(event.type=="cascade"){
				expect(data).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1 useBefore2 on useAfter1 useAfter2");
				return data+" useAfterAll";
			}else{
				expect(data).toEqual([
					"test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2",
					"test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2",
				]);
				return data.map((item)=>{return item+" useAfterAll"});
			}
		});
		e1.emit("test","test").then((results)=>{
			expect(results).toEqual([
					"test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useAfterAll",
					"test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useAfterAll",
				]);
			a1=[];
			return e1.cascade("test","test");
		}).then((result)=>{
			expect(result).toEqual("test useBeforeAll useBefore1 useBefore2 on useAfter1 useAfter2 useBefore1 useBefore2 on useAfter1 useAfter2 useAfterAll");
		}).then(()=>{
			done();
		});

	});



});
