var config = {};

config.accountSid = "";
config.authToken = "";
config.fromNumber = '';


config.APIKEY = '9bbd58ba-29ca-11e9-9ee8-0200cd936042';
// config.GOOGLE_API_KEY = 'AIzaSyAlS37BoM39sJiOD-Jvf_vdWnVNGd2DWgI';
config.GOOGLE_API_KEY = 'AIzaSyDHHCWqTMFL86731hcD_moytZRzlod_WN8';

config.mongoUri = 'mongodb://127.0.0.1/B-VAS';
//config.uploadPath = '/var/www/html/B-VAS-API/public/images/docs/'; //dev_url
config.uploadPath = '/home/developer/bvas/public/images/docs/';
config.uploadRPath = '/home/developer/bvas/public/images/reports/'; //dev_url
config.uploadTPath = '/home/developer/bvas/public/images/templates/';
//config.uploadPath = '/home/developer/home/vagrant/api/bvas/public/images-new/docs/';
//config.uploadRPath = '/home/developer/home/vagrant/api/bvas/public/images-new/reports/'; //dev_url
//config.uploadTPath = '/home/developer/home/vagrant/api/bvas/public/images-new/templates/';
//config.FCM_KEY = 'AIzaSyA-q9btsnjIGuJgFSfoh8B6dfNSLq_Fvoc';
config.baseUrl = 'https://apistages.rijasprime.com/images/docs/';
config.baseRUrl = 'https://apistages.rijasprime.com/images/reports/';
config.baseTUrl = 'https://apistages.rijasprime.com/images/templates/';
config.uploadWebPath = '/usr/share/nginx/html/template/'; //dev_url
config.baseWebUrl = 'https://stages.rijasprime.com/template/';


config.serverport = 3000;
config.Serverkey  = 'AAAAbkC6U20:APA91bHilR9aJh46dpllPcp0Q5XXEOdNjmCKorIkSeG-X4BvLoK8wkAULHDsHobnp0QHFqHO-B3-3I101lwq_pWqYzGp2ZrffbcziiX7atGGJJWiW-rwqg0aYN0_4wpPEwBDZy-UPsI8';

 config.EMAIL_HOST   = 'smtp.gmail.com';
 config.EMAIL_PORT   = 465;
 config.EMAIL_USERNAME  = "reports.prime47@gmail.com";
 config.EMAIL_PWD       = "rijas@123";
 config.EMAIL_FROM      = "info@bvas.com";
config.awsaccessKeyId= 'AKIAWFLAJXL4Q55QVIEI',
config.awssecretAccessKey= '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',
config.awsbucketname ='bvas-stages';
config.awsregion ='ap-south-1'
module.exports =  config;

