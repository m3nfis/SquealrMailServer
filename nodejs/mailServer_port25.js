var simplesmtp = require("simplesmtp"),
	MongoClient = require('mongodb').MongoClient,
	cheerio = require('cheerio'),
	sanitizeHtml = require('sanitize-html'),
	MailParser = require("mailparser").MailParser,
	MemoryStream = require('memorystream'),
    DB,
	emailColl;

var CONFIG = require('./config_mail.json');

var smtp = simplesmtp.createServer( CONFIG.smtp );

	smtp.listen( CONFIG.ports.smtp , function(err) {
			if (err) {
				console.log(err);
			}
			console.log('Squealr Mail Server litening on SMTP %d', CONFIG.ports.smtp  );
	});

MongoClient.connect( CONFIG.mongo.url, function(err, db) {
	if( err ) { 
		console.log("MONGO failed to connect to %s", CONFIG.mongo.url); return;
	}
	  
	console.log("MONGO db connected");
	DB = db;
	emailColl = db.collection( CONFIG.mongo.workCollection );
	/*
	, function(err, collection) {
		if(err) {
			console.log("Collection " + CONFIG.mongo.workCollection + " missing");
			console.log(err);
			emailColl = collection;
		}
	});
	*/
});

var parseMail = function( mailString ){

	var mailParserEx = new MailParser();
	mailParserEx.on("end", function(mail){
		console.log('connection.mailparser end');
		$ = cheerio.load( mail.html );
		
		$('a').attr('target','_blank');
		
		mail.html = sanitizeHtml( $.html() , CONFIG.sanitizeHtml.schemes );
		emailColl.insert(mail, {w:1}, function(err, result) {
			if(err) { return console.dir(err); }
			 console.log(" --EMAIL Saved-- ");
		});
	});
	
	mailParserEx.write( mailString );
	mailParserEx.end();
	
}

smtp.on("startData", function(connection){
	console.log("-- "+( new Date().toString()  )+" --" );
    console.log("Message from:", connection.from);
    console.log("Message to:", connection.to);
	
	//connection.mailparser = new MailParser();
	
    connection.saveStream = new MemoryStream(null, {
		readable : false
	});
	connection.saveStream.on('end', function() {
		console.log('connection.saveStream end');
		parseMail( connection.saveStream.toString() );
		//connection.mailparser.write( connection.saveStream.toString() );
		//connection.mailparser.end();
		
	});
	/*
	connection.mailparser.on("end", function(mail){
		console.log('connection.mailparser end');
		$ = cheerio.load( mail.html );
		
		$('a').attr('target','_blank');
		
		mail.html = sanitizeHtml( $.html() , CONFIG.sanitizeHtml.schemes );
		emailColl.insert(mail, {w:1}, function(err, result) {
			if(err) { return console.dir(err); }
			 console.log(" --EMAIL Saved-- ");
		});
	});
	*/
});

smtp.on("data", function(connection, chunk){
    connection.saveStream.write(chunk);
});

smtp.on("dataReady", function(connection, callback){
    connection.saveStream.end();
    callback(null, "ABC1"); // ABC1 is the queue id to be advertised to the client
    // callback(new Error("Rejected as spam!")); // reported back to the client
});

smtp.on("close", function(connection){
	
});

var Monitor = {
	intercept : function(){
		
	}

};