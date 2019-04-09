'use strict'
var   ffi = require('ffi')
      , express = require('express')
      , path = require('path')
      , app = express()
      , http = require('http').Server(app)
      , io = require('socket.io')(http)
      , eventEmitter = require('events').EventEmitter()
      , tempVal = 0
      , value = 0
      , tubeCount = 0
      , barcodeDelay = 0
      , flagHomeA = false
      , flagHomeB = false
      , flagShootA = false
      , flagShootB = false
      , SerialPort = require('serialport');

var lib = ffi.Library('./src/libAttControl', {
    'readData': [ 'int', ['int']],
    'writeData': [ 'void', ['int', 'int', 'int']],
    'process_write': [ 'int', ['int', 'int', 'int']]
});

var I001 = 0x0001
    , I002 = 0x0002
    , I003 = 0x0004
    , I004 = 0x0008
    , I005 = 0x0010
    , I006 = 0x0020
    , I007 = 0x0040
    , I008 = 0x0080
    , I009 = 0x0100
    , I010 = 0x0200
    , I011 = 0x0400
    , I012 = 0x0800
    , I013 = 0x1000
    , DC_OK = 0x2000
    , O001 = 0x0001
    , O002 = 0x0002
    , O003 = 0x0004
    , O004 = 0x0008
    , O005 = 0x0010
    , O006 = 0x0020
    , O007 = 0x0040
    , O008 = 0x0080
    , O009 = 0x0100
    , O010 = 0x0200
    , O011 = 0x0400
    , O012 = 0x0800
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
    // lib.readData(0) = lib.readData(0);
    // ~lib.readData(70) = ~lib.readData(70);
    if(lib.readData(0) & I011){				//Sensor-A detected
        value |= O003;			//Conveyer-A activate
        tubeCount++;
        // console.log("tube: " + tubeCount);
    }
    if(lib.readData(0) & I009){				//Sweeper-sensor detected
        value |= O010;			//sweeper activated.
        value |= O011;
        // printf("%x", ~lib.readData(70));
        // fflush(stdout);
        if((~lib.readData(70) & O003) == O003) {
            value ^= O003;				//Conveyer-A deactivate.
        }
    }
    if(lib.readData(0) & I012){				//conveyer-B detected
        if((~lib.readData(70) & O010) == O010) value ^= O010;			//sweeper deactivate.
        if((~lib.readData(70) & O011) == O011) value ^= O011;
        value |= O005;			//conveyer-B activate.
    }

    // barcode reader process;
    if((lib.readData(0) & I008) && (!flagShootA)){
        if((~lib.readData(70) & O005) == O005) value ^= O005;			//conveyer-B deactivate.
        value |= O009;
        barcodeDelay++;			//tube rolling
        // when cannot read (temporary the fixing is still need.)
        if(barcodeDelay > 300){								//rolling sensor detected
            barcodeDelay = 0;
            //if((~lib.readData(70) & O009) == O009) value ^= O009;			//conveyer-B deactivate.
            value &= 0xEFFF;			//rolling-B deactivate.
            lib.writeData(70, 2, value);
            flagShootA = true;
            flagHomeA = false;
        }
    }
    //when barcode success read
    /*-
    if()

        -*/



    //shooting-A process
    if(flagShootA){
        value |= O001;				//conveyer-C start
        // if((~lib.readData(70) & O009) == O009) value ^= O009;			//conveyer-B deactivate.
        if((lib.readData(0) & I001) != I001){
            //shooting-A activate
            value |= O012;
            value |= O006;
        }
        else{
            if((~lib.readData(70) & O012) == O012) value ^= O012;
            if((~lib.readData(70) & O006) == O006) value ^= O006;
            flagShootA = false
            flagHomeA = true;
        }
    }
    //tempus shooting process
    if((lib.readData(0) & I007) && (!flagShootB) && (!flagHomeB)) {				//tube shooting rail detected
        if((~lib.readData(70) & O001) == O001) value ^= O001;				//conveyer-C stop
        if(lib.readData(0) & I013){				//tempus ready
            flagShootB = true;
            flagHomeB = false;
        }
    }

    //shooting-B process
    if(flagShootB && !flagHomeB){
        if((lib.readData(0) & I003) != I003){
            value |= O008;
        }
        else{
            if((~lib.readData(70) & O008) == O008) value ^= O008;
            flagShootB = false;
            flagHomeB = true;
        }
    }

    // Shooting-A Homing
    if(((lib.readData(0) & I002) != I002) && flagHomeA)	{
        value |= O012;		//shooting-A state recoil.
    }
    else{
        if(!flagShootA) if((~lib.readData(70) & O012) == O012) value ^= O012;//shooting-A state home position.
        if((~lib.readData(70) & O009) == O009) value ^= O009;
        if(flagHomeA) flagHomeA = false;
    }

    // Shooting-B Homing
    if(flagHomeB){
      if((lib.readData(0) & I004) != I004){
        value |= O008|O004;		//shooting-B state recoil.
      }
      else {
          if(!flagShootB) if((~lib.readData(70) & O008) == O008) value ^= O008;
          if((~lib.readData(70) & O004) == O004) value ^= O004;
          if(flagHomeB) flagHomeB = false;
      }
    }

    // // Shooting-B Homing
    // if(((lib.readData(0) & I004) != I004) && flagHomeB)	{
    //     value |= O008|O004;		//shooting-B state recoil.
    // }
    // else {
    //     if(!flagShootB) if((~lib.readData(70) & O008) == O008) value ^= O008;
    //     if((~lib.readData(70) & O004) == O004) value ^= O004;
    //     if(flagHomeB) flagHomeB = false;
    // }

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
