var revPi = require("./jLibRevPi.js");
var flag = 0;
var state = setInterval(function (){
  //console.log('Test');
  if(flag == 0){
    revPi.write(70, 2, 8192)
    flag = 1;
  }
  if(flag){
    revPi.write(70, 2, 0)
    flag = 0;
  }
},1000);
