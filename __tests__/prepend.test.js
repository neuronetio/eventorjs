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


describe("prepend",()=>{

	describe("should prepend one listener from the end",()=>{

		it("basic",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);

			expect(eventor.listeners().length).toEqual(4);
			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(result).toEqual(3);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(results).toEqual([4,1,2,3]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

		it("namespace",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);

			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(result).toEqual(3);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(results).toEqual([4,1,2,3]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(1);// namespaced
				expect(order).toEqual([4,1]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([4,1]);
				expect(results).toEqual([4,1]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

		it("namespace,wildcard",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","te*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("**e*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace",/te.*/gi,(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);

			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(result).toEqual(3);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([4,1,2,3]);
				expect(results).toEqual([4,1,2,3]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(1);// namespaced
				expect(order).toEqual([4,1]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([4,1]);
				expect(results).toEqual([4,1]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

	});

	

	describe("should prepend one listener from the middle ",()=>{

		it("basic",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			

			expect(eventor.listeners().length).toEqual(4);
			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(results).toEqual([3,1,2,4]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

		it("namespace",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			

			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(results).toEqual([3,1,2,4]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(1);// namespaced
				expect(order).toEqual([3,1]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([3,1]);
				expect(results).toEqual([3,1]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

		it("namespace,wildcard",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","te*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("**e*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace",/te.*/gi,(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			

			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([3,1,2,4]);
				expect(results).toEqual([3,1,2,4]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(1);// namespaced
				expect(order).toEqual([3,1]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([3,1]);
				expect(results).toEqual([3,1]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

	});




	describe("should prepend one listener from the beginning ",()=>{

		it("basic",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			

			expect(eventor.listeners().length).toEqual(4);
			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(results).toEqual([1,2,3,4]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});
		});


		it("namespace",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});

			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(results).toEqual([1,2,3,4]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(4);// namespaced
				expect(order).toEqual([1,2,4]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([1,2,4]);
				expect(results).toEqual([1,2,4]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});


		it("namespace,wildcard",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace",/.*es.*/gi,(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","te*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("**e*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			
			expect(eventor.listeners().length).toEqual(4);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(result).toEqual(4);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([1,2,3,4]);
				expect(results).toEqual([1,2,3,4]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(4);// namespaced
				expect(order).toEqual([1,2,4]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([1,2,4]);
				expect(results).toEqual([1,2,4]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

	});





	describe("should prepend multiple listeners ",()=>{

		it("basic",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			

			expect(eventor.listeners().length).toEqual(6);
			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([6,3,1,2,4,5]);
				expect(result).toEqual(5);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([6,3,1,2,4,5]);
				expect(results).toEqual([6,3,1,2,4,5]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});
		});


		it("namespace",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);

			expect(eventor.listeners().length).toEqual(6);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([6,3,1,2,4,5]);
				expect(result).toEqual(5);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([6,3,1,2,4,5]);
				expect(results).toEqual([6,3,1,2,4,5]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(5);// namespaced
				expect(order).toEqual([3,1,2,5]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([3,1,2,5]);
				expect(results).toEqual([3,1,2,5]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});


		it("namespace,wildcard",(done)=>{
			let eventor = Eventor();
			let order = [];

			eventor.on("namespace",/.*es.*/gi,(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","te*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("**e*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("*es*",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","test",(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace",/tes.*/gi,(data,event)=>{
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			
			expect(eventor.listeners().length).toEqual(6);

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([6,4,1,2,3,5]);
				expect(result).toEqual(5);
				order=[];
				return eventor.emit("test","data")
			}).then((results)=>{
				expect(order).toEqual([6,4,1,2,3,5]);
				expect(results).toEqual([6,4,1,2,3,5]);
				order=[];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(result).toEqual(5);// namespaced
				expect(order).toEqual([6,1,2,5]);
				order=[];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([6,1,2,5]);
				expect(results).toEqual([6,1,2,5]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});

		});

	});


	describe("middlewares",()=>{

		it("all middlewares proper order",(done)=>{

			let eventor = Eventor();
			let order = [];

			eventor.useBeforeAll("test",(data,event)=>{//#1
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBeforeAll("test",(data,event)=>{//#2
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBeforeAll("test",(data,event)=>{//#3
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBeforeAll("test",(data,event)=>{//#4
				order.push(event.listener.id);
				return event.listener.id;
			});


			eventor.on("test",(data,event)=>{//#5
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{//#6
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("test",(data,event)=>{//#7
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("test",(data,event)=>{//#8
				order.push(event.listener.id);
				return event.listener.id;
			});


			eventor.useBefore("test",(data,event)=>{//#9
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBefore("test",(data,event)=>{//#10
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBefore("test",(data,event)=>{//#11
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBefore("test",(data,event)=>{//#12
				order.push(event.listener.id);
				return event.listener.id;
			},0);


			eventor.useAfterAll("test",(data,event)=>{//#13
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll("test",(data,event)=>{//#14
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll("test",(data,event)=>{//#15
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll("test",(data,event)=>{//#16
				order.push(event.listener.id);
				return event.listener.id;
			},0);


			eventor.useAfter("test",(data,event)=>{//#17
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useAfter("test",(data,event)=>{//#18
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfter("test",(data,event)=>{//#19
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfter("test",(data,event)=>{//#20
				order.push(event.listener.id);
				return event.listener.id;
			});

			let listeners = eventor.allListeners();

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([
					3,2,1,4, // before all

					12,10,9,11, // before
					6, // on
					19,18,17,20, // after

					12,10,9,11, // before
					5, // on
					19,18,17,20, // after

					12,10,9,11, // before
					7, // on
					19,18,17,20, // after

					12,10,9,11, // before
					8, // on
					19,18,17,20, // after

					16,15,14,13 // after all
				]);
				expect(result).toEqual(13);
				order = [];
				return eventor.emit("test","data");
			}).then((results)=>{
				expect(order).toEqual([
					3,2,1,4, // before all

					12,12,12,12, 10,10,10,10, 9,9,9,9, 11,11,11,11,
					6,5,7,8,
					19,19,19,19, 18,18,18,18, 17,17,17,17, 20,20,20,20,


					16,15,14,13 // after all					
				]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});


		});



		it("all middlewares proper order (namespace,wildcard)",(done)=>{

			let eventor = Eventor();
			let order = [];

			eventor.useBeforeAll("namespace","te*",(data,event)=>{//#1
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBeforeAll("namespace",/te.*/gi,(data,event)=>{//#2
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBeforeAll("test",(data,event)=>{//#3
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBeforeAll("test",(data,event)=>{//#4
				order.push(event.listener.id);
				return event.listener.id;
			});


			eventor.on("test",(data,event)=>{//#5
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("namespace","test**",(data,event)=>{//#6
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.on("te**",(data,event)=>{//#7
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.on("namespace","te**",(data,event)=>{//#8
				order.push(event.listener.id);
				return event.listener.id;
			});


			eventor.useBefore("namespace",/te.*/gi,(data,event)=>{//#9
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBefore("test",(data,event)=>{//#10
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useBefore("test",(data,event)=>{//#11
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useBefore("namespace","te*t",(data,event)=>{//#12
				order.push(event.listener.id);
				return event.listener.id;
			},0);


			eventor.useAfterAll("namespace","test",(data,event)=>{//#13
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll(/test/gi,(data,event)=>{//#14
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll("namespace","test",(data,event)=>{//#15
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfterAll("te*",(data,event)=>{//#16
				order.push(event.listener.id);
				return event.listener.id;
			},0);


			eventor.useAfter("namespace",/te.*/gi,(data,event)=>{//#17
				order.push(event.listener.id);
				return event.listener.id;
			});
			eventor.useAfter("test",(data,event)=>{//#18
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfter("namespace","test",(data,event)=>{//#19
				order.push(event.listener.id);
				return event.listener.id;
			},0);
			eventor.useAfter("test",(data,event)=>{//#20
				order.push(event.listener.id);
				return event.listener.id;
			});

			let listeners = eventor.allListeners();

			eventor.cascade("test","data").then((result)=>{
				expect(order).toEqual([
					3,2,1,4, // before all

					12,10,9,11, // before
					6, // on
					19,18,17,20, // after

					12,10,9,11, // before
					5, // on
					19,18,17,20, // after

					12,10,9,11, // before
					7, // on
					19,18,17,20, // after

					12,10,9,11, // before
					8, // on
					19,18,17,20, // after

					16,15,14,13 // after all
				]);
				expect(result).toEqual(13);
				order = [];
				return eventor.emit("test","data");
			}).then((results)=>{
				expect(order).toEqual([
					3,2,1,4, // before all

					12,12,12,12, 10,10,10,10, 9,9,9,9, 11,11,11,11,
					6,5,7,8,
					19,19,19,19, 18,18,18,18, 17,17,17,17, 20,20,20,20,


					16,15,14,13 // after all					
				]);
				order = [];
				return eventor.cascade("namespace","test","data");
			}).then((result)=>{
				expect(order).toEqual([
					2,1, // before all

					12,9, // before
					6, // on
					19,17, // after

					12,9, // before
					8, // on
					19,17, // after

					15,13 // after all
				]);
				expect(result).toEqual(13);
				order = [];
				return eventor.emit("namespace","test","data");
			}).then((results)=>{
				expect(order).toEqual([
					2,1, // before all

					12,12, 9,9,
					6,8,
					19,19, 17,17,


					15,13 // after all
				]);
				done();
			}).catch((e)=>{
				if(e instanceof Error){
					done.fail(e);
				}else{
					done.fail(e.error);
				}
			});


		});

	});


});