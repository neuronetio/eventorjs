const http = require('http');
let fs = require("fs");
let path = require("path");

let eventorFilename = path.resolve(__dirname+"/../../index.js");
let indexFIlename = path.resolve(__dirname+"/index.html");

let eventorFile = fs.readFileSync(eventorFilename,'utf-8');
let index = fs.readFileSync(indexFIlename,'utf-8');

const server = http.createServer((req, res) => {
  switch (req.url) {
    case '/eventor':
        res.end(eventorFile);
      break;
    default:
      res.end(index);
  }
});


server.listen(3000);
