var login = function (con, username, pass,callback){
    var acc = {username:username,password:pass}; 
    con.query("SELECT * FROM account WHERE username like ? AND password like ?",[username,pass], function(err, result, fields){
        if(err) throw err;
        callback(result);
    })
}

module.exports.login = login;
