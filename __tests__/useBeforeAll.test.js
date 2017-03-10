const Eventor = require("../index.js");
const jsc=require("jscheck");
const Promise = require("bluebird");

let valueSize = 1000;


let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  // no duplicates, no wildcards
  if(eventNames.indexOf(name)>=0 || name.indexOf("*")>=0 || name.charAt(0)=="%"){
    i--;
  }else{
    eventNames.push(name);
  }
}

let values = jsc.array(valueSize,jsc.any())();
let promiseLoop=require("promiseloop")(Promise);

describe("useBeforeAll",()=>{

  it("should have useBeoreAll method",()=>{
    let eventor=Eventor();
    expect(typeof eventor.useBeforeAll).toEqual("function");
  });

  it("should run useBeforeAll listener inside emit",(done)=>{
    let eventor=Eventor();
    let resultArr=[];
    eventor.useBeforeAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        resultArr.push("useBeforeAll");
        resolve("useBeforeAll");
      });
    });

    eventor.emit("test","ok").then((result)=>{
      expect(resultArr).toEqual(["useBeforeAll"]);
      expect(result).toEqual([]);
      done();
    })
  });

  it("should run useBeforeAll when there is no 'on' listeners",(done)=>{
    let eventor = Eventor();
    let beforeAll=0;
    eventor.useBeforeAll("test",(data,event)=>{
      return new Promise((resolve)=>{
        beforeAll++;
        resolve(beforeAll+"+test")
      });
    });
    eventor.emit("test","").then((results)=>{
      expect(beforeAll).toEqual(1);
      expect(results).toEqual([]);
      return eventor.cascade("test","");
    }).then((result)=>{
      //expect(beforeAll).toEqual(2);
      //expect(result).toEqual("2+test");
      done();
    });
  });

  it("should pass result from useBeforeAll to useBefore,on,useAfter,useAfterAll when there is a listener",(done)=>{
    let e1=Eventor(),a1=[];
    let e2=Eventor(),a2=[];
    let e3=Eventor(),a3=[];
    let e4=Eventor(),a4=[];

    e1.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a1.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e1.useBefore('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        expect(data).toEqual("test useBeforeAll");
        a1.push("useBefore")
        resolve(data+" useBefore");
      })
    });
    e1.on("test",(data,event)=>{
      // on must be here because useBefore is glued to 'on'
      // if there is no 'on' there will be no useBefore
      expect(data).toEqual("test useBeforeAll useBefore");
      return new Promise((resolve,reject)=>{
        a1.push("on")
        resolve(data+" on");
      });
    });
    e1.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll useBefore on"]);
    });
    e1.cascade("test","test").then((result)=>{
      expect(result).toEqual("test useBeforeAll useBefore on");
    });


    e2.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a2.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e2.on("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a2.push("on")
        resolve(data+" on");
      });
    });
    e2.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll on"]);
    });
    e2.cascade("test","test").then((result)=>{
      expect(result).toEqual("test useBeforeAll on");
    });


    e3.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a3.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e3.on("test",(data,event)=>{
      // on must be here because useAfter is glued to 'on'
      // if there is no 'on' there will be no useAfter
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a3.push("on")
        resolve(data+" on");
      });
    });
    e3.useAfter("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll on");
      return new Promise((resolve,reject)=>{
        a3.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e3.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll on useAfter"]);
    });
    e3.cascade("test","test").then((result)=>{
      expect(result).toEqual("test useBeforeAll on useAfter");
    });


    e4.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a4.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e4.on("test",(data,event)=>{
      // on must be here because useAfter is glued to 'on'
      // if there is no 'on' there will be no useAfter
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a4.push("on")
        resolve(data+" on");
      });
    });
    e4.useAfter("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll on");
      return new Promise((resolve,reject)=>{
        a4.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e4.useAfterAll("test",(data,event)=>{
      if(event.type=="cascade"){
        expect(data).toEqual("test useBeforeAll on useAfter");
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve(data+" useAfterAll");
        });
      }else{
        expect(data).toEqual(["test useBeforeAll on useAfter"]);
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve([data[0]+" useAfterAll"]);
        });
      }
    });
    e4.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll on useAfter useAfterAll"]);
    });
    e4.cascade("test","test").then((result)=>{
      expect(result).toEqual("test useBeforeAll on useAfter useAfterAll");
    });


    promiseLoop(50,()=>{
      setTimeout(()=>{
          expect(a1).toEqual(["useBeforeAll","useBeforeAll","useBefore","useBefore","on","on"]);
          expect(a2).toEqual(["useBeforeAll","useBeforeAll","on","on"]);
          expect(a3).toEqual(["useBeforeAll","useBeforeAll","on","on","useAfter","useAfter"]);
          expect(a4).toEqual(["useBeforeAll","useBeforeAll","on","on","useAfter","useAfter","useAfterAll","useAfterAll"]);
          done();
      },100); // don't know why - something with bluebird
    });

  });

  it("should pass result from useBeforeAll to useBefore,on,useAfter,useAfterAll with multiple listeners",(done)=>{
    let e1=Eventor(),a1=[];
    let e2=Eventor(),a2=[];
    let e3=Eventor(),a3=[];
    let e4=Eventor(),a4=[];

    e1.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a1.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e1.useBefore('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        if(data!="test useBeforeAll" && data!="test useBeforeAll useBefore on")
          done.fail("data should not equal "+data)
        a1.push("useBefore")
        resolve(data+" useBefore");
      })
    });
    e1.on("test",(data,event)=>{
      // on must be here because useBefore is glued to 'on'
      // if there is no 'on' there will be no useBefore
      expect(data).toEqual("test useBeforeAll useBefore");
      return new Promise((resolve,reject)=>{
        a1.push("on")
        resolve(data+" on");
      });
    });
    e1.on("test",(data,event)=>{
      // on must be here because useBefore is glued to 'on'
      // if there is no 'on' there will be no useBefore
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll useBefore");
      }else{
        if(data!="test useBeforeAll useBefore" && data!="test useBeforeAll useBefore on useBefore")
          done.fail("data should not equal "+data);
      }
      return new Promise((resolve,reject)=>{
        a1.push("on")
        resolve(data+" on");
      });
    });
    e1.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll useBefore on","test useBeforeAll useBefore on"]);
      return e1.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll useBefore on useBefore on");
    });


    e2.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a2.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e2.on("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a2.push("on")
        resolve(data+" on");
      });
    });
    e2.on("test",(data,event)=>{
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll");
      }else{
        expect(data).toEqual("test useBeforeAll on");
      }
      return new Promise((resolve,reject)=>{
        a2.push("on")
        resolve(data+" on");
      });
    });
    e2.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll on","test useBeforeAll on"]);
      return e2.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll on on");
    });


    e3.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a3.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e3.on("test",(data,event)=>{
      // on must be here because useAfter is glued to 'on'
      // if there is no 'on' there will be no useAfter
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a3.push("on")
        resolve(data+" on");
      });
    });
    e3.on("test",(data,event)=>{
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll");
      }else{
        if(data!="test useBeforeAll" && data!="test useBeforeAll on useAfter")
          done.fail("data should not equal "+data)
      }
      return new Promise((resolve,reject)=>{
        a3.push("on")
        resolve(data+" on");
      });
    });
    e3.useAfter("test",(data,event)=>{
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll on");
      }else{
        if(data!="test useBeforeAll on" && data!="test useBeforeAll on useAfter on")
          done.fail("data should not euqal "+data);
      }
      return new Promise((resolve,reject)=>{
        a3.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e3.emit("test","test").then((results)=>{
      expect(results).toEqual(["test useBeforeAll on useAfter","test useBeforeAll on useAfter"]);
      return e3.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll on useAfter on useAfter");
    });


    e4.on("test",(data,event)=>{
      // on must be here because useAfter is glued to 'on'
      // if there is no 'on' there will be no useAfter
      //if(data!="test useBeforeAll" && data!="useAfter")throw new Error("data should equal 'test useBeforeAll' or 'useAfter'");
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a4.push("on")
        resolve(data+" on");
      });
    });
    e4.on("test",(data,event)=>{
      // on must be here because useAfter is glued to 'on'
      // if there is no 'on' there will be no useAfter
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll");
      }else{
        if(data!="test useBeforeAll" && data!="useAfter")throw new Error("data should equal 'test useBeforeAll' or 'useAfter'");
      }
      return new Promise((resolve,reject)=>{
        a4.push("on")
        resolve(data+" on");
      });
    });
    e4.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a4.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e4.useAfter("test",(data,event)=>{
      if(event.type=="emit"){
        expect(data).toEqual("test useBeforeAll on");
      }else{
        if(data!="useAfter on" && data!="test useBeforeAll on")done.fail("data should equal 'useAfter' or 'test useBeforeAll on' not "+data);
      }
      return new Promise((resolve,reject)=>{
        a4.push("useAfter")
        resolve("useAfter");
      });
    });
    e4.useAfterAll("test",(data,event)=>{
      if(event.type=="cascade"){
        expect(data).toEqual("useAfter");
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve(data+" useAfterAll");
        });
      }else{
        expect(data).toEqual(["useAfter","useAfter"]);
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          let res=[];
          res=data.map((item)=>{return item+" useAfterAll";});
          resolve(res);
        });
      }
    });
    e4.emit("test","test").then((results)=>{
      expect(results).toEqual(["useAfter useAfterAll","useAfter useAfterAll"]);
      return e4.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("useAfter useAfterAll");
    });


    promiseLoop(50,()=>{
      setTimeout(()=>{
          expect(a1).toEqual([
            "useBeforeAll","useBefore","useBefore","on","on",
            "useBeforeAll","useBefore","on","useBefore","on"
          ]);
          expect(a2).toEqual([
            "useBeforeAll","on","on",
            "useBeforeAll","on","on"
          ]);
          expect(a3).toEqual([
            'useBeforeAll', 'on', 'on', 'useAfter', 'useAfter',
            'useBeforeAll', 'on', 'useAfter', 'on', 'useAfter'
          ]);
          expect(a4).toEqual([
            "useBeforeAll","on","on","useAfter","useAfter","useAfterAll",//emit
            "useBeforeAll","on","useAfter","on","useAfter","useAfterAll"
          ]);
          done();
      },100); // don't know why - something with bluebird
    });
  });

  it("should pass result from useBeforeAll to useAfterAll when there is no 'on' listeners",(done)=>{
    let e1=Eventor(),a1=[];
    let e2=Eventor(),a2=[];
    let e3=Eventor(),a3=[];
    let e4=Eventor(),a4=[];

    e1.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a1.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e1.useBefore('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        expect(data).toEqual("test useBeforeAll");
        a1.push("useBefore")
        resolve(data+" useBefore");
      })
    });
    e1.useBefore('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        expect(data).toEqual("test useBeforeAll useBefore");
        a1.push("useBefore")
        resolve(data+" useBefore");
      })
    });
    e1.emit("test","test").then((results)=>{
      expect(results).toEqual([]);
      return e1.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll");
    });


    e2.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a2.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e2.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a2.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e2.emit("test","test").then((results)=>{
      expect(results).toEqual([]);
      return e2.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll useBeforeAll");
    });


    e3.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a3.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e3.useAfter("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a3.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e3.useAfter("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll useAfter");
      return new Promise((resolve,reject)=>{
        a3.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e3.emit("test","test").then((results)=>{
      expect(results).toEqual([]);
      return e3.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll");
    });


    e4.useBeforeAll('test',(data,event)=>{
      return new Promise((resolve,reject)=>{
        a4.push("useBeforeAll");
        resolve(data+" useBeforeAll");
      });
    });
    e4.useAfter("test",(data,event)=>{
      expect(data).toEqual("test useBeforeAll");
      return new Promise((resolve,reject)=>{
        a4.push("useAfter")
        resolve(data+" useAfter");
      });
    });
    e4.useAfterAll("test",(data,event)=>{
      if(event.type=="cascade"){
        expect(data).toEqual("test useBeforeAll");
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve(data+" useAfterAll");
        });
      }else{
        expect(data).toEqual([]);
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve([]);
        });
      }
    });
    e4.useAfterAll("test",(data,event)=>{
      if(event.type=="cascade"){
        expect(data).toEqual("test useBeforeAll useAfterAll");
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve(data+" useAfterAll");
        });
      }else{
        expect(data).toEqual([]);
        return new Promise((resolve,reject)=>{
          a4.push("useAfterAll")
          resolve([]);
        });
      }
    });
    e4.emit("test","test").then((results)=>{
      expect(results).toEqual([]);
      return e4.cascade("test","test");
    }).then((result)=>{
      expect(result).toEqual("test useBeforeAll useAfterAll useAfterAll");
    });


    promiseLoop(50,()=>{
      setTimeout(()=>{
          expect(a1).toEqual(["useBeforeAll","useBeforeAll"]);
          expect(a2).toEqual(["useBeforeAll","useBeforeAll","useBeforeAll","useBeforeAll"]);
          expect(a3).toEqual(["useBeforeAll","useBeforeAll"]);
          expect(a4).toEqual([
            'useBeforeAll','useAfterAll','useAfterAll',//emit
            'useBeforeAll','useAfterAll','useAfterAll'//cascade
          ]);
          done();
      },100); // don't know why - something with bluebird
    });
  });

  it("should execute useBeforeAll inside namespace",(done)=>{
    let e=Eventor(),a=[];
    e.useBeforeAll("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("useBeforeAll");
        resolve("useBeforeAll");
      });
    });
    e.useBefore("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("useBefore");
        resolve("useBefore");
      });
    });
    e.on("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("on");
        resolve("on");
      });
    });
    e.on("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("on");
        resolve("on");
      });
    });
    e.useAfter("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("useAfter");
        resolve("useAfter");
      });
    });
    e.useAfterAll("namespace","test",(data,event)=>{
      return new Promise((resolve)=>{
        a.push("useAfterAll");
        if(event.type=="emit"){
          resolve(data.map((item)=>"useAfterAll"));
        }else{
          resolve("useAfterAll");
        }
      });
    });

    e.emit("namespace","test","go").then((results)=>{
      expect(results).toEqual(["useAfterAll","useAfterAll"]);
      expect(a).toEqual([
        "useBeforeAll",
        "useBefore","useBefore","on","on","useAfter","useAfter",
        "useAfterAll"
      ]);
      a=[];
      return e.emit("test","go");
    }).then((results)=>{
      expect(results).toEqual(["useAfterAll","useAfterAll"]);
      expect(a).toEqual([
        "useBeforeAll",
        "useBefore","useBefore","on","on","useAfter","useAfter",
        "useAfterAll"
      ]);
      a=[];
      return e.cascade("namespace","test","go");
    }).then((result)=>{
      expect(result).toEqual("useAfterAll");
      expect(a).toEqual([
        "useBeforeAll",
        "useBefore","on","useAfter",
        "useBefore","on","useAfter",
        "useAfterAll"
      ]);
      a=[];
      return e.cascade("test","go");
    }).then((result)=>{
      expect(result).toEqual("useAfterAll");
      expect(a).toEqual([
        "useBeforeAll",
        "useBefore","on","useAfter",
        "useBefore","on","useAfter",
        "useAfterAll"
      ]);
      done();
    });
  });

});
