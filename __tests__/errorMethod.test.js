const Eventor = require("../");

describe("error method",()=>{

  it("should emit an error",async (done)=>{

    let eventor = Eventor();
    let errors = [];
    let events = [];

    eventor.on("error",({error,event})=>{
      errors.push(error);
      if(typeof event!="undefined")
      events.push(event);
    });

    let emittedErrors = [
      new Error("this is error"),
      "this is error too",
      5
    ];

    await eventor.error(emittedErrors[0]);
    await eventor.error(emittedErrors[1]);
    await eventor.error(emittedErrors[2]);

    expect(errors[0]).toEqual(emittedErrors[0]);
    expect(errors[1]).toEqual(emittedErrors[1]);
    expect(errors[2]).toEqual(emittedErrors[2]);

    errors=[];
    await eventor.error("yeah","this is event");
    expect(errors).toEqual(["yeah"]);
    expect(events).toEqual(["this is event"]);

    done();
  });

});
