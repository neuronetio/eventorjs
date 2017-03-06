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


describe("position",()=>{


	it("should iterate and test different positions with one moved listener(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){
						if(typeof positions[i]!="undefined"){
							eventor.on("test",(data,event)=>{
								order.push(i);
								return data+1;
							},positions[i]);
						}else{
							eventor.on("test",(data,event)=>{
								order.push(i);
								return data+1;
							});
						}
					}

					expect(eventor.listeners().length).toEqual(count);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions with one moved listener (partial namespace)(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){
						if(Math.random()>0.5){
							if(typeof positions[i]!="undefined"){
								eventor.on("test",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("test",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}else{
							if(typeof positions[i]!="undefined"){
								eventor.on("namespace","test",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("namespace","test",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}
					}

					expect(eventor.listeners().length).toEqual(count);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions with one moved listener (full namespace)(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){
						if(typeof positions[i]!="undefined"){
							eventor.on("namespace","test",(data,event)=>{
								order.push(i);
								return data+1;
							},positions[i]);
						}else{
							eventor.on("namespace","test",(data,event)=>{
								order.push(i);
								return data+1;
							});
						}
					}

					expect(eventor.listeners().length).toEqual(count);

					eventor.cascade("namespace","test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions with one moved listener (partial wildcards)(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){
						if(Math.random()>0.5){
							if(typeof positions[i]!="undefined"){
								eventor.on("test",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("test",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}else{
							if(typeof positions[i]!="undefined"){
								eventor.on("t*",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("t**",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}
					}

					let listeners = eventor.listeners();
					expect(listeners.length).toEqual(count);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions with one moved listener (full wildcards)(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){

							if(typeof positions[i]!="undefined"){
								eventor.on("t*",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on(/t.*/gi,(data,event)=>{
									order.push(i);
									return data+1;
								});
							}

					}

					let listeners = eventor.listeners();
					expect(listeners.length).toEqual(count);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions with one moved listener (partial wildcards/namespace)(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		// uncomment 611 to see what is going on

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);

					let order = [];

					for(let i=0;i<count;i++){
						if(Math.random()>0.5){
							if(typeof positions[i]!="undefined"){
								eventor.on("test",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("namespace","t*",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}else{
							if(typeof positions[i]!="undefined"){
								eventor.on("namepsace","t*",(data,event)=>{
									order.push(i);
									return data+1;
								},positions[i]);
							}else{
								eventor.on("t**",(data,event)=>{
									order.push(i);
									return data+1;
								});
							}
						}
					}

					let listeners = eventor.listeners();
					expect(listeners.length).toEqual(count);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count);
						let equal=true;
						//console.log(`${_from}->${_to}`,order,should); // console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});


	it("should iterate and test different positions when there are multiple moved listeners(cascade)",(done)=>{
		let count=3; // change this nr for more sophisticated test
		let iteration=0;

		function doneTesting(){
			expect(iteration).toEqual(count*count);
			done();
		}
		
		
		for(let from=0;from<count;from++){
			for(let to=0;to<count;to++){
				
				iteration++;

				(function(_from,_to,_iteration){

					let eventor = Eventor();

					let positions = [];
					for(let i=1;i<=count;i++){positions.push(undefined);}
					positions[_from]=_to;

					let should = [];
					for(let i=0;i<count;i++){should.push(i);}
					let moved = should[_from];
					should.splice(_from,1);
					should.splice(_to,0,moved);
					should.splice(_to,0,moved);
					should.splice(_to,0,moved);

					let order = [];
					let multipleOrder = [];

					for(let i=0;i<count;i++){
						if(typeof positions[i]!="undefined"){
							eventor.on("test",(data,event)=>{
								order.push(i);
								multipleOrder.push(event.listener.id);
								return data+1;
							},positions[i]);
							eventor.on("test",(data,event)=>{
								order.push(i);
								multipleOrder.push(event.listener.id);
								return data+1;
							},positions[i]);
							eventor.on("test",(data,event)=>{
								order.push(i);
								multipleOrder.push(event.listener.id);
								return data+1;
							},positions[i]);
						}else{
							eventor.on("test",(data,event)=>{
								order.push(i);
								return data+1;
							});
						}
					}

					expect(eventor.listeners().length).toEqual(count+2);

					eventor.cascade("test",0).then((result)=>{
						expect(result).toEqual(count+2);
						let equal=true;
						// console.log(`${_from}->${_to}`,order,should) // uncoment this to see what is going on
						should.forEach((item,index)=>{
							if(item!=order[index]){
								equal=false;
							}
						});
						if(!equal){// we need more info
							console.error(`order doesn't equal should at (from: ${_from} to: ${_to} , should: ${should} order: ${order})`);
						}
						expect(order).toEqual(should);
						// first id should be greater because it should override first one (prepend)
						expect(multipleOrder[0]>multipleOrder[1]).toBeTruthy();
						expect(multipleOrder[1]>multipleOrder[2]).toBeTruthy();
						if(_iteration==count*count)doneTesting();
					}).catch((e)=>{
						console.log("error",e)
						throw e;
					});	

				}(from,to,iteration));
				
			}
		}

	});



	it("should have proper position when not defined",(done)=>{
		let eventor = Eventor();

		eventor.useBeforeAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(0);
		});
		eventor.useBeforeAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(1);
		});
		eventor.useBeforeAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
		});

		eventor.useBefore("test",(data,event)=>{
			expect(event.listener.position).toEqual(0);
		});
		eventor.useBefore("test",(data,event)=>{
			expect(event.listener.position).toEqual(1);
		});
		eventor.useBefore("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
		});

		eventor.on("test",(data,event)=>{
			expect(event.listener.position).toEqual(0);
		});
		eventor.on("test",(data,event)=>{
			expect(event.listener.position).toEqual(1);
		});
		eventor.on("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
		});


		eventor.useAfter("test",(data,event)=>{
			expect(event.listener.position).toEqual(0);
		});
		eventor.useAfter("test",(data,event)=>{
			expect(event.listener.position).toEqual(1);
		});
		eventor.useAfter("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
		});


		eventor.useAfterAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(0);
		});
		eventor.useAfterAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(1);
		});
		eventor.useAfterAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
		});

		let listeners = eventor.allListeners();
		let positions = listeners.map(listener=>listener.position);

		eventor.emit("test","testData").then((results)=>{
			return eventor.cascade("test","testData");
		}).then((result)=>{
			done();
		}).catch((e)=>{
			console.log("error?",e)
			throw e.error;
		});

	});

	it("should have proper position inside listener object",(done)=>{
		let eventor = Eventor();
		let order=[];

		eventor.useBeforeAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(2);
			order.push("useBeforeAll");
		},2);

		eventor.useBefore("test",(data,event)=>{
			expect(event.listener.position).toEqual(3);
			order.push("useBefore");
		},3);

		eventor.on("test",(data,event)=>{
			expect(event.listener.position).toEqual(4);
			order.push("on");
		},4);

		eventor.useAfter("test",(data,event)=>{
			expect(event.listener.position).toEqual(5);
			order.push("useAfter");
		},5);

		eventor.useAfterAll("test",(data,event)=>{
			expect(event.listener.position).toEqual(6);
			order.push("useAfterAll");
		},6);

		let listeners = eventor.allListeners();
		let positions = listeners.map(listener=>listener.position);

		listeners.forEach((listener,index)=>{
			expect(listener.position).toEqual(index+2);
		});

		eventor.emit("test","data").then((results)=>{
			expect(order).toEqual(["useBeforeAll","useBefore","on","useAfter","useAfterAll"]);
			order=[];
			return eventor.cascade("test","data");
		}).then((result)=>{
			expect(order).toEqual(["useBeforeAll","useBefore","on","useAfter","useAfterAll"]);
			done();
		}).catch((e)=>{throw e;});

	});


	it("should prepend listener #1 from 2 to 1",(done)=>{
		let eventor = Eventor();
		let order = [];

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll1")
				resolve("useBeforeAll");
			})
		});

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll2")
				resolve("useBeforeAll");
			})
		},0);

		eventor.useBeforeAll("test",(data,event)=>{
				order.push("useBeforeAll3")
				return "useBeforeAll";
		});


		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore1")
				resolve("useBefore");
			})
		});

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore2")
				resolve("useBefore");
			})
		},0);

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore3")
				resolve("useBefore");
			});
		});


		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on1")
				resolve("on");
			})
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on2")
				resolve("on");
			})
		},0);

		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on3")
				resolve("on");
			});
		});



		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter1")
				resolve("useAfter");
			})
		});

		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter2")
				resolve("useAfter");
			})
		},0);

		eventor.useAfter("test",(data,event)=>{
				order.push("useAfter3")
				return "useAfter";
		});



		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll1")
				resolve("useAfterAll");
			})
		});

		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll2")
				resolve("useAfterAll");
			})
		},0);

		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll3")
				resolve("useAfterAll");
			});
		});


		eventor.emit("test","data").then((results)=>{
			expect(order).toEqual([
				'useBeforeAll2', 'useBeforeAll1', 'useBeforeAll3',
				'useBefore2', 'useBefore2', 'useBefore2',
				'useBefore1', 'useBefore1', 'useBefore1',
				'useBefore3', 'useBefore3', 'useBefore3',
				'on2', 'on1', 'on3',
				'useAfter2', 'useAfter2', 'useAfter2',
				'useAfter1', 'useAfter1', 'useAfter1',
				'useAfter3', 'useAfter3', 'useAfter3',
				'useAfterAll2', 'useAfterAll1', 'useAfterAll3']);
			order=[];
			return eventor.cascade("test","data");
		}).then((result)=>{
			expect(order).toEqual([
				'useBeforeAll2', 'useBeforeAll1', 'useBeforeAll3',
				'useBefore2','useBefore1','useBefore3',"on2","useAfter2","useAfter1","useAfter3",
				'useBefore2','useBefore1','useBefore3',"on1","useAfter2","useAfter1","useAfter3",
				'useBefore2','useBefore1','useBefore3',"on3","useAfter2","useAfter1","useAfter3",
				'useAfterAll2', 'useAfterAll1', 'useAfterAll3']);
			done();
		}).catch((e)=>{throw e;});
	});

	it("should prepend listener #2 from 3 to 1",(done)=>{
		let eventor = Eventor();
		let order = [];

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll1")
				resolve("useBeforeAll");
			})
		});

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll2")
				resolve("useBeforeAll");
			})
		});

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push("useBeforeAll3")
				resolve("useBeforeAll");
			});
		},0);


		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore1")
				resolve("useBefore");
			})
		});

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore2")
				resolve("useBefore");
			})
		});

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push("useBefore3")
				resolve("useBefore");
			});
		},0);


		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on1")
				resolve("on");
			})
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on2")
				resolve("on");
			})
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push("on3")
				resolve("on");
			});
		},0);



		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter1")
				resolve("useAfter");
			})
		});

		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter2")
				resolve("useAfter");
			})
		});

		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve)=>{
				order.push("useAfter3")
				resolve("useAfter");
			});
		},0);



		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll1")
				resolve("useAfterAll");
			})
		});

		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll2")
				resolve("useAfterAll");
			})
		});

		eventor.useAfterAll("test",(data,event)=>{
				order.push("useAfterAll3")
				return "useAfterAll";
		},0);


		eventor.emit("test","data").then((results)=>{
			expect(order).toEqual([
				'useBeforeAll3', 'useBeforeAll1', 'useBeforeAll2',
				'useBefore3', 'useBefore3', 'useBefore3',
				'useBefore1', 'useBefore1', 'useBefore1',
				'useBefore2', 'useBefore2', 'useBefore2',
				'on3', 'on1', 'on2',
				'useAfter3', 'useAfter3', 'useAfter3',
				'useAfter1', 'useAfter1', 'useAfter1',
				'useAfter2', 'useAfter2', 'useAfter2',
				'useAfterAll3', 'useAfterAll1', 'useAfterAll2']);
			order=[];
			return eventor.cascade("test","data");
		}).then((result)=>{
			expect(order).toEqual([
				'useBeforeAll3', 'useBeforeAll1', 'useBeforeAll2',
				'useBefore3','useBefore1','useBefore2',"on3","useAfter3","useAfter1","useAfter2",
				'useBefore3','useBefore1','useBefore2',"on1","useAfter3","useAfter1","useAfter2",
				'useBefore3','useBefore1','useBefore2',"on2","useAfter3","useAfter1","useAfter2",
				'useAfterAll3', 'useAfterAll1', 'useAfterAll2']);
			done();
		}).catch((e)=>{throw e;});
	});

	
	it("should prepend listener #3 from 1 to 1",(done)=>{
		let eventor = Eventor();
		let order = [];

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll1")
				resolve("useBeforeAll");
			})
		},0);

		eventor.useBeforeAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBeforeAll2")
				resolve("useBeforeAll");
			})
		});

		eventor.useBeforeAll("test",(data,event)=>{
				order.push("useBeforeAll3")
				return "useBeforeAll";
		});


		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore1")
				resolve("useBefore");
			})
		},0);

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore2")
				resolve("useBefore");
			})
		});

		eventor.useBefore("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useBefore3")
				resolve("useBefore");
			});
		});


		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on1")
				resolve("on");
			})
		},0);

		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on2")
				resolve("on");
			})
		});

		eventor.on("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("on3")
				resolve("on");
			});
		});



		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter1")
				resolve("useAfter");
			})
		},0);

		eventor.useAfter("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfter2")
				resolve("useAfter");
			})
		});

		eventor.useAfter("test",(data,event)=>{
				order.push("useAfter3")
				return "useAfter";
		});



		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll1")
				resolve("useAfterAll");
			})
		},0);

		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll2")
				resolve("useAfterAll");
			})
		});

		eventor.useAfterAll("test",(data,event)=>{
			return new Promise((resolve,reject)=>{
				order.push("useAfterAll3")
				resolve("useAfterAll");
			});
		});


		eventor.emit("test","data").then((results)=>{
			expect(order).toEqual([
				'useBeforeAll1', 'useBeforeAll2', 'useBeforeAll3',
				'useBefore1', 'useBefore1', 'useBefore1',
				'useBefore2', 'useBefore2', 'useBefore2',
				'useBefore3', 'useBefore3', 'useBefore3',
				'on1', 'on2', 'on3',
				'useAfter1', 'useAfter1', 'useAfter1',
				'useAfter2', 'useAfter2', 'useAfter2',
				'useAfter3', 'useAfter3', 'useAfter3',
				'useAfterAll1', 'useAfterAll2', 'useAfterAll3']);
			order=[];
			return eventor.cascade("test","data");
		}).then((result)=>{
			expect(order).toEqual([
				'useBeforeAll1', 'useBeforeAll2', 'useBeforeAll3',
				'useBefore1','useBefore2','useBefore3',"on1","useAfter1","useAfter2","useAfter3",
				'useBefore1','useBefore2','useBefore3',"on2","useAfter1","useAfter2","useAfter3",
				'useBefore1','useBefore2','useBefore3',"on3","useAfter1","useAfter2","useAfter3",
				'useAfterAll1', 'useAfterAll2', 'useAfterAll3']);
			done();
		}).catch((e)=>{throw e;});
	});


	it(" 0 0 1 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},0);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([1,0,2]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 0 0 1 1 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},0);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		},1);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([1,0,3,2]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" 0 0 1 x 1 0 2 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},0);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([5,1,0,4,2,6,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	})


it(" 2 0 1 x 1 0 2 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},2);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([5,1,4,2,6,0,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	});

	it(" 0 2 1 x 1 0 2 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},0);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([5,0,4,2,6,1,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" x 0 1 x 1 0 2 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([5,1,4,2,6,0,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 0 20 10 x 15 0 25 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},0);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},20);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},10);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},15);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},25);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([5,0,3,7,2,4,1,6]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" x x x x 3 x x x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(5)
		});
		eventor.on("test",(data,event)=>{
			order.push(6)
		});
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,2,4,3,5,6,7]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" x x x x 3 4 x x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},4);
		eventor.on("test",(data,event)=>{
			order.push(6)
		});
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,2,4,5,3,6,7]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" 1 1 1 x 3 3 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},1);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([3,2,1,0,6,5,4,7]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" 1 x 1 x 3 3 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},1);
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([1,2,0,6,5,4,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 1 x 1 x 3 3 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},1);
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		},1);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([1,2,0,6,5,4,3,7]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" x x x x 0 x x 0 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		},0);
		eventor.on("test",(data,event)=>{
			order.push(5)
		});
		eventor.on("test",(data,event)=>{
			order.push(6)
		});
		eventor.on("test",(data,event)=>{
			order.push(7)
		},0);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([7,4,0,1,2,3,5,6]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 3 3 3 x x x 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},3);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.on("test",(data,event)=>{
			order.push(4)
		});
		eventor.on("test",(data,event)=>{
			order.push(5)
		});
		eventor.on("test",(data,event)=>{
			order.push(6)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(7)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([3,4,5,6,2,1,0,7]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 12 13 12 14 x x x 0 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},12);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},13);
		eventor.on("test",(data,event)=>{
			order.push(2)
		},12);
		eventor.on("test",(data,event)=>{
			order.push(3)
		},14);
		eventor.on("test",(data,event)=>{
			order.push(4)
		});
		eventor.on("test",(data,event)=>{
			order.push(5)
		});
		eventor.on("test",(data,event)=>{
			order.push(6)
		});
		eventor.on("test",(data,event)=>{
			order.push(7)
		},0);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([7,4,5,6,2,0,1,3]);
			done();
		}).catch(e=>{throw e.error;});
	})


	it(" x x x 2 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		},2);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,3,2]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" x x x 3 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		},3);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,2,3]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" x x 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(3)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,3,2]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" x x 3 3 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(3)
		},3);
		eventor.on("test",(data,event)=>{
			order.push(4)
		});
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,4,3,2]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" 30 40 x test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		},30);
		eventor.on("test",(data,event)=>{
			order.push(1)
		},40);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1]);
			eventor.on("test",(data,event)=>{
				order.push(2)
			},40);
			eventor.on("test",(data,event)=>{
				order.push(3)
			},41);
			order=[];
			return eventor.cascade("test","data");
		}).then(()=>{
			expect(order).toEqual([0,2,1,3]);
			done();
		}).catch(e=>{throw e.error;});
	});

	it(" x x x 4 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		},4);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,2,3]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it(" x x x x 2 2 2 2 4 4 4 4 test",(done)=>{
		let eventor = Eventor();
		let order =[];
		eventor.on("test",(data,event)=>{
			order.push(0);
		});
		eventor.on("test",(data,event)=>{
			order.push(1)
		});
		eventor.on("test",(data,event)=>{
			order.push(2)
		});
		eventor.on("test",(data,event)=>{
			order.push(3)
		});

		eventor.on("test",(data,event)=>{
			order.push(4);
		},2);
		eventor.on("test",(data,event)=>{
			order.push(5)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(6)
		},2);
		eventor.on("test",(data,event)=>{
			order.push(7)
		},2);

		eventor.on("test",(data,event)=>{
			order.push(8);
		},4);
		eventor.on("test",(data,event)=>{
			order.push(9)
		},4);
		eventor.on("test",(data,event)=>{
			order.push(10)
		},4);
		eventor.on("test",(data,event)=>{
			order.push(11)
		},4);
		eventor.cascade("test","data").then(()=>{
			expect(order).toEqual([0,1,7,6,5,4,2,11,10,9,8,3]);
			done();
		}).catch(e=>{throw e.error;});
	})

	it("should prepend listener (namespace)",(done)=>{
		let eventor = Eventor();
		let order = [];

				eventor.on("test","test",(data,event)=>{
					order.push(0);
				},2);
				eventor.on("test","test",(data,event)=>{
					order.push(1);
				},0);
		eventor.useBeforeAll("test","test",(data,event)=>{
			order.push(2);
		});
				eventor.on("test","test",(data,event)=>{
					order.push(3);
				},2);
				eventor.on("test","t*",(data,event)=>{
					order.push(4);
				});
			eventor.useBefore("test",/t.*/gi,(data,event)=>{
				order.push(5);
			});
					eventor.useAfter("test",/t.*/gi,(data,event)=>{
						order.push(6);
					});
						eventor.useAfterAll("test","t**",(data,event)=>{
							order.push(7);
						},0);
		eventor.useBeforeAll("test","test",(data,event)=>{
			order.push(8);
		},0);
		eventor.useBeforeAll("test","test",(data,event)=>{
			order.push(9);
		},10);
		eventor.useBefore("test","test",(data,event)=>{
			order.push(10);
		},0);
		eventor.useBefore("test",/t.*/gi,(data,event)=>{
			order.push(11);
		},10);
					eventor.useAfter("test","test",(data,event)=>{
						order.push(12);
					},0);
					eventor.useAfter("test","t**",(data,event)=>{
						order.push(13);
					},1);
					eventor.useAfter("test","t**",(data,event)=>{
						order.push(14);
					});
						eventor.useAfterAll("test","t**",(data,event)=>{
							order.push(15);
						},0);
						eventor.useAfterAll("test","t**",(data,event)=>{
							order.push(16);
						},1);
				eventor.on("test",/t.*/gi,(data,event)=>{
					order.push(17);
				},2);

		let listeners=eventor.allListeners();
		//expect(listeners.length).toEqual(13);

		eventor.cascade("test","data").then((result)=>{
			let should=[
				8,2,9, // beforeAll

				10,5,11, // before
				1, // on
				12,13,6,14, // after

				10,5,11,
				4,
				12,13,6,14,

				10,5,11,
				17,
				12,13,6,14,

				10,5,11,
				3,
				12,13,6,14,

				10,5,11,
				0,
				12,13,6,14,

				15,7,16 // after all

			];
			expect(order).toEqual(should);
			order=[];
			return eventor.cascade("test","test","data");
		}).then((result)=>{
			expect(order).toEqual([]);
			done();
		}).catch((e)=>{throw e.error;});

	});

	it("should prepend listener (wildcard)",(done)=>{
		done.fail("TODO");
	});




	it("should add listener in the middle of other listeners",(done)=>{
		done.fail("TODO");
	});

	it("should add listener in the middle of other listeners (namespace)",(done)=>{
		done.fail("TODO");
	});

	it("should add listener in the middle of other listeners (wildcard)",(done)=>{
		done.fail("TODO");
	});




	it("should add listener at the end of the listeners",(done)=>{
		done.fail("TODO");
	});

	it("should add listener at the end of the listeners (namespace)",(done)=>{
		done.fail("TODO");
	});

	it("should add listener at the end of the listeners (wildcard)",(done)=>{
		done.fail("TODO");
	});


	it("should prepend position if there already was same position",(done)=>{
		done.fail("TODO");
	});

});