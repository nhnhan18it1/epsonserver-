var createRoom = function (con, roomName, key, main, callback) { 
    con.query("INSERT INTO room(room.name,room.Key,room.main) VALUES(?,?,?)",[roomName,key,parseInt(main)], function (err, result, fields) {  
        if (err) {
            callback(false)
            throw err
            
        }
        callback(true)
    })
 }
var getRoom = function (con,callback) { 
    con.query("SELECT * FROM room",function (err, result, fields) { 
        if (err) {
            throw err;
        }
        callback(result)
     })
 }

module.exports.getRoom = getRoom;
module.exports.createRoom = createRoom;