const rcr = require("../recaptcha");

function TokenData(_rcr, host){
  //this.rcr = _rcr;
  this.isHost = host;
  this.roomId = host && rcr.toRoomId(_rcr);
  this.hostToken = host && rcr.toHostToken(_rcr);
  this.clientToken = (!host) && rcr.toClientToken(_rcr);
  this.creationTime = performance.now();
}

module.exports = TokenData;