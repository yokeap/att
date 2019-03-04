'use strict'
var revPi = require("./jLibRevPi.js");
var ref = require('ref');
// var flag = false;
// var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms
//
// function blinkLED() { //function to start blinking
//   if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
//     LED.writeSync(1); //set pin state to 1 (turn LED on)
//   } else {
//     LED.writeSync(0); //set pin state to 0 (turn LED off)
//   }
// }
//
// function endBlink() { //function to stop blinking
//   clearInterval(blinkInterval); // Stop blink intervals
//   LED.writeSync(0); // Turn LED off
//   LED.unexport(); // Unexport GPIO to free resources
// }
//
//
// var state = setInterval(main,2000);
//
// async function main(){
//   toggleLed();
//   await onLed();
//   await offLed();
// }
//
// async function onLed(){
//   if(flag === true){
//     revPi.write(70,2,8192);
//     console.log(flag);
//   }
// }
//
// async function offLed(){
//   if(flag === false){
//     revPi.write(70,2,0);
//     console.log(flag);
//   }
// }
//
// function toggleLed(){
//   flag = !flag;
// }
var uint32 = ref.types.uint32;
var test = revPi.read(0,10);
console.log(test);
