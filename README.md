# open-haxball
A room-server backend that can host rooms and provide match-making for WebRTC clients. This backend currently only works as a https://www.haxball.com alternative, but in fact it can, and should, and possibly will, be generalized for use with ANY app/game.

# How to run
Just run `npm install`, and then `npm start`, and navigate in your browser by default to `localhost:3000/roomList.html`. 

- It uses the same folder structure of the `examples_web` folder of the `node-haxball` package. If you want detailed explanation, the readme is here: https://github.com/wxyz-abcd/node-haxball/tree/main/examples_web. In addition, we also have a `/headlesstoken.html` endpoint that can generate room tokens.

- `thr1.QMzOsbPS9VwJ0b83VIEpABjlHtT.WlGkS9xhN0bgoMIM` is a pre-generated room token inside the code to allow people to test creating a room easier. You should remove it in production builds.

# Features
This backend basically has all the features of haxball.com implemented as close to original as possible. Here are its features:

- GET `/rs/api/notice`: A notice that should be shown in the main website globally. (Haxball still does use it, but it always have empty contents.)
- GET `/rs/api/geo`: The geolocation of the requester's IP address that is obtained by looking up the geolocation database. (Both node-haxball and Haxball are still using this.)
- GET `/rs/api/list`: The current room list. (Both node-haxball and Haxball are still using this.)
- POST `/rs/api/getheadlesstoken (g-recaptcha-response)`: Generates a (create) room token from Google Recaptcha response. Used internally in `headlesstoken.html`.
- POST `/rs/api/host (rcr?, token?)`: Can generate a (create) room token from rcr(Google Recaptcha response), or validate a previously generated (create) room token. Used internally by node-haxball package and Haxball itself while creating a room. (Both node-haxball and Haxball are still using this.)
- POST `/rs/api/client (room?, rcr?, token?)`: Can generate a (join) room token from rcr(Google Recaptcha response), or validate a previously generated (join) room token. Used internally by node-haxball package and Haxball itself while joining a room. (Both node-haxball and Haxball are still using this.)
- GET `/rs/api/tokens`: The current list of all tokens in memory. (Not internally used, should be removed in production builds.)

# Notes
- This repo is using a pretty old version of node-haxball. It needs to be updated later. 
- Some parts of the code might be pretty outdated too.
- The token-generation algorithms are not the same as Haxball, so you cannot use these tokens on the Haxball website.
