'use strict'
var ffi = require('ffi');
var val = 0
    , tempVal = 0
    , tubeCount = 0
    , barcodeDelay = 0;

var lib = ffi.Library('./src/libAttControl', {
    'readData': [ 'int', ['int']],
    'writeData': [ 'void', ['int', 'int', 'int']],
    'process_write': [ 'int', ['int', 'int', 'int']]
});

var flagReadyA = false
    , flagReadyB = false
    , flagShootA = false
    , flagShootB = false;


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


setInterval(function(){
    process();
}, 10);


function process(){
    var value = 0
        , tempMask = 0;

    val = lib.readData(0);
    tempVal = lib.readData(70);
     console.log(val);
    if(val & I011){				//Sensor-A detected
        value |= O003;			//Conveyer-A activate
        tubeCount++;
    }
    if(val & I009){				//Sweeper-sensor detected
        value |= O010;			//sweeper activated.
        value |= O011;
        // printf("%x", tempVal);
        // fflush(stdout);
        if((tempVal & O003) == O003) {
            value ^= O003;				//Conveyer-A deactivate.
        }
    }
    if(val & I012){				//conveyer-B detected
        if((tempVal & O010) == O010) value ^= O010;			//sweeper deactivate.
        if((tempVal & O011) == O011) value ^= O011;
        value |= O005;			//conveyer-B activate.
    }

    // barcode reader process;
    if((val & I008) && (flagReadyA)){
        if((tempVal & O005) == O005) value ^= O005;			//conveyer-B deactivate.
        value |= O009;
        barcodeDelay++;			//tube rolling
        // when cannot read (temporary the fixing is still need.)
        if(barcodeDelay > 300){								//rolling sensor detected
            barcodeDelay = 0;
            //if((tempVal & O009) == O009) value ^= O009;			//conveyer-B deactivate.
            value ^= O009;			//rolling-B deactivate.
            writeData(0x46, 2, value);
            flagShootA = true;
            flagReadyA = false;
        }
    }
    //when barcode success read
    /*-
    if()

        -*/



    //shooting-A process
    if(flagShootA){
        value |= O001;				//conveyer-C start
        if((tempVal & O009) == O009) value ^= O009;			//conveyer-B deactivate.
        if((val & I001) != I001){
            //shooting-A activate
            value |= O012;
            value |= O006;
        }
        else{
            if((tempVal & O012) == O012) value ^= O012;
            if((tempVal & O006) == O006) value ^= O006;
            flagShootA = false;
        }
    }
    //tempus shooting process
    if((val & I007) && (flagReadyB)) {				//tube shooting rail detected
        if((tempVal & O001) == O001) value ^= O001;				//conveyer-C stop
        if(val & I013){				//tempus ready
            flagShootB = true;
        }
    }

    //shooting-B process
    if(flagShootB){
        if((val & I003) != I003){
            value |= O008;
        }
        else{
            if((tempVal & O008) == O008) value ^= O008;
            flagShootB = false;
            flagReadyB = false;
        }
    }

    // Shooting-A Homing
    if(((val & I002) != I002) && (!flagShootA))	{
        value |= O012;		//shooting-A state recoil.
    }
    else{
        if((tempVal & O012) == O012) value ^= O012;//shooting-A state home position.
        flagReadyA = true;
    }

    // Shooting-B Homing
    if(((val & I004) != I004) && (!flagShootB))	{
        value |= O008|O004;		//shooting-A state recoil.
    }
    else {
        if((tempVal & O008) == O008) value ^= O008;
        if((tempVal & O004) == O004) value ^= O004;
        flagReadyB = true;
    }
    // console.log(value);
    lib.writeData(70, 2, value);
}
