const { defaultPort, rcrSiteKey } = require("./consts");
const url = require("url");
const express = require("express");
const ws = require("ws");
const rsApi = require("./rs_api");
const getIp = require("./getIp");
const app = express();
const port = process.env.PORT || defaultPort;

app.use(express.query());
app.use(express.urlencoded());

rsApi.init(app);

app.use("/", (request, response, next)=>{
  console.log(request.url);
  var str = request.url;
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

const wsServer = new ws.Server({ noServer: true });
const server = app.listen(port);
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    const clientIp = getIp(request);
    console.log(request.url, clientIp);
    socket.binaryType = "arraybuffer";
    const { pathname, query } = url.parse(request.url, true);
    switch (pathname){
      case "/host": {
        rsApi.handleHostWs(socket, clientIp, query.token);
        break;
      }
      case "/client": {
        rsApi.handleClientWs(socket, clientIp, query.id, query.token);
        break;
      }
    }
  });
});

console.log("Server is running on port:", port);
