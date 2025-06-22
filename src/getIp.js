const { serverIp } = require("./consts");
const requestIp = require("request-ip");

function getIp(req){
  var clientIp = requestIp.getClientIp(req);
  if (clientIp.match(/(127.0.0.1)|(::1)|(::ffff:127.0.0.1)/))
    clientIp = serverIp;
  return clientIp;
}

module.exports = getIp;
