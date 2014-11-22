var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.bodyParser());
app.use(app.router);

var clients = {};
var connections = {};

var Const = {
	emailRegex : /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@squealr.com$/
};

io.on('connection', function(socket){
	// ON CONNECT
	clients[socket.id] = {};
	clients[socket.id].pipe = socket ;
	console.log('a user connected %s', socket.id);
	//-----
	
	// ON DISCONNECT
	socket.on('disconnect', function(){
		console.log('user disconnected %s, for email:%s',socket.id, clients[socket.id].consumer );
		if ( clients[socket.id] ){
			delete clients[socket.id];
		}
	});
	//-----

	socket.emit('add-consumer', {});    
	socket.on('add-consumer', function(emailToConsume){
		if ( emailToConsume.split('@').length == 2 && Const.emailRegex.test(emailToConsume)  ){
		
			console.log('add-consumer %s',emailToConsume);
			clients[socket.id].consumer = emailToConsume;
		
		} else {
			socket.emit('ERROR', {msg: 'add-consumer '+emailToConsume+' is not a valid SQUEALR email' }); 
		}
	});


});

var sendEmailNotification = function( email ){
	var to = email.to;
	console.log('sendEmailNotification for %s', to);
	for (var cIdx in clients) {
		if ( clients[cIdx].consumer && clients[cIdx].consumer === to ){
		
			clients[cIdx].pipe.emit('email', email);
		}
	};
	
}

app.get('/', function(req, res){
  res.sendfile('index.html');
});

app.post('/notif', function(req, res){
	try{
		if ( req.body && req.body.to ) {
			res.end();
			sendEmailNotification( req.body );
		} else {
			res.send({msg:'Invalid Format'},400);
			res.end();
		}
	}catch (err) {
		console.log('POST /notif ERROR');
		console.log(err);
	}
   
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});