const Eventor = require("../index.js");
const jsc=require("jscheck");

let valueSize = 1000;

let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  // no duplicates, no wildcards
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0 || name.charAt(0)=="^"){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();


describe("timeout",()=>{

	it("should emit timeout event after 500ms",(done)=>{

		let eventor = Eventor({timeout:500});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},600);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});


	});


	it("should emit timeout event inside useBeforeAll",(done)=>{

		let eventor = Eventor({timeout:100});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},200);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});
	});

	it("should emit timeout event inside useBefore",(done)=>{

		let eventor = Eventor({timeout:100});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},200);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});
	});

	it("should emit timeout event inside useAfterAll",(done)=>{

		let eventor = Eventor({timeout:100});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},200);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});
	});

	it("should emit timeout event inside useAfter",(done)=>{

		let eventor = Eventor({timeout:100});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},200);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});
	});

	it("should not emit timeout event before 500ms",(done)=>{

		let eventor = Eventor({timeout:500});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},300);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(0);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(0);
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});


	});


	it("should emit timeout event after 500ms with arguments,type and error",(done)=>{

		let eventor = Eventor({timeout:500});
		let timeouts = [];
		let order = [];

		eventor.on("timeout",(data,event)=>{
			timeouts.push(data);
			expect(data.arguments).toEqual(["test","testData"]);
			if(data.type!="emit" && data.type!="cascade"){
				done.fail("timeout data.type should equal 'emit' or 'cascade'");
			}
			expect(data.error instanceof Error).toBe(true);
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				setTimeout(()=>{
					resolve("ok");
				},600);
			});
		});
		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push(event.listener.id);
				resolve("ok");
			})
		});

		eventor.emit("test","testData").then((results)=>{
			expect(timeouts.length).toEqual(1);
			return eventor.cascade("test","testData");
		}).then((result)=>{
			expect(timeouts.length).toEqual(2);
			expect(timeouts[0].type).toEqual("emit");
			expect(timeouts[1].type).toEqual("cascade");
			done();
		}).catch((e)=>{
			if(e instanceof Error){
				done.fail(e.message)
			}else if(e instanceof Eventor.Error){
				done.fail(e.error.message);
			}else{
				done.fail(e);
			}
		});


	});

})
