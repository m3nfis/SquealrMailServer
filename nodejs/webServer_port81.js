
var express = require('express'),
	path = require('path'),
	http = require('http'),
	mongo = require('mongodb'),
	ObjectId = mongo.ObjectID,
	MongoClient = mongo.MongoClient,
	DB, emailColl;

var CONFIG = require('./config.json');

const client = new MongoClient(CONFIG.mongo.url);
client
  .connect()
  .then(function (a) {
    console.log("MONGO db connected");
    DB = client.db("squealr");
    emailColl = DB.collection("emails");
  })
  .catch(function(b) {
	console.log("MONGO failed to connect to %s", CONFIG.mongo.url);
	console.error(b);
  });


var app = express();
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

app.get('/inbox/list/:to',async function (req, res) {
	
	var toEmail = req.params.to;
	console.log('toEmail', toEmail);
	
	if ( !toEmail ){
		res.status(404);
		res.end();
		return;
	}
	//origin.indexOf('squealr.com') > -1
	//res.header("Access-Control-Allow-Origin", origin );
	//res.header("Access-Control-Allow-Headers", "X-Requested-With");

	try {
		var items =  await emailColl.find( {'headers.to.text' : new RegExp(toEmail, 'i')  }).sort({'date': -1}).toArray();
		res.json(items);
		res.end();

	} catch(err) {
		console.log("MONGO failed to find  %s in %s collection", toEmail, CONFIG.mongo.workCollection);
		console.log(err);
		res.status(400).json([]);
		res.end();
	}
});

app.get('/inbox/html/:id',function (req, res) {
	var mailId = req.params.id;	
	emailColl.findOne({"_id": new ObjectId(mailId)}, function(err, doc) {
		if(err) {
			console.log("MONGO failed to find  doc with id %s in %s collection", mailId , CONFIG.mongo.workCollection);
			console.log(err);
			res.status(400).send('not found');
		}
		res.send( doc.html );
		res.end();
	});	

} );
app.delete('/inbox/mail/:id',async function (req, res) {
	var mailId = req.params.id;	

	if ( !mailId ){
		res.status(404);
		res.end();
		return;
	}

	try {
		var result = await emailColl.deleteOne({"_id": new ObjectId(mailId)});
		res.json(result);
		res.end();

	} catch(err) {
		console.log("failed to delete  %s in %s collection", mailId, CONFIG.mongo.workCollection);
		console.log(err);
		res.status(400).json([]);
		res.end();
	}
} );


http.createServer(app).listen( CONFIG.ports.http , function(){
	console.log('Squealr MailWebServer started on port ' + CONFIG.ports.http );
});




