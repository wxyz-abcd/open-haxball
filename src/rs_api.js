// version check missing
const { refreshRoomsIntervalMsec, roomRemovalThresholdMsec, version, hostname, secure, defaultPort, rcrSiteKey } = require("./consts");
const geoip = require("geoip-lite");
const pako = require("pako");
const { RoomData, ClientRoomData } = require("./data/RoomData");
const StreamReader = require("./data/StreamReader");
const StreamWriter = require("./data/StreamWriter");
const TokenData = require("./data/TokenData");
const rcr = require("./recaptcha");
const getIp = require("./getIp");
const tokens = [];
const rooms = [];
const clientSockets = new Map();
var lastRoomsData = null, clientIdCounter = 1; // clientIdCounter should never be 2000000000.

// **********************
// for testing purposes: 
// **********************

tokens.push({ "isHost": true, "roomId": "AUvPASnCRzCkc4EtC3GIEg", "hostToken": "thr1.QMzOsbPS9VwJ0b83VIEpABjlHtT.WlGkS9xhN0bgoMIM", "clientToken": false, "creationTime": 10649.647399902344 });
tokens.push({ "isHost": true, "roomId": "ZzZzZzZzZzZzZzZzZzZzZz", "hostToken": "thr1.ZzZzZzZzZzZzZzZzZzZzZzZzZzZ.zZzZzZzZzZzZzZzZ", "clientToken": false, "creationTime": 57124.246799843232 });
//for (var i=0;i<100;i++) rooms.push(new RoomData("123_abcd"+i, new ClientRoomData(version, "test_.._"+i, "tr", 40, 38.5, false, 12, 1)));

// **********************

function stringToUint8Array(str){
  return (new TextEncoder()).encode(str);
}

function updateLastRoomsData(){
  var currentTime = performance.now(), indicesToRemove = [], w = StreamWriter.create(10, false);
  w.writeUint8(0);
  rooms.forEach((room, idx)=>{
    if (currentTime-room.lastUpdateTime>roomRemovalThresholdMsec)
      indicesToRemove.unshift(idx);
    else
      room.writeToStream(w);
  });
  lastRoomsData = Buffer.from(w.toArrayBuffer());
  indicesToRemove.forEach((idx)=>{
    rooms.splice(idx, 1);
  });
}

setInterval(updateLastRoomsData, refreshRoomsIntervalMsec);
updateLastRoomsData();

function createToken(_rcr, isHost){
  var token = new TokenData(_rcr, isHost);
  tokens.push(token);
  return token;
}

function validateToken(_token, isHost){
  if (isHost)
    return tokens.filter((x)=>x.hostToken==_token)[0];
  else
    return tokens.filter((x)=>x.clientToken==_token)[0];
}

function sendTokenResponse(res, tokenObj, isHost, tokenRequired = true){
  var tkn = (!tokenRequired || tokenObj) ? (isHost ? tokenObj.hostToken : tokenObj.clientToken) : "";
  if (!tkn)
    tkn = "";
  res.send({
    error: null, 
    data: { 
      sitekey: rcrSiteKey,
      action: (!tokenRequired || tokenObj) ? "connect" : "recaptcha",
      url: (!tokenRequired || tokenObj) ? ((secure?"wss":"ws")+"://"+hostname+":"+defaultPort) : "", // ???
      token: tkn
    }
  });
}

function sendHeadlessTokenResponse(res, tokenObj){
  res.send("Token obtained: \""+tokenObj.hostToken+"\"");
}

function createZeroMessage(){ // never seriously used in client, but still send it.
  var writer = StreamWriter.create(10, true);
  writer.writeUint8(0);
  return writer.toArrayBuffer();
}

function createAnswerMessage(sdp, candidateArray){ // reader: Ph
  var writer = StreamWriter.create(512, false);
  writer.writeUint8(1);
  var writer2 = StreamWriter.create(512, false);
  writer2.writeString(sdp);
  writer2.writeJSON(candidateArray);
  writer.writeUint8Array(pako.deflateRaw(writer2.toUint8Array()));
  return writer.toArrayBuffer();
}

function createHostIceCandidateMessage(candidateInfo){ // reader: Ph
  var writer = StreamWriter.create(512, false);
  writer.writeUint8(4);
  var writer2 = StreamWriter.create(512, false);
  writer2.writeJSON(candidateInfo);
  writer.writeUint8Array(pako.deflateRaw(writer2.toUint8Array()));
  return writer.toArrayBuffer();
}

function createRoomLinkMessage(roomId){ // reader: No
  var writer = StreamWriter.create(10, true);
  writer.writeUint8(5);
  writer.writeUint8(roomId.length);
  writer.writeStringContents(roomId);
  return writer.toArrayBuffer();
}

function createTokenMessage(hostToken){ // reader: Qo
  var writer = StreamWriter.create(10, true);
  writer.writeUint8(6);
  writer.writeStringContents(hostToken);
  return writer.toArrayBuffer();
}

function createRoomUpdatedMessage(){ // never used in client, but still send it.
  var writer = StreamWriter.create(10, true);
  writer.writeUint8(8);
  return writer.toArrayBuffer();
}

function createJoinRoomMessage(clientId, ip, applyTimeoutToSendCandidate, candidateArray, sdp, version, password){ // reader: Oh
  var ipHex = stringToUint8Array(ip);
  var writer = StreamWriter.create(512, false);
  writer.writeUint8(1);
  writer.writeUint32(clientId);
  writer.writeUint8(ipHex.length);
  writer.writeUint8Array(ipHex);
  var writer2 = StreamWriter.create(512, false);
  writer2.writeUint8(applyTimeoutToSendCandidate?1:0); // (ak=2500(default=0) -> msec timeout to send a RTCIceCandidate )
  writer2.writeString(sdp);
  writer2.writeJSON(candidateArray); // g
  // room joining checks : Ro
  // custom function for reading version & password: Vj -> Oo
  writer2.writeUint16(version);
  writer2.writeNullableString(password);
  writer.writeUint8Array(pako.deflateRaw(writer2.toUint8Array()));
  return writer.toArrayBuffer();
}

function createClientIceCandidateMessage(clientId, candidateInfo){ // reader: Ph, Nh
  var writer = StreamWriter.create(512, false);
  writer.writeUint8(4);
  writer.writeUint32(clientId);
  var writer2 = StreamWriter.create(512, false);
  writer2.writeJSON(candidateInfo);
  writer.writeUint8Array(pako.deflateRaw(writer2.toUint8Array()));
  return writer.toArrayBuffer();
}

function HostPlayer(socket, ip, sessionDataPromise, token){
  var tokenData = validateToken(token, true), room = null;
  console.log(tokenData);
  //socket.on("open", ()=>{
  if (!tokenData){
    console.log("token data error");
    socket.close(1001);
    return;
  }
  sessionDataPromise?.then((data)=>{
    //socket.userData = data;
    if (!data || !socket)
      return;
    var w = StreamWriter.create(10000, false);
    w.writeUint8(111);
    w.writeUint32(2000000000);
    w.writeJSON(data);
    socket.send(w.toUint8Array(), { binary: true });
  })?.catch((ex)=>{
    console.log(ex);
  });
  //});

  socket.on("message", (data, binary) => {
    var reader = new StreamReader(new DataView(data), false);
    var b = reader.readUint8();
    switch(b){
      case 0:{ // error occurred
        var clientId = reader.readUint32();
        if (reader.offset==data.byteLength){
          // ????
          clientSockets.get(clientId)?.send(createZeroMessage());
          break;
        }
        var errorCode = reader.readUint16();
        var _socket = clientSockets.get(clientId);
        if (_socket){
          _socket.close(errorCode);
          clientSockets.delete(clientId);
        }
        console.log("error code received... clientId:"+clientId+", code:"+errorCode);
        /*
        switch(errorCode){
          case 4001:
            return "The room was closed.";
          case 4100:
            return "The room is full.";
          case 4101:
            return "Wrong password.";
          case 4102:
            return "You are banned from this room.";
          case 4103:
            return "Incompatible game version.";
          case 4104:
            // ????????????
          default:
            return "Connection closed (" + a + ")";
        }
        */
        break;
      }
      case 1:{
        var clientId = reader.readUint32();
        if (reader.offset==data.byteLength) // ???? localhost?
          break;

        var reader2 = new StreamReader(new DataView(pako.inflateRaw(reader.readUint8Array()).buffer), false);
        var sdp = reader2.readString();
        var candidateArray = reader2.readJSON();
        clientSockets.get(clientId)?.send(createAnswerMessage(sdp, candidateArray));



        /*
        console.log("------------join room----------------");
        console.log(clientId);
        console.log(sdp); // +
        console.log(candidateArray);
        console.log("-------------------------------------");
        */
        break;
      }
      case 4:{
        var clientId = reader.readUint32();
        var reader2 = new StreamReader(new DataView(pako.inflateRaw(reader.readUint8Array()).buffer), false);
        var candidateInfo = reader2.readJSON();
        // console.log("received candidate info:", candidateInfo);
        clientSockets.get(clientId)?.send(createHostIceCandidateMessage(candidateInfo));
        break;
      }
      case 7:{ // room data received
        try{
          var clientRoomData = ClientRoomData.createFromStream(reader);
          var _room = rooms.find((x)=>x.id==tokenData.roomId);
          if (_room){
            _room.clientData = clientRoomData;
            if (_room.hostSocket!=socket){
              _room.hostSocket?.close?.();
              _room.hostSocket = socket;
            }
          }
          else{
            _room = new RoomData(tokenData.roomId, clientRoomData, socket);
            rooms.push(_room);
          }
          room = _room;
          socket.send(createRoomLinkMessage(tokenData.roomId));
          socket.send(createTokenMessage(tokenData.hostToken));
        }catch(ex){
          console.log(ex);
        }
        return;
      }
      case 8:{ // room update
        if (!room)
          return;
        room.lastUpdateTime = performance.now();
        if (rooms.indexOf(room)<0)
          rooms.push(room);
        socket.send(createRoomUpdatedMessage()); // never used in client, but still send it.
        return;
      }
      case version:{ // room recaptcha mode changed [This does not look right; basro, my friend, this is just wrong!!!...]
        if (!room)
          return;
        room.recaptchaEnabled = (reader.readUint8()!=0);
        return;
      }
    }
    console.log("host socket message:", b, data, binary);
  });

  socket.on("error", (error) => {
    console.log("host socket error:", error);
  });

  socket.on("close", (code, reason) => {
    console.log("host socket closed:", code, reason);
    if (room){
      room.hostSocket = null;
      room = null;
    }
  });
}

function ClientPlayer(socket, ip, sessionDataPromise, id, token){
  var room = rooms.find((x)=>x.id==id);
  if (clientIdCounter==4294967296)
    clientIdCounter=1;
  else if (clientIdCounter==2000000000)
    clientIdCounter++;
  var clientId = clientIdCounter++;
  console.log("clientId: ", clientId);

  if (!room){
    console.log("room id error");
    socket.close(1001);
    return;
  }

  sessionDataPromise?.then((data)=>{
    if (!socket || !data/* || !room?.hostSocket?.userData*/)
      return;
    //socket.userData = data;
    var w = StreamWriter.create(10000, false);
    w.writeUint8(111);
    w.writeUint32(clientId);
    w.writeJSON(data);
    room.hostSocket.send(w.toUint8Array(), { binary: true });
  })?.catch((ex)=>{
    console.log(ex);
  });

  if (room.recaptchaEnabled){
    var tokenData = validateToken(token, false);
    if (!tokenData){
      console.log("token data error");
      socket.close(1001);
      return;
    }
  }

  clientSockets.set(clientId, socket);

  socket.on("message", (data, binary) => {
    var reader = new StreamReader(new DataView(data), false);
    var b = reader.readUint8();
    switch(b){
      case 0:{ // ???
        room.sendToHost(createZeroMessage());
        break;
      }
      case 1:{ // offer-answer
        var reader2 = new StreamReader(new DataView(pako.inflateRaw(reader.readUint8Array()).buffer), false);
        var applyTimeoutToSendCandidate = (reader2.readUint8()!=0); // ?
        var sdp = reader2.readString();
        var candidateArray = reader2.readJSON();
        var array = reader2.readUint8Array();
        var reader3 = new StreamReader(new DataView(array.buffer, array.byteOffset), false);
        var version = reader3.readUint16();
        var password = reader3.readNullableString();
        /*
        console.log("------------join room----------------");
        console.log(applyTimeoutToSendCandidate);
        console.log(sdp); // +
        console.log(candidateArray);
        console.log(version); // +
        console.log(password); // +
        console.log("-------------------------------------");
        */
        room.sendToHost(createJoinRoomMessage(clientId, ip, applyTimeoutToSendCandidate, candidateArray, sdp, version, password));
        break;
      }
      case 4:{ // icecandidate
        var reader2 = new StreamReader(new DataView(pako.inflateRaw(reader.readUint8Array()).buffer), false);
        var candidateInfo = reader2.readJSON();
        
        //console.log("received candidate info:", candidateInfo);

        room.sendToHost(createClientIceCandidateMessage(clientId, candidateInfo));
        break;
      }
    }
    console.log("client socket message:", b, data, binary);
    //socket.send(data, { binary });
  });

  socket.on("error", (error) => {
    clientSockets.delete(clientId);
    console.log("client socket error:", error);
  });

  socket.on("close", (code, reason) => {
    clientSockets.delete(clientId);
    console.log("client socket closed:", code, reason);
  });
}

module.exports = {
  handleHostWs: HostPlayer,
  handleClientWs: ClientPlayer,
  init: function(app){
    app.get("/rs/api/notice", (req, res)=>{
      res.status(200);
      res.send({
        "data":{
          "content": ""
        }
      });
    });

    app.get("/rs/api/geo", (req, res)=>{
      var geo = geoip.lookup(getIp(req));
      res.status(200);
      res.send({
        "data":{
          "code": geo.country,
          "lat": geo.ll[0],
          "lon": geo.ll[1]
        }
      });
    });

    app.get("/rs/api/list", (req, res)=>{
      res.status(200);
      res.send(lastRoomsData);
    });

    app.post("/rs/api/getheadlesstoken", (req, res)=>{
      var _rcr = req.body["g-recaptcha-response"];
      rcr.validate(_rcr, ()=>{
        sendHeadlessTokenResponse(res, createToken(_rcr, true));
      }, ()=>{
        res.sendStatus(404);
        res.end();
      });
    });
    
    app.post("/rs/api/host", (req, res)=>{
      var _rcr = req.body?.rcr, _token = req.body?.token;
      if (_rcr && _rcr.length>0){
        rcr.validate(_rcr, ()=>{
          sendTokenResponse(res, createToken(_rcr, true), true);
        }, ()=>{
          sendTokenResponse(res, null, true);
        });
        return;
      }
      else if (_token && _token.length>0){
        sendTokenResponse(res, validateToken(_token, true), true);
        return;
      }
      sendTokenResponse(res, null, true);
    });

    app.post("/rs/api/client", (req, res)=>{
      var roomId = req.body?.room, room = rooms.find((x)=>x.id==roomId), _rcr = req.body?.rcr, _token = req.body?.token;
      if (!room)
        return;
      if (_rcr && _rcr.length>0){
        rcr.validate(_rcr, ()=>{
          sendTokenResponse(res, createToken(_rcr, false), false, room.recaptchaEnabled);
        }, ()=>{
          sendTokenResponse(res, null, false, room.recaptchaEnabled);
        });
        return;
      }
      else if (_token && _token.length>0){
        sendTokenResponse(res, validateToken(_token, false), false, room.recaptchaEnabled);
        return;
      }
      sendTokenResponse(res, null, false, room.recaptchaEnabled);
    });

    app.get("/rs/api/tokens", (req, res)=>{
      res.send(tokens);
      res.end();
    });
  }
};