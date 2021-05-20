const path = require('path');
const express = require('express');
const Gpio = require('pigpio').Gpio;
var lcdi2c = require('lcdi2c');
//var promise = require('promise');

const app = express();
const publicPath = path.join(__dirname,'../public');
var lcd = new lcdi2c(1,0x27,16,2);

const MICROSECDONDS_PER_CM = 1e6/34321;
const triggerUp = new Gpio(17, {mode: Gpio.OUTPUT});
const echoUp = new Gpio(18, {mode: Gpio.INPUT, alert: true});
const triggerDown = new Gpio(22, {mode: Gpio.OUTPUT});
const echoDown = new Gpio(23, {mode: Gpio.INPUT, alert: true});
const MotorUp = new Gpio(27, {mode: Gpio.OUTPUT});    // relay
const MotorDown = new Gpio(24, {mode: Gpio.OUTPUT});  // relay
const pipeline = new Gpio(25, {mode: Gpio.INPUT});
var levelUp,levelDown,emptyUp,emptyDown,full,low,lowDown, currUp,currDown;
emptyUp=24;
emptyDown=25;
full=4;
fullDown = 5;
lowUp=15;
lowDown=21;

triggerUp.digitalWrite(0); // Make sure trigger is low
triggerDown.digitalWrite(0); // Make sure trigger is low
MotorUp.digitalWrite(1);
MotorDown.digitalWrite(1);
lcd.off();

lcd.on();
lcd.clear();
lcd.setCursor(0,0);
lcd.print("TankUp: ");
lcd.setCursor(0,1);
lcd.print("TankDown: ");

const watchHCSR04up = () => {
    let startTick;
    echoUp.on('alert', (level, tick) => {
      if (level === 1) {
        startTick = tick;
      } else {
        const endTick = tick;
        const diff = (endTick >> 0) - (startTick >> 0); // Unsigned 32 bit arithmetic
        levelUp = diff / 2 / MICROSECDONDS_PER_CM;
        levelUp = levelUp.toFixed(0);
        console.log("Level Up: ",levelUp);
        currUp = percentUp(levelUp);
        if(levelUp >= lowUp && levelDown < lowDown )
        {
          MotorUp.digitalWrite(0);
        }
        else if(levelUp <= full){
          MotorUp.digitalWrite(1);
          currUp = 100;

        }
        else if(levelDown >= lowDown){
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
        levelDown = levelDown.toFixed(0);
        console.log("Level Down: ",levelDown);
        currDown = percentDown(levelDown);
        if(pipeline.digitalRead() && (levelDown!=fullDown))
        {
          MotorDown.digitalWrite(0);
        }
        else if(pipeline.digitalRead()==0)
        {
          MotorDown.digitalWrite(1);
        }
        else if(levelDown <= fullDown)
        {
          MotorDown.digitalWrite(1);
          currDown = 100;
        }
        else if(pipeline.digitalRead() && (levelUp!=full) && (levelDown < lowDown))
        {
          MotorUp.digitalWrite(0);
        }

      }
    });
  }

  var percentUp = (lev) => {
    lev = ((lev-full)/(emptyUp-full))*100;
    lev = (100-lev).toFixed(0);
    lcd.setCursor(8,0);
    lcd.print(lev+"%");
    console.log(lev+"%");
    return lev;
  };
  var percentDown = (lev) => {
    lev = ((lev-fullDown)/(emptyDown-fullDown))*100;
    lev = (100-lev).toFixed(0);
    lcd.setCursor(10,1);
    lcd.print(lev+"%");
    console.log(lev+"%");
    return lev;
  };
  
  watchHCSR04up();
  watchHCSR04Down();

app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.sendfile(publicPath+'/index.html');
})

app.get('/status', (req, res) => {
  res.send(
    { statusUp : currUp+'%',
      statusDown : currDown+'%',
      currMotorUp : MotorUp.digitalRead(),
      currMotorDown : MotorDown.digitalRead(),
      statusPipeline : pipeline.digitalRead()
    }
  )
})

app.get('/upMotor', (req, res) => {
  const upMotorButton = req.query.buttonUp;
  if(upMotorButton == "true"){
    MotorUp.digitalWrite(0);
    res.send(MotorUp.digitalRead());
}
else if(upMotorButton == "false"){
    MotorUp.digitalWrite(1);
    res.send(MotorUp.digitalRead());
}
})

app.get('/downMotor', (req, res) => {
  const DownMotorButton = req.query.buttonDown;
  if(DownMotorButton == "true"){
      MotorDown.digitalWrite(0);
      res.send(MotorDown.digitalRead());
  }
  else if(DownMotorButton == "false"){
      MotorDown.digitalWrite(1);
      res.send(MotorDown.digitalRead());
}
})
/*app.get('/', (req, res) => {
    const underMotorStatus = req.query.button
    if(underMotorStatus == "true"){
        //led.digitalWrite(1);
        res.send();
    }
    else if(underMotorStatus == "false"){
        //led.digitalWrite(0);
        res.send();
    }

    //res.send({status: address})
})*/

app.listen(8080, ()=>{
    console.log("Server is up on port 8080.");
})

// Trigger a distance measurement once per second
setInterval(() => {
  triggerUp.trigger(10, 1); // Set trigger high for 10 microseconds
  triggerDown.trigger(10, 1); // Set trigger high for 10 microseconds
}, 1000);