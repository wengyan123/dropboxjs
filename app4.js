var express = require("express"),
    app = express(),
    formidable = require('formidable'),
    util = require('util'),
    fs   = require('fs-extra'),
    qt   = require('quickthumb');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;

var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');
var util = require('util');
// Use quickthumb
//app.use(qt.static(__dirname + '/'));

//upload file to db
app.post('/upload', function (req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files) {
    res.writeHead(200, {'content-type': 'text/plain'});
    res.write('received upload:\n\n');
    res.end(util.inspect({fields: fields, files: files}));
  });


//when the entire request has been received
  form.on('end', function(fields, files) {
    /* Temporary location of our uploaded file */
    var temp_path = this.openedFiles[0].path;
    /* The file name of the uploaded file */
    var file_name = this.openedFiles[0].name;
    

    /* Location where we want to copy the uploaded file */
    var new_location = 'uploads/';

    fs.copy(temp_path, new_location + file_name, function(err) {  
      if (err) {
        console.error(err);
      } else {
        //store file in mongodb
        mongoose.connect('mongodb://127.0.0.1/test');
        var conn = mongoose.connection;

        conn.once('open', function () {
           console.log('open');
           var gfs = Grid(conn.db);
 
           // streaming to gridfs
           //filename to store in mongodb
           var writestream = gfs.createWriteStream({
              filename: file_name
           });
           //var dirname = require('path').dirname(__dirname);
           fs.createReadStream(__dirname + '/' + new_location + file_name).pipe(writestream);
 
           writestream.on('close', function (file) {
           // do something with `file`
           console.log(file.filename + 'Written To DB');
           });
        });
        console.log("success!");

     }
    });
  });
});


// Show the upload form 
app.get('/', function (req, res){
  res.writeHead(200, {'Content-Type': 'text/html' });
  var form = '<form action="/upload" enctype="multipart/form-data" method="post">Add a title: <input name="title" type="text" /><br><br><input multiple="multiple" name="upload" type="file" /><br><br><input type="submit" value="Upload" /></form>';
  res.end(form); 
});



//display uoloaded file in mongodb
var findDocuments = function(db, callback){
  //get the documents collection
  var collection = db.collection('fs.files');
  //find some documents
   collection.find({},{filename:1, _id:0}).toArray(function(err,docs){
   assert.equal(err, null);
   console.log("Found the following records");
   //console.dir(docs);
   callback(docs);
   });
}

app.get('/uploads', function (req,res){
  res.writeHead(200, {'Content-Type': 'text/html'});
  
  //connection URL
  var url = 'mongodb://localhost:27017/test';
  //use connct method to connect to the server 
  MongoClient.connect(url, function(err, db){
    assert.equal(null, err);
    console.log("Connected correctly to server");
    findDocuments(db, function(docs) {
      db.close();
      console.dir(docs);
      res.end(util.inspect(docs));
    });
  });    
       
});
 
app.listen(8080);
