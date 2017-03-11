# eventorjs
async event emitter on steroids with
- emit (`Promise.all`)
- cascade (waterfall = output of one listener is passed as input for the next one),
- middlewares (useBefore, useAfter and useBeforeAll,useAfterAll)
- before and after events to easly create events before some action and after it
- event namespaces (event grouping,removing & executing specified group only)
- wildcards & express-like path params & regexp ("user.\*" = user.created user.destroyed, "/user/:id/created")
- timeouts
- prepend

`eventorjs` was build for loosely coupled inter-module communication and for hooks system, but can be used for other purposes as well, just like normal event emitter with extra features.

Eventor was created to make your code more reusable.
Eventor gives you super easy way of build apps/modules that are easly extendable with no need to change original code. You can write a module, and then write another module that will extend (loosely) the first one, without touching the code of the first one. You will have two modules that you can copy elsewhere and copy only those functions (submodules) that you need.
Eventor should be used as hooks that can be used to change behaviour of the module without changing the original code.
Eventor is also good way for creating micro-modules or functions which will be responsible for only one thing. Instead of building large customized module with different jobs running here and there - you can create one module for general use case and a lot of micro-modules that will extend (loosely) the main one. You will have ability to copy and paste or install those micro-modules in other projects. You will have a lot of benefits if you compose your system that way. With eventor your system will be more composeable.

For example you have built a nice user module, that you can copy and paste or install in other projects. Some day your client wants to add some custom feature to the user module. If you modify this module you loose ability to copy and paste it in other projects or to update it. With eventor you can save original module and use `eventor` to add new feature in other specialized micro-module that will be listening "user.create" event (for example) and add custom data before saving it to database (for example).
With eventor you can create micro modules - specialized modules that do only one thing and do it well.
All modules and submodules will be loosely coupled - if nobody listen, nothing will happen - you don't need to `require` the user module to extend it.


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

function doSomething(data,event){
  return new Promise((resolve,reject)=>{
    resolve("test1");
  });
}
eventor.on("test",doSomething);

// you can use promises as return value but it is not necessary
let event2id = eventor.on("test",(data,event)=>{
  return "test2";
});

eventor.emit("test",{someData:"someValue"}).then((results)=>{
  console.log(results); // -> ["test1","test2"]
});

let testEventListeners = eventor.listeners("test");

eventor.off(doSomething); // function
eventor.off(event2id); // or listener id


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

let module1Listeners = eventor.getListenersFromNamespace("module1");
//or
let module1TestListeners = eventor.listeners("module1","test");

let module2Listeners = eventor.getListenersFromNamespace("module2");
//or
let module2TestListeners = eventor.listeners("module2","test");

eventor.removeListenersFromNamespace("module1");

```


## Middlewares (useBefore, useAfter & useBeforeAll, useAfterAll)

Middlewares are fired before or after normal `on` listeners.
They can modify input before passing it to the listeners and output before result is returned to emitter.
The can be used for other things as well (for example prepare or remove something before and after some job).

"image is worth a thousand words"

### middleware diagram

EMIT:

![emit diagram](http://neuronet.it:8080/images/emit.jpg)

CASCADE:

![emit diagram](http://neuronet.it:8080/images/cascade.jpg)

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
**IMPORTANT** `useAfterAll` will have an array of results in `emit` mode and just result (value) in `cascade` mode.
To figure out blindly in wich mode you are you can use `event.type` parameter.

```javascript
eventor.useAfterAll("doSomething",(data,event)=>{

    if(event.type=="emit"){ // in emit mode input is an array

      data=data.map((item,index)=>{
        return "test "+index;
      }); // result of the emit process will be ["test 1","test 2","test 3",...]

    }else if(event.type=="cascade"){ // in cascade mode input is just value

      return "test";

    }// result of the cascade process will be just "test"

});
```

## timeouts

Default timeout is 60sec. but if you want other timetout then pass it to the options.
When timeout happened the `timeout` event is emited but no other action will be taken.
```javascript
let eventor = Eventor({timeout:500}); //500ms timeout

eventor.on("timeout",(data,event)=>{
  // do something with timeout
  console.log(data.arguments); // arguments from cascade or emit -> ["test","testData"]
  console.log(data.type); // -> "cascade"
  console.log(data.error); // -> instance of new Error("timeout"); to track source code
});

eventor.on("test",(data,event)=>{
  return new Promise((resolve)=>{
    setTimeout(()=>{
      resolve("yeahhh");
    },900);// more than 500 = timeout
  });
});

eventor.cascade("test","testData").then((result)=>{
  console.log(result); // -> yeahhh
}).catch((e)=>{
  // there will be no error at all - only 'timeout' event
});

```

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
},0); // <- 0 here

eventor.on("test",(data,event)=>{
  order.push("third");
},0); // <- 0 here

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
eventor.after.cascade("test","original"); // same as eventor.cascade("test","original")
```

## Wildcards
Wildcards are regular expression patterns. So if you want to execute one callback on multiple events - now you can.
Wildcars may be a string like `system.*.created` or `system.**` where one `*` replaces all characters in one level beetwen delimeters and `**` replaces all characters to the end of the eventName no matter which level.
Delimeter is a dot `.` by default. You can change it by passign delimeter option to the constructor to override it `let eventor = Eventor({ delimeter:':' });`. Delimeter should be just one special character.

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

You can use normal RegExp object as eventName too. All matches will be inside `event.matches` parameter.
```javascript
eventor.on(/user\.(.*)/gi,(data,event)=>{
  let matches = event.matches; // result from /user\.(.*)/gi.exec(eventName)
});
```

Eventor has built-in express-like route wildcard/params system so when you want to use some params - just add percent `%` sign at the beginning of the eventName like `%web-request:/user/:id/jobs` - of course `%` sign will be removed. You will have those "route" params inside `event.params` object. If there is a percent `%` character at the beginning of the event name - eventor will try to parse params inside those eventNames.

http://expressjs.com/en/guide/routing.html

```javascript
let eventor = Eventor();
eventor.on("%do-something:/with/:number",(data,event)=>{
  let nr = event.params.number;
});
eventor.emit("do-something:/with/10");

eventor.on("%/call/user/:id",(data,event)=>{
  let nr = event.params.id;
});
eventor.cascade("/call/user/10")

eventor.on("%system.:module.:action",(data,event)=>{
  console.log(event.params.module); // -> "user"
  console.log(event.params.action); // -> "create"
});
eventor.cascade("system.user.create")
```
You can test params here: http://forbeslindesay.github.io/express-route-tester/

Regular expression can be slow - sometimes veeeeeeryyy slow (slow as hell), so you must decide whenever use it or not in your specific case.
You have an ability to do so, but if you decide to not use it - it will not affect your performance.
For more information try to search something on this topic: **ReDoS**


## Error handling

All errors that lives inside listener will be handled by `error` event.


**IMPORTANT** errorObject inside `error` event will have an object with two keys :`error` and `event` so you can have more information about error and/or clean up something when error occurs inside some listener with `event.eventId`.

```javascript
eventor.on("error",(errorObject)=>{// test error will be emitted here
  let originalErrorThatWasThrown = errorObject.error;
  let event=errorObject.event;
  console.log(event.eventName); // -> test
  // now we can do something with event.eventId
  // or have more information about event
});

eventor.on("test",(data,event)=>{
  return new Promise((resolve,reject)=>{
    throw new Error("test error");
  });
});

eventor.emit("test",{value:"someData"})
.then((results)=>{
  // this code will not be executed
}).catch((error)=>{
  console.log(error.message); // -> "test error"
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
another example
```javascript
eventor.cascade("test","testData").then((result)=>{
  throw "plain error";
}).catch((e)=>{
  console.log(e); // -> "plain error";
});

eventor.cascade("test","testData").then((result)=>{
  throw {yeah:"plain error"};
}).catch((e)=>{
  console.log(e); // -> {yeah:"plain error"};
});
```

```javascript
eventor.cascade("test","testData").then((result)=>{
  throw new Error("error message");
}).catch((e)=>{
  if(e instanceof Error){
    console.log(e.message); // -> "error message";
  }else{
    console.log(e);
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
eventor.on("error",(errorObj,event)=>{
  throw "this error will be handled in errorEventsErrorHandler";
});
```
### How about other listeners?
When you have couple of listeners and there is an error inside one of them, other listeners can be executed or not - it depends.
When you `emit` an event, all listeners for this event will be executed no matter what, but when you `cascade` your event all later listeners will be stopped (look at the diagram above to see what and how promises are chained).
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
}).catch((error)=>{
  // all of the listeners were executed but we dont have a results because of error
});

eventor.cascade("test","someData").then((results)=>{
  // this code will not be executed
}).catch((error)=>{
  // only first and second listeners were executed
});
```

### What about middlewares?

If there was an exception inside `useBeforeAll` listener, no other listeners will be fired (`useBefore`,`on`,`useAfter`,`useAfterAll` will not be executed).


If there was an exception inside `useBefore` listener, `on` and `useAfter` will not be executed (they are chained).
Emit and Cascade work different - look at the diagram above to find out how listeners are chained together.
When we emit and there was an error inside one brach - other branches will continue to work, but useAfterAll will not be fired up because emit is using `Promise.all` method. In Cascade mode when something bad happened along the path no other listener will be fired up.

At the end .catch() method will execute for those two scenarios.


## event.eventId
Each event have an unique id called `eventId`.
`eventId` is a combination of timestamp, random generated numbers using `crypto`(nodejs) or `window.crypto` (browser), machine \ browser id ,and local number that is increased each generation process. If you want other unique id generation method, just start eventor with `unique` option like `Eventor({unique:yourUniqueIdGeneratorFunc})` and your function will be used instead of default one.
Why? For example for cleaning up things. Let say you doesn't have a transactions in your db.
When you emit an event and there was an error during execution in some listener, you can rollback your database inserts (when you save eventId along with your data).
You can clean up memory or realease some 'things' after an error event to prevent memory leaks.
You can use `eventId` for logging purposes as well. You can use it if you want to store some data that can be used between listeners and remove this data after event was finished or some error occurs.

Example of storing data between listeners for individual events.
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

}).catch((error)=>{
  // error here is just object that was thrown  - (new Error("for example"))
  // we doesn't have an eventId here so we must clean up thing on 'error' event
});
```
