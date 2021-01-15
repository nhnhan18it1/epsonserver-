var express = require("express");
var app = express();
var https = require("https")//.createServer(app).listen(process.env.PORT || 3000);
const httpolyglot = require('httpolyglot')

var fs = require("fs")
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer();
const path = require('path')
const { v4: uuidV4 } = require("uuid");
var session = require('express-session')
var mysql = require('mysql')

var acc = require("./account");
var room = require("./room");

var dbConfig = {
  host: "b8qlmi0rrl6fqlz9g7xq-mysql.services.clever-cloud.com",
  user: "ulxhup08hubnlnlb",
  password: "56cWxVOzXaCCD5QmDQsr",
  database: "b8qlmi0rrl6fqlz9g7xq"
}

var connection;
function handleDisconnect() {
  connection = mysql.createConnection(dbConfig);
  connection.connect(function (err) {
    if (err) {
      console.log('error when connecting to db:', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  connection.on('error', function (err) {
    console.log('db error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();



const options = {
  key: fs.readFileSync(path.join(__dirname, '.', 'ssl', 'key.pem'), 'utf-8'),
  cert: fs.readFileSync(path.join(__dirname, '.', 'ssl', 'cert.pem'), 'utf-8')
}
port = process.env.PORT || 3000
const httpsServer = httpolyglot.createServer(options, app)
httpsServer.listen(port, () => {
  console.log(`listening on port ${port}`)
})

var io = require("socket.io").listen(httpsServer);


peers = {}
var groups = []
// [{
//   gId:1,
//   name:'aaaa',
//   key:'socket_id',
//   gpeers:{
//     sk_id:socket
//   }
// }]
app.use(express.urlencoded({
  extended: true
}))
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))
app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.static("public"))
app.use(express.static('node_modules'))
app.use(session({
  secret: 'this-is-a-secret-token',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000,
  }
}));
app.use(function (req, res, next) {
  if (req.session.user != null) {
    res.locals.user = req.session.user;
  }

  next();
});

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/meeting/:room', (req, res) => {
  res.render('meeting', { roomId: req.params.room })
})
app.get('/room', (req, res) => {
  req.session.user = {
    id: 1,
    name: 'hele'
  }
  console.log(req.session.user)
  res.render('room')
})

app.get("/createroom", function (req, res) {
  res.render('createroom')
})

app.get("/login", function (req, res) {

  res.render("login2");

})

app.post("/createroom", (req, res) => {
  var roomName = req.body.roomName;
  var key = req.body.key;
  var main = req.body.idMain;
  if (roomName && key && main) {
    room.createRoom(connection, roomName, key, main, function (param) {
      console.log(param)
      res.json(param)
    })
  }
  else {
    res.send("Err");
  }

})

app.post("/login", (req, res) => {
  var username = req.body.username;
  var pass = req.body.password;
  console.log(req.body.username);
  acc.login(connection, username, pass, (rs) => {
    console.log(rs);
    res.json(rs);
  });
})



app.get("/getroom", (req, res) => {
  room.getRoom(connection, function (param) {
    res.json(param)
  })
})

app.get("/turnsv", function (req, res) {
  let o = {
    format: "urls"
  };

  let o2 = {iceServers: [
    {
    urls: ["stun:stun.l.google.com:19302"]
    },
    // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
    // set your own servers here
    {
      urls: ['turn:192.158.29.39:3478?transport=udp'],
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808'
    }
  ]}

  let bodyString = JSON.stringify(o);
  let https = require("https");
  let options = {
    host: "global.xirsys.net",
    path: "/_turn/exstream2",
    method: "PUT",
    headers: {
      "Authorization": "Basic " + Buffer.from("nhavbnm2:5aa7ba3a-415d-11eb-b3fc-0242ac150002").toString("base64"),
      "Content-Type": "application/json",
      "Content-Length": bodyString.length
    }
  };

  let httpreq = https.request(options, function (httpres) {
    let str = "";
    httpres.on("data", function (data) { str += data; });
    httpres.on("error", function (e) { console.log("error: ", e); });
    httpres.on("end", function () {
      console.log("response: ", str);
      var rs = JSON.parse(str)
      rs.v.iceServers = [rs.v.iceServers]
      rs.v.iceServers.push({urls: ["stun:ss-turn2.xirsys.com"]})
      res.json(rs);
    });
  });

  httpreq.on("error", function (e) { console.log("request error: ", e); });
  httpreq.end(bodyString);
  // res.json(o2)
})
// app.get('/:room',(req, res)=>{
//     res.render('room',{roomId: req.params.room})
// })

console.log("hello")
function covertX() {
  var gx = []
  groups.forEach(item => {
    gx.push({ gId: item.gId, name: item.name, key: item.key })
  });
  return gx
}


io.on("connection", function (socket) {
  console.log(socket.id);
  peers[socket.id] = socket
  // io.emit("ahihi","ahiji")
  //console.log(peers)

  socket.on('CreateRoom', (data) => {
    roomx = {
      gId: groups.length + 1,
      name: data,
      key: socket.id,
      gpeers: {

      }
    }
    roomx.gpeers[socket.id] = socket
    groups.push(roomx)
    io.emit("Svs_getRoom", covertX())
    console.log(groups)

    // groups.forEach((item, index)=>{
    //   console.log(item.gId)
    // })
  })

  socket.on('joinRoom', (data) => {
    ix = 0;
    isExistRoom = false;
    console.log(data)
    groups.forEach((item, index) => {
      if (item.name === data.gId) {
        item.gpeers[socket.id] = socket
        ix = index;
        isExistRoom = true;
        console.log("join room sucess " + data.gId)
      }
    })

    if (!isExistRoom) {
      roomx = {
        gId: groups.length + 1,
        name: data.gId,
        key: socket.id,
        gpeers: {

        }
      }
      roomx.gpeers[socket.id] = socket
      groups.push(roomx)
      ix = -1
      socket.broadcast.emit("Svs_getRoom", covertX())
    }
    console.log("ix-" + ix)
    console.log(groups)
    socket.emit("joinRoomSucess", ix);
  })

  socket.on("getRoom", () => {
    // console.log(groups)

    socket.emit("Svs_getRoom", covertX())
  })

  socket.on('clientReady', (data) => {
    for (let id in peers) {
      if (id === socket.id) continue
      console.log('sending init re to ' + socket.id)
      peers[id].emit('initReceive', socket.id)
    }
  })

  socket.on('clientReadyGroup', (data) => {
    console.log("clinetReadyGroup" + data)
    for (let id in groups[data].gpeers) {
      if (id === socket.id) continue
      console.log('sending init re to' + socket.id)
      groups[data].gpeers[id].emit('initReceive', socket.id)
    }
  })



  socket.on('signal', data => {
    console.log('sending singnal from ' + socket.id + ' to ', data)
    if (!peers[data.socket_id]) return
    peers[data.socket_id].emit('signal', {
      socket_id: socket.id,
      signal: data.signal
    })
    console.log('sending singnal from ' + socket.id + ' to ', data)
  })

  socket.on("outRoom", (data) => {
    groups.forEach((item, index) => {
      if (item.gId == data) {
        for(let id in item.gpeers) {
          if (socket.id=id) continue
          item.gpeers[id].emit("removePeer",socket.id)
        }
        delete item.gpeers[socket.id]
        if (item.gpeers.length == 0) {
          groups.splice(index, 1)
        }
      }
    })
  })

  socket.on('send_message', (data) => {
    // console.log(data.gId)
    let crtime = new Date();
    data.time = crtime.getHours().toString() + ":" + crtime.getMinutes().toString()
    console.log(data.time)
    groups.forEach((item, index) => {
      if (item.name == data.gId) {
        for (let id in item.gpeers) {
          if (id == socket.id) continue
          // console.log(data)
          item.gpeers[id].emit('message', data)
        }
      }
    })
  })

  socket.on('disconnect', () => {
    console.log("sk disconnect " + socket.id)
    socket.broadcast.emit('removePeer', socket.id)
    delete peers[socket.id]
    groups.forEach((item, index) => {
      delete item.gpeers[socket.id]
      if (item.gpeers.length == 0) {
        groups.splice(index, 1)
      }
    });
  })

  socket.on("initSend", (init_socket_id) => {
    console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
    peers[init_socket_id].emit('initSend', socket.id)
  })

  socket.on("sendImg",(data)=>{
    groups.forEach((item, index) => {
      if (item.name == data.gId) {
        for (let id in item.gpeers) {
          if (id == socket.id) continue
          
          item.gpeers[id].emit('sendImg', data)
        }
      }
    })
  })
})