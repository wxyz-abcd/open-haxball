const { secure, defaultPort, rcrSiteKey } = require("./consts");
const http = require("http");
const https = require("https");
const url = require("url");
const express = require("express");
const fs = require("fs");
const ws = require("ws");
const rsApi = require("./rs_api");
const getIp = require("./getIp");
const app = express();

app.use(express.query());
app.use(express.urlencoded());

rsApi.init(app);

app.use("/", (request, response, next)=>{
  console.log(request.url);
  var str = request.url;
  if (str=="/")
    request.url = str = "/roomList.html";
  var i2 = str.length;
  var i1 = str.indexOf(".");
  if (i1>=0){
    i2 = str.indexOf("?");
    if (i2<0 || i2>i1 || str.substring(i1+1, i1+5)=="html")
      return next();
  }
  else{
    i1 = str.indexOf("?");
    if (i1>=0)
      i2 = i1;
  }
  request.url = str.substring(0,i2)+".html"+str.substring(i2);
  console.log("usage: ", request.url);
  next();
});
app.use("/", express.static(__dirname + "/public"));
app.get("/headlesstoken.html", (req, res)=>{
  res.status(200);
  res.send(`
<html>
  <head>
    <title>Headless Token</title>
    <script src="https://www.google.com/recaptcha/api.js" async defer></script>
  </head>
  <body>
    <h1>Obtain Headless Token</h1>
    <form action="rs/api/getheadlesstoken" method="POST">
      <div class="g-recaptcha" data-sitekey="`+rcrSiteKey+`"></div>
      <br/>
      <input type="submit" value="Submit">
    </form>
  </body>
</html>`);
});

function verifySession(identityToken){ // should return a promise that returns the user data for the given identity token. you should use the same identityToken while creating/joining a room with node-haxball.
  return new Promise((resolve, reject)=>{
    setTimeout(()=>{ // this timeout is just to simulate a database connection.
      resolve({id: 0, name: "abc"}); // you may return any kind of json data related to the user here.
    }, 50);
  });
}

const wsServer = new ws.Server({ noServer: true });
const server = secure ? https.createServer({
  key: fs.readFileSync("./key.pem", "utf8"),
  cert: fs.readFileSync("./cert.pem", "utf8")
}, app) : http.createServer(app);

server.on("upgrade", (request, socket, head)=>{
  wsServer.handleUpgrade(request, socket, head, (socket)=>{
    /*const data = request.headers["sec-websocket-protocol"];
    const sessionDataPromise = data && verifySession(Buffer.from(data,"hex").toString("utf8"));*/
    const sessionDataPromise = verifySession("");
    const clientIp = getIp(request);
    socket.binaryType = "arraybuffer";
    const { pathname, query } = url.parse(request.url, true);
    switch (pathname){
      case "/host": {
        rsApi.handleHostWs(socket, clientIp, sessionDataPromise, query.token);
        break;
      }
      case "/client": {
        rsApi.handleClientWs(socket, clientIp, sessionDataPromise, query.id, query.token);
        break;
      }
    }
  });
});

server.listen(defaultPort);

console.log("Server is running on port:", defaultPort);
