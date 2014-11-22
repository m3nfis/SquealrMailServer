
var express = require('express'),
	path = require('path'),
	http = require('http'),
	mongo = require('mongodb'),
	ObjectId = mongo.ObjectID,
	MongoClient = mongo.MongoClient,
	DB, emailColl;

var CONFIG = require('./config_web.json');


MongoClient.connect( CONFIG.mongo.url , function(err, db) {
	if( err ) {  console.log("MONGO failed to connect to %s", CONFIG.mongo.url); return;}
    console.log("MONGO db connected");
    DB = db;
    emailColl = db.collection( CONFIG.mongo.workCollection ,function(err, collection) {
		if(err) {
			console.log("Collection " + CONFIG.mongo.workCollection + " missing");
			console.log(err);
		}
	});
});


var app = express();
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

app.get('/inbox/:to',function (req, res) {
	var toEmail = req.params.to;
	
	if ( !toEmail ){
		res.status(404);
		res.end();
		return;
	}
	//origin.indexOf('squealr.com') > -1
	//res.header("Access-Control-Allow-Origin", origin );
	//res.header("Access-Control-Allow-Headers", "X-Requested-With");

	DB.collection( CONFIG.mongo.workCollection ).find( {'headers.to' : new RegExp(toEmail, 'i')  }).sort({'date': -1}).toArray(function (err, items) {
		if(err) {
			console.log("MONGO failed to find  %s in %s collection", toEmail, CONFIG.mongo.workCollection);
			console.log(err);
		}
		res.json(items);
		res.end();
	});	

});

app.get('/inbox/html/:id',function (req, res) {
	var mailId = req.params.id;	
	DB.collection( CONFIG.mongo.workCollection ).findOne({"_id": new ObjectId(mailId)}, function(err, doc) {
		if(err) {
			console.log("MONGO failed to find  doc with id %s in %s collection", mailId , CONFIG.mongo.workCollection);
			console.log(err);
		}
		res.send( doc.html );
		res.end();
	});	

} );


http.createServer(app).listen( CONFIG.ports.http , function(){
	console.log('Squealr MailWebServer started on port ' + CONFIG.ports.http );
});




