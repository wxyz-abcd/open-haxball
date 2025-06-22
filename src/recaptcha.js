const { rcrPrivateKey } = require("./consts");
const https = require("https");
const crypto = require("crypto");

function rcrToHostToken(response){
  var str = crypto.createHash("SHA256").update(response).digest("base64url");
  return "thr1."+str.substring(0, 27)+"."+str.substring(27);
}

function rcrToRoomId(response){
  return crypto.createHash("SHAKE128").update(response).digest("base64url");
}

function rcrToClientToken(response){
  var str = crypto.createHash("SHAKE256").update(response).digest("base64url");
  return "tcr1."+str.substring(0, 27)+"."+str.substring(27);
}

function httpsPost({body, ...options}) {
  return new Promise((resolve,reject) => {
    const req = https.request({
      method: "POST",
      ...options,
    }, res => {
      const chunks = [];
      res.on("data", data => chunks.push(data));
      res.on("end", () => {
        let resBody = Buffer.concat(chunks);
        if (res.headers["content-type"].includes("application/json"))
          resBody = JSON.parse(resBody);
        resolve(resBody);
      });
    })
    req.on("error", reject);
    if (body)
      req.write(body);
    req.end();
  })
}

function rcrValidate(rcr, onSuccess, onError){
  httpsPost({
    hostname: "google.com",
    path: "/recaptcha/api/siteverify?secret="+rcrPrivateKey+"&response="+rcr,
  }).then((x)=>{
    if (x.success)
      onSuccess(x);
    else
      onError(x);
  }, (err)=>{
    onError(err);
  });
}

module.exports = {
  toHostToken: rcrToHostToken,
  toClientToken: rcrToClientToken,
  toRoomId: rcrToRoomId,
  validate: rcrValidate
};
