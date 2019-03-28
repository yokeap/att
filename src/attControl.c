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
#define I011  				0x0400
#define I012			  	0x0800
#define I013  				0x1000
#define DC_OK       	0x2000

// define output
#define O001  				0x0001
#define O002			  	0x0002
#define O003  				0x0004
#define O004			  	0x0008
#define O005  				0x0010
#define O006			  	0x0020
#define O007  				0x0040
#define O008			  	0x0080
#define O009  				0x0100
#define O010			  	0x0200
#define O011  				0x0400
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

void blink()
{
	int flag = 1;
	unsigned int val;

	while(1){
		val = readData(0);
		//--------- check input tupe and start conveyer ---------------------------
		if((val & I011) && (flag == 1)) flag = process_write(flag, O003, 1);

		// ------------------------------------------------------------------------

		//---------------- sweep tube process -------------------------------------
		if((val & I009) && (flag == 2)) flag = process_write(flag, O010 | O011, 2);
		//-------------------------------------------------------------------------

		//------ conveyering tube to the barcode reader process -------------------
		if((val & I012) && (flag == 3)) {
			// decoin the shoot state
			while((val & I002) != I002) {
				flag = process_write(2, O012|O001 , 2);
				usleep(5000);
				val = readData(0);
			}
			flag = process_write(flag, 0x10, 3);
		}

		//--------------barcode reader process ------------------------------------
		if((val & I008) && (flag == 4)) {
			flag = process_write(flag, O009, 4);
			//read barcode rolling delay
			usleep(5000000);
			writeData(0x46, 2, 0x0000);				//stop motor
			val = readData(0);
			// decoin the state
			while((val & I002) != I002) {
				flag = process_write(5, O012|O001 , 5);
				usleep(5000);
				val = readData(0);
			}
			// shooting
			process_write(5, O001 , 5);
			while((val & I001) != I001) {
				flag = process_write(6, O012 | O006 , 6);
				usleep(5000);
				val = readData(0);
			}
			process_write(6, O001 , 6);
			// decoin the state
			while((val & I002) != I002) {
			  usleep(1000);
				val = readData(0);
				flag = process_write(7, O012|O001 , 7);
			}
			flag = process_write(8, O001 , 8);
		}
		// ------------------------------------------------------------------------

		//----------------check tempus status -------------------------------------
			// if((val & I007|I013) && (flag == 9)) {  // check if tube in state
			// 	flag = process_write(flag, 0x0000 , 9);
			// 	val = readData(0);
			// 	// check decoin state
			// 	while((val & I004) != I004) {
			// 		flag = process_write(10, O008 | O004 , 10);
			// 		usleep(5000);
			// 		val = readData(0);
			// 	}
			// 	// shooting state
			// 	process_write(10, 0 , 10);
			// 	while((val & I003) != I003) {
			// 		flag = process_write(11, O008 , 11);
			// 		usleep(5000);
			// 		val = readData(0);
			// 	}
			// 	process_write(11, 0 , 11);
			// 	// decoin state
			// 	while((val & I004) != I004) {
			// 		flag = process_write(12, O008 | O004, 12);
			// 		usleep(5000);
			// 		val = readData(0);
			// 	}
			// 	flag = process_write(flag, 0, 13);
			// 	flag = 1;
			// }

		if((val & I007) && (val & I013) && (flag == 9)) {
			flag = process_write(flag, 0x0000 , 9);
			 usleep(5000);
			// read tempus status

			val = readData(0);
			while((val & I004) != I004) {
				flag = process_write(10, O008 | O004 , 10);
				usleep(5000);
				val = readData(0);
			}
			process_write(10, 0 , 10);
			while((val & I003) != I003) {
				flag = process_write(11, O008 , 11);
				usleep(5000);
				val = readData(0);
			}
			process_write(11, 0 , 11);
			while((val & I004) != I004) {
				flag = process_write(12, O008 | O004, 12);
				usleep(5000);
				val = readData(0);
			}
			flag = process_write(flag, 0, 13);
			flag = 1;
		}

		// if((val & I013) && (val & I012))  flag = process_write(flag, O005, 3);
		//
		// if(val & I007) flag = process_write(flag, O009, 4);
		// if(val & I002) flag = process_write(flag, O001, 5);
		// if(val & I010) flag = process_write(flag, O001, 5);

		// // state 1
		// if((val & DC_OK) && (flag == 0)) {
		// 	if(!flag){
		// 		flag = 1;
		// 		writeData(0x46, 2, 0x2000);
		// 		printf("state : A");
		// 		fflush(stdout);
		// 	}
		// 	else {
		// 		printf()
		// 	}
		// }
		// // State 2
		// if((val & I1) && (flag == 1)) {
		// 	flag = 0;
		// 	writeData(0x46,2, 0x0000);
		// 	printf("LED is off");
		// 	fflush(stdout);
		// }
		usleep(10000);
	  // printf("address : %d,   value: %d\n", 0x46, val & I011);
		// fflush(stdout);
	}
}

/***********************************************************************************/
/*!
 * @brief Shows help for this program
 *
 * @param[in]   Program name
 *
 ************************************************************************************/
void printHelp(char *programname)
{
    printf("Usage: %s [OPTION]\n", programname);
    printf("Options:\n");
    printf("                 -d: Get device list.\n");
    printf("\n");
    printf("      -v <var_name>: Shows infos for a variable.\n");
    printf("\n");
}

int main(int argc, char *argv[])
{
	char *progname;
	int function;
	int c;
	int rc;
	bool cyclic = true;     // default is cyclic output

	// checking terminal input command.
	// ---------------------------------------------------------------------------
	progname = strrchr(argv[0], '/');
	if (!progname) {
		progname = argv[0];
	} else {
		progname++;
	}

	if (!strcmp(progname, "piControlReset")) {
		rc = piControlReset();
		if (rc) {
			printf("Cannot reset: %s\n", strerror(-rc));
		}
		return rc;
	}

	if (argc == 1) {
		printHelp(progname);
		return 0;
	}
	// ---------------------------------------------------------------------------
		while ((c = getopt(argc, argv, "sr")) != -1) {
			switch (c) {
				case 's':
				printf("Start");
				fflush(stdout);
				blink();
					//return 0;
					break;

				case 'r':
					writeData(0x46,2, 0x0000);
					printf("Exit");
					return 0;
					break;
			}
		}
}
