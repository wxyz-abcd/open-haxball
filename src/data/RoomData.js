const StreamWriter = require("./StreamWriter");

function ClientRoomData(version = 0, name = "", countryCode = "", latitude = 0, longitude = 0, password = false, maxPlayers = 8, players = 1){ // Fb
  this.version = version; // Id
  this.name = name; // w
  this.countryCode = countryCode; // ub
  this.latitude = latitude; // Ec
  this.longitude = longitude; // Gc
  this.password = password; // Ib
  this.maxPlayers = maxPlayers; // Xe
  this.players = players; // I
}

ClientRoomData.createFromStream = function(stream){ // ja
  var oldValue = stream.littleEndian;
  stream.littleEndian = true;
  var obj = new ClientRoomData(stream.readUint16(), stream.readString2(), stream.readString2(), stream.readFloat32(), stream.readFloat32(), stream.readUint8()!=0, stream.readUint8(), stream.readUint8());
  stream.littleEndian = oldValue;
  return obj;
};

function RoomData(id = null, clientRoomData = null, hostSocket = null){ // Wb
  this.id = id; // $
  this.clientData = clientRoomData; // vd
  this.recaptchaEnabled = false;
  this.lastUpdateTime = performance.now();
  this.hostSocket = hostSocket;
}

RoomData.prototype = {
  writeToStream: function(stream){ // ga
    stream.writeString3(this.id);
    var w = StreamWriter.create(10, true);
    w.writeUint16(this.clientData.version);
    w.writeString2(this.clientData.name);
    w.writeString2(this.clientData.countryCode);
    w.writeFloat32(this.clientData.latitude);
    w.writeFloat32(this.clientData.longitude);
    w.writeUint8(this.clientData.password?1:0);
    w.writeUint8(this.clientData.maxPlayers);
    w.writeUint8(this.clientData.players);
    var array = w.toUint8Array();
    stream.writeUint16(array.byteLength);
    stream.writeUint8Array(array);
  },
  sendToHost: function(data){
    this.hostSocket?.send(data);
  }
};

module.exports = {
  RoomData,
  ClientRoomData
};
