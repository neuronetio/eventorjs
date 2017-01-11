# eventorjs
async event emitter on steroids with
- cascade (waterfall = output of one listener is passed as input for the next one),
- middleware callbacks (useBefore, useAfter and useAfterAll middlewares)
- before and after events to easly create events before some action and after
- event namespaces (event grouping,removing-executing specified group only)
- wildcards (user.\* = user.creaded user.destroyed etc) and regexp patterns

## nodejs usage
```
npm install --save eventorjs
```
```javascript
const Eventor = require("eventorjs");
const eventor = Eventor();
```
## browser usage
```html
<script src="http://yourwebsite/js/eventor.min.js"></script>
```
```javascript
const eventor = Eventor();
```

## emit

```javascript
let eventor = Eventor();

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


## Middlewares (useBefore, useAfter & useAfterAll)

"image is worth a thousand words"

```
EMIT:                                             CASCADE:
                useBefore #1                               useBefore #1
                     |                                          |
                     V                                          V
                useBefore #2                               useBefore #2
                     |                                          |
                     V                                          V
                useBefore #3                               useBefore #3
                     |                                          |
                     V                                          V
    ------------------------------------                      on #4
    |                |                 |                        |
   on #4           on #5              on #6                     V
    |                |                 |                      on #5
    V                |                 |                        |
useAfter #7          |                 V                        |
    |                V            useAfter #7                   |
    V           useAfter #7            |                        V
useAfter #8          |                 V                       on #6
    |                V            useAfter #8                   |
    |           useAfter #8            |                        |
    |                |                 |                        V
    V                V                 V                  useAfter #7
    ------------------------------------                        |
  [ result    ,    result    ,    result ]                      V
                     |                                    useAfter #8
   (array of results as input to afterAll)                      |
                     |                                          V
                     V                                    useAfterAll #9
              useAfterAll #9                                    |
                     |                                          V
                     V                                    useAfterAll #10
              useAfterAll #10                                   |
                     |                                          V
                     V                                       .then(...)
                 .then(...)
```

`useBefore`,`useAfter` and `useAfterAll` events are middlewares.
They run in waterfall/cascade way, so next is fired up when current one finish some work.
Before an normal event `on` is emitted `useBefore` callback is emitted first.
Result of the `useBefore` event is passed as input to the normal listeners.
`useAfter` event callback is fired immediately after each `on` listener has finished.
`useAfter` doesn't wait for all listeners - it is executed with each listener individually.
`useAfterAll` is fired after all `useAfter` listeners like `Promise.all`.


`useAfter` and `useAfterAll` work different in `emit` context (in the context of `cascade` they bahave same way).
When `emit` is fired, result of the whole emitting process is an array of results returned one by one from listeners.
`useAfter` event is applied to each of the result in array immediately after individual listener has finished.
`useAfterAll` is emitted after last `useAfter` event is resolved and as input can have an array of results from listeners(`emit`) or just last value (`cascade`).
To determine wich kind of result we have, we can use `event` object from callback (second argument) which containt `type` of event.
It can be `cascade`- one value or `emit`-array of values.
`useAfterAll` can modify array of results given from listeners (add,change or remove result).

### be carefull with cascade!

`emit` run `on` listeners simultaneously and `cascade` is waiting for each listener to go further so when you have ten `on` listeners
which need 1 second to do their job, when you `emit` an event the total work time will be just one second,
but when you `cascade` an event the total time will be 10 seconds so be aware of it!


`useBefore`,`useAfter` and `useAfterAll` middlewares are cascaded like normal middlewares so be carefull to not put
too much heavy operations (time consuming) in this context (if this is important), because second one is starting
after the first one has finished, so if you have some requests or heavy duty operations this may take a while to complete the sequence.
But this is normal behaviour- middlewares in `express` or other frameworks works same way, so you always must be carefull and know
exactly what you are doing. In `eventor` you have more control over how things works and how you want to make things happen.


For example we can prepare some data before normal event is fired like db connection.
```javascript
let eventor = new Eventor();

eventor.useBefore("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let db = connectToTheDatabase();
    data.db=db;
    resolve(data);
  });
});

eventor.useAfter("doSomething",(data,event)=>{
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
eventor.useAfterAll("doSomething",(data,event)=>{
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
You can use `useBefore` and `useAfter` to show and hide spinner (hourglass) in each component individualy.
You can listen some event and then do some request in each component (just for demonstration purpose)
In `useBefore` we will show an spinner and in `useAfter` we will remove it in each component when request return some data.
All components will work independently because `useAfter` will work with each listener independently too.
Only `useAfterAll` will wait untill all requests has finished. So it is quite usable.


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

## Eventor.before

There is ofter situations that you need to emit something and get results from listener before some action like db.write.
For this purpose you have built in Eventor.before emitter so you doesn't need to make ugly events like `user.create:before`.
With `Eventor.before` you can emit two events that are named same way but are separated.
```javascript
let eventor = Eventor();
eventor.before.cascade("user.create",userData).then((user)=>{
  db.write(user);
  return eventor.cascade("user.create",user);
});
```
So now you have clean event naming without weird things going on at the end of eventName.
`eventor.after.cascade` is the same as `eventor.cascade`. This is just helper so you can make an image in your mind where you are (before or after some action).
```javascript
let eventor = Eventor();
eventor.before.cascade("user.create",userData).then((user)=>{
  db.write(user);
  return eventor.after.cascade("user.create",user); // same as eventor.cascade
});
```
So for clarity you can use `eventor.before` & `eventor.after`
```javascript
eventor.before.emit("someAction",{});
doSomeAction()
eventor.after.emit("someAction",{});
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
