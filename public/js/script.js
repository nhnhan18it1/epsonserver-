let socket
let localStreem = null;
let peers={}

 const configuration = {
    iceServers: [{   urls: ["stun:ss-turn2.xirsys.com"] },
        {  
            username: "ze4whgfnMDvaXx5TfTI_gv_TEkTKTZ3bos-EyDL9AUiM8WLqQ1C3egLitrhHt7fkAAAAAF_c86tuaGF2Ym5tMg==",
              
            credential: "26963e64-415e-11eb-8ab6-0242ac140004",
              
            urls: ["stun:us-turn7.xirsys.com",
            "turn:us-turn7.xirsys.com:80?transport=udp",
            "turn:us-turn7.xirsys.com:3478?transport=udp",
            "turn:us-turn7.xirsys.com:80?transport=tcp",
            "turn:us-turn7.xirsys.com:3478?transport=tcp",
            "turns:us-turn7.xirsys.com:443?transport=tcp",
            "turns:us-turn7.xirsys.com:5349?transport=tcp"  
            ]
        }
    ]

    // iceServers: [{url:'stun:stun01.sipphone.com'},
    // {url:'stun:stun.ekiga.net'},
    // {url:'stun:stun.fwdnet.net'},
    // {url:'stun:stun.ideasip.com'},
    // {url:'stun:stun.iptel.org'},
    // {url:'stun:stun.rixtelecom.se'},
    // {url:'stun:stun.schlund.de'},
    // {url:'stun:stun.l.google.com:19302'},
    // {url:'stun:stun1.l.google.com:19302'},
    // {url:'stun:stun2.l.google.com:19302'},
    // {url:'stun:stun3.l.google.com:19302'},
    // {url:'stun:stun4.l.google.com:19302'},
    // {url:'stun:stunserver.org'},
    // {url:'stun:stun.softjoys.com'},
    // {url:'stun:stun.voiparound.com'},
    // {url:'stun:stun.voipbuster.com'},
    // {url:'stun:stun.voipstunt.com'},
    // {url:'stun:stun.voxgratia.org'},
    // {url:'stun:stun.xten.com'},
    // {
    //     url: 'turn:numb.viagenie.ca',
    //     credential: 'muazkh',
    //     username: 'webrtc@live.com'
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=udp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=tcp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // }

}


let constraints = {
    audio: true,
    video: {
        width: {
            max: 750
        },
        height:{
            max: 1080
        },
        type:"camera",
        withoutExtension:true
    },
    
}

constraints.video.facingMode = {
    ideal: "user"
}

navigator.mediaDevices.getUserMedia(constraints).then(stream=>{
    console.log("Receive local stream");

    localVideo.srcObject = stream
    mainvideo.srcObject = stream
    localStreem = stream;
    init();
}).catch(e => alert(`getusermedia err ${e.name}`))

function init(){
    socket = io("/")
    console.log("init")

    socket.on('joinRoomSucess',(data)=>{
        if(data!=-1){
            console.log("Join room success")
            socket.emit('clientReadyGroup',data);
        }
        
    })

    socket.emit('joinRoom',{gId:ROOM_ID})

    

    socket.on('initReceive',(socket_id)=>{
        console.log('INIT RECEIVE '+ socket_id)
        addPeer(socket_id,false)
        socket.emit('initSend', socket_id)
    })

    socket.on('initSend', socket_id => {
        console.log('INIT SEND ' + socket_id)
        addPeer(socket_id,true)
    })

    socket.on('removePeer', (socket_id)=>{
        console.log('romove peer '+socket_id)
        removePeer(socket_id)
    })

    socket.on('disconnect', ()=>{
        console.log('got DISCONNECTED')
        for(let socket_id in peers){
            removePeer(socket_id)
        }
    })

    socket.on('signal', data => {
        console.log(data)
        peers[data.socket_id].signal(data.signal)
    })

    socket.on('message',(data)=>{
        console.log(data)
        let ctv = document.createElement('p')
        let name = document.createElement('strong')
        let br = document.createElement('br')
        name.append(data.name)
        ctv.appendChild(name)
        ctv.append(" "+data.time)
        ctv.appendChild(br)
        ctv.append(data.content)
        mess.appendChild(ctv)
    })
}

function count(params) {
    c=1;
    for (let id in params) {
        c++;      
    }
    return c;
}

function removePeer(socket_id){
    let videoEl = document.getElementById(socket_id)
    let ctn=document.getElementById('ctn'+socket_id)
    if (videoEl) {
        const tracks = videoEl.srcObject.getTracks();

        tracks.forEach(function (track) {
            track.stop();
        });

        videoEl.srcObject= null;
        videoEl.parentNode.removeChild(videoEl)
        ctn.parentNode.removeChild(ctn)

    }
    if(peers[socket_id])peers[socket_id].destroy();
    delete peers[socket_id]
    $("#count_online").text(" "+count(peers));
    console.log($("#count_online").text())
}

function addPeer(socket_id, am_init){
    console.log("addpeer "+socket_id)
    peers[socket_id] = new SimplePeer({
        initiator: am_init,
        stream: localStreem,
        config: configuration
    })
    peers[socket_id].on('signal',(data)=>{
        //console.log(data)
        socket.emit('signal',{
            signal: data,
            socket_id: socket_id
        })
    })
    peers[socket_id].on('stream',stream=>{
        console.log(stream);
        let newVid = document.createElement('video')
        newVid.srcObject = stream
        newVid.id = socket_id
        newVid.playsinline = false
        newVid.autoplay = true
        newVid.click = "changeMainVideo(this)"
        newVid.className = "vid"

        let ctn = document.createElement('div')
        ctn.className='col-md-1'
        ctn.id='ctn'+socket_id
        ctn.appendChild(newVid)
        videos.appendChild(ctn)
    })
    console.log($("#count_online").text())
    $("#count_online").text(" "+count(peers));
    
    $(".vid").click(function (e) { 
        e.preventDefault();
        changeMainVideo(this)
    });
}

function removeLocalStream() {
    if (localStream) {
        const tracks = localStream.getTracks();

        tracks.forEach(function (track) {
            track.stop()
        })

        localVideo.srcObject = null
    }

    for (let socket_id in peers) {
        removePeer(socket_id)
    }
}

function ShareScreen() {
    if (constraints.video.facingMode.ideal === 'user') {
        constraints.video.facingMode.ideal = 'environment'
    } else {
        constraints.video.facingMode.ideal = 'user'
    }

    

    const tracks = localStreem.getTracks();
    var isShare=(constraints.video.type=="camera") ? false : true;
    tracks.forEach(function (track) {
        track.stop()
    })

    localVideo.srcObject = null
    if(!isShare){
        navigator.mediaDevices.getDisplayMedia(constraints).then(stream => {
            changeStream(stream);
        })
        constraints.video.type="screen"
    }
    else{
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            changeStream(stream);
        })
        constraints.video.type="camera"
    }
    
}

function changeStream(stream) {
    for (let socket_id in peers) {
        for (let index in peers[socket_id].streams[0].getTracks()) {
            for (let index2 in stream.getTracks()) {
                if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
                    peers[socket_id].replaceTrack(peers[socket_id].streams[0].getTracks()[index], stream.getTracks()[index2], peers[socket_id].streams[0])
                    break;
                }
            }
        }
    }

    localStreem = stream
    localVideo.srcObject = stream
}

function senMessage() {
    if (socket!=null) {
        let ct = $("#ipmess").val();
        socket.emit('send_message',{gId:ROOM_ID,name:socket.id,content:ct})
        $("#ipmess").val("");
        let ctv = document.createElement('p')
        let name = document.createElement('strong')
        let br = document.createElement('br')
        name.append("bạn")
        ctv.appendChild(name)
        ctv.append(" ")
        ctv.appendChild(br)
        ctv.append(ct)
        mess.appendChild(ctv)
    }
}

$(document).ready(function () {
    $(".vid").click(function (e) { 
        e.preventDefault();
        changeMainVideo(this)
    });
    $(document).on("click",".vid", function () {
        changeMainVideo(this)
    });
    $('#ipmess').keyup(function(e){
        if(e.keyCode == 13)
        {
            senMessage()
        }
    });
});

function changeMainVideo(params) {
    var src = params.srcObject;
    mainvideo.srcObject = src
    console.log("change")
    console.log(src)
}
var flag = false,
prevX = 0,
currX = 0,
prevY = 0,
currY = 0,
dot_flag = false;

var x = "black",
y = 2;
async function capture() {
var context = canvas.getContext('2d');
var w, h, ratio;
ratio = mainvideo.videoWidth / mainvideo.videoHeight;

// w = video.videoWidth - 100;
w=500
// h= 500
h = parseInt(w / ratio, 10);

canvas.width = w;
    canvas.height = h;			
    context.fillRect(0, 0, w, h);
    context.drawImage(mainvideo, 0, 0, w, h);
// }
};

function draw() {
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
ctx.beginPath();
ctx.moveTo(prevX, prevY);
ctx.lineTo(currX, currY);
ctx.strokeStyle = x;
ctx.lineWidth = y;
ctx.stroke();
ctx.closePath();
}

function findxy(res, e) {
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
if (res == 'down') {
prevX = currX;
prevY = currY;
currX = e.clientX - canvas.offsetLeft;
currY = e.clientY - canvas.offsetTop;

flag = true;
dot_flag = true;
if (dot_flag) {
    ctx.beginPath();
    ctx.fillStyle = x;
    ctx.fillRect(currX, currY, 2, 2);
    ctx.closePath();
    dot_flag = false;
}
}
if (res == 'up' || res == "out") {
flag = false;
}
if (res == 'move') {
if (flag) {
    prevX = currX;
    prevY = currY;
    currX = e.clientX - canvas.offsetLeft;
    currY = e.clientY - canvas.offsetTop;
    draw();
}
}
}

var video = document.querySelector('video');
var canvas = document.querySelector('canvas');
// Get a handle on the 2d context of the canvas element
var context = canvas.getContext('2d');
// Define some vars required later
var w, h, ratio;
canvas.addEventListener("mousemove", function (e) {
findxy('move', e)
}, false);
canvas.addEventListener("mousedown", function (e) {
findxy('down', e)
}, false);
canvas.addEventListener("mouseup", function (e) {
findxy('up', e)
}, false);
canvas.addEventListener("mouseout", function (e) {
findxy('out', e)
}, false);
function convertBase64() { 
    var canvas = document.querySelector('canvas');
    let base64 = canvas.toDataURL('image/jpeg', 1.0)
    console.log('base64', base64)
    base64 = base64.replace("data:image/jpeg;base64,","")
    return base64;
 }
function sendImg() { 
    socket.emit("sendImg",convertBase64())
 }