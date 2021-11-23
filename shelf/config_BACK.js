var config = {};

config.accountSid = "";
config.authToken = "";
config.fromNumber = '';


config.APIKEY = '9bbd58ba-29ca-11e9-9ee8-0200cd936042';
config.GOOGLE_API_KEY = 'AIzaSyAlS37BoM39sJiOD-Jvf_vdWnVNGd2DWgI';

config.mongoUri = 'mongodb://localhost/B-VAS';
//config.uploadPath = '/var/www/html/B-VAS-API/public/images/docs/'; //dev_url
config.uploadPath = '/home/developer/home/vagrant/api/bvas/public/images/docs/';
config.uploadRPath = '/home/developer/home/vagrant/api/bvas/public/images/reports/'; //dev_url
config.uploadTPath = '/home/developer/home/vagrant/api/bvas/public/images/templates/';
//config.FCM_KEY = 'AIzaSyA-q9btsnjIGuJgFSfoh8B6dfNSLq_Fvoc';
config.baseUrl = 'https://api.primeclarify.ml/images/docs/';
config.baseRUrl = 'https://api.primeclarify.ml/images/reports/';
config.baseTUrl = 'https://api.primeclarify.ml/images/templates/';

config.serverport = 3000;
config.Serverkey  = 'AAAAbkC6U20:APA91bHilR9aJh46dpllPcp0Q5XXEOdNjmCKorIkSeG-X4BvLoK8wkAULHDsHobnp0QHFqHO-B3-3I101lwq_pWqYzGp2ZrffbcziiX7atGGJJWiW-rwqg0aYN0_4wpPEwBDZy-UPsI8';

 config.EMAIL_HOST   = 'smtp.gmail.com';
 config.EMAIL_PORT   = 465;
 config.EMAIL_USERNAME  = "reports.prime47@gmail.com";
 config.EMAIL_PWD       = "rijas*123";
 config.EMAIL_FROM      = "info@bvas.com";


module.exports =  config;

