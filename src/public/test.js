const API = abcHaxballAPI(window, {
  noVariableValueChangeEvent: true,
  /*
  backend: { // this is basro's current backend server
    hostname: "www.haxball.com",
    hostnameWs: "p2p.haxball.com",
    secure: true
  },
  proxy: { // this is my proxy server
    WebSocketChangeOriginAllowed: false,
    WebSocketUrl: "wss://node-haxball.glitch.me/",
    HttpUrl: "https://node-haxball.glitch.me/rs/"
  }
  */
  /*
  proxy: { // this is how i can use my own proxy server locally
    WebSocketChangeOriginAllowed: false,
    WebSocketUrl: "ws://localhost:3000/",
    HttpUrl: "http://localhost:3000/rs/"
  },
  */
  backend: { // this is how i can use my backend server locally
    hostname: window.location.host,
    hostnameWs: window.location.host,
    secure: window.location.protocol.indexOf("s")>0
  }
}); // if you use our haxballOriginModifier extension, you don't need a proxy server. (But you still have to serve the files, you cannot open the html directly.)

var { OperationType, VariableType, ConnectionState, AllowFlags, Callback, Utils, Room, Replay, Query, RoomConfig, /*Plugin,*/ Renderer, Impl } = API;
//Utils.getRoomList().then(console.log);
//Utils.getGeo().then(console.log);

/*
Utils.generateAuth().then(([authKey, authObj])=>{
  Room.join({
    id: "tqbzfGO4tkc",
    password: "aaaaa",
    authObj: authObj
  }, {
    storage: {
      player_name: "wxyz-abcd",
      avatar: "👽"
    }, 
    onSuccess: (room)=>{
      console.log("success:", room);
      //const { name } = room.getRoomData();
      //room.sendChat("Hello " + name);
    },
    onFailure: (error)=>{
      console.log("failure:", error);
    },
    onLeave: (msg)=>{
      console.log("leave:", msg);
    },
    onConnectionStateChange: (state)=>{
      console.log("state:", state);
    },
    onReverseConnection: ()=>{
      console.log("reverse");
    },
    onRequestRecaptcha: ()=>{
      console.log("recaptcha");
    }
  });
});
*/

var first = true;

Utils.generateAuth().then(([authKey, authObj])=>{
  Room.create({
    name: "testttttttttttt", 
    password: "!'^aaa123",
    showInRoomList: true, 
    maxPlayerCount: 8,
    //fakePassword: null,
    token: "thr1.QMzOsbPS9VwJ0b83VIEpABjlHtT.WlGkS9xhN0bgoMIM"
    //token: "thr1.AAAAAGP4rcrZXDVwlXqurw.SxS1_tJAteg"
  }, {
    storage: {
      player_name: "wxyz-abcd",
      avatar: "👽"
    }, 
    onSuccess: (room)=>{
      console.log("success:", room);
      //const { name } = room.getRoomData();
      //room.sendChat("Hello " + name);
      room.startGame();
      room.onAfterRoomLink = (roomLink)=>{
        console.log("room link:", roomLink);
        if (!first)
          return;
        console.log(room);
        first = false;
        var y=roomLink.indexOf("c="), z=roomLink.indexOf("&", y);
        var roomId = roomLink.substring(y+2, (z<0)?undefined:z);
        setTimeout(()=>{
          Room.join({
            id: roomId,
            password: "!'^aaa123",
            authObj: authObj
          }, {
            storage: {
              player_name: "aabbcc",
              avatar: "XX"
            }, 
            onSuccess: (room2)=>{
              console.log("success:", room2);
              //const { name } = room.getRoomData();
              //room.sendChat("Hello " + name);
              console.log(room2);
            },
            onFailure: (error)=>{
              console.log("failure:", error);
            },
            onLeave: (msg)=>{
              console.log("leave:", msg);
            },
            onConnectionStateChange: (state)=>{
              console.log("state:", state);
            },
            onReverseConnection: ()=>{
              console.log("reverse");
            },
            onRequestRecaptcha: ()=>{
              console.log("recaptcha");
            }
          });
        }, 5000);
      };
    },
    onFailure: (error)=>{
      console.log("failure:", error);
    },
    onLeave: (msg)=>{
      console.log("leave:", msg);
    },
    onConnectionStateChange: (state)=>{
      console.log("state:", state);
    },
    onReverseConnection: ()=>{
      console.log("reverse");
    },
    onRequestRecaptcha: ()=>{
      console.log("recaptcha");
    }
  });
});

/*
Room.create({
  name: "testttttttttttt", 
  password: "!'^aaa123", 
  showInRoomList: true, 
  maxPlayerCount: 8,
  //fakePassword: null,
  //token: "thr1.QMzOsbPS9VwJ0b83VIEpABjlHtT.WlGkS9xhN0bgoMIM"
  token: "thr1.AAAAAGP4rcrZXDVwlXqurw.SxS1_tJAteg"
}, {
  storage: {
    player_name: "wxyz-abcd",
    avatar: "👽"
  }, 
  onSuccess: (room)=>{
    console.log("success:", room);
    //const { name } = room.getRoomData();
    //room.sendChat("Hello " + name);
    room.onAfterRoomLink = (roomLink)=>{
      console.log("room link:", roomLink);
    };
  },
  onFailure: (error)=>{
    console.log("failure:", error);
  },
  onLeave: (msg)=>{
    console.log("leave:", msg);
  },
  onConnectionStateChange: (state)=>{
    console.log("state:", state);
  },
  onReverseConnection: ()=>{
    console.log("reverse");
  },
  onRequestRecaptcha: ()=>{
    console.log("recaptcha");
  }
});
*/
