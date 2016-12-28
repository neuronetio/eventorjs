# eventor
async event emitter on steroids with
- waterfall(cascade = output of one event is input for the next one),
- "-before" "-after" middleware callbacks
- event namespaces (event grouping)
- wildcards\* (user.\*)

## examples

### emit

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
:collision:

**Be careful with object references as input data!**

**Because emiting object will give a reference to it to all of the listeners!**

**See [here](#collision-object-references-as-event-input-data)**

:collision:

### waterfall / cascade

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

// same as eventor.cascade
eventor.waterfall("test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",two:"second",someData:"someValue"}
});
```

### namespace
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


eventor.waterfall("module1","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",someData:"someValue"}
});

eventor.waterfall("module2","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {two:"second",someData:"someValue"}
});

eventor.emit("module1","test",{someData:"someValue"}).then((results)=>{
  console.log(results); // -> [{two:"second",someData:"someValue"}]
});

let module1Listeners = eventor.getNameSpaceListeners("module1");
let module2Listeners = eventor.getNameSpaceListeners("module2");

eventor.removeNameSpaceListeners("module1");

// eventor.allListeners is now same as module2Listeners

```

### -before & -after (middleware)

Before and After events are middlewares ("eventName-before","eventName-after").
They run in waterfall/cascade way, so next is fired up when current one finish some work.
Before an normal event is emitted "-before" is emitted first.
Result of the "-before" event is passed as input to the normal listeners.
-after event is emmited after all normal events finished their work and can modify the result right before passing it back to emit/waterfall promise.

For example we can prepare some data before normal event is fired like db connection.
```javascript
let eventor = new Eventor();

eventor.on("doSomething-before",(data)=>{
  return new Promise((resolve,reject)=>{
    let db = connectToTheDatabase();
    data.db=db;
    resolve(data);
  });
});

eventor.on("doSomething-after",(data)=>{
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

### wildcards
```javascript
// work in progress
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
