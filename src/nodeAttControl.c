/*!
*
* Project: ATT blood automation controller
*
* Author: Siwakorn Sukprasertchai
% License: Intelligent Control Co.,Ltd and Siwakorn Sukprasertchai.
*
* Copyright (C) 2019 : Siwakorn Sukprasertchai, Bangkok, Thailand.
*
*/

#define _BSD_SOURCE
#include <stdio.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <termios.h>
#include <getopt.h>
#include <time.h>
#include <sys/types.h>
#include <stdbool.h>
#include <unistd.h>
#include "piControlIf.h"
#include "piControlIf.c"
#include "piControl.h"


// #define I1       0x0001
// Define Input
#define I001  				0x0001
#define I002			  	0x0002
#define I003  				0x0004
#define I004			  	0x0008
#define I005  				0x0010
#define I006			  	0x0020
#define I007  				0x0040
#define I008			  	0x0080
#define I009  				0x0100
#define I010			  	0x0200
#define I011  				0x0400	//sensor-A, Detec
#define I012			  	0x0800
#define I013  				0x1000
#define DC_OK       	0x2000

// define output
#define O001  				0x0001
#define O002			  	0x0002
#define O003  				0x0004		//conveyer-A, tube conveyering
#define O004			  	0x0008
#define O005  				0x0010
#define O006			  	0x0020
#define O007  				0x0040
#define O008			  	0x0080
#define O009  				0x0100
#define O010			  	0x0200	 	//sweep motor, tube sweeping
#define O011  				0x0400		//conveyer-B, tube conveyering to barcode reader
#define O012			  	0x0800
#define O013  				0x1000
#define O014			  	0x2000

/***********************************************************************************/
/*!
* @brief Get message text for read error
*
* Get the message text for an error on read from control process.
*
* @param[in]   Error number.
*
* @return Pointer to the error message
*
************************************************************************************/
char *getReadError(int error)
{
	static char *ReadError[] = {
		"Cannot connect to control process",
		"Offset seek error",
		"Cannot read from control process",
		"Unknown error"
	};
	switch (error) {
		case -1:
		return ReadError[0];
		break;
		case -2:
		return ReadError[1];
		break;
		case -3:
		return ReadError[2];
		break;
		default:
		return ReadError[3];
		break;
	}
}

/***********************************************************************************/
/*!
* @brief Get message text for write error
*
* Get the message text for an error on write to control process.
*
* @param[in]   Error number.
*
* @return Pointer to the error message
*
************************************************************************************/
char *getWriteError(int error)
{
	static char *WriteError[] = {
		"Cannot connect to control process",
		"Offset seek error",
		"Cannot write to control process",
		"Unknown error"
	};
	switch (error) {
		case -1:
		return WriteError[0];
		break;
		case -2:
		return WriteError[1];
		break;
		case -3:
		return WriteError[2];
		break;
		default:
		return WriteError[3];
		break;
	}
}

/***********************************************************************************/
/*!
 * @brief Read data
 *
 * Read <length> bytes at a specific offset.
 *
 * @param[in]   Offset
 * @param[in]   Length
 *
 ************************************************************************************/
uint16_t readData(uint16_t offset)
{
    int rc;
    uint8_t *pValues;
    unsigned int val, retVal;

    // Get memory for the values
    pValues = malloc(2);
    if (pValues == NULL) {
	printf("Not enough memory\n");
	return 0;
    }

		rc = piControlRead(offset, 2, pValues);
		if (rc < 0) {
			printf("read error %s\n", getReadError(rc));
		} else {
			retVal = pValues[1] << 8;
			retVal = retVal | pValues[0];
		}
		return ~retVal;
}


/***********************************************************************************/
/*!
 * @brief Write data to process image
 *
 * Write <length> bytes to a specific offset of process image.
 *
 * @param[in]   Offset
 * @param[in]   Length
 * @param[in]   Value to write
 *
 ************************************************************************************/
void writeData(int offset, int length, unsigned long i32uValue)
{
    int rc;

    if (length != 1 && length != 2 && length != 4) {
	printf("Length must be one of 1|2|4\n");
	return;
    }
    rc = piControlWrite(offset, length, (uint8_t *) & i32uValue);
    if (rc < 0) {
	printf("write error %s\n", getWriteError(rc));
    } else {
	// printf("Write value %lx hex (=%ld dez) to offset %d.\n", i32uValue, i32uValue, offset);
    }
}

int process_write(int flag, unsigned int value, int state)
{
	if(flag == state){
		flag = state + 1;
		writeData(0x46, 2, value);
		printf("state, %d", state);
		fflush(stdout);
		return flag;
	}
	else {
		printf("alarm,unexpected input");
		writeData(0x46, 2, 0x0000);
	}
	return 0;
}

// void process()
// {
// 	char state = 0;
// 	bool flagShootA = false, flagShootB = false, flagReadyA = false, flagReadyB = false;
// 	uint16_t value = 0, tempVal = 0, tempMask = 0, val = 0;
// 	unsigned int tubeCount = 0, barcodeDelay = 0;
//
// 	while(1){
// 		val = readData(0);
// 		tempVal = ~readData(70);
// 		if(val & I011){				//Sensor-A detected
// 			value |= O003;			//Conveyer-A activate
// 			tubeCount++;
// 		}
// 		if(val & I009){				//Sweeper-sensor detected
// 			value |= O010;			//sweeper activated.
// 			value |= O011;
// 			// printf("%x", tempVal);
// 			// fflush(stdout);
// 			if((tempVal & O003) == O003) {
// 				value ^= O003;				//Conveyer-A deactivate.
// 			}
// 		}
// 		if(val & I012){				//conveyer-B detected
// 			if((tempVal & O010) == O010) value ^= O010;			//sweeper deactivate.
// 			if((tempVal & O011) == O011) value ^= O011;
// 			value |= O005;			//conveyer-B activate.
// 		}
//
// 		// barcode reader process;
// 		if((val & I008) && (flagReadyA)){
// 			if((tempVal & O005) == O005) value ^= O005;			//conveyer-B deactivate.
// 			value |= O009;
// 			barcodeDelay++;			//tube rolling
// 			// when cannot read (temporary the fixing is still need.)
// 			if(barcodeDelay > 300){								//rolling sensor detected
// 				barcodeDelay = 0;
// 				//if((tempVal & O009) == O009) value ^= O009;			//conveyer-B deactivate.
// 				value ^= O009;			//rolling-B deactivate.
// 				writeData(0x46, 2, value);
// 				flagShootA = true;
// 				flagReadyA = false;
// 			}
// 		}
// 		//when barcode success read
// 		/*-
// 		if()
//
// 			-*/
//
//
//
// 		//shooting-A process
// 		if(flagShootA){
// 			value |= O001;				//conveyer-C start
// 			if((tempVal & O009) == O009) value ^= O009;			//conveyer-B deactivate.
// 			if((val & I001) != I001){
// 				//shooting-A activate
// 				value |= O012;
// 				value |= O006;
// 			}
// 			else{
// 				if((tempVal & O012) == O012) value ^= O012;
// 				if((tempVal & O006) == O006) value ^= O006;
// 				flagShootA = false;
// 			}
// 		}
// 		//tempus shooting process
// 		if((val & I007) && (flagReadyB)) {				//tube shooting rail detected
// 			if((tempVal & O001) == O001) value ^= O001;				//conveyer-C stop
// 			if(val & I013){				//tempus ready
// 				flagShootB = true;
// 			}
// 		}
//
// 		//shooting-B process
// 		if(flagShootB){
// 			if((val & I003) != I003){
// 				value |= O008;
// 			}
// 			else{
// 				if((tempVal & O008) == O008) value ^= O008;
// 				flagShootB = false;
// 				flagReadyB = false;
// 			}
// 		}
//
// 		// Shooting-A Homing
// 		if(((val & I002) != I002) && (!flagShootA))	{
// 			value |= O012;		//shooting-A state recoil.
// 		}
// 		else{
// 			if((tempVal & O012) == O012) value ^= O012;//shooting-A state homeposition.
// 			flagReadyA = true;
// 		}
//
// 		// Shooting-B Homing
// 		if(((val & I004) != I004) && (!flagShootB))	{
// 			value |= O008|O004;		//shooting-A state recoil.
// 		}
// 		else {
// 			if((tempVal & O008) == O008) value ^= O008;
// 			if((tempVal & O004) == O004) value ^= O004;
// 			flagReadyB = true;
// 		}
//
// 		writeData(0x46, 2, value);
// 		usleep(10000);
// 	}
// }
