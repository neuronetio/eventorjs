# eventor
async event emitter on steroids with
- cascade (waterfall = output of one listener is passed as input for the next one),
- middleware callbacks (before, after and afterAll middlewares)
- event namespaces (event grouping,removing-executing specified group only)
- wildcards (user.\* = user.creaded user.destroyed etc) and regexp patterns

## emit

```javascript
let eventor = new Eventor();

let event1 = eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve("test1");
  });
});

// you can use promises as return value but it is not necessary
let event2 = eventor.on("test",(data,event)=>{
  return "test2";
});


eventor.emit("test",{someData:"someValue"}).then((results)=>{
    console.log(results); // -> ["test1","test2"]
});

eventor.removeListener(event1); // same as eventor.removeListener(event1);

let allTestEvents = eventor.listeners("test"); // only second event object
```


## cascade

```javascript
let eventor = new Eventor();

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);     // shallow copy to be sure that cascade works
    _data.one="first";                    // we are modyfing copy - not the original one from emitter
    resolve(_data);
  });
});

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);
    _data.two="second";
    resolve(_data);
  });
});

eventor.cascade("test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",two:"second",someData:"someValue"}
});
```


## namespace
```javascript
let eventor = new Eventor();

eventor.on("module1","test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);
    _data.one="first";
    resolve(_data);
  });
});

eventor.on("module2","test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);
    _data.two="second";
    resolve(_data);
  });
});


eventor.cascade("module1","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",someData:"someValue"}
});

eventor.cascade("module2","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {two:"second",someData:"someValue"}
});

eventor.emit("module2","test",{someData:"someValue"}).then((results)=>{
  console.log(results); // -> [{two:"second",someData:"someValue"}]
});

let module1Listeners = eventor.getNameSpaceListeners("module1");
//or
let module1TestListeners = eventor.listeners("module1","test");

let module2Listeners = eventor.getNameSpaceListeners("module2");
//or
let module2TestListeners = eventor.listeners("module2","test");

eventor.removeNameSpaceListeners("module1");

```


## before, after & afterAll middlewares

"image is worth a thousand words"



`before`,`after` and `afterAll` events are middlewares.
They run in waterfall/cascade way, so next is fired up when current one finish some work.
Before an normal event `on` is emitted `before` callback is emitted first.
Result of the `before` event is passed as input to the normal listeners.
`after` event callback is emmited immediately after each `on` listener finished their work.
`after` doesn't wait for all listeners - it is executed with each listener individually.
`afterAll` is fired after all `after` listeners like `Promise.all`.
`after` and `afterAll` work different in `emit` context (in the context of `cascade` they bahave same way).
When `emit` is fired, result of the whole emitting process is an array of results returned one by one from listeners.
`after` event is applied to each of the result in array immediately after individual listener has finished.
`afterAll` is emitted after last(time) `after` event and as input can have an array of results from listeners(`emit`) or just last value (`cascade`).
To determine wich kind of result we have, we can use `event` object from callback (second argument) which containt `type` of event.
It can be `cascade`- one value or `emit`-array of values.
`afterAll` can modify array of results given from listeners (add,change or remove result).

For example we can prepare some data before normal event is fired like db connection.
```javascript
let eventor = new Eventor();

eventor.before("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let db = connectToTheDatabase();
    data.db=db;
    resolve(data);
  });
});

eventor.after("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    delete data.db;
    resolve(data);
  });
});

eventor.on("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    data.result = data.db("read from database");
    resolve(data);
  });
});

// this is only for demonstrating afterAll and not related with db
eventor.afterAll("doSomething",(data,event)=>{
    if(event.type=="emit"){
      data=data.map((item)=>{
        let _item=Object.assign({},item);
        _item.afterAllOfThis="weHaveAwinner";
        return _item;
      });
    }else if(event.type=="cascade"){
      let _data=Object.assign({},data);
      _data.afterAllOfThis="weHaveAwinner";
      data=_data;
    }
    return data;
});

eventor.cascade("doSomething",{}).then((result)=>{
  console.log(result); // -> {result:databaseResult,afterAllOfThis:"weHaveAwinner"} without db connection
});
```
Lets assume that we have three UI components.
Each component
You can use before and after to show and hide spinner (hourglass) in each component individualy.
```
```


## wildcards
Wildcards are regexp patterns. So if you want to execute one callback on multiple events - now you can.
Wildcars may be a string `system.*.created` or `system.**` where one `*` replaces all characters in one level beetwen delimeters and `**` replaces all characters to the end of eventName no matter which level.
Delimeter is a dot `.` by default. You can change it by passign delimeter option to the constructor to override it `let eventor = new Eventor({ delimeter:'::' });`
You can use normal RegExp object as eventName to match multiple events.

```javascript
let eventor = new Eventor();
eventor.on(/^test.*$/gi,()=>{}); // will match something like 'test','testing','testosteron' ...
eventor.on(/test/gi,()=>{}); // will match 'test'
eventor.on("te*",()=>{}); // will match 'te','test','testing','testosteron' ...
eventor.on("te**",()=>{}); // will match 'te','test','testing','testosteron' ...
eventor.on("test.*.next",()=>{}); // will match 'test.go.next','test.something.next','test.are.next' ...
eventor.on("test.**.next",()=>{}); // will match 'test.go.to.the.next','test.something.next','test.are.next' ...
eventor.on("test.**",()=>{}); // will match 'test.are.awe.some','test.something.next','test.are.good' ...
```

## :collision: Object references as event input data

If you pass a data as an object it will be object reference inside event listener.
So when you modify it you will be modifying original object.
If you want immutable data, you must do it by yourself.

```javascript
let eventor = new Eventor();

let originalObject = {
  test:"test of reference"
};

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.test2="this is an reference to the originalObject";
    resolve(data);
  });
});

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.test="changed item";
    resolve(data);
  });
});

eventor.emit("test",originalObject).then((results)=>{
  // results are now array of references to original object
  console.log(results); // -> [ originalObject, originalObject ]
  console.log(originalObject); // -> {test:"changed item",test2:"this is an reference to the originalObject"}
});
```
