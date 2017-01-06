# eventor
async event emitter on steroids with
- waterfall(cascade = output of one event is input for the next one),
- middleware callbacks (before and after middlewares)
- event namespaces (event grouping)
- wildcards\* (user.\*) and regexp patterns

## emit

```javascript
let eventor = new Eventor();

let event1 = eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    resolve("test1");
  });
});

let event2 = eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    resolve("test2");
  });
});


eventor.emit("test",{someData:"someValue"}).then((results)=>{
    console.log(results); // -> ["test1","test2"]
});

eventor.off(event1); // same as eventor.removeListener(event1);

let allTestEvents = eventor.getListenersForEvent("test"); // only second event object (not id)
```


### :collision: Warning :collision:

**Be careful with object references as input data!**

**Because emiting object will give a reference to it to all of the listeners!**

**See [here](#collision-object-references-as-event-input-data)**





## cascade

```javascript
let eventor = new Eventor();

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);     // shallow copy to be sure that cascade works
    _data.one="first";                    // we are modyfing copy - not the original one from emitter
    resolve(_data);
  });
});

eventor.on("test",(data)=>{
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

eventor.on("module1","test",(data)=>{
  return new Promise((resolve,reject)=>{
    let _data=Object.assign({},data);
    _data.one="first";
    resolve(_data);
  });
});

eventor.on("module2","test",(data)=>{
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
let module2Listeners = eventor.getNameSpaceListeners("module2");

eventor.removeNameSpaceListeners("module1");

// eventor.listeners() is now same as module2Listeners

```


## before & after middlewares

Before and After events are middlewares.
They run in waterfall/cascade way, so next is fired up when current one finish some work.
Before an normal event is emitted before callback is emitted first.
Result of the before event is passed as input to the normal listeners.
After event callback is emmited after all normal events finished their work and can modify the result right before passing it back to emit/cascade promise.

For example we can prepare some data before normal event is fired like db connection.
```javascript
let eventor = new Eventor();

eventor.before("doSomething",(data)=>{
  return new Promise((resolve,reject)=>{
    let db = connectToTheDatabase();
    data.db=db;
    resolve(data);
  });
});

eventor.after("doSomething",(data)=>{
  return new Promise((resolve,reject)=>{
    delete data.db;
    resolve(data);
  });
});

eventor.on("doSomething",(data)=>{
  return new Promise((resolve,reject)=>{
    data.result = data.db("read from database");
    resolve(data);
  });
});


eventor.cascade("doSomething",{}).then((result)=>{
  console.log(result); // -> {result:databaseResult} without db connection
});
```


### :collision: Warning :collision:

**If `eventor.cascade` will emit an event `after` middleware as input will have an object (like in normal `cascade` method).**
**If `eventor.emit` will trigger an event then `after` middleware will have an array of results from listeners (like in normal `emit` method)**

```javascript
eventor.after("test",(data,event)=>{
  console.log(event.type); // -> "emit" or "cascade"
  console.log(data); // -> [{data:"data"},{data:"data"},...] result of the emit method is an array
});
eventor.emit("test",{data:"data"})
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
