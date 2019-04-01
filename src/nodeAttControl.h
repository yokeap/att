/*!
 *
 * Project: Pi Control
 *
 * MIT License
 *
 * Copyright (C) 2017 : KUNBUS GmbH, Heerweg 15C, 73370 Denkendorf, Germany
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * \file piControlIf.c
 *
 * \brief PI Control Interface
 *
 *
 */

#ifndef NODEATTCONTROL_H_
#define NODEATTCONTROL_H_

/******************************************************************************/
/********************************  Includes  **********************************/
/******************************************************************************/

#include <stdint.h>
// #include <piControl.h>

#include "piControlIf.h"


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


/******************************************************************************/
/*********************************  Types  ************************************/
/******************************************************************************/

extern int PiControlHandle_g;


/******************************************************************************/
/*******************************  Prototypes  *********************************/
/******************************************************************************/
#ifdef __cplusplus
extern "C" {
#endif

char *getReadError(int error);
char *getWriteError(int error);
uint16_t readData(uint16_t offset);
void writeData(int offset, int length, unsigned long i32uValue);
int process_write(int flag, unsigned int value, int state);

// void piControlClose(void);

#ifdef __cplusplus
}
#endif

#endif /* PICONTROLIF_H_ */
