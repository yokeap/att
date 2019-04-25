var mongojs = require('mongojs');
var mydb = mongojs('pcldb');
var moment = require('moment');


mydb.createCollection("pcl" + moment().format("DMMYYYY"),function (err, res) {
  if(err){
    console.log(err);
  }
  else{
    console.log('collection created!');
  }
});

var myCollection = mydb.collection("pcl" + moment().format("DMMYYYY"));


myCollection.insert({"id":"49051295","time":"19:09:43:315"}, function (err, res){
  if(err){
    console.log(err);
  }
  else {
    console.log(res);
  }
});

// var moment = require('moment');
//
// console.log("pcl-" + moment().format("DMMYYYY"));
//
// console.log(moment().endOf('day').fromNow());
// var numbers = moment().endOf('day').fromNow().match(/\d+/g).map(Number);
// console.log(numbers[0]);
//
// if(numbers[0] < 9) console.log('true');
