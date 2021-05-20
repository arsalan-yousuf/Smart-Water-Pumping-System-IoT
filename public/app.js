var progressUp = document.getElementById('progressUp');
var progressDown = document.getElementById('progressDown');
var percentUp = document.getElementById('percentUp');
var percentDown = document.getElementById('percentDown');
var statusUp = document.getElementById('statusUp');
var statusDown = document.getElementById('statusDown');
var statusPipeline = document.getElementById('statusPipeline');

var motorUpControl = (val) => {
    fetch(`/upMotor?buttonUp=${val}`)
    .then( (response) => {
        response.json()
        .then( (data) => {
            if(data == 0)
            {
                statusUp.innerHTML = "ON";
            }
            else
            {
                statusUp.innerHTML = "OFF";
            }
       })
})
};

var motorDownControl = (val) => {
    fetch(`/downMotor?buttonDown=${val}`)
    .then( (response) => {
        response.json()
        .then( (data) => {
            if(data == 0)
            {
                statusDown.innerHTML = "ON";
            }
            else
            {
                statusDown.innerHTML = "OFF";
            }
       })
})
};

setInterval(() => {
    fetch(`/status`)
    .then( (response) => {
        response.json()
        .then( (data) => {
            progressUp.style.width = data.statusUp;
            progressDown.style.width = data.statusDown;
            percentUp.innerHTML = data.statusUp;
            percentDown.innerHTML = data.statusDown;

            if(data.currMotorUp == 0)
            {
                statusUp.innerHTML = "ON";
            }
            else
            {
                statusUp.innerHTML = "OFF";
            }

            if(data.currMotorDown == 0)
            {
                statusDown.innerHTML = "ON";
            }
            else
            {
                statusDown.innerHTML = "OFF";
            }

            if(data.statusPipeline == 1)
            {
                statusPipeline.innerHTML = "Available";
            }
            else
            {
                statusPipeline.innerHTML = "Unavailable";
            }
       })
    })
    
}, 2000);