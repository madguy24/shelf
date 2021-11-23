var config 		= require('../config'),
    http	    = require('http'),
    qs = require("querystring");


function sendOTP(toNumber){
    console.log(toNumber)
    var codelength = 4;
    var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

    // var twilio = require('twilio');
    // var client = new twilio(config.accountSid, config.authToken);
    //var message = 'Please use - ' + code + ' from B-VAS for the ' + codelength + ' digit verification';

    // client.messages.create({
    //     body: message,
    //     to: ('+1' + toNumber),  // Text this number
    //     from: config.fromNumber // From a valid Twilio number
    // })
    //     .then((message) => console.log(message.sid));


    var options = {
         "method": "GET",
         "hostname": "2factor.in",
         "port": null,
         "path": "/API/V1/"+config.APIKEY+"/SMS/"+toNumber+"/"+code,
         //"path": "API/R1/?module=TRANS_SMS&apikey=0a10dc67-1264-11e9-a895-0200cd936042&to=9447432807&from=sandra&templatename=sandra&var1=Emmus&var2=Howareyou?",
         "headers": {
             "content-type": "application/x-www-form-urlencoded"
         }
     };
    // /API/V1/293832-67745-11e5-88de-5600000c6b13/SMS/9911991199/4499
     var req = http.request(options, function (res) {
         var chunks = [];

         res.on("data", function (chunk) {
             chunks.push(chunk);
         });

         res.on("end", function () {
             var body = Buffer.concat(chunks);
             console.log(body.toString());
         });
     });-

     req.write(qs.stringify({}));
     req.end();
    return code;
}

module.exports = {
    sendOTP: sendOTP
}
