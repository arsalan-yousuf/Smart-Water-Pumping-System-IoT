'use strict';

const Gpio = require('pigpio').Gpio;
var lcdi2c = require('lcdi2c');
var lcd = new lcdi2c(1,0x27,16,2);
lcd.on();
lcd.clear();
lcd.setCursor(0,0);
lcd.print("TankUp: ");
lcd.setCursor(0,1);
lcd.print("TankDown: ");

// The number of microseconds it takes sound to travel 1cm at 20 degrees celcius
const MICROSECDONDS_PER_CM = 1e6/34321;

const triggerUp = new Gpio(17, {mode: Gpio.OUTPUT});
const echoUp = new Gpio(18, {mode: Gpio.INPUT, alert: true});
const triggerDown = new Gpio(22, {mode: Gpio.OUTPUT});
const echoDown = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const MotorUp = new Gpio(27, {mode: Gpio.OUTPUT});

triggerUp.digitalWrite(0); // Make sure trigger is low
triggerDown.digitalWrite(0); // Make sure trigger is low
MotorUp.digitalWrite(1);
var levelUp,levelDown,emptyUp,emptyDown,full,low;
emptyUp=24;
emptyDown=22.6;
full=3;
low=16;


const watchHCSR04 = () => {
  let startTick;
  echoUp.on('alert', (level, tick) => {
    if (level === 1) {
      startTick = tick;
    } else {
      const endTick = tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      levelUp = diff / 2 / MICROSECDONDS_PER_CM;
      levelUp = levelUp.toFixed(1);
      console.log("Level Up: ",levelUp);
      percentUp(levelUp);
      if(levelUp >= low && levelDown < 20 )
      {
        MotorUp.digitalWrite(0);
      }
      else if(levelUp <= full){
        MotorUp.digitalWrite(1);
        lcd.setCursor(8,0);
        lcd.print("100%");
      }
      else if(levelDown >= 20){
        MotorUp.digitalWrite(1);
      }
      
    }

  });
  
};

const watchHCSR04Down = () => {
  let startTick;
  echoDown.on('alert', (level, tick) => {
    if (level === 1) {
      startTick = tick;
    } else {
      const endTick= tick;
      const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
      levelDown = diff / 2 / MICROSECDONDS_PER_CM;
      levelDown = levelDown.toFixed(1);
      console.log("Level Down: ",levelDown);
      percentDown(levelDown);
    }
  });
}

var percentUp = (lev) => {
  lev = (lev/24)*100;
  lev = (100-lev).toFixed(0);
  lcd.setCursor(8,0);
  lcd.print(lev+"%");
};
var percentDown = (lev) => {
  lev = (lev/22.6)*100;
  lev = (100-lev).toFixed(0);
  lcd.setCursor(10,1);
  lcd.print(lev+"%");
};

watchHCSR04();
watchHCSR04Down();


// Trigger a distance measurement once per second
setInterval(() => {
  triggerUp.trigger(10, 1); // Set trigger high for 10 microseconds
  triggerDown.trigger(10, 1); // Set trigger high for 10 microseconds

  
}, 1000);
