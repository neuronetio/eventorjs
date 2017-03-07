# eventorjs (experimental - may change)
async event emitter on steroids with
- cascade (waterfall = output of one listener is passed as input for the next one),
- middlewares (useBefore, useAfter and useBeforeAll,useAfterAll)
- before and after events to easly create events before some action and after it
- event namespaces (event grouping,removing & executing specified group only)
- wildcards (user.\* = user.created user.destroyed etc) and regexp patterns

`eventorjs` was build for loosely coupled inter-module communication as a hooks system, but can be used for other purposes as well, just like normal event emitter with extra features.

## nodejs usage
```
npm install --save eventorjs
```
```javascript
const Eventor = require("eventorjs");
const eventor = Eventor();
// or just
const eventor = require("eventorjs")();
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

eventor.emit("test",{someData:"someValue"})
.then((results)=>{
    console.log(results); // -> ["test1","test2"]
});
eventor.removeListener(event1); // same as eventor.removeListener(event1);
let allTestEvents = eventor.listeners("test"); // only second event object
```

## cascade
Cascade is when output of one listener is passed as input to the next one.
```javascript
let eventor = new Eventor();

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve(data+2);
  });
});

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve(data+3);
  });
});

eventor.cascade("test",5)
.then((result)=>{
    console.log(result); // -> 10
});
```

### Cascade is a sequence

`emit` run `on` listeners simultaneously but `cascade` is waiting for each listener to finish - to go further.
So when you have ten `on` listeners which need 1 second to do their job,
when you `emit` an event, the total work time will be just one second,
but when you `cascade` an event, the total time will be 10 seconds so be aware of it


## promises
Eventor is based on promises. You can choose your A+ implementation of promises like bluebird.
We are recommending bluebird, because it is the **fastest one**, and have a lot of features.
If you need native Promise in your project just do nothing.
```javascript
const bluebird = require("bluebird");
let eventor = Eventor({promise:bluebird});
```
or
```javascript
const Promise = require("bluebird");
let eventor = Eventor({promise:Promise});
```

## namespace
```javascript
let eventor = new Eventor();

eventor.on("module1","test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve(data+"-module1");
  });
});

eventor.on("module2","test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve(data+"-module2");
  });
});


eventor.cascade("module1","test","someData")
.then((result)=>{
    console.log(result); // -> "someData-module1"
});

eventor.cascade("module2","test","someData")
.then((result)=>{
    console.log(result); // -> "someData-module2"
});

eventor.emit("module2","test","someData")
.then((results)=>{
  console.log(results); // -> ["someData-module2"]
});

let module1Listeners = eventor.getNameSpaceListeners("module1");
//or
let module1TestListeners = eventor.listeners("module1","test");

let module2Listeners = eventor.getNameSpaceListeners("module2");
//or
let module2TestListeners = eventor.listeners("module2","test");

eventor.removeNameSpaceListeners("module1");

```


## Middlewares (useBefore, useAfter & useBeforeAll, useAfterAll)

Middlewares are fired before or after normal `on` listeners.
They can modify input before passing it to the listeners and output before result is returned to emitter.
The can be used for other things as well (for example prepare or remove something before and after some job).

"image is worth a thousand words"

### middleware diagram

TODO: put image here

### middleware example
For example we can prepare some data before normal event is fired like db connection.
(It is not really cool way to play with db connections, but for demonstration purpose we can do this)
```javascript
let eventor = new Eventor();

eventor.useBeforeAll("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    let db = connectToTheDatabase();
    data.db = db;
    resolve(data);
  });
});

eventor.on("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    data.result = data.db("read from database");
    resolve(data);
  });
});

eventor.useAfterAll("doSomething",(data,event)=>{
  return new Promise((resolve,reject)=>{
    delete data.db;
    resolve(data);
  });
});

eventor.cascade("doSomething",{}).then((result)=>{
  console.log(result); // -> {result:databaseResult} without db connection
});
```

```javascript
eventor.useAfterAll("doSomething",(data,event)=>{

    if(event.type=="emit"){ // input is an array

      data=data.map((item,index)=>{
        return "test "+index;
      }); // result of the emit process will be ["test 1","test 2","test 3",...]

    }else if(event.type=="cascade"){ // input is a value

      return "test";

    }// result of the cascade process will be just "test"

});
```

Lets assume that we have three UI components.
You can use `useBefore` and `useAfter` to show and hide spinner (hourglass) in each component individualy before and after some time consuming job (like request or something).
You can listen some event and then do some request in each component (just for demonstration purpose)
In `useBefore` we will show an spinner and in `useAfter` we will hide it for each component, right after request will return some data.
All spinners will work independently because `useAfter` will work with each listener independently too.
Only `useAfterAll` will wait untill all requests has finished. So it can be quite usable.


## prepend

If you want to prepend listener to the beginning just add another argument `0` at the end of argument list. If you have multiple listeners that was prepended, then later declared will be the first one.

```javascript
let eventor=Eventor();

let order = [];

eventor.on("test",(data,event)=>{
  order.push("first");
});

eventor.on("test",(data,event)=>{
  order.push("second");
},0); // <- 0 add here

eventor.on("test",(data,event)=>{
  order.push("third");
},0); // <- 0 add here

eventor.cascade("test","data").then(()=>{
  console.log(order); // -> ["third","second","first"]
});
```

```javascript
let eventor=Eventor();

let order = [];

eventor.on("namespace","test",(data,event)=>{
  order.push("first");
});

eventor.on("namespace","test",(data,event)=>{
  order.push("second");
},0); // <- 0 add here

eventor.on("namespace","test",(data,event)=>{
  order.push("third");
});

eventor.on("namespace","test",(data,event)=>{
  order.push("fourth");
},0); // <- 0 add here

eventor.cascade("namespace","test","data").then(()=>{
  console.log(order); // -> ["fourth","second","first","third"]
});
```

## Eventor.before & Eventor.after

There are often situations that you need to emit something and get results from listeners before some action (for example db.write).
For this purpose you have built in `Eventor.before` emitter so you don't need to make ugly event names like `user.create:before`.
With `Eventor.before` you can emit two events that are named same way but are separated.
```javascript
let eventor = Eventor();
eventor.before.on("user.create",(userData,event)=>{
  userData.phone="911"; // you can modify some data before db.write
  return userData;
});
eventor.after.on("user.create",(userData,event)=>{
  //user was saved in the database so we can do some action after that
  return userData;
});
eventor.before.cascade("user.create",userData)
.then((user)=>{
  // now we have modified data
  db.write(user);
  return eventor.cascade("user.create",user);// same as eventor.after.cascade
});
```
So now you have clean event naming without weird things going on at the end of the eventName.
`eventor.after.cascade` is the same as `eventor.cascade`. This is just helper so you can make an image in your mind where you are (before or after some action).
```javascript
let eventor = Eventor();
eventor.before.cascade("user.create",userData)
.then((user)=>{
  db.write(user);
  return eventor.after.cascade("user.create",user); // same as eventor.cascade
});
```
So for clarity, you can use `eventor.before` & `eventor.after` like
```javascript
eventor.before.emit("someAction",{});
doSomeAction()
eventor.after.emit("someAction",{});
```
Both `eventor.before.*` and `eventor.after.*` are separated, so you can add different middlewares to both emitters.
```javascript
eventor.before.useBefore(...)
eventor.after.useBefore(...) // same as eventor.useBefore
```
So when you want to add a middleware to `eventor.before.*` and to `eventor.after.*` you must add two middlewares becasue they are different emitters/listeners.
```javascript
function myMiddleware(data,event){
  return "modified";
}
eventor.useBefore("test",myMiddleware);
eventor.before.on("test",(data,event)=>{
  console.log(data); // -> "original"
  return "onTest";
});
eventor.on("test",(data,event)=>{
  console.log(data); // -> "modified"
  return "onTest";
});
eventor.after.on("test",(data,event)=>{
  console.log(data); // -> "modified"
  return "onTest";
});
eventor.before.cascade("test","original");
eventor.cascade("test","original");
```

## Wildcards
Wildcards are regular expression patterns. So if you want to execute one callback on multiple events - now you can.
Wildcars may be a string like `system.*.created` or `system.**` where one `*` replaces all characters in one level beetwen delimeters and `**` replaces all characters to the end of the eventName no matter which level.
Delimeter is a dot `.` by default. You can change it by passign delimeter option to the constructor to override it `let eventor = Eventor({ delimeter:':' });`. Delimeter should be just one special character.
You can use normal RegExp object as eventName too.

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
Regular expression can be slow - sometimes veeeeeeryyy slow (slow as hell), so you must decide whenever use it or not in your specific case.
You have an ability to do so, but if you decide to not use it - it will not affect your performance.
For more information try to search something on this topic: **ReDoS**


## Error handling

All errors that lives inside listener will be handled by `error` event.

```javascript
eventor.on("error",(error)=>{// test error will be emitted here
  // do something with error - log or write to file... you name it
});

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    throw "test error";
  });
});

eventor.emit("test",{value:"someData"})
.then((results)=>{
  // this code will not be executed
}).catch((errorObj)=>{
  // errorObj.error === "test error"
});

```
**IMPORTANT** catch method contains custom error object - not original that was thrown!
Custom error object contains original `error` and `event` object.
```javascript
eventor.emit("test","someValue")
.then(()=>{})
.catch((errorObj)=>{
  let originalErrorThatWasThrown = errorObj.error;
  let event=errorObj.event;
  // now we can do something with event.eventId
  // or have more information about event
});
```

All type of errors inside listener will be handled - even promise `reject`.

```javascript
eventor.on("test",(data,event)=>{
  throw "test error"; // will be handled
  return new Promise((resolve,reject)=>{
    resolve("will not be resolved");
  });
});
```
```javascript
eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    reject("will be handled"); // yes it will be handled by 'error' event
  });
});
```
but in javascript all errors that was thrown after `resolve` are silenced so will not be handled
```javascript
eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    resolve("will resolve normally");
    throw "oh no!"; // this error will be silenced and not handled by 'error' event
  });
});
```
Errors that will be thrown after `cascade` or `emit` will not have error object.
```javascript
eventor.cascade("test","testData").then((result)=>{
  throw "plain error";
}).catch((e)=>{
  console.log(e); // -> "plain error";
})
```
so you should check what kind of error you will get
```javascript
eventor.cascade("test","testData").then((result)=>{
  throw new Error();
}).catch((e)=>{
  if(e instanceof Error){
    console.log(e.message); // -> "plain error";
  }else{
    console.log(e.error.message);
  }
})
```

You can even catch errors that are inside `error` event listener :O with `errorEventsErrorHandler` option.
If you have an error inside `error` event listener you can handle it too.
For example when you handle your app erros and want to save your errors to a log file, but disk is full or there is a problem with permissions - you can catch this errors too.
```javascript
function errorEventsErrorHandler(error){
  // handle 'error' event errors :O
}
let eventor = Eventor({errorEventsErrorHandler});
eventor.on("error",(error,event)=>{
  throw "this error will be handled in errorEventsErrorHandler";
});
```
### How about other listeners?
When you have couple of listeners and there is an error inside one of them, other listeners can be executed or not - it depends.
When you `emit` an event, all listeners for this event will be executed no matter what, but when you `cascade` your event all later listeners will be stopped.
```javascript
eventor.on("test",(data,event)=>{
  return "test01";
});
eventor.on("test",(data,event)=>{
  throw "test error";
});
eventor.on("test",(data,event)=>{
  return "test03";
});
eventor.on("test",(data,event)=>{
  return "test04";
});

eventor.emit("test","someData").then((results)=>{
  // this code will not be executed
}).catch((errorObj)=>{
  // all of the listeners were executed but we dont have a results because of error
});

eventor.cascade("test","someData").then((results)=>{
  // this code will not be executed
}).catch((errorObj)=>{
  // only first and second listeners were executed
});
```

### What about middlewares?

If there was an exception inside `useBefore` listener, no other listeners will be fired (`on`,`useAfter`,`useAfterAll` will not be executed).


If there was an exception inside `on` listener, `useBefore` will be executed.
Again `on` listeners works different in context of `emit` or `cascade`.
In `emit` context `useAfter` will be executed for those `emit` listeners that works correctly.
`useAfter` will not be fired for listener that throw some exception.
`useAfterAll` will not be fired at all.
In `cascade` context, after exception all other `on`,`useAfter` and `useAfterAll` listeners will be stopped.
In `cascade` things are straight forward, when something bad happened all other listeners and middlewares will not be executed.

TODO: put image here

At the end .catch() method will execute for all of those different scenarios.

### Why so serious?

Why error behaviour is so shitty? Why so complex? - "With great power, comes great responsibility" ;)
Most of the times you don't need to bother with this. But I needed a lib that will be elastic so I can use it in different situations. You don't want to change your library and refactor everything when you hit the wall? Dont you? Emit and cascade are different way of doing things, but sometimes you need both. If we want to have similar methods for both scenarios we must sacrifice it somewhere else.

Eventor gives you super easy way of build apps/modules that are easly extended with no need to change original code. You can write a module, and then write another module that is extending (loosely) the first one, without touching the code of the first one. You will have to modules that you can copy elsewhere and copy only those functions (submodules) that you need.
Eventor should be used as hooks that can be used to change behaviour of the module without changing the original code.


## event.eventId
Each event have an unique id called `eventId`.
`eventId` is a combination of Date.now().toString(16) , random generated numbers using `crypto`(nodejs) or `window.crypto` (browser), machine \ browser id ,and local number that is increased each generation process. If you want other unique id generation method, just start eventor with `unique` option like `Eventor({unique:yourUniqueIdGeneratorFunc})` and your function will be used instead of default one.
Why? For example for cleaning up things. Let say you doesn't have a transactions in your db.
When you emit an event and there was an error during execution in some listener, you can rollback your database inserts when you save eventId along with your data.
You can clean up memory or realease some 'things' after an error event to prevent memory leaks.
You can use `eventId` for logging purposes as well. You can use it if you want to store some data that can be used between listeners and remove this data after event was finished or ... You name it.

Storing data between listeners for events.
```javascript
let eventor = Eventor();
let sharedEventData = {};

eventor.useBeforeAll("test",(data,event)=>{
  let dbConnection = connectToTheDatabase(); //pseudo code ;)
  sharedEventData[event.eventId]=dbConnection;
});
eventor.on("test",(data,eventId)=>{
  let dbConnection = sharedEventData[event.eventId];
  // we have shared data withoud modifying "data" argument
});
eventor.useAfterAll("test",(data,event)=>{
  delete sharedEventData[event.eventId]; // cleaning up - we dont need any memory leak
});
eventor.on("error",(errorObj,event)=>{ // in case of error (useAfterAll will not be fired)
  if(typeof sharedEventData[errorObj.event.eventId]!="undefined"){
    delete sharedEventData[errorObj.event.eventId];
  }
});
eventor.emit("test",{}).then((results)=>{

}).catch((errorObj)=>{ // just for fun - we already deleted dbconnection inside "error" event
  if(typeof sharedEventData[errorObj.event.eventId]!="undefined"){
    delete sharedEventData[errorObj.event.eventId];
  }
});
```
