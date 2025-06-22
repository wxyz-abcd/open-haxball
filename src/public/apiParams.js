var apiParams1 = {
  setTimeout: window.setTimeout,
  clearTimeout: window.clearTimeout,
  setInterval: window.setInterval,
  clearInterval: window.clearInterval,
  console: window.console,
  requestAnimationFrame: window.requestAnimationFrame,
  cancelAnimationFrame: window.cancelAnimationFrame,
  RTCPeerConnection: window.RTCPeerConnection, 
  RTCIceCandidate: window.RTCIceCandidate, 
  RTCSessionDescription: window.RTCSessionDescription, 
  crypto: window.crypto,
  WebSocket: window.WebSocket,
  XMLHttpRequest: window.XMLHttpRequest,
  performance: window.performance,
  JSON5: window.JSON5,
  pako: window.pako
};
var apiParams2_original = {
  /*
  proxy: {
    WebSocketChangeOriginAllowed: false,
  },
  */
  backend: {
    hostname: "www.haxball.com",
    hostnameWs: "p2p.haxball.com",
    secure: true
  }
};
var apiParams2_local = {
  /*
  proxy: {
    WebSocketChangeOriginAllowed: false,
    WebSocketUrl: "ws://localhost:3000/",
    HttpUrl: "http://localhost:3000/rs/"
  },
  */
  backend: {
    hostname: "localhost:3000",
    hostnameWs: "localhost:3000",
    secure: false
  }
};