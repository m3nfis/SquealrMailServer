var simplesmtp = require("simplesmtp"),
  MongoClient = require("mongodb").MongoClient,
  cheerio = require("cheerio"),
  sanitizeHtml = require("sanitize-html"),
  MailParser = require("mailparser").MailParser,
  MemoryStream = require("memorystream"),
  DB,
  emailColl;

var simpleParser = require("mailparser").simpleParser;
var CONFIG = require("./config.json");

var smtp = simplesmtp.createServer(CONFIG.smtp,  function(req){
  req.pipe(console.log);
   
  var toArrayAsString = req.to.join('');
  if (toArrayAsString.includes(CONFIG.domain)) {
    console.log('ACCEPTED', req.to);  
    req.accept();
    console.dir(req);
    console.log('-------------------------------------------------')
  } else {
    console.log('BAD_DEST_ADDRESS')
    req.reject("BAD_DEST_ADDRESS");
    console.dir(req)
    console.log('-------------------------------------------------')
  }
  
});

smtp.listen(CONFIG.ports.smtp, function (err) {
  if (err) {
    console.log(err);
  }
  console.log("Squealr Mail Server litening on SMTP %d", CONFIG.ports.smtp);
});

const client = new MongoClient(CONFIG.mongo.url);
client
  .connect()
  .then(function (a) {
    console.log("MONGO db connected");
    DB = client.db("squealr");
    emailColl = DB.collection("emails");
  })
  .catch(console.error);

var parseMail = function (mailString) {
  simpleParser(mailString, {}).then(function (mail) {
    console.log("connection.mailparser end");
    $ = cheerio.load(mail.html);

    $("a").attr("target", "_blank");

    mail.html = sanitizeHtml($.html(), CONFIG.sanitizeHtml.schemes);
    mail.inboundTimestamp = new Date();
    emailColl.insertOne(mail).then(function (insertResult) {
      console.log(" --EMAIL Saved-- ", insertResult);
    }).catch(function(err) {
      console.log(" --EMAIL SAVE ERROR-- ");
      console.dir(err);
    })
  });

  // Parsed mail* object has the following properties
  // headers – a Map object with lowercase header keys
  // subject is the subject line (also available from the header mail.headers.get(‘subject’))
  // from is an address object for the From: header
  // to is an address object for the To: header
  // cc is an address object for the Cc: header
  // bcc is an address object for the Bcc: header (usually not present)
  // date is a Date object for the Date: header
  // messageId is the Message-ID value string
  // inReplyTo is the In-Reply-To value string
  // reply-to is an address object for the Cc: header
  // references is an array of referenced Message-ID values
  // html is the HTML body of the message. If the message included embedded images as cid: urls then these are all replaced with base64 formatted data: URIs
  // text is the plaintext body of the message
  // textAsHtml is the plaintext body of the message formatted as HTML
  // attachments is an array of attachments
};

var setReceiverAllowed = function (connection) {
  var toArrayAsString = connection.to.join('');
  connection.isAllowed = toArrayAsString.includes(CONFIG.domain);
};

smtp.on("startData", function (connection) {
  console.log("-- " + new Date().toString() + " --");
  console.log("Message from:", connection.from);
  console.log("Message to:", connection.to);
  setReceiverAllowed(connection);

  //connection.mailparser = new MailParser();

  connection.saveStream = new MemoryStream(null, {
    readable: false,
  });
  connection.saveStream.on("end", function () {
    console.log("connection.saveStream end");
    if (connection.isAllowed) {
      parseMail(connection.saveStream.toString());
    }
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

smtp.on("data", function (connection, chunk) {
  connection.saveStream.write(chunk);
});

smtp.on("dataReady", function (connection, callback) {
  connection.saveStream.end();

  if (connection.isAllowed) { //!connection.isAllowed
    callback(null, "ABC1"); // ABC1 is the queue id to be advertised to the client
  } else {
    callback(new Error("Rejected as spam!"));
    console.error('Span Attempt:', connection.to);
    delete connection.isAllowed;
  }
});

smtp.on("close", function (connection) {});

var Monitor = {
  intercept: function () {},
};
