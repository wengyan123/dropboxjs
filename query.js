var findFiles = function(db, callback){
  var cursor = db.collection('fs.files').find();
  cursor.each(function(err, doc){
     assert.equal(err, null);
     if (doc != null){
        console.dir(doc);
     }else{
        callback();
     }
