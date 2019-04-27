<<<<<<< Updated upstream
'use strict'
var   ffi = require('ffi')
      , express = require('express')
      , path = require('path')
      , app = express()
      , http = require('http').Server(app)
      , io = require('socket.io')(http)
      , eventEmitter = require('events').EventEmitter()
      , SerialPort = require('serialport')
      , mongojs = require('mongojs')
      , mydb = mongojs('pcldb')
      , moment = require('moment')
      // , startDay = moment().format("h:mm:ss");
      , tempVal = 0
      , value = 0
      , tubeCount = 0
      , barcodeDelay = 0
      , flagQRRead = false
      , flagHomeQR = false
      , flagHomeReject = false
      , flagHomeTempus = false
      , flagHomeSweeper = false
      , flagShootQR = false
      , flagshootReject = false
      , flagShootTempus = false
      , flagShootSweeper = false;

var lib = ffi.Library('./src/libAttControl', {
    'readData': [ 'int', ['int']],
    'writeData': [ 'void', ['int', 'int', 'int']],
    'process_write': [ 'int', ['int', 'int', 'int']]
});

mydb.createCollection("pcl" + moment().format("DMMYYYY"),function (err, res) {
  if(err){
    console.log(err);
  }
  else{
    console.log('collection created!');
  }
});

var myCollection = mydb.collection("pcl" + moment().format("DMMYYYY"));

var I001 = 0x0001               //QR shooting fired sensor
    , I002 = 0x0002             //QR shooting homing sensor
    , I003 = 0x0004             //Tempus shooting fired sensor
    , I004 = 0x0008             //Tempus shooting homing sensor
    , I005 = 0x0010
    , I006 = 0x0020
    , I007 = 0x0040             //tempus tray sensor
    , I008 = 0x0080             //tube barcode sensor
    , I009 = 0x0100             //Sweeper detect sensor
    , I010 = 0x0200
    , I011 = 0x0400             //tube entering detect sensor
    , I012 = 0x0800             //tube conveyering to QR process sensor
    , I013 = 0x1000             //tempus ready sensor
    , DC_OK = 0x2000
    , O001 = 0x0001             //conveyering to tempus motor
    , O002 = 0x0002
    , O003 = 0x0004             //tube entering conveyer motor
    , O004 = 0x0008             //Tempus shooting motor direction
    , O005 = 0x0010             //tube conveyering QR process motor
    , O006 = 0x0020             //QR shooting motor direction
    , O007 = 0x0040
    , O008 = 0x0080             //Tempus shooting motor
    , O009 = 0x0100             //tube QR roller motor
    , O010 = 0x0200             //sweeper motor run
    , O011 = 0x0400             //sweeper motor direction
    , O012 = 0x0800             //QR shooting motor
    , O013 = 0x1000
    , O014 = 0x2000;

var M3port = new SerialPort('/dev/ttyUSB0', {
    autoOpen: false,
    baudRate: 9600,
    highWaterMark: 65535
//parser: SerialPort.parsers.readline('\n'),
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, "./")));
app.use(express.static(path.join(__dirname, "./public/")));
app.use(express.static(path.join(__dirname, "./public/css")));
app.use(express.static(path.join(__dirname, "./public/js")));
app.use(express.static(path.join(__dirname, "./public/bower_components")));
app.use(express.static(path.join(__dirname, "./public/webcomponents")));

http.listen(9010, function() {
  console.log('listening on localhost:9010');
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
    //res.send("Hello World");
});

function writeKunbus(valProcess){
    lib.writeData(70, 2, valProcess);
    console.log(valProcess);
}

function readKunbus(){
    lib.writeData(70, 2, valProcess);
    console.log(valProcess);
}


setInterval(async function(){
    // let valKunbus = readKunbus();
    // let valProcess = process(lib.readData(0), ~lib.readData(70));
    let valProcess = await process();
    let test = await writeKunbus(valProcess);
    // lib.writeData(70, 2, process());
}, 10);
//
// async function run(){
//
// }

function process(){

    /*---------------- tube entering ------------------------------*/
    if(lib.readData(0) & I011){				                                          //tube entering sensor detected
        value |= O003;			                                                    //tube entering conveyer active
        tubeCount++;
        // console.log("tube: " + tubeCount);
    }

    /*--------------- sweeper routine ----------------------------*/
    if((lib.readData(0) & I009) && (!flagShootSweeper) && (!flagHomeSweeper)){				                                          //Sweeper-sensor detected
        flagShootSweeper = true;
        flagHomeSweeper = false;
        // printf("%x", ~lib.readData(70));
        // fflush(stdout);
        if((~lib.readData(70) & O003) == O003) {
            value ^= O003;				                                               //tube entering conveyer deactivate.
        }
    }

    /*---------- tube conveyering to QR process -----------------*/
    if(lib.readData(0) & I012){				                                          //conveyer-B detected
        if((~lib.readData(70) & O010) == O010) value ^= O010;			              //sweeper run deactivate.
        if((~lib.readData(70) & O011) == O011) value ^= O011;
        value |= O005;			                                                    //tube conveyering to QR motor active.
    }

    /*--------------- barcode reader process -------------------*/
    if((lib.readData(0) & I008) && (!flagShootQR) && (!flagHomeQR)){                              //tube barcode sensor
        if((~lib.readData(70) & O005) == O005) value ^= O005;			              //tube conveyering to QR motor deactivate.
        value |= O009;                                                          //tube QR roller motor
        barcodeDelay++;			                                                    //start counting (each of tick is 10ms)
        if(flagQRRead){
          if((~lib.readData(70) & O009) == O009) value ^= O009;                 //tube rolling deactive
          flagShootQR = true;
          flagQRRead = false;
          flagHomeQR = false;                                                  //QR shooting homing is not set
        }
        // when cannot read (temporary the fixing is still need.)
        // if(barcodeDelay > 300){								                                  //When timeout (3 second)
        //     barcodeDelay = 0;
        //     if((~lib.readData(70) & O009) == O009) value ^= O009;
        //     value &= 0xEFFF;			//rolling-B deactivate.
        //     lib.writeData(70, 2, value);
        //     flagShootQR = true;                                                  //QR shooting flag is set
        //     flagHomeQR = false;                                                  //QR shooting homing is not set
        // }
        if(barcodeDelay > 300){								                                  //When timeout (3 second)
            barcodeDelay = 0;
            flagShootReject = true;
            flagHomeReject = false;
        }
    }
    //when barcode success read
    /*-
    if()

        -*/

      /*-------------------- Tempus tray sensor -------------------------*/
      if((lib.readData(0) & I007) && (!flagShootTempus) && (!flagHomeTempus)) {				      //tempus tray detected
          if((~lib.readData(70) & O001) == O001) value ^= O001;				            //conveyering to tempus motor deactive
          if(lib.readData(0) & I013){				                                      //tempus ready sensor
              flagShootTempus = true;
              flagHomeTempus = false;
          }
      }


    /*--------------------sweeper shooting -------------------------------*/
    if(flagShootSweeper && !flagHomeSweeper){
      if((lib.readData(113) & I001) != I001){                                   //when sweeper shooting final sensor is not trigged
          //shooting-A activate
          value |= O010;		                                                      //sweeper motor run active.
      }
      else{                                                                   //when QR shooting final sensor is trigged
          if((~lib.readData(183) & O010) == O010) value ^= O010;               //QR shooting motor deactive
          flagShootSweeper = false                                                  //QR shooting is not set
          flagHomeSweeper = true;                                                   //QR homing is set
      }
    }

    /*-------------------- Reject shooting Routine---------------------*/
    if(flagshootReject && !flagHomeReject){

    }

    /*-------------------- QR shooting routine -------------------------*/
    if(flagShootQR && !flagHomeQR){
        value |= O001;				                                                  //conveyering to tempus motor active
        // if((~lib.readData(70) & O009) == O009) value ^= O009;
        if((lib.readData(0) & I001) != I001){                                   //when QR shooting final sensor is not trigged
            //shooting-A activate
            value |= O012;                                                      //QR shooting motor active
            value |= O006;                                                      //QR shooting motor direction active
        }
        else{                                                                   //when QR shooting final sensor is trigged
            if((~lib.readData(70) & O012) == O012) value ^= O012;               //QR shooting motor deactive
            if((~lib.readData(70) & O006) == O006) value ^= O006;               //QR shooting motor direction deactive
            flagShootQR = false                                                  //QR shooting is not set
            flagHomeQR = true;                                                   //QR homing is set
        }
    }

    /*--------------------Tempus shooting routine -------------------------*/
    if(flagShootTempus && !flagHomeTempus){
        if((lib.readData(0) & I003) != I003){                                   //Tempus shooting fired sensor
            value |= O008;                                                      //Tempus shooting motor active
        }
        else{
            if((~lib.readData(70) & O008) == O008) value ^= O008;               //Tempus shooting motor deactive
            flagShootTempus = false;
            flagHomeTempus = true;
        }
    }

    /*-------------------- QR shooting homing  -------------------------*/
    if(flagHomeQR){
      if((lib.readData(0) & I002) != I002)	{                                   //execute until QR shooting homing is detect
          value |= O012;		                                                    //QR shooting motor active (dir = 0).
      }
      else{
          if(!flagShootQR) if((~lib.readData(70) & O012) == O012) value ^= O012;//shooting-A state home position.
          //if((~lib.readData(70) & O009) == O009) value ^= O009;                 //QR Roller
          if(flagHomeQR) flagHomeQR = false;
      }
    }

    /*-------------------- Tempus shooting homing  ----------------------*/
    if(flagHomeTempus){
      if((lib.readData(0) & I004) != I004){                                     //execute until Tempus shooting homing is detect
        value |= O008|O004;                                                     //Tempus shooting motor is active to home (dir = 1)
      }
      else {
          if(!flagShootTempus) {
            if((~lib.readData(70) & O008) == O008) value ^= O008;
            if((~lib.readData(70) & O004) == O004) value ^= O004;
          }
          if(flagHomeTempus) flagHomeTempus = false;
      }
    }

    /*-------------------- Sweeper shooting homing  ----------------------*/
    if(flagHomeSweeper){
      if((lib.readData(113) & I002) != I002){                                     //execute until sweeper shooting homing is detect
        value |= O010;		                                                      //sweeper motor run active.
        value |= O013;                                                          //sweeper motor direction.ss
      }
      else {
          if(!flagShootSweeper) {
            if((~lib.readData(70) & O010) == O010) value ^= O010;               //QR shooting motor deactive
            if((~lib.readData(70) & O013) == O013) value ^= O013;               //QR shooting motor direction deactive
        }
          if(flagHomeSweeper) flagHomeSweeper = false;
      }
    }

    if(flagHomeReject){

    }

    return value;
}

io.on('connection', function(socket) {
  console.log('a user connect');

  socket.on('control', function(msg){
    console.log(msg);
    if(msg == "start"){

    }

    if(msg == "stop"){

    }
  });

  socket.on('message', function(){

  });
});

console.log(moment().endOf('day').fromNow());

setInterval(function(){
  // var numbers = moment().endOf('day').fromNow().match(/\d+/g).map(Number);
  // if(numbers[0] < 1) {
  //   console.log('creat new day database');
  // }
  if(moment().endOf('day').fromNow() == "in a few seconds"){
    console.log('creat new day database');
    mydb.createCollection("pcl" + moment().format("DMMYYYY"),function (err, res) {
      if(err){
        console.log(err);
      }
      else{
        console.log('collection created!');
      }
    });

    myCollection = mydb.collection("pcl" + moment().format("DMMYYYY"));
  }
}, 60000);
=======
'use strict'
var   express = require('express')
      , path = require('path')
      , app = express()
      , http = require('http').Server(app)
      , io = require('socket.io')(http)
      , eventEmitter = require('events').EventEmitter()
      , tempVal = 0
      , value = 0
      , tubeCount = 0
      , barcodeDelay = 0
      , flagHomeQR = false
      , flagHomeTempus = false
      , flagShootQR = false
      , flagShootTempus = false
      , SerialPort = require('serialport');

var M3port = new SerialPort('/dev/ttyUSB0', {
    autoOpen: false,
    baudRate: 9600,
    highWaterMark: 65535
//parser: SerialPort.parsers.readline('\n'),
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, "./")));
app.use(express.static(path.join(__dirname, "./public/")));
app.use(express.static(path.join(__dirname, "./public/css")));
app.use(express.static(path.join(__dirname, "./public/js")));
app.use(express.static(path.join(__dirname, "./public/bower_components")));
app.use(express.static(path.join(__dirname, "./public/webcomponents")));

http.listen(9010, function() {
  console.log('listening on localhost:9010');
});

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
    //res.send("Hello World");
});

// setInterval(async function(){
//     // let valKunbus = readKunbus();
//     // let valProcess = process(lib.readData(0), ~lib.readData(70));
//     let valProcess = await process();
//     let test = await writeKunbus(valProcess);
//     // lib.writeData(70, 2, process());
// }, 10);
//

io.on('connection', function(socket) {
  console.log('a user connect');

  socket.on('control', function(msg){
    console.log(msg);
    if(msg == "start"){

    }

    if(msg == "pause"){

    }
  });

  socket.on('message', function(){

  });
});
>>>>>>> Stashed changes
