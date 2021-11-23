var express 	= require('express'),
    oauthserver = require('oauth2-server'),
    mongoose 	= require('mongoose'),
    path 		= require('path'),
    bodyParser 	= require('body-parser'),
    jade        = require('jade'),
    fs 			= require('fs'),
    model 		= require('./model.js'),
    fun   	    = require('./function.js'),
    routes 		= require('./routes/index'),
    config 		= require('./config'),
    crypto      = require('crypto'),
    formidable 	= require('formidable'),
    notification = require('./pushNotification.js'),
    email       = require('./emailService.js'),
    sms       = require('./shelf/sms.js'),
    multer 		 = require("multer"),
    util = require('util'),
    fs_extra   = require('fs-extra'),
    http	    = require('http');

var app 		= express();
var xlsxj = require('xlsx-to-json-lc');
var xlsj = require('xls-to-json-lc');
var distance = require('google-distance-matrix');

// var excel = require('excel4node');
// var wb = new excel.Workbook();
var JSZip = require('jszip');
var Docxtemplater = require('docxtemplater');
var qs = require("querystring");
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var ImageModule=require('docxtemplater-image-module');
var toPdf = require("office-to-pdf")
//var ReverseMd5 = require('reverse-md5')
var fileModel = require('./mongo/model/file');
var pdf = require('html-pdf');
var Handlebars = require('handlebars');

var HtmlDocx = require('html-docx-js');
var toPdf = require("office-to-pdf")
var officegen = require('officegen');






app.use(express.static(path.join(__dirname, 'public')));
app.use("/getImagePath",express.static(path.join(config.uploadPath)));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser());


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, config.uploadPath)
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
var upload = multer({ //multer settings
    storage: storage
}).array('file',5);

//CORS Middleware
app.use(function (req, res, next) {
    //Enabling CORS
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization,device_id,userType,usertype,docRefId");
    next();
});

var mongoUri = config.mongoUri;
mongoose.connect(mongoUri, function(err, res) {
    if (err) {
        return console.error('Error connecting to "%s":', mongoUri, err);
    }
    console.log('Connected successfully to "%s"', mongoUri);
});



app.oauth = new oauthserver({
    model: require('./model.js'),
    grants: ['password', 'authorization_code'],
    accessTokenLifetime:1209600, //token expired time
    debug: true
});


app.post('/api/test',function (req, res) {

    /*var NodeGeocoder = require('node-geocoder');
    var options = {
        provider: 'google',
        httpAdapter: 'https', // Default
        apiKey: 'AIzaSyB9MopGCyRf7G8ng-5_tx4FkZKOiff-ko4', // for Mapquest, OpenCage, Google Premier
        formatter: null         // 'gpx', 'string', ...
    };


    var geocoder = NodeGeocoder(options);

    geocoder.reverse({lat:45.767, lon:4.833})
        .then(function(res) {
            console.log(res);
        })
        .catch(function(err) {
            console.log(err);*/

    /*  var currentDate = new Date('2019-03-05T06:28:02.859Z');


      var year = currentDate.getFullYear();
      var day = currentDate.getDate() < 10 ? "0" + currentDate.getDate() : currentDate.getDate();
      var mon = ("0" + (currentDate.getMonth() + 1)).slice(-2);



      /*var hours 	= currentDate.getHours() > 12 ? currentDate.getHours() - 12 : currentDate.getHours();
      var am_pm 	= currentDate.getHours() >= 12 ? "PM" : "AM";
          hours 	= hours < 10 ? "0" + hours : hours;
      var minutes = currentDate.getMinutes() < 10 ? "0" + currentDate.getMinutes() : currentDate.getMinutes();
      // var seconds = currentDate.getUTCSeconds() < 10 ? "0" + currentDate.getUTCSeconds() : currentDate.getUTCSeconds();
      var time	= currentDate.toLocaleTimeString('en-GB', { hour: "numeric",
          minute: "numeric"});
      //var time	= hours + ":" + minutes + ":" + seconds + " " +  am_pm;

      var dateString = day + "-" + mon + "-" + year + " " + time*/

    var dateString = fun.max_date(['2019-03-05T13:17:37.800Z', '2019-03-05T12:17:37.800Z', '2019-03-05T18:17:37.800Z']);


    res.json({message: 'SUCESS',status:dateString});
});


//get MIS REPORT
app.post('/api/getMISFormat',function (req, res) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var MISFormat;
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                /*if(req.body.productName=='ME'){
                    MISFormat = config.baseTUrl + 'ME-INPUT_FORMAT.xlsx';
                }else
                    MISFormat = config.baseTUrl + 'INPUT-FORMAT.xlsx';*/
                MISFormat = config.baseTUrl + 'ME-INPUT_FORMAT.xlsx';
                res.json({message: 'DOCS GENERATED', status: 1,MISFormat:MISFormat});
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});


//generate pdf
app.post('/api/generateDocReport',function (req, res) {
    var codelength = 4;
    //console.log(req.body.fromDate)
    var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

    if(!req.headers.authorization || !req.body.bankName || !req.body.internalRef_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                var verifiers = null,pdfFormat,agency_remarks = '';

                model.getPdfReport(req, function (err, objFile) {
                    //  console.log(objFile)
                    if (objFile != null) {
                        model.getProductFields(req, function (err, objProd) {
                            console.log(objProd)
                            if (objProd != null) {
                                pdfFormat = objProd.pdfFormat;
                                for (var i = 0; i < objFile.productFields.length; i++) {
                                    if (objFile.productFields[i].DISPLAY_NAME == 'Agency Remarks') {
                                        agency_remarks = objFile.productFields[i].VALUE

                                    }
                                }
                            }

                            if(req.body.productName=='ME'){
                                agency_remarks = objFile.file_verification_remarks;
                            }


                            var Agency_Remarks_part2;
                            console.log("Agency emark Length=======>")
                            console.log(agency_remarks.length)
                            var upper_limit_around = 1500,upper_limit = 1500,buffer_limit;
                            if(agency_remarks.length > upper_limit_around) {
                                pdfFormat = 'AL_PL_HL_BL_multiPage.html';

                                if(req.body.productName=='ME'){
                                    console.log("ME_multiPage====>")
                                    pdfFormat = 'ME_multiPage.html';
                                }
                                buffer_limit = agency_remarks.substring(upper_limit_around).indexOf("<br>")
                                if(buffer_limit>400)
                                    buffer_limit = agency_remarks.substring(upper_limit_around).indexOf(" ")
                                console.log("buffer_limit==================================>",buffer_limit)
                                var upper_limit = upper_limit_around + buffer_limit;
                                console.log("upper_limit==================================>",upper_limit)
                                Agency_Remarks_part2 = agency_remarks.substring(upper_limit, agency_remarks.length)
                                console.log(Agency_Remarks_part2)
                            }



                            console.log("pdfFormat===============")
                            console.log(pdfFormat)
                            if (pdfFormat != undefined) {
                                var objjb = {};
                                var images = [];
                                var place = [];
                                for (var j = 0; j < objFile.document.length; j++) {
                                    if (verifiers != null) {
                                        verifiers = verifiers + ',' + objFile.document[j].verifier;

                                    } else {
                                        verifiers = objFile.document[j].verifier;
                                    }

                                }


                                fs.readFile(config.uploadTPath + pdfFormat, function (err, data) {

                                    var uname;
                                    if (objFile.username.includes(" ")) {
                                        uname = objFile.username;
                                        var arr = uname.split(" ");
                                        uname = arr[0];
                                    } else
                                        uname = objFile.username;

                                    var pname;
                                    if (objFile.productName.includes(" ")) {
                                        pname = objFile.productName;
                                        var arr = pname.split(" ");
                                        pname = arr[0];
                                    } else
                                        pname = objFile.productName;

                                    var currentDate = new Date();


                                    var year = currentDate.getFullYear();
                                    var day = currentDate.getDate() < 10 ? "0" + currentDate.getDate() : currentDate.getDate();
                                    var mon = ("0" + (currentDate.getMonth() + 1)).slice(-2);

                                    var dateString = day + mon + year

                                    var reportWord = 'REPORT' + '-' + req.body.bankName + '-' + req.body.branchName + '-' + uname + '-' + objFile.file_Id + '-' + pname + '-' + dateString + '-' + code;

                                    var out = fs.createWriteStream(config.uploadTPath + reportWord + '.docx');

                                    if (objFile.productFields) {
                                        for (var i = 0; i < objFile.productFields.length; i++) {
                                            if (objFile.productFields[i].TYPE == 'date') {
                                                var currentDate = objFile.productFields[i].VALUE;
                                                if (currentDate.includes(" ")) {
                                                    // console.log(currentDate)
                                                    currentDate = currentDate.split(" ");
                                                    objFile.productFields[i].VALUE = currentDate[0]
                                                }
                                            }



                                            var fieldKey = objFile.productFields[i].FIELD;
                                            var fieldKVal = objFile.productFields[i].VALUE;
                                            // console.log(fieldKey)
                                            fieldKey = fieldKey.replace(" ", "_")
                                            //console.log(fieldKey)
                                           // console.log(fieldKVal)

                                            if(fieldKVal!='') {
                                                console.log("fieldKValfieldKValfieldKVal")
                                                console.log(fieldKey)
                                                if (fieldKey == 'CPC_Name') {
                                                    data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                    data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                }else if (objFile.productFields[i].FIELD == 'ME_LEGAL_NAME') {
                                                    data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                    data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                }else if (fieldKey == 'Agency_Remarks') {
                                                    console.log("Agency_RemarksAgency_RemarksAgency_RemarksAgency_Remarks")
                                                    if(agency_remarks.length > upper_limit) {
                                                        fieldKVal= agency_remarks.substring(0,upper_limit)
                                                        data = data.toString().replace('{' + fieldKey + '}', fieldKVal );
                                                        console.log("Agency_Remarks_part2",Agency_Remarks_part2)
                                                        data = data.toString().replace('{Agency_Remarks2}', Agency_Remarks_part2 );

                                                    }else
                                                        data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                }else{
                                                    console.log("other field===>",fieldKey)
                                                    data = data.toString().replace('{' + fieldKey + '}', fieldKVal);
                                                }
                                            }
                                            else
                                                data = data.toString().replace('{' + fieldKey + '}', "");


                                            if (req.body.productName == 'ME') {
                                                //createdDate = createdDate.split(" ");
                                                if (objFile.productFields[i].FIELD== 'REMARKS') {
                                                    if(agency_remarks.length > upper_limit) {
                                                        //console.log("remark22222222222222222222222222222",Agency_Remarks_part2)
                                                        fieldKVal= agency_remarks.substring(0,upper_limit)
                                                        console.log("remark22222222222222222222222222222",fieldKVal)
                                                        console.log("remarkyyyyyyyyyyyyyyyyyyyyyyyy",Agency_Remarks_part2)
                                                        data = data.toString().replace('{Agency_Remarks}', fieldKVal);

                                                    }else
                                                        data = data.toString().replace('{Agency_Remarks}', fieldKVal);

                                                    data = data.toString().replace('{Agency_Remarks2}', Agency_Remarks_part2 );
                                                }

                                                if (fieldKey== 'STATUS') {
                                                    console.log("statussssssssssssssssssssssssssssssssss")
                                                    data = data.toString().replace('{Status}', fieldKVal);
                                                }
                                                if (fieldKey== 'BAR_Code') {
                                                    console.log("statussssssssssssssssssssssssssssssssss")
                                                    data = data.toString().replace('{MID}', objFile.file_Id);
                                                }

                                                var submitDate;
                                                console.log("submit date====>")
                                                console.log()
                                                if(objFile.verifiedAt!=null)
                                                    submitDate = fun.getFormatDate(objFile.verifiedAt)
                                                var createdDate = fun.getFormatDate(objFile.createdAt);

                                                data = data.toString().replace('{Date_of_Pickup}', createdDate);
                                                if(submitDate!=undefined)
                                                    data = data.toString().replace('{REPORT_DATE}', submitDate);
                                                else
                                                    data = data.toString().replace('{REPORT_DATE}', "");


                                                data = data.toString().replace('{Office_Full_Address}', objFile.customer_office_full_address);
                                            }

                                        }

                                        for (var i = 0; i < objFile.document.length; i++) {
                                            console.log("images 00000000000000000000")
                                            for (var j = 0; j < objFile.document[i].verifier_image.length; j++) {
                                                console.log("images 00000000000000000000111111111111111111")
                                                if (objFile.document[i].verifier_image[j].checked == true) {
                                                    var img = objFile.document[i].verifier_image[j].image;
                                                    images.push(img);
                                                    if(objFile.document[i].location!=undefined){
                                                        place.push(objFile.document[i].location.inputLocation)
                                                    }

                                                }
                                            }
                                        }

                                        if (images[0]) {
                                            //<a href="#" onClick="window.open('http://www.yahoo.com', '_blank')">test</a>
                                            data = data.toString().replace('{%image}', '<a href="{link}"><img src="{img}"  height="200" width="200" /></a>');
                                            data = data.toString().replace('{img}', images[0]);
                                            var link = 'https://www.google.com/maps/place/' + place[0];
                                            console.log(link)
                                            data = data.toString().replace('{link}', link);
                                        } else {
                                            data = data.toString().replace('{%image}', "")
                                        }
                                        if (images[1]) {
                                            data = data.toString().replace('{%image1}', '<a href="{link1}"><img src="{img1}" height="200" width="200" /></a>');
                                            data = data.toString().replace('{img1}', images[1]);
                                            var link = 'https://www.google.com/maps/place/' + place[1];
                                            data = data.toString().replace('{link1}', link);
                                        } else {
                                            data = data.toString().replace('{%image1}', "")
                                        }
                                        if (images[2]) {
                                            data = data.toString().replace('{%image2}', '<a href="{link2}" target ="_blank"><img src="{img2}" height="200px" width="200px" /></a>');
                                            data = data.toString().replace('{img2}', images[2]);
                                            var link = 'https://www.google.com/maps/place/' + place[2];
                                            data = data.toString().replace('{link2}', link);
                                        } else {
                                            data = data.toString().replace('{%image2}', "")
                                        }
                                        if (images[3]) {
                                            data = data.toString().replace('{%image3}', '<a href="{link3}" target ="_blank"><img src="{img3}" height="200px" width="200px" /></a>');
                                            data = data.toString().replace('{img3}', images[3]);
                                            var link = 'https://www.google.com/maps/place/' + place[3];
                                            data = data.toString().replace('{link3}', link);
                                        } else {
                                            data = data.toString().replace('{%image3}', "")
                                        }

                                        data = data.toString().replace('{Verifier_Name}', verifiers);
                                        //var createdDate = fun.getFormatDate(objFile.createdAt);

                                        data = data.toString().replace('{sign}', config.baseTUrl + 'sign.jpg');



                                    }
                                    // data = data.toString().replace('{name1}', 'SANDRA1');
                                    // data =  data.toString().replace('{Agency_Remarks}', Agency_Remarks);
                                    //data = data.toString().replace('{%image}', '<a href="https://google.com"><img src="file:///var/www/html/nodeJS/projects/html_docx_pdf/templates/logo.png" height="200px" width="200px" /></a>');


                                    out.write(data);
                                    out.end();

                                    console.log('Finished to create the DOCX file!');


                                    wordBuffer = data

                                    var ttt = toPdf(wordBuffer);

                                    //console.log('3333333333');

                                    toPdf(wordBuffer).then(
                                        (pdfBuffer) => {

                                            fs.writeFileSync(config.uploadTPath + reportWord + ".pdf", pdfBuffer)
                                        }, (err) => {
                                        }
                                    )


                                    setTimeout(function () {
                                        // res.json({message: 'DOCS GENERATED', status: 1, data: config.baseTUrl + code + '.docx'});
                                        res.json({
                                            message: 'DOCS GENERATED',
                                            status: 1,
                                            data: config.baseTUrl + reportWord + ".docx",
                                            pdf: config.baseTUrl + reportWord + ".pdf"
                                        });
                                    }, 8000);

                                });


                            }else
                                res.json({message: 'NO_MIS_FORMAT EXISTS',status:4});

                        });
                    }else
                        res.json({message: 'NO_DATA_FOUND',status:4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }

});



//generate pdf
app.post('/api/generateDocReportOld',function (req, res) {
    console.log("generate Pdf")
    var nowDate = new Date();
    nowDate = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
    var codelength = 4;
    //console.log(req.body.fromDate)
    var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

    if(!req.headers.authorization || !req.body.bankName || !req.body.branchName || !req.body.internalRef_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var pdfFormat,agency_remarks = '',verifiers = null;
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getPdfReport(req, function (err, objFile) {
                    if (objFile != null) {
                        model.getProductFields(req, function (err, objProd) {
                            if (objProd != null) {
                                pdfFormat = objProd.pdfFormat;
                            }
                            //  console.log("pdfFormat===============")
                            // console.log(pdfFormat)
                            if(pdfFormat!=undefined) {

                                if (objFile.productFields) {
                                    for (var i = 0; i < objFile.productFields.length; i++) {
                                        if (objFile.productFields[i].DISPLAY_NAME == 'Agency Remarks') {
                                            agency_remarks = objFile.productFields[i].VALUE

                                        }
                                    }
                                    for (var j = 0; j < objFile.document.length; j++) {
                                        if (verifiers!=null) {
                                            verifiers = verifiers + ','+objFile.document[j].verifier;

                                        }else{
                                            verifiers = objFile.document[j].verifier;
                                        }
                                    }
                                }

                                var createdDate = fun.getFormatDate(objFile.createdAt);



                                if(req.body.productName=='ME'){
                                    agency_remarks = objFile.file_verification_remarks;
                                }
                                var content,Agency_Remarks_part2;
                                console.log("Agency emark Length=======>")
                                console.log(agency_remarks.length)
                                var upper_limit_around = 2000,upper_limit = 2000;
                                if(agency_remarks.length > upper_limit_around) {
                                    pdfFormat = 'AL_PL_HL_BL_multipage.docx';

                                    if(req.body.productName=='ME'){
                                        pdfFormat = 'ME_PDF_Report_multipage.docx';
                                    }
                                    buffer_limit = agency_remarks.substring(upper_limit_around, upper_limit_around+10).indexOf(" ")
                                    var upper_limit = upper_limit_around + buffer_limit;
                                    Agency_Remarks_part2 = agency_remarks.substring(upper_limit, agency_remarks.length)
                                    content = fs
                                        .readFileSync(path.resolve(config.uploadTPath, pdfFormat), 'binary');
                                }else{
                                    content = fs
                                        .readFileSync(path.resolve(config.uploadTPath, pdfFormat), 'binary');
                                }
                                var zip = new JSZip(content);

                                var doc = new Docxtemplater();

                                //  var LinkModule = require('docxtemplater-link-module');
                                // var linkModule = new LinkModule();

                                var opts = {}
                                opts.centered = false;
                                opts.getImage=function(tagValue, tagName) {
                                    return fs.readFileSync(tagValue);
                                }

                                opts.getSize=function(img,tagValue, tagName) {
                                    return [150,150];
                                }

                                var imageModule=new ImageModule(opts);

                                doc.attachModule(imageModule);
                                // doc.attachModule(linkModule);

                                doc.loadZip(zip);

                                var images = [];

                                for(var i=0;i<objFile.document.length;i++){
                                    for(var j=0;j<objFile.document[i].verifier_image.length;j++) {
                                        if(objFile.document[i].verifier_image[j].checked==true) {
                                            var img = objFile.document[i].verifier_image[j].image;
                                            img = img.split('/');
                                            img = config.uploadPath + img[img.length - 1];
                                            images.push(img);
                                        }
                                    }
                                }



                                var objjb = {};
                                if (objFile.productFields) {
                                    for (var i = 0; i < objFile.productFields.length; i++) {
                                        if(objFile.productFields[i].TYPE=='date'){
                                            var currentDate = objFile.productFields[i].VALUE;
                                            if(currentDate.includes(" ")) {
                                                // console.log(currentDate)
                                                currentDate = currentDate.split(" ");
                                                objFile.productFields[i].VALUE = currentDate[0]
                                            }
                                        }
                                        if (objFile.productFields[i].DISPLAY_NAME == 'Agency Remarks') {
                                            if(agency_remarks.length > upper_limit) {
                                                objFile.productFields[i].VALUE = agency_remarks.substring(0,upper_limit)
                                            }
                                        }
                                        var fieldKey = objFile.productFields[i].FIELD;
                                        var fieldKVal = objFile.productFields[i].VALUE;
                                        objjb[fieldKey] = fieldKVal

                                    }

                                    objjb['image'] = images[0]
                                    objjb['image1'] = images[1]
                                    objjb['image2'] = images[2]
                                    objjb['image3'] = images[3]
                                    objjb['status'] = objFile.feedback_status
                                    objjb['Agency_Remarks_part2'] = Agency_Remarks_part2
                                    objjb['Verifier_Name'] = verifiers
                                    objjb['link'] = 'www.google.com'


                                    if(req.body.productName=='ME') {
                                        createdDate = createdDate.split(" ");
                                        var submitDate;
                                        console.log("submit date====>")
                                        submitDate = fun.getFormatDate( objFile.verifiedAt)
                                        //submitDate = submitDate.split(" ");
                                        objjb['Date_of_Pickup'] = createdDate;
                                        objjb['REPORT_DATE'] = submitDate;
                                        objjb['CUSTOMER_NAME'] = objFile.username;
                                        if(agency_remarks.length > upper_limit) {
                                            objjb['Agency_Remarks'] = agency_remarks.substring(0,upper_limit)
                                        }else
                                            objjb['Agency_Remarks'] = agency_remarks

                                    }

                                    if(objFile.productName=='ME'){
                                        objjb['Office_Full_Address'] = objFile.customer_office_full_address;
                                    }

                                    console.log('hia agency', objjb);
                                    doc.setData(objjb);

                                }

                                try {
                                    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
                                    doc.render()
                                }
                                catch (error) {
                                    var e = {
                                        message: error.message,
                                        name: error.name,
                                        stack: error.stack,
                                        properties: error.properties,
                                    }
                                    console.log(JSON.stringify({error: e}));
                                    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
                                    throw error;
                                }

                                var buf = doc.getZip()
                                    .generate({type: 'nodebuffer'});
                                var uname;
                                if(objFile.username.includes(" ")){
                                    uname = objFile.username;
                                    var arr = uname.split(" ");
                                    uname = arr[0];
                                }else
                                    uname = objFile.username;

                                var pname;
                                if(objFile.productName.includes(" ")){
                                    pname = objFile.productName;
                                    var arr = pname.split(" ");
                                    pname = arr[0];
                                }else
                                    pname = objFile.productName;

                                var currentDate = new Date();


                                var year = currentDate.getFullYear();
                                var day = currentDate.getDate() < 10 ? "0" + currentDate.getDate() : currentDate.getDate();
                                var mon = ("0" + (currentDate.getMonth() + 1)).slice(-2);

                                var dateString = day  + mon  + year

                                var reportWord ='REPORT'+'-'+req.body.bankName+'-'+req.body.branchName+'-'+uname+'-'+objFile.file_Id+'-'+pname+ '-'+dateString+ '-'+code;

                                // buf is a nodejs buffer, you can either write it to a file or do anything else with it.
                                fs.writeFileSync(path.resolve(config.uploadTPath, reportWord + '.docx'), buf);

                                //  console.log("docxxxxxxxxxxxxxxxxxxxxxx")
                                // console.log(config.baseTUrl + reportWord + '.docx')




                                var wordBuffer = fs.readFileSync(config.uploadTPath + reportWord + '.docx')


                                toPdf(wordBuffer).then(
                                    (pdfBuffer) => {
                                        // console.log("beforeee============>")
                                        //console.log(pdfBuffer)
                                        fs.writeFileSync(config.uploadTPath + reportWord + '.pdf', pdfBuffer)
                                        // console.log("pdfBuffer=============>")
                                        // console.log(pdfBuffer)
                                    }, (err) => {
                                        console.log(err)
                                    }
                                )

                                // res.json({message: 'DOCS GENERATED', status: 1, data: config.baseTUrl + code + '.docx',pdf:config.baseTUrl + code + '.pdf'});
                                setTimeout(function(){
                                    // res.json({message: 'DOCS GENERATED', status: 1, data: config.baseTUrl + code + '.docx'});
                                    res.json({message: 'DOCS GENERATED', status: 1, data: config.baseTUrl + reportWord + '.docx',pdf:config.baseTUrl + reportWord + '.pdf'});
                                }, 5000);

                            }else
                                res.json({message: 'NO_MIS_FORMAT EXISTS',status:4});

                        });
                    }else
                        res.json({message: 'NO_DATA_FOUND',status:4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


//get MIS REPORT
app.post('/api/getMISReport',function (req, res) {
    var excel = require('excel4node');
    var wb = new excel.Workbook();
    var codelength = 4;
    //console.log(req.body.fromDate)
    var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

    const ws = wb.addWorksheet('sheet'+code);
    //wb.removeWorksheet(ws.id);
    if(!req.headers.authorization || !req.body.bankName || !req.body.from || !req.body.t){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }

        var product_arr = [];
        var branch_arr = [];

        if(req.body.productName==undefined){
            req.body.productName = 'ALL'
        }

        var headings = [];
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                var docs = [];
                console.log("req.body.productName================")
                console.log(req.body.productName)
                console.log(typeof(req.body.productName))

                if(typeof(req.body.productName)=='object'){
                    for(var i=0;i<req.body.productName.length;i++){
                        product_arr.push(req.body.productName[i].product_name)
                    }
                    req.body.productName = product_arr;
                }
                if(typeof(req.body.branchName)=='object'){
                    for(var i=0;i<req.body.branchName.length;i++){
                        branch_arr.push(req.body.branchName[i].branch_name)
                    }
                    req.body.branchName = branch_arr;
                }
                console.log(req.body.productName)
                console.log(req.body.branchName)

                model.getReportData(req, function (err, objFile) {
                    if (objFile != null) {
                        for(var i=0;i<objFile.length;i++){
                            if(objFile[i].is_active=='active') {
                                var file = {fileName: objFile[i].file_Id, productFields: objFile[i].productFields,status:objFile[i].status,feedback_status:objFile[i].feedback_status};
                                docs.push(file);
                            }
                        }
                    }

                    if(docs.length!=0) {
                        if (typeof(req.body.productName)=='object') {

                            model.getBank(req, function (err, objBank) {
                                if (objBank != null) {
                                    if (objBank.fields.length != 0) {
                                        headings = objBank.fields;
                                        req.body.headings = headings;
                                        // console.log("headings", headings)
                                        for (var j = 0; j < headings.length; j++) {
                                            // console.log(docs[0].productFields[j].DISPLAY_NAME)
                                            console.log(headings[j].DISPLAY_NAME)
                                            ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                fill: {
                                                    type: 'pattern', // the only one implemented so far.
                                                    patternType: 'solid', // most common.
                                                    fgColor: '#FFFF66',
                                                    bgColor: '#FF0800'  // most common.
                                                }, font: {size: 9, bold: true}
                                            });
                                        }
                                    }
                                }
                                done(ws,req,docs,wb,code,headings,objFile)
                            });

                            /*req.body.branch_name = req.body.branchName;
                            model.getBranchByBank(req, function (err, objBranch) {
                                if (objBranch != null) {
                                    if (objBranch.fields.length != 0) {
                                        headings = objBranch.fields
                                        for (var j = 0; j < headings.length; j++) {
                                            // console.log(docs[0].productFields[j].DISPLAY_NAME)
                                            ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                fill: {
                                                    type: 'pattern', // the only one implemented so far.
                                                    patternType: 'solid', // most common.
                                                    fgColor: '#FFFF66',
                                                    bgColor: '#FF0800'  // most common.
                                                }, font: {size: 9, bold: true}
                                            });
                                        }
                                        done(ws,req,docs,wb,code,headings,objFile)
                                    }
                                    else {
                                        console.log("1 else")
                                        model.getBank(req, function (err, objBank) {
                                            if (objBank != null) {
                                                if (objBank.fields.length != 0) {
                                                    headings = objBank.fields
                                                    for (var j = 0; j < headings.length; j++) {
                                                       // console.log(headings[j].DISPLAY_NAME)
                                                        ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                            fill: {
                                                                type: 'pat' +
                                                                    '' +
                                                                    'tern', // the only one implemented so far.
                                                                patternType: 'solid', // most common.
                                                                fgColor: '#FFFF66',
                                                                bgColor: '#FF0800'  // most common.
                                                            }, font: {size: 9, bold: true}
                                                        });
                                                    }
                                                }
                                            }
                                            done(ws,req,docs,wb,code,headings,objFile)
                                        });
                                    }
                                } else {
                                    console.log("2 else")
                                    model.getBank(req, function (err, objBank) {
                                        if (objBank != null) {
                                            if (objBank.fields.length != 0) {
                                                headings = objBank.fields;
                                                req.body.headings = headings;
                                               // console.log("headings", headings)
                                                for (var j = 0; j < headings.length; j++) {
                                                    // console.log(docs[0].productFields[j].DISPLAY_NAME)
                                                    console.log(headings[j].DISPLAY_NAME)
                                                    ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                        fill: {
                                                            type: 'pattern', // the only one implemented so far.
                                                            patternType: 'solid', // most common.
                                                            fgColor: '#FFFF66',
                                                            bgColor: '#FF0800'  // most common.
                                                        }, font: {size: 9, bold: true}
                                                    });
                                                }
                                            }
                                        }
                                        done(ws,req,docs,wb,code,headings,objFile)
                                    });
                                }
                            });*/
                        } else {
                            console.log("MEEEEEEEEEEEEEEEEEEEEEE")
                            model.getProductField(req, function (err, objProd) {
                                if (objProd.length != 0) {
                                    if (objProd[0].fields.length != 0) {
                                        headings = objProd[0 ].fields
                                        console.log(headings)
                                        for (var j = 0; j < headings.length; j++) {
                                            // console.log(docs[0].productFields[j].DISPLAY_NAME)
                                            ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                fill: {
                                                    type: 'pattern', // the only one implemented so far.
                                                    patternType: 'solid', // most common.
                                                    fgColor: '#FFFF66',
                                                    bgColor: '#FF0800'  // most common.
                                                }, font: {size: 9, bold: true}
                                            });
                                        }
                                        done(ws,req,docs,wb,code,headings,objFile)
                                    }else{
                                        model.getBank(req, function (err, objBank) {
                                            if (objBank != null) {
                                                if (objBank.fields.length != 0) {
                                                    headings = objBank.fields
                                                    for (var j = 0; j < headings.length; j++) {
                                                        // console.log(headings[j].DISPLAY_NAME)
                                                        ws.cell(1, j + 1).string(headings[j].DISPLAY_NAME).style({
                                                            fill: {
                                                                type: 'pat' +
                                                                    '' +
                                                                    'tern', // the only one implemented so far.
                                                                patternType: 'solid', // most common.
                                                                fgColor: '#FFFF66',
                                                                bgColor: '#FF0800'  // most common.
                                                            }, font: {size: 9, bold: true}
                                                        });
                                                    }
                                                }
                                            }
                                            done(ws,req,docs,wb,code,headings,objFile)
                                        });
                                    }
                                }
                            });
                        }

                        var date = fun.getDateTime();
                        var name = 'DailyMIS';
                        if(req.body.productName=='ME')
                            name = 'ME-MIS'
                        setTimeout(function(){
                            res.json({message: 'SUCCESS',status:1,url:config.baseRUrl+name+'-'+req.body.bankName+'-'+date +'.xlsx'});
                        }, 7000);

                        // workbook.removeWorksheet(ws.id);
                    }else
                        res.json({message: 'NO_DATA_FOUND',status:4,body:req.body});

                });



            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});


function done(ws,req,docs,wb,code, headings) {
    var i=2 , val = 1,name = 'DailyMIS';
    if(req.body.productName=='ME')
        name = 'ME-MIS'

    //console.log("headings",headings)
    var date = fun.getDateTime();
    docs.forEach(element => {
        console.log("producttt")
        console.log(element.productName)
        if (element.productName != ''){
            ws.row(i).setHeight(50);

            var j = 0;//product field increment
            // console.log(element.productFields.length);
            for (var k = 0; k < headings.length; k++) {//loop through the headings
                if (j + 1 > element.productFields.length) {
                    ws.cell(i, k + 1).string(' ').style({
                        font: {
                            size: 9,
                            color: '#DE3825'
                        }
                    });
                } else {

                    if (element.productFields[j].DISPLAY_NAME != headings[k].DISPLAY_NAME) {//if there is mismatch
                        //console.log(element.productFields[j].DISPLAY_NAME +'!='+ headings[k].DISPLAY_NAME);
                        ws.cell(i, k + 1).string(' ').style({
                            font: {
                                size: 9,
                                color: '#DE3825'
                            }
                        });
                    } else {
                        ////actual data here

                        if (element.productFields[j].FIELD == 'Agency_Remarks') {
                            var a_r = element.productFields[j].VALUE;
                            element.productFields[j].VALUE = a_r.replace(/<br>/g,"\n")
                        }
                        if (element.productFields[j].FIELD == 'REMARKS') {
                            var a_r = element.productFields[j].VALUE;
                            element.productFields[j].VALUE = a_r.replace(/<br>/g,"\n")
                        }

                        // console.log("now date")
                        //  console.log(element.productFields[j].VALUE)
                        if (element.status == 'COMPLETED' || element.status == 'SENT') {
                            // console.log(element.productFields[j].FIELD)
                            // console.log(element.feedback_status)
                            if (element.productFields[j].FIELD == 'Sr No') {
                                if (element.feedback_status.toUpperCase() == 'FRAUD' || element.feedback_status.toUpperCase() == 'DOCUMENT DECLINE' || element.feedback_status.toUpperCase() == 'PROFILE DECLINE' || element.feedback_status.toUpperCase() == 'NEGATIVE' || element.feedback_status.toUpperCase() == 'FAILED') {
                                    ws.cell(i, k + 1).number(val).style({
                                        font: {
                                            size: 9,
                                            color: '#DE3825'
                                        }
                                    });
                                } else if (element.feedback_status.toUpperCase() == 'POSITIVE') {
                                    ws.cell(i, k + 1).number(val).style({
                                        font: {
                                            size: 9,
                                            color: '#0A0504'
                                        }
                                    });
                                } else {
                                    ws.cell(i, k + 1).number(val).style({
                                        font: {
                                            size: 9,
                                            color: '#096D0F'
                                        }
                                    });
                                }
                            } else {
                                if (element.feedback_status.toUpperCase() == 'FRAUD' || element.feedback_status.toUpperCase() == 'DOCUMENT DECLINE' || element.feedback_status.toUpperCase() == 'PROFILE DECLINE' || element.feedback_status.toUpperCase() == 'NEGATIVE' || element.feedback_status.toUpperCase() == 'FAILED') {
                                    if (element.productFields[j].VALUE == 'Other')
                                        ws.cell(i, k + 1).string(element.productFields[j].OTHER_VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#DE3825'
                                            }, alignment: {wrapText: true},

                                        });
                                    else
                                        ws.cell(i, k + 1).string(element.productFields[j].VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#DE3825'
                                            }, alignment: {wrapText: true},
                                        });
                                } else if (element.feedback_status.toUpperCase() == 'POSITIVE') {
                                    if (element.productFields[j].VALUE == 'Other')
                                        ws.cell(i, k + 1).string(element.productFields[j].OTHER_VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#0A0504'
                                            }, alignment: {wrapText: true},
                                        });
                                    else
                                        ws.cell(i, k + 1).string(element.productFields[j].VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#0A0504'
                                            }, alignment: {wrapText: true},
                                        });
                                } else {
                                    if (element.productFields[j].VALUE == 'Other')
                                        ws.cell(i, k + 1).string(element.productFields[j].OTHER_VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#096D0F'
                                            }, alignment: {wrapText: true},
                                        });
                                    else
                                        ws.cell(i, k + 1).string(element.productFields[j].VALUE).style({
                                            font: {
                                                size: 9,
                                                color: '#096D0F'
                                            }, alignment: {wrapText: true},
                                        });
                                }
                            }
                        } else {
                            if (element.productFields[j].FIELD == 'Sr No') {

                                ws.cell(i, k + 1).number(val).style({
                                    font: {
                                        size: 9,
                                        color: '#CD66B1'
                                    },
                                }).alignment = {wrapText: true};
                            } else {
                                if (element.productFields[j].VALUE == 'Other')
                                    ws.cell(i, k + 1).string(element.productFields[j].OTHER_VALUE).style({
                                        font: {
                                            size: 9,
                                            color: '#CD66B1'
                                        }, alignment: {wrapText: true},
                                    });
                                else
                                    ws.cell(i, k + 1).string(element.productFields[j].VALUE).style({
                                        font: {
                                            size: 9,
                                            color: '#CD66B1'
                                        }, alignment: {wrapText: true},
                                    });
                            }
                        }

                        j++;
                    }


                }

            }

            i = i + 1;
            val = val + 1;
        }

    });
    wb.write(config.uploadRPath + name+'-'+req.body.bankName+'-'+date +'.xlsx');
}



// API FOR OTP VERIFICATION
app.post('/api/getOTP', function (req, res) {
    if(!req.body.mobile){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        model.loginUserApp(req, function (err, obj) {
            if (obj != null) {
                if (obj.userType == 'sampler' || obj.userType == 'sampler/verifier' || obj.userType == 'verifier') {
                    var code = sms.sendOTP(req.body.mobile);
                    // console.log("code===========>")
                    // console.log(code)
                    obj.otp = code;
                    model.updateUser(obj);
                    //console.log(obj)
                    res.json({
                        message: 'USER_LOGIN_PASS1',
                        username: obj.username,
                        status: 1,
                        otp: code
                    });
                }else{
                    res.json({message: 'Invalid user', status: 2});
                }
            } else {
                res.json({message: 'USER_NOT_FOUND', status: 4});
            }
        });
    }
});

// API FOR LOGIN WEB
app.post('/api/login', function (req, res) {

    if(!req.body.username || !req.body.password || !req.body.device_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        model.signInUser(req, function(err, obj) {
            //console.log(obj)
            if (obj != null) {
                var token = crypto.randomBytes(12).toString('hex');
                var data = {
                    accessToken: token,
                    deviceId: req.body.device_id
                }
                if (obj.status == "active"){
                    model.addToken(data, obj, function (err, token) {

                        res.json({message: 'LOGIN_SUCCESS', status: 1, data: token});
                    });
                }else {
                    res.json({message: 'DISABLED_USER',status:4});
                }
                //  res.json({message: 'LOGIN_SUCCESS',status:1});
            }else{
                res.json({message: 'USER_NOT_FOUND',status:4});
            }
        });
    }
});

// API FOR LOGIN APP
app.post('/api/appLogin', function (req, res) {

    if(!req.body.mobile || !req.body.otp || !req.body.device_id){
        // console.log("otp loginnnn")
        // console.log(req.body.device_id)
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        model.getUser(req, function(err, obj) {
            console.log(obj)
            if (obj != null) {
                var token = crypto.randomBytes(12).toString('hex');
                var data = {
                    accessToken: token,
                    deviceId: req.body.device_id
                }
                if (obj.userType == 'sampler' || obj.userType == 'sampler/verifier' || obj.userType == 'verifier'){
                    model.addToken(data, obj, function (err, token) {

                        data = {
                            accessToken: token.accessToken,
                            deviceId: token.deviceId,
                            email: token.user.companyEmail,
                            emp_id: token.user.emp_id,
                            firstName: token.user.firstName,
                            lastName: token.user.lastName,
                            mobile: token.user.mobile,
                            status: token.user.status,
                            userType: token.user.userType,
                            username: token.user.username
                        }

                        res.json({message: 'LOGIN_SUCCESS', status: 1, data: data});
                    });
                    //  res.json({message: 'LOGIN_SUCCESS',status:1});
                }else{
                    res.json({message: 'INVALID USER',status:4});
                }
            }else{
                res.json({message: 'USER_NOT_FOUND',status:4});
            }
        });
    }
});

// API FOR PUNCH IN
app.post('/api/punchIn', function (req, res) {
    console.log(req.headers.authorization)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                req.body.mobile = obj.user.mobile;

                model.loginUserApp(req, function (err, objUser) {
                    if (objUser != null) {
                        if (objUser.password == req.body.password) {
                            var nowDate = new Date();
                            data = {
                                emp_id: obj.user.emp_id,
                                expires: "",
                                userType: req.body.userType,
                                password: req.body.password,
                                location_punchIn: req.body.location_punchIn,
                                location_punchOut: "",
                                punchInTime: nowDate,
                                punchOutTime: ""
                            }

                            model.addPuchIn(data, function (err, objPunch) {
                                if (objPunch != null) {
                                    res.json({message: 'SUCCESS', status: 1, data: objPunch});
                                } else {
                                    res.json({message: 'FAILURE', status: 2});
                                }
                            });
                        } else {
                            res.json({message: 'INVALID_PASSWORD', status: 2});
                        }
                    }else {
                        res.json({message: 'INVALID_USER', status: 2});
                    }
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});

// API FOR PUNCH OUT
app.post('/api/punchOut', function (req, res) {

    // console.log(req.headers.authorization)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {

                var nowDate = new Date();

                data = {
                    emp_id: obj.user.emp_id,
                    punchInTime:req.body.punchInTime
                }

                model.getPuchIn(data, function(err, objPunch) {
                    if (objPunch != null) {
                        objPunch.punchOutTime = nowDate;
                        objPunch.location_punchOut = req.body.location_punchOut;
                        model.updatePunch(objPunch);
                        res.json({message: 'SUCCESS',status:1,data:objPunch});
                    }else{
                        res.json({message: 'FAILURE',status:2});
                    }
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }

});


// GET CURRENT SERVER TIME

app.get('/api/getCurrentTime', function (req, res) {
    var nowDate = new Date();
    res.json({message: 'SUCCESS',status:1,data:nowDate});

});

//API - FORGOT PWD
app.get('/api/forgotPassword', function (req, res) {
    console.log("Forgot Password")
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }

        model.getToken(data, function(err, obj) {
            if (obj != null) {
                var codelength = 4;
                var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

                var data = {
                    email:obj.user.personelEmail,
                    subject: 'Forgot Password', // Subject line
                    text: 'Forgot Password', // plain text body
                    html: 'Hi,<br>Your One Time password  : <b>'+code+'</b><br/>Your mobile number : <b>'+obj.user.mobile+'</b><br/>Regards,<br>Bvas Team' // html body
                }
                email.sendEmail(data);
                obj.user.otp = code;
                model.updateToken(obj);
                res.json({message: 'SUCCESS', status: 1});
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        })
    }
});

//API - RESET PWD
app.post('/api/resetPassword', function (req, res) {
    // console.log("Forgot Password")
    if(!req.headers.authorization || !req.body.otp || !req.body.password){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.otp == req.body.otp){
                    req.body.mobile = obj.user.mobile;
                    obj.user.password = req.body.password;
                    model.updateToken(obj);
                    model.loginUserApp(req, function (err, objUser) {
                        if (objUser != null) {
                            objUser.password =  req.body.password;
                            model.updateUser(objUser);
                            res.json({message: 'SUCCESS', status: 1});
                        }else{
                            res.json({message: 'INVALID_USER',status:2});
                        }
                    });
                }else
                    res.json({message: 'INVALID_OTP',status:2});
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        })
    }
});


//API - ADDUSER
app.post('/api/addUser', function (req, res) {
    console.log(req.body)
    if(!req.body.mobile || !req.body.firstName || !req.body.lastName || !req.body.userType){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {

                    model.checkUsers(req, function (err, objuser) {
                        if(objuser==null) {
                            model.getLastUser(req, function (err, obj) {
                                //  console.log(obj.length)
                                if (obj.length != 0) {
                                    // if(!obj[0].emp_id)
                                    console.log("existsss")
                                    var empId = obj[0].emp_id;
                                    var empIds = empId.split('-')
                                    var num = parseInt(empIds[1]) + 1;
                                    req.body.emp_id = 'EMP-' + num;
                                    // console.log(req.body.emp_id)
                                } else {
                                    var num = 1001;
                                    req.body.emp_id = 'EMP-' + num;
                                    console.log(req.body.emp_id)
                                }
                                //console.log("obj++++++++++++++")
                                if(req.body.userType=='admin' || req.body.userType=='supervisor'){
                                    model.checkUsername(req, function (err, objuserName) {
                                        if (objuserName == null) {
                                            model.addUser(req, function (err, user) {
                                                if (user != null) {
                                                    if(req.body.userType=='sampler' || req.body.userType=='verifier' || req.body.userType=='sampler/verifier'){
                                                        //send pwd
                                                        /*   var reverseMd5 = ReverseMd5({
                                                               lettersUpper: false,
                                                               lettersLower: true,
                                                               numbers: true,
                                                               special: false,
                                                               whitespace: true,
                                                               maxLen: 12
                                                           })*/

                                                        var data = {
                                                            email:user.personelEmail,
                                                            password:user.password,
                                                            subject: 'Welcome to BVAS', // Subject line
                                                            text: 'Welcome Email', // plain text body
                                                            html: 'Hi,<br>Your punch In password  : <b>'+user.password+'</b><br/>Your mobile number :<b>'+user.mobile+'</b><br/>Regards,<br>Bvas Team' // html body
                                                        }
                                                        email.sendEmail(data);
                                                    }
                                                    res.json({message: 'USER_REGISTRATION_SUCCESS', status: 1, data: user});
                                                } else
                                                    res.json({message: 'USER_REGISTRATION_FAILED', status: 2});
                                            });
                                        }else{
                                            // model.updateUser(objUser);
                                            res.json({message: 'Username already exist', status: 2});
                                        }

                                    });
                                }else{
                                    model.addUser(req, function (err, user) {
                                        if (user != null) {
                                            if(req.body.userType=='sampler' || req.body.userType=='verifier' || req.body.userType=='sampler/verifier'){
                                                //send pwd
                                                /*   var reverseMd5 = ReverseMd5({
                                                       lettersUpper: false,
                                                       lettersLower: true,
                                                       numbers: true,
                                                       special: false,
                                                       whitespace: true,
                                                       maxLen: 12
                                                   })*/

                                                var data = {
                                                    email:user.personelEmail,
                                                    password:user.password,
                                                    subject: 'Welcome to BVAS', // Subject line
                                                    text: 'Welcome Email', // plain text body
                                                    html: 'Hi,<br>Your punch In password  : <b>'+user.password+'</b><br/>Your mobile number : <b>'+user.mobile+'</b><br/>Regards,<br>Bvas Team' // html body
                                                }
                                                email.sendEmail(data);
                                            }
                                            res.json({message: 'USER_REGISTRATION_SUCCESS', status: 1, data: user});
                                        } else
                                            res.json({message: 'USER_REGISTRATION_FAILED', status: 2});
                                    });
                                }

                            });
                        }else
                            res.json({message: 'Mobile number already exist', status: 2});
                    });
                }
                else
                    res.json({message: 'NO_PERMISSION',status:2});
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

//API-EDIT USER
app.post('/api/editUser', function (req, res) {
    if(!req.headers.authorization || !req.body.mobile || !req.body.firstName || !req.body.lastName || !req.body.userType || !req.body.emp_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                //  if(obj.user.userType=='admin') {
                model.getUserById(req, function (err, objUser) {
                    //console.log(req.body)
                    // console.log(objUser)
                    if (objUser != null) {
                        //objUser.mobile = req.body.mobile;
                        // objUser.username            = req.body.username;
                        objUser.firstName           = req.body.firstName
                        objUser.lastName            = req.body.lastName;
                        objUser.fatherName          = req.body.fatherName ;
                        objUser.motherName          = req.body.motherName ;
                        objUser.DOB                 = req.body.DOB ;
                        //objUser.userType            = req.body.userType;
                        objUser.password            = req.body.password;
                        objUser.phoneNumber         = req.body.phoneNumber;
                        objUser.personelEmail       = req.body.personelEmail;
                        objUser.companyEmail        = req.body.companyEmail;
                        objUser.presentAddress      = req.body.presentAddress;
                        objUser.permanentAddress    = req.body.permanentAddress;
                        objUser.city                = req.body.city;
                        objUser.qualification       = req.body.qualification;
                        objUser.reference1.name     = req.body.reference1.name;
                        objUser.reference1.contactno = req.body.reference1.contactno;
                        objUser.reference1.address  = req.body.reference1.address;
                        objUser.reference1.relation = req.body.reference1.relation;
                        objUser.reference2.name     = req.body.reference2.name;
                        objUser.reference2.contactno = req.body.reference2.contactno;
                        objUser.reference2.address  = req.body.reference2.address;
                        objUser.reference2.relation = req.body.reference2.relation;
                        objUser.prevExp.company     = req.body.prevExp.company;
                        objUser.prevExp.address     = req.body.prevExp.address;
                        objUser.prevExp. designation = req.body.prevExp.designation;
                        objUser.prevExp.contactPerson = req.body.prevExp.contactPerson;
                        objUser.prevExp.designationOfContact = req.body.prevExp.designationOfContact;
                        objUser.prevExp.contactNum = req.body.prevExp.contactNum;


                        model.checkUser(req, function (err, objMob) {
                            // console.log("objMob==fghhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh=")
                            // console.log(objMob)
                            if (objMob.length==0) {
                                objUser.mobile = req.body.mobile;
                                console.log(req.body)
                                if(req.body.userType!=objUser.userType){
                                    if(req.body.userType!='supervisor' && req.body.userType!='admin'){
                                        objUser.userType            = req.body.userType;
                                        objUser.username            = req.body.username;
                                        var codelength = 6;
                                        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
                                        req.body.password = code;
                                        objUser.password = req.body.password;
                                        model.updateUser(objUser);

                                        var data = {
                                            email:objUser.personelEmail,
                                            password:objUser.password,
                                            subject: 'Welcome to BVAS', // Subject line
                                            text: 'Welcome Email', // plain text body
                                            html: 'Hi,<br>Your punch In password  : <b>'+req.body.password+'</b><br/>Your mobile number :<b>'+objUser.mobile+'</b><br/>Regards,<br>Bvas Team' // html body
                                        }
                                        email.sendEmail(data);

                                        res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                    }else{
                                        //objUser.username = req.body.username;
                                        objUser.userType = req.body.userType;
                                        if(req.body.username==objUser.username){
                                            objUser.username = req.body.username;
                                            model.updateUser(objUser);
                                            res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                        }else{
                                            model.checkUsername(req, function (err, objuserName) {
                                                if (objuserName == null) {
                                                    objUser.username = req.body.username;
                                                    model.updateUser(objUser);
                                                    res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                                }else
                                                    res.json({message: 'Username already exist', status: 2})
                                            });
                                        }
                                    }
                                }else{
                                    if(req.body.userType!='supervisor' && req.body.userType!='admin'){
                                        objUser.userType            = req.body.userType;
                                        objUser.username            = req.body.username;
                                        var codelength = 6;
                                        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
                                        req.body.password = code;
                                        objUser.password = req.body.password;
                                        model.updateUser(objUser);

                                        var data = {
                                            email:objUser.personelEmail,
                                            password:objUser.password,
                                            subject: 'Welcome to BVAS', // Subject line
                                            text: 'Welcome Email', // plain text body
                                            html: 'Hi,<br>Your punch In password  : <b>'+req.body.password+'</b><br/>Your mobile number :<b>'+objUser.mobile+'</b><br/>Regards,<br>Bvas Team' // html body
                                        }
                                        email.sendEmail(data);

                                        res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                    }else{
                                        //objUser.username = req.body.username;
                                        objUser.userType = req.body.userType;
                                        if(req.body.username==objUser.username){
                                            objUser.username = req.body.username;
                                            model.updateUser(objUser);
                                            res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                        }else{
                                            model.checkUsername(req, function (err, objuserName) {
                                                if (objuserName == null) {
                                                    objUser.username = req.body.username;
                                                    model.updateUser(objUser);
                                                    res.json({message: 'USER_UPDATION_SUCCESS', status: 1, data: objUser});
                                                }else
                                                    res.json({message: 'Username already exist', status: 2})
                                            });
                                        }
                                    }
                                }
                            } else
                                res.json({message: 'Mobile number already exist', status: 2})
                        });

                    } else
                        res.json({message: 'USER_NOT_FOUND', status: 4});
                });
                // }else
                //    res.json({message: 'NO_PERMISSION',status:2});
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR DELETE USER
app.post('/api/updateStatus', function (req, res) {
    if (!req.headers.authorization || !req.body.emp_id || !req.body.status) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {
                    model.getUserById(req, function (err, obj) {
                        if (obj != null) {
                            // console.log()
                            //console.log(obj)
                            obj.status = req.body.status;
                            /* if(req.body.status=='active'){
                                 sendSMS(req.body.toNumber)
                             }*/
                            model.updateUser(obj);
                            res.json({message: 'SUCCESS', status: 1});
                        } else {
                            res.json({message: 'USER_NOT_FOUND', status: 4});
                        }
                    });
                }else
                    res.json({message: 'NO_PERMISSION',status:2});
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

// API FOR GET USERLIST
app.get('/api/getUserList', function (req, res) {
    // console.log(req.headers.authorization)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {
                    model.getAllUsers(data, function (err, objUser) {
                        // console.log(objUser)
                        if (objUser != null) {
                            res.json({message: 'SUCCESS', status: 1, data: objUser});
                        } else
                            res.json({message: 'NO DATA FOUND', status: 4});
                    });
                }else{
                    res.json({message: 'NO_PERMISSION',status:2});
                }
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});

// API FOR GET VERIFIER LIST
app.get('/api/getVerifierList', function (req, res) {
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhh")
    //console.log(req.headers.authorization)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='supervisor') {
                    req.body.userType = 'verifier';
                    model.getVerifiers(req, function (err, objUser) {
                        console.log(objUser)
                        if (objUser != null) {
                            var verifiers =[]
                            for(var i=0;i<objUser.length;i++){
                                if(objUser[i].city!=undefined)
                                    verifiers.push(objUser[i].firstName+" "+objUser[i].city)
                                else
                                    verifiers.push(objUser[i].firstName);
                            }
                            //  console.log("Verifier List")
                            verifiers.sort(function (a, b) {
                                return a.toLowerCase().localeCompare(b.toLowerCase());
                            });
                            console.log(verifiers)
                            res.json({message: 'SUCCESS', status: 1, data: verifiers});
                        } else
                            res.json({message: 'NO DATA FOUND', status: 4});
                    });
                }else{
                    res.json({message: 'NO_PERMISSION',status:2});
                }
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});

// API FOR GET USERLIST
app.post('/api/getSingleUserData', function (req, res) {
    // console.log(req.headers.authorization)
    if(!req.headers.authorization || !req.body.emp_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.loginUser(req, function(err, objUser) {
                    // console.log(objUser)
                    if (objUser != null) {
                        res.json({message: 'SUCCESS',status:1,data:objUser});
                    }else
                        res.json({message: 'NO DATA FOUND',status:4});
                });

            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});

//ADD BANK DETAILS
app.post('/api/addBank', function (req, res) {

    if(!req.body.bankName || !req.body.email || !req.body.manager || !req.body.agency_name){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {

                    model.getBank(req, function (err, objBank) {
                        if (objBank == null) {
                            if(req.body.logo==undefined) {
                                req.body.logo = "";
                            }
                            var nowDate = new Date();
                            //req.body.createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                            req.body.createdAt = nowDate;
                            req.body.updatedAt = nowDate;

                            var bankId;
                            model.getLastBank(req, function (err, objBank) {
                                if (objBank.length==0) {
                                    bankId = "1";
                                    req.body.bankId = "1";
                                    model.addBank(req, function (err, bank) {
                                        if (bank != null) {
                                            res.json({message: 'SUCCESS', status: 1});
                                        } else

                                            res.json({message: 'FAILURE', status: 2});
                                    });
                                } else {
                                    //console.log(objBank[0].bankId)
                                    bankId = parseInt(objBank[0].bankId) + 1;
                                    req.body.bankId = bankId
                                    model.addBank(req, function (err, bank) {
                                        if (bank != null) {
                                            res.json({message: 'SUCCESS', status: 1});
                                        } else

                                            res.json({message: 'FAILURE', status: 2});
                                    });
                                }

                            });
                        }else
                            res.json({message: 'ALREADY_EXISTS',status:4});
                    })
                }else
                    res.json({message: 'NO_PERMISSION',status:2});
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});



//API-EDIT BANK
app.post('/api/editBank', function (req, res) {
    if(!req.headers.authorization || !req.body.bankName  || !req.body.bankId || !req.body.email || !req.body.manager){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {
                    model.getBankId(req, function (err, objBank) {
                        if (objBank != null) {
                            var bank_old = objBank.bankName;
                            objBank.email = req.body.email;
                            objBank.manager = req.body.manager;
                            objBank.bankName = req.body.bankName;
                            // objBank.products = req.body.products;
                            //objBank.branch = req.body.branch;
                            objBank.logo = req.body.logo;
                            objBank.agency_name = req.body.agency_name;
                            model.updateBank(objBank);
                            updateCollections(req,objBank,bank_old);
                            res.json({message: 'BANK_UPDATION_SUCCESS', status: 1});
                        } else
                            res.json({message: 'BANK_NOT_FOUND', status: 4});
                    });
                }else
                    res.json({message: 'NO_PERMISSION',status:2});
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

function updateCollections(req,objBank,bank_old){


    model.getProducts(req, function (err, objProd) {
        if (objProd.length != 0) {
            for(var i=0;i<objProd.length;i++){
                objProd.product_bank = req.body.bankName
                model.updateProduct(objProd[i]);
            }
        }
        model.getAllFileList(req, function (err, objFile) {
            if (objFile.length!=0) {
                for(var i=0;i<objFile.length;i++){
                    if(objFile[i].bankName == bank_old){
                        objFile[i].bankName = req.body.bankName
                        model.updateFile(objFile[i]);
                    }
                }
            }
            model.getBranch(req, function (err, objBranch) {
                if (objBranch.length != 0) {
                    for(var i=0;i<objBranch.length;i++){
                        objBranch.bankName = req.body.bankName
                        model.updateBranch(objBranch[i]);
                    }

                }
            });
        });
    });

}

// API FOR DELETE BANK
app.post('/api/deleteBank', function (req, res) {
    if (!req.headers.authorization || !req.body.bankName || !req.body.status) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.userType=='admin') {

                    model.getBankId(req, function (err, objBank) {
                        if (objBank != null) {
                            objBank.status = req.body.status;
                            model.updateBank(objBank);
                            res.json({message: 'SUCCESS', status: 1});
                        } else
                            res.json({message: 'BANK_NOT_FOUND', status: 4});
                    });
                }else
                    res.json({message: 'NO_PERMISSION',status:2});

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});



// API FOR GET BANK
app.get('/api/getBankList', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getBankList(req, function (err, objBank) {
                    if (objBank != null) {
                        for (var i = 0; i < objBank.length; i++) {
                            if(objBank[i].createdAt && objBank[i].updatedAt) {
                                var nowDate = objBank[i].createdAt;
                                objBank[i].createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                                nowDate = objBank[i].updatedAt;
                                objBank[i].updatedAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                            }
                        }
                        res.json({message: 'SUCCESS', status: 1,data:objBank});
                    } else
                        res.json({message: 'BANK_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

//ADD DOCUMENT DETAILS
app.post('/api/addDocument', function (req, res) {
    console.log(req.body.fields)
    if(!req.body.document_type || !req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                req.body.doc_type = req.body.document_type;
                model.getDocs(req, function (err, objDoc) {

                    if (objDoc == null) {

                        model.addDoc(req, function (err, doc) {
                            if (doc != null) {
                                //  console.log("resultt=======>")
                                // console.log(doc)
                                res.json({message: 'SUCCESS', status: 1});
                            } else

                                res.json({message: 'FAILURE', status: 2});
                        });
                    }else
                        res.json({message: 'DOCUMENT_ALREADY EXISTS', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

app.post('/api/editDocument', function (req, res) {
    console.log(req.body.fields)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        /*  var data = {
              accessToken: req.headers.authorization
          }
          model.getToken(data, function(err, obj) {
              if (obj != null) {*/
        model.getDocs(req, function (err, objDoc) {
            //  console.log("objDocs====")
            // console.log(objDoc)
            if (objDoc != null) {
                objDoc.document_type = req.body.doc_type;
                objDoc.positive_remarks = req.body.positive_remarks;
                objDoc.negative_remarks = req.body.negative_remarks;
                objDoc.negative_remarks = req.body.negative_remarks;
                objDoc.fields = req.body.fields;
                model.updateDoc(objDoc)
                res.json({message: 'SUCCESS', status: 1});
            } else
                res.json({message: 'DOC_NOT_FOUND', status: 4});
        });

        /* }else
             res.json({message: 'INVALID_TOKEN',status:2});
     });*/
    }
});

// API FOR GET DOCS
app.post('/api/getDocList', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        var dat = [];
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getDocList(req, function (err, objDoc) {
                    //console.log("objDocs====")
                    // console.log(objDoc)
                    if (objDoc != null) {
                        for(var i=0;i<objDoc.length;i++){
                            //dat.push({document:objDoc[i].document,file_Id:objDoc[i].file_Id,status:objDoc[i].status})
                            if(objDoc[i].status!='TEMP') {
                                for (var j = 0; j < objDoc[i].document.length; j++) {

                                    //console.log("document===========>")
                                    // console.log(objDoc[i].document[j])
                                    if (objDoc[i].document[j]) {
                                        if (objDoc[i].document[j].verification_status != 'COMPLETED' && objDoc[i].document[j].is_active == 'active') {

                                            dat.push({
                                                internalRef_id: objDoc[i].internalRef_id,
                                                fileName: objDoc[i].file_Id,
                                                bankName: objDoc[i].bankName,
                                                branchName: objDoc[i].branchName,
                                                productName: objDoc[i].productName,
                                                sampler: objDoc[i].userId,
                                                document: objDoc[i].document[j],
                                                username: objDoc[i].username,
                                                createdAt: objDoc[i].document[j].createdAt
                                            });
                                            //console.log(dat)
                                        }
                                    }

                                }
                            }
                        }
                        dat.sort(function(a,b){
                            // Turn your strings into dates, and then subtract them
                            // to get a value that is either negative, positive, or zero.
                            return new Date(b.createdAt) - new Date(a.createdAt);
                        });
                        res.json({message: 'SUCCESS', status: 1,data:dat});
                    } else
                        res.json({message: 'DOC_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});



// API FOR GET DOCS TYPES
app.get('/api/getDocTypes', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.docProfileList(req, function (err, objDoc) {
                    if (objDoc.length!=0) {
                        res.json({message: 'SUCCESS', status: 1,data:objDoc});
                    }else{
                        res.json({message: 'DOC_NOT_FOUND', status: 4});
                    }
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR GET DOCS DETAILS
app.post('/api/getDocData', function (req, res) {
    if (!req.headers.authorization || !req.body.docName) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                req.body.doc_type = req.body.docName;
                model.getDocs(req, function (err, objDoc) {
                    if (objDoc!=null) {
                        res.json({message: 'SUCCESS', status: 1,data:objDoc});
                    }else{
                        res.json({message: 'DOC_NOT_FOUND', status: 4});
                    }
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

// API FOR GET DOCS
app.get('/api/getDocuments', function (req, res) {
    //console.log("documents=====>")
    //console.log(req.body)
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        var docs;
        var docs1= [];
        var document = [];
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                if(obj.user.city!=undefined)
                    req.body.verfier = obj.user.firstName + " "+ obj.user.city;
                else
                    req.body.verfier = obj.user.firstName;
                // console.log(req.body.emp_id)
                model.getDocuments(req, function (err, objDoc) {
                    if (objDoc != null) {
                        docs = objDoc;
                        for(var i=0;i<docs.length;i++){

                            var arr = docs[i].document;
                            for(var j=0;j<arr.length;j++) {

                                if(arr[j].verifier==req.body.verfier && arr[j].verification_status=='IN_PROGRESS') {

                                    if(arr[j].is_active=='active') {

                                        //console.log("doc Type=========>")
                                        // console.log(arr[j].docType)

                                        docs1.push({
                                            fileName: docs[i].file_Id,
                                            bankName: docs[i].bankName,
                                            branchName: docs[i].branchName,
                                            productName: docs[i].productName,
                                            sampler: docs[i].userId,
                                            verificationType: docs[i].verificationType,
                                            document: arr[j],
                                            docType:arr[j].docType,
                                            docRefId:arr[j].docRefId,
                                            internalRef_id: docs[i].internalRef_id,
                                            createdDate: docs[i].createdAt,
                                            customer_name: docs[i].username
                                        });

                                    }
                                }

                            }
                        }


                        res.json({message: 'SUCCESS', status: 1,data:docs1});
                    } else
                        res.json({message: 'DOC_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


//ADD PRODUCT DETAILS
app.post('/api/addProduct', function (req, res) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {


        var prodRefId;
        model.getLastProduct(req, function (err, objProd) {

            if (objProd.length == 0) {
                prodRefId = "1";
                req.body.prodRefId = prodRefId;
            } else {
                prodRefId = parseInt(objProd[0].prodRefId) + 1;
                req.body.prodRefId = prodRefId;
            }
            model.addProduct(req, function (err, prod) {
                if (prod != null) {
                    var valid = 0;
                    req.body.bankName = req.body.product_bank;
                    model.getBank(req, function (err, bank) {
                        if (bank != null) {
                            for (var i = 0; i < bank.products.length; i++) {
                                if (bank.products[i] == req.body.product_name) {
                                    valid = 1;
                                }
                            }
                            if (valid == 0)
                                bank.products.push(req.body.product_name)
                            model.updateBank(bank);
                        }
                    });
                    res.json({message: 'SUCCESS', status: 1});
                } else

                    res.json({message: 'FAILURE', status: 2});
            });
        });
        /* }else
             res.json({message: 'INVALID_TOKEN',status:2});
     });*/
    }
});




//edit PRODUCT DETAILS
app.post('/api/editProduct', function (req, res) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getProductById(req, function (err, objProd) {
                    if (objProd != null) {
                        objProd.product_id = req.body.product_id;
                        objProd.product_name = req.body.product_name;
                        objProd.product_bank = req.body.product_bank;
                        model.updateProduct(objProd);
                        res.json({message: 'SUCCESS', status: 1,data:objProd});
                    } else {
                        res.json({message: 'INVALID PRODUCT', status: 4});
                    }
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

// API FOR GET PRODUCTS
app.post('/api/getProductList', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {

                model.getProducts(req, function (err, objProd) {
                    // console.log("objProd====")
                    // console.log(objProd)
                    var arr = [];
                    if (objProd.length!=0) {

                        for(var i=0;i<objProd.length;i++){
                            if(objProd[i].type!='other'){
                                arr.push(objProd[i])
                            }
                        }

                        res.json({message: 'SUCCESS', status: 1,data:arr});
                    } else
                        res.json({message: 'PRODUCT_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR GET PRODUCTS
app.post('/api/getProductsForReport', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        console.log(req.body)
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getProducts(req, function (err, objProd) {
                    console.log("objProd====")
                    console.log(objProd)
                    var arr = [];
                    if (objProd.length!=0) {
                        for(var i=0;i<objProd.length;i++){
                            console.log(objProd[i].type)
                            if(objProd[i].type=='other'){
                                arr.push(objProd[i])
                            }
                        }

                        res.json({message: 'SUCCESS', status: 1,data:arr});
                    } else
                        res.json({message: 'PRODUCT_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


//ADD PRODUCT DETAILS
app.post('/api/addBranch', function (req, res) {
    // console.log(req.body)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                var branchId;
                model.getLastBranch(req, function (err, objBranch) {
                    //console.log("objBranch")
                    // console.log(objBranch)
                    if (objBranch.length==0) {
                        branchId = 1;
                        req.body.branchId = branchId;
                        model.addBranch(req, function (err, branch) {
                            if (branch != null) {
                                model.getBank(req, function (err, bank) {
                                    if (bank != null) {
                                        bank.branch.push(req.body.branch_name)
                                        model.updateBank(bank);
                                    }
                                });
                                res.json({message: 'SUCCESS', status: 1});
                            } else

                                res.json({message: 'FAILURE', status: 2});
                        });
                    } else {
                        branchId = parseInt(objBranch[0].branchId) + 1;
                        req.body.branchId = branchId;
                        model.addBranch(req, function (err, branch) {
                            if (branch != null) {
                                model.getBank(req, function (err, bank) {
                                    if (bank != null) {
                                        bank.branch.push(req.body.branch_name)
                                        model.updateBank(bank);
                                    }
                                });
                                res.json({message: 'SUCCESS', status: 1});
                            } else

                                res.json({message: 'FAILURE', status: 2});
                        });
                    }

                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR GET BRANCH
app.post('/api/getBranchList', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getBranch(req, function (err, objbranch) {
                    if (objbranch.length!=0) {
                        res.json({message: 'SUCCESS', status: 1,data:objbranch});
                    } else
                        res.json({message: 'branch_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


app.post('/api/editBranch', function (req, res) {
    console.log(req.body.fields)
    if(!req.headers.authorization || !req.body.branchId){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getBranchById(req, function (err, objBranch) {
                    if (objBranch != null) {
                        //objBranch.branchId = req.body.branchId;
                        objBranch.branch_name = req.body.branch_name;
                        objBranch.bankName = req.body.bankName;
                        objBranch.manager = req.body.manager;
                        objBranch.address = req.body.address;
                        objBranch.email = req.body.email;
                        objBranch.ifsc = req.body.ifsc;
                        objBranch.phone = req.body.phone;
                        model.updateBranch(objBranch)
                        res.json({message: 'SUCCESS', status: 1});
                    } else
                        res.json({message: 'DOC_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

//ADD FILE DETAILS
app.post('/api/addFile', function (req, res) {
    if(!req.headers.authorization || !req.body.bankName){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }

        model.getBank(req, function (err, objBank) {
            if (objBank != null) {
                req.body.agency_name = objBank.agency_name;
                req.body.bankId = objBank.bankId;
            }else{
                req.body.agency_name = "";
            }
            req.body.branch_name = req.body.branchName;
            model.getBranchByBank(req, function (err, objBranch) {
                if (objBranch != null) {
                    req.body.branchId = objBranch.branchId;
                }
            });
        });


        model.getToken(data, function(err, obj) {
            if (obj != null) {
                req.body.userId = obj.user.emp_id;
                req.body.sampler = obj.user.firstName;
                // console.log(req.body.userId)
                //if(obj.user.userType=='sampler') {

                //AUTO FILL VALUES=================>

                model.getLastFile(req, function (err, objFile) {
                    var d = new Date();
                    var day = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
                    var mon = ("0" + (d.getMonth() + 1)).slice(-2);
                    var yy = d.getFullYear().toString().substr(2,2);
                    // console.log(objFile.length)
                    if (objFile.length != 0) {



                        var dat = d.toLocaleString();
                        dat = dat.split(" ");
                        var existDate = new Date(objFile[0].createdAt);
                        existDate = existDate.toLocaleString();
                        existDate = existDate.split(" ");

                        if(dat[0]==existDate[0]){
                            //  console.log("existssss")
                            var file_Id = objFile[0].internalRef_id;
                            var file_Ids = file_Id.split('-')
                            var bank = req.body.bankName.substring(0,3);
                            var branch = req.body.branchName.substring(0,3);
                            var num = parseInt(file_Ids[1]) + 1;

                            // if(d.getTime()=='')
                            req.body.internalRef_id = bank + branch + yy  + mon + day +'-' + num;
                            console.log(req.body.internalRef_id)
                        }else{
                            var num = 101;
                            var bank = req.body.bankName.substring(0,3);
                            var branch = req.body.branchName.substring(0,3);
                            req.body.internalRef_id = bank + branch + yy  + mon + day +"-"+ num;
                            console.log(req.body.internalRef_id)
                        }

                    } else {
                        var num = 101;
                        var bank = req.body.bankName.substring(0,3);
                        var branch = req.body.branchName.substring(0,3);
                        req.body.internalRef_id = bank + branch + yy  + mon + day + "-"+num;
                        console.log(req.body.internalRef_id)
                    }
                    var nowDate = new Date();
                    //req.body.createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                    req.body.createdAt = nowDate;
                    req.body.updatedAt = nowDate;


                    req.data = {
                        file_Id :req.body.file_Id,
                        internalRef_id :req.body.internalRef_id,
                        bankName :req.body.bankName,
                        branchName  :req.body.branchName,
                        productName  :req.body.productName,
                        userId:req.body.userId ,
                        sampler:req.body.sampler,
                        username:req.body.username ,
                        presentAddress: "",
                        permanentAddress: "",
                        document:[],
                        verificationType:req.body.verificationType,
                        productFields:req.body.fields,
                        status: "TEMP",
                        is_active:"active",
                        createdAt   : req.body.createdAt,
                        updatedAt   : req.body.updatedAt
                    }
                    var arr = req.body.fields;
                    if(arr) {
                        arr.forEach(element => {
                            if (element.FILLED_BY == 'auto') {
                                console.log("auto fields")
                                console.log(element);
                                // Save file: - All the default values will be processed
                                data = saveFile(element,req);
                                console.log("After=========>")
                                console.log(data)
                                element.VALUE = data.VALUE;
                            }
                        });
                        //res.json({message: 'SUCCESS', status: 1,data:arr});
                        req.body.fields = arr;
                    }

                    model.addFile(req, function (err, files) {
                        if (files != null) {
                            // console.log("resultt=======>")
                            // console.log(files)
                            model.docList(req, function (err, objDoc) {
                                // console.log(objDoc.length)
                                if (objDoc.length != 0) {
                                    var arr = objDoc;
                                    arr.sort(function(a, b){
                                        // console.log(a)
                                        //  console.log(b)
                                        if(a.document_type.toUpperCase() < b.document_type.toUpperCase()) { return -1; }
                                        if(a.document_type.toUpperCase() > b.document_type.toUpperCase()) { return 1; }
                                        return 0;
                                    });
                                    res.json({message: 'SUCCESS', status: 1,data:arr,file:files});
                                }else {
                                    res.json({message: 'SUCCESS', status: 1, data: []});
                                }
                            });

                        } else

                            res.json({message: 'FAILURE', status: 2});
                    });

                });
                // }

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


function saveFile(data,req){
    // console.log("Save File Fields")
    //console.log(data)
    if(data.DEFAULT!=undefined) {
        switch (data.DEFAULT) {
            case 'CURRENT_DATE':
                // console.log("inside======>")
                data.VALUE = fun.getCurrentDate();
                // console.log(data.VALUE)
                break;
            case 'NA':
                if(data.TYPE.toUpperCase() == 'NUMBER')
                    data.VALUE = '0';
                else
                    data.VALUE = 'NA';
                break;
            case 'SAMPLER_NAME':
                data.VALUE = req.body.sampler;
                break;
            case 'AGENCY_NAME':
                //  console.log("AGENCY_NAME")
                //console.log(req.body.agency_name)
                data.VALUE = req.body.agency_name;
                break;
            case 'installation_address':
                console.log("installation_address")
                console.log(req.body.installation_address)
                data.VALUE = req.body.installation_address;
                break;
            default:
                if(data.DEFAULT!="")
                    data.VALUE = fun.getFieldValue(data.DEFAULT, req);
                // console.log(data.VALUE)
                if (data.VALUE == null)
                    data.VALUE = "";
                break;
        }
    }
    // console.log(data)
    return data;
}



app.post('/api/excelUpload',function (req, res) {

    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }

        req.body.fields = [];

        model.getToken(data, function(err, obj) {
            if (obj != null) {
                var fileName, extension, exceltojson;
                new formidable.IncomingForm().parse(req)
                    .on('file', function (name, file) {
                        // console.log(file)
                        extension = path.extname(file.name).toLowerCase();
                        // console.log('extension', extension);
                    })
                    .on('field', function (name, field) {
                        // console.log('name....',name)
                        fileName = name;
                    })
                    .on('error', function (err) {
                        console.log(err + "error")
                        next(err);
                    }).on('end', function (fields, files) {

                    if(fileName=='excelFile') {

                        if (extension == '.xlsx') {
                            exceltojson = xlsxj;

                        } else {
                            exceltojson = xlsj;
                        }
                        try {
                            exceltojson({
                                input: this.openedFiles[0].path,
                                output: null, //since we don't need output.json
                                lowerCaseHeaders: true
                            }, function (err, result) {
                                if (err) {
                                    console.log(err)
                                    return res.json({error_code: 1, err_desc: err, data: null});
                                }

                                //console.log('jsonData', result)
                                var customer_res_full_address = '';
                                var customer_office_full_address = '';
                                //console.log("success!")
                                var arr = [];


                                if(result.length!=0) {
                                    var data,stat = 0;
                                    model.getLastFile(req, function (err, objFile) {

                                        function asyncLoop(i, callback) {
                                            if (i < result.length) {
                                                if(result[i].product=='ME') {
                                                    if (result[i] && result[i].name_of_bank != '') {
                                                        req.body.productName = result[i].product;
                                                        req.body.branch_name = result[i].branch;
                                                        req.body.branchName = result[i].branch;
                                                        req.body.agency_name = result[i].agency_name;
                                                        req.body.bankName = result[i].name_of_bank;
                                                        req.body.doc_type = result[i].nature_of_verification;

                                                        //console.log("req.body.doc_type===")
                                                        //console.log(req.body.doc_type)
                                                        var doc = [];



                                                        if (result[i].office_address_1 != '') {
                                                            customer_office_full_address = result[i].office_address_1
                                                           // console.log("1",customer_office_full_address)
                                                        }


                                                        if (result[i].office_address_2 != '') {
                                                            if(customer_office_full_address == ''){
                                                                customer_office_full_address = result[i].office_address_2;
                                                            }else{
                                                                customer_office_full_address = customer_office_full_address + ',' + result[i].office_address_2;
                                                            }

                                                        }
                                                        if (result[i].office_address_3 != '') {
                                                            if(customer_office_full_address == ''){
                                                                customer_office_full_address = result[i].office_address_3;
                                                            }else{
                                                                customer_office_full_address = customer_office_full_address + ',' + result[i].office_address_3
                                                            }

                                                        }
                                                        if (result[i].office_address_4 != '') {
                                                            if(customer_office_full_address == ''){
                                                                customer_office_full_address = result[i].office_address_4;
                                                            }else{
                                                                customer_office_full_address = customer_office_full_address + ',' + result[i].office_address_4
                                                            }

                                                        }
                                                        if (result[i].office_address_5 != '') {
                                                            if(customer_office_full_address == ''){
                                                                customer_office_full_address = result[i].office_address_5;
                                                            }else{
                                                                customer_office_full_address = customer_office_full_address + ',' + result[i].office_address_5
                                                            }


                                                           // console.log("5",customer_office_full_address)
                                                        }


                                                        req.body.installation_address = customer_office_full_address;
                                                        //console.log(req.body)
                                                        var codelength = 6;
                                                        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

                                                        var d = new Date();
                                                        var day = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
                                                        var mon = ("0" + (d.getMonth() + 1)).slice(-2);
                                                        var yy = d.getFullYear().toString().substr(2, 2);
                                                        // console.log(objFile.length)
                                                        if (objFile.length != 0) {

                                                            var file_Id = objFile[0].internalRef_id;
                                                            var file_Ids = file_Id.split('-')
                                                            var bank, branch;
                                                            if (req.body.bankName)
                                                                bank = req.body.bankName.substring(0, 3);
                                                            if (req.body.branchName)
                                                                branch = req.body.branchName.substring(0, 3);
                                                            var num = parseInt(file_Ids[1]) + i + 1;

                                                            if(branch!=undefined)
                                                                req.body.internalRef_id = bank + branch + yy + mon + day + '-' + num;
                                                            else
                                                                req.body.internalRef_id = bank + yy + mon + day + '-' + num;

                                                        } else {
                                                            var num = 101;
                                                            var bank, branch;
                                                            if (req.body.bankName)
                                                                bank = req.body.bankName.substring(0, 3);
                                                            if (req.body.branchName)
                                                                branch = req.body.branchName.substring(0, 3);
                                                            //req.body.internalRef_id = bank + branch + yy + mon + day + "-" + num;
                                                            if(branch!=undefined)
                                                                req.body.internalRef_id = bank + branch + yy + mon + day + '-' + num;
                                                            else
                                                                req.body.internalRef_id = bank + yy + mon + day + '-' + num;
                                                        }

                                                        req.body.file_id = code;


                                                        model.getBank(req, function (err, objBank) {
                                                            if (objBank != null) {
                                                                req.body.bankId = objBank.bankId;
                                                                // req.body.fields = objBank.fields;
                                                                console.log("req.body.productName = result[i].product;",result[i].product)
                                                                req.body.productName = result[i].product;
                                                                model.getProductField(req, function (err, objProd) {
                                                                    if (objProd.length != 0) {
                                                                        if (objProd[0].fields.length != 0) {
                                                                            req.body.fields = objProd[0].fields;
                                                                             arr = req.body.fields;
                                                                            if (arr) {
                                                                                arr.forEach(element => {
                                                                                    if (element.FILLED_BY == 'auto') {
                                                                                        data = saveFile(element, req);
                                                                                        element.VALUE = data.VALUE;
                                                                                    } else if (element.FILLED_BY == 'sampler') {
                                                                                        data = mapFile(element, req, result[i]);
                                                                                        element.VALUE = data.VALUE;
                                                                                    }
                                                                                });
                                                                                req.body.fields = arr;
                                                                            }

                                                                            model.getBranchByBank(req, function (err, objBranch) {
                                                                                if (objBranch != null) {
                                                                                    req.body.branchId = objBranch.branchId;
                                                                                } else {
                                                                                    req.body.branchId = '';
                                                                                }

                                                                            });
                                                                        }
                                                                    }
                                                                    else {
                                                                        req.body.fields = [];
                                                                    }
                                                                });


                                                            } else {
                                                                req.body.bankId = '';
                                                            }

                                                            console.log("arrrrrrrrrrr",arr)


                                                            if (req.body.doc_type != null && req.body.doc_type != '' && req.body.doc_type != undefined) {
                                                                //console.log("get documents==>")
                                                                //console.log(req.body.doc_type)
                                                                model.getDocs(req, function (err, objDoc) {
                                                                    // console.log("get documents==>11111111111111111111")
                                                                    //console.log(objDoc)

                                                                    var positive_remark = "";
                                                                    var negative_remark = "";
                                                                    if (objDoc != null) {
                                                                        //console.log("resultt")
                                                                        positive_remark = objDoc.positive_remarks;
                                                                        negative_remark = objDoc.negative_remarks;

                                                                        var num = 101, docRefNum;

                                                                        docRefNum = 'File' + req.body.file_id + req.body.doc_type + '-' + num

                                                                        doc.push({
                                                                            docRefId: docRefNum,
                                                                            docType: req.body.doc_type,
                                                                            fields: objDoc.fields,
                                                                            verifier: "",
                                                                            verification_status: "NEW",
                                                                            bankName: "",
                                                                            remarks: {
                                                                                positive_remarks: positive_remark,
                                                                                negative_remarks: negative_remark
                                                                            },
                                                                            doc_image: [{url: "", page: ""}],
                                                                            remarks_status: "",
                                                                            verification_remarks: "",
                                                                            otherRemarks: "",
                                                                            is_active: "active",
                                                                            createdAt: new Date(),
                                                                            updatedAt: new Date()
                                                                        });
                                                                    }


                                                                        var file = new fileModel({
                                                                            file_Id: result[i].mid,
                                                                            internalRef_id: req.body.internalRef_id,
                                                                            bankName: req.body.bankName,
                                                                            branchName: req.body.branchName,
                                                                            bankId: req.body.bankId,
                                                                            branchId: req.body.branchId,
                                                                            productName: req.body.productName,
                                                                            userId: "EMP-1023",
                                                                            sampler: "SUPERVISOR",
                                                                            username: result[i].me_legal_name,
                                                                            presentAddress: result[i].residence_address1,
                                                                            permanentAddress: result[i].residence_address2,
                                                                            customer_res_full_address: customer_res_full_address,
                                                                            customer_office_full_address: customer_office_full_address,
                                                                            document: doc,
                                                                            verificationType: result[i].nature_of_verification,
                                                                            productFields: arr,
                                                                            verification_remarks: "",
                                                                            feedback_status: "",
                                                                            pending_count: "",
                                                                            location: '',
                                                                            status: "NEW",
                                                                            is_active: "active",
                                                                            createdAt: new Date(),
                                                                            updatedAt: new Date(),
                                                                            verifiedAt: ""
                                                                        });

                                                                        //console.log(req.body.fields)
                                                                       if(arr!=undefined)
                                                                        file.save(function (err, file) {
                                                                            console.log("file")
                                                                            //console.log(file)
                                                                            req.body = {};
                                                                            customer_office_full_address = "";
                                                                            stat = 1;
                                                                            asyncLoop(i + 1, callback);
                                                                            if (err) {
                                                                                console.log(err)
                                                                                // return console.error(err);
                                                                            }
                                                                        });


                                                                });
                                                            }
                                                            else {


                                                                var file = new fileModel({
                                                                    file_Id: rresult[i].mid,
                                                                    internalRef_id: req.body.internalRef_id,
                                                                    bankName: req.body.bankName,
                                                                    branchName: req.body.branchName,
                                                                    bankId: req.body.bankId,
                                                                    branchId: req.body.branchId,
                                                                    productName: req.body.productName,
                                                                    userId: "EMP-1023",
                                                                    sampler: "SUPERVISOR",
                                                                    username: result[i].me_legal_name,
                                                                    presentAddress: result[i].residence_address1,
                                                                    permanentAddress: result[i].residence_address2,
                                                                    document: [],
                                                                    verificationType: result[i].nature_of_verification,
                                                                    productFields: arr,
                                                                    verification_remarks: "",
                                                                    feedback_status: "",
                                                                    pending_count: "",
                                                                    location: '',
                                                                    status: "NEW",
                                                                    is_active: "active",
                                                                    createdAt: new Date(),
                                                                    updatedAt: new Date(),
                                                                    verifiedAt: ""
                                                                });

                                                               // console.log(file)
                                                                if(arr!=undefined)
                                                                    file.save(function (err, file) {
                                                                        console.log("file")
                                                                        //console.log(file)
                                                                        req.body = {};
                                                                        stat = 1;
                                                                        asyncLoop(i + 1, callback);
                                                                        if (err) {
                                                                            console.log(err)
                                                                            // return console.error(err);
                                                                        }
                                                                    });
                                                            }


                                                        });
                                                        // saveFiles(req, result[i])


                                                    }
                                                }


                                            } else {
                                                callback();
                                            }


                                        }
                                        asyncLoop( 0, function() {

                                        });
                                    });
                                    if(stat == 0)
                                        setTimeout(function(){
                                            res.json({message: 'FILES ADDED', status: 1});
                                        }, 5000);
                                    else
                                        res.json({message: 'UPLOAD FAILED', status: 2});
                                }else{
                                    res.json({message: 'CANT READ EXCEL', status: 4});
                                }

                            });
                        } catch (e) {
                            res.json({error_code: 1, err_desc: "Corupted excel file"});
                        }
                    }
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });

    }
});


function mapFile(data,req,result){

    //if(data.DISPLAY_NAME!='' && data.DISPLAY_NAME!=undefined) {
    var display_name = data.FIELD.toLowerCase();
    //console.log("map File===>")
   // console.log(display_name)
    //console.log(result)
    display_name = display_name.split(' ').join('_');
  //  console.log("display_name")
  //  console.log(result[display_name])


    if (result[display_name] != '' && result[display_name] != undefined) {
        data.VALUE = result[display_name];
    }else
        data.VALUE = '';

    // console.log(data)
    return data;
    //}
}


//SHARE IMAGES
app.post('/api/shareDocs', function (req, res) {
    //console.log(req.body.fields)
    if(!req.headers.authorization || !req.body.internalRef_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                var imgs = []
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        if(req.body.docRefId=='application'){
                            var doc = objFile.application_image[0].url;
                            //console.log(doc)
                            var img = doc.split('/');
                            doc = config.uploadPath + img[img.length - 1];
                            imgs.push({filename:img[img.length - 1],content: fs.createReadStream(doc),contentType:'application/pdf'})

                        }else{
                            for(var i=0;i<objFile.document.length;i++){
                                if(objFile.document[i].docRefId==req.body.docRefId){
                                    for(var j=0;j<objFile.document[i].doc_image.length;j++) {
                                        var doc = objFile.document[i].doc_image[j].url;
                                        var img = doc.split('/');
                                        console.log("imgggggg")
                                        console.log(img)
                                        //  var ext = img.split('.');
                                        doc = config.uploadPath + img[img.length - 1];

                                        imgs.push({
                                            filename: img[img.length - 1],
                                            content: fs.createReadStream(doc),
                                            contentType:'application/pdf'
                                        })

                                    }
                                }
                            }
                        }
                        var data = {
                            email:obj.user.personelEmail,
                            //password:user.password,
                            subject: 'BVAS', // Subject line
                            text: 'BVAS Email', // plain text body
                            html: 'Hi,<br>Please Find the Attachment </b><br/>Regards,<br>Bvas Team', // html body
                            attachments:imgs
                        }
                        email.sendEmail(data);
                        res.json({message: 'SUCCESS', status: 1});
                    }else{
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                    }
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});


app.post('/api/sendPdf', function (req, res) {

    console.log("send Pdfff")
    if(!req.headers.authorization || !req.body.pdf || !req.body.bankName || !req.body.internalRef_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                req.body.branch_name = req.body.branchName;
                console.log(req.body)
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        req.body.productName = objFile.productName;
                        model.getBank(req, function (err, objBank) {
                            if (objBank != null) {

                                var imgs = [];

                                var doc = req.body.pdf;
                                var img = doc.split('/');
                                //  var ext = img.split('.');
                                doc = config.uploadTPath + img[img.length - 1];

                                var currentDate = new Date();

                                var uname;
                                if (objFile.username.includes(" ")) {
                                    uname = objFile.username;
                                    var arr = uname.split(" ");
                                    uname = arr[0];
                                } else
                                    uname = objFile.username;

                                var pname;
                                if (objFile.productName.includes(" ")) {
                                    pname = objFile.productName;
                                    var arr = pname.split(" ");
                                    pname = arr[0];
                                } else
                                    pname = objFile.productName;


                                var year = currentDate.getFullYear();
                                var day = currentDate.getDate() < 10 ? "0" + currentDate.getDate() : currentDate.getDate();
                                var mon = ("0" + (currentDate.getMonth() + 1)).slice(-2);

                                var dateString = day + mon + year;

                                var reportWord = img[img.length - 1];
                                //var reportWord ='REPORT'+'-'+req.body.bankName+'-'+req.body.branchName+'-'+uname+'-'+objFile.file_Id+'-'+pname+ '-'+dateString+ '-'+code;

                                imgs.push({
                                    filename: reportWord + '.pdf',
                                    content: fs.createReadStream(doc),
                                    contentType: 'application/pdf'
                                })

                                model.getProductEmail(req, function (err, objProd) {
                                    console.log(objProd)
                                    if (objProd != null) {
                                        if(!objProd.send_pdf_emails || objProd.send_pdf_emails.length!=0) {
                                            console.log("send_pdf_emails", objProd.send_pdf_emails)
                                            console.log("productsss", objFile.productName)
                                            var data = {
                                                email: objProd.send_pdf_emails,
                                                //password:user.password,
                                                subject: reportWord, // Subject liness
                                                text: 'BVAS Email', // plain text body
                                                html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName + '<br/>' + objBank.agency_name + '<br/><br/>' + 'Do Not Reply to This Email',
                                                attachments: imgs
                                            }
                                            email.sendEmail(data);
                                            model.getFileDetails(req, function (err, objFile) {
                                                if (objFile != null) {
                                                    objFile.status = "SENT";
                                                    objFile.updatedAt = new Date();
                                                    model.updateFile(objFile);
                                                }
                                            });
                                            res.json({message: 'SUCCESS', status: 1});
                                        }else{
                                            model.getBranchByBank(req, function (err, objBranch) {
                                                // console.log(objBranch.email)
                                                if (objBranch != null) {

                                                    var data = {
                                                        email: objBranch.email,
                                                        //password:user.password,
                                                        subject: reportWord, // Subject liness
                                                        text: 'BVAS Email', // plain text body
                                                        html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName+'<br/>'+objBank.agency_name+'<br/><br/>'+'Do Not Reply to This Email',
                                                        attachments: imgs
                                                    }
                                                    email.sendEmail(data);
                                                    model.getFileDetails(req, function (err, objFile) {
                                                        if (objFile != null) {
                                                            objFile.status = "SENT";
                                                            objFile.updatedAt = new Date();
                                                            model.updateFile(objFile);
                                                        }
                                                    });
                                                    res.json({message: 'SUCCESS', status: 1});
                                                } else {

                                                    if(!objBank.send_pdf_emails || objBank.send_pdf_emails.length!=0) {
                                                        var data = {
                                                            email: objBank.send_pdf_emails,
                                                            //password:user.password,
                                                            subject: reportWord, // Subject liness
                                                            text: 'BVAS Email', // plain text body
                                                            html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName + '<br/>' + objBank.agency_name + '<br/><br/>' + 'Do Not Reply to This Email',
                                                            attachments: imgs
                                                        }
                                                        email.sendEmail(data);
                                                        model.getFileDetails(req, function (err, objFile) {
                                                            if (objFile != null) {
                                                                objFile.status = "SENT";
                                                                objFile.updatedAt = new Date();
                                                                model.updateFile(objFile);
                                                            }
                                                        });
                                                        res.json({message: 'SUCCESS', status: 1});
                                                    }else{
                                                        res.json({message: 'NO EMAIL FOUND', status: 4});
                                                    }
                                                }
                                            });
                                        }
                                    }else{
                                        model.getBranchByBank(req, function (err, objBranch) {
                                            // console.log(objBranch.email)
                                            if (objBranch != null) {
                                                if(!objBranch.send_pdf_emails || objBranch.send_pdf_emails.length!=0) {
                                                    var data = {
                                                        email: objBranch.email,
                                                        //password:user.password,
                                                        subject: reportWord, // Subject liness
                                                        text: 'BVAS Email', // plain text body
                                                        html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName + '<br/>' + objBank.agency_name + '<br/><br/>' + 'Do Not Reply to This Email',
                                                        attachments: imgs
                                                    }
                                                    email.sendEmail(data);
                                                    model.getFileDetails(req, function (err, objFile) {
                                                        if (objFile != null) {
                                                            objFile.status = "SENT";
                                                            objFile.updatedAt = new Date();
                                                            model.updateFile(objFile);
                                                        }
                                                    });
                                                    res.json({message: 'SUCCESS', status: 1});
                                                }else{
                                                    if(!objBank.send_pdf_emails || objBank.send_pdf_emails.length!=0) {
                                                        var data = {
                                                            email: objBank.send_pdf_emails,
                                                            //password:user.password,
                                                            subject: reportWord, // Subject liness
                                                            text: 'BVAS Email', // plain text body
                                                            html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName + '<br/>' + objBank.agency_name + '<br/><br/>' + 'Do Not Reply to This Email',
                                                            attachments: imgs
                                                        }
                                                        email.sendEmail(data);
                                                        model.getFileDetails(req, function (err, objFile) {
                                                            if (objFile != null) {
                                                                objFile.status = "SENT";
                                                                objFile.updatedAt = new Date();
                                                                model.updateFile(objFile);
                                                            }
                                                        });
                                                        res.json({message: 'SUCCESS', status: 1});
                                                    }else{
                                                        res.json({message: 'NO EMAIL FOUND', status: 4});
                                                    }
                                                }
                                            } else {

                                                //res.json({message: 'BRANCH NOT FOUND', status: 4});
                                                if(!objBank.send_pdf_emails || objBank.send_pdf_emails.length!=0) {
                                                    var data = {
                                                        email: objBank.send_pdf_emails,
                                                        //password:user.password,
                                                        subject: reportWord, // Subject liness
                                                        text: 'BVAS Email', // plain text body
                                                        html: 'Hi,<br/><br>&nbsp;&nbsp;Please Find the Attached PDF Report</b><br/><br/>Thanks and Regards,<br>' + obj.user.firstName + ' ' + obj.user.lastName + '<br/>' + objBank.agency_name + '<br/><br/>' + 'Do Not Reply to This Email',
                                                        attachments: imgs
                                                    }
                                                    email.sendEmail(data);
                                                    model.getFileDetails(req, function (err, objFile) {
                                                        if (objFile != null) {
                                                            objFile.status = "SENT";
                                                            objFile.updatedAt = new Date();
                                                            model.updateFile(objFile);
                                                        }
                                                    });
                                                    res.json({message: 'SUCCESS', status: 1});
                                                }else{
                                                    res.json({message: 'NO EMAIL FOUND', status: 4});
                                                }
                                            }
                                        });
                                    }

                                });

                            }else{
                                res.json({message: 'BANK NOT FOUND', status: 4});
                            }
                        });
                    }else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }

});



app.post('/api/editFile', function (req, res) {
    //console.log(req.body.fields)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {

                    if (objFile != null) {
                        objFile.file_Id = req.body.file_Id;
                        objFile.bankName = req.body.bankName;
                        objFile.branchName = req.body.branchName;
                        objFile.productName = req.body.productName;
                        objFile.userId = req.body.userId;
                        objFile.sampler = req.body.sampler;
                        objFile.username = req.body.username;
                        objFile.presentAddress = req.body.presentAddress;
                        objFile.permanentAddress = req.body.permanentAddress;
                        var data = {
                            docType:req.body.doc_type,
                            fields:req.body.fields,
                            verifier:req.body.verifier,
                            verification_status:req.body.verification_status
                        }
                        objFile.document.push(data);
                        if(req.body.productFields){
                            objFile.productFields = req.body.productFields;
                        }
                        model.updateFile(objFile)
                        model.docList(req, function (err, objDoc) {
                            console.log(objDoc.length)
                            if (objDoc.length != 0) {
                                res.json({message: 'SUCCESS', status: 1,data:objDoc});
                            }else
                                res.json({message: 'SUCCESS', status: 1,data:[]});
                        });
                        //  res.json({message: 'SUCCESS', status: 1});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


app.post('/api/saveDistance', function (req, res) {
    console.log(req.body)
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {

                    if (objFile != null) {

                        for(var i=0;i<objFile.document.length;i++){
                            if(objFile.document[i].docRefId==req.body.docRefId){
                                objFile.document[i].distance = req.body.distance;
                                objFile.document[i].location = req.body.verifierLocation;
                            }
                        }
                        objFile.location = req.body.samplerLocation;
                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    }else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


app.post('/api/getDistance', function (req, res) {
    console.log(req.headers.authorization)
    if (!req.headers.authorization || !req.body.samplerLocation || !req.body.verifierLocation) {
        res.json({
            message: 'PARAMS_REQUIRED',
            status: 3
        });
    } else {
        const key = config.GOOGLE_API_KEY;
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                var origins = req.body.samplerLocation;
                var destinations = req.body.verifierLocation;
                distance.key(key);
                distance.matrix([origins], [destinations], function (err, distances) {
                    if (err) {
                        console.log(err);
                        res.json({
                            message: err,
                            status: 2
                        });
                    }
                    if (!distances) {
                        console.log('no distances');
                        res.json({
                            message: 'no distances',
                            status: 2
                        });
                    }
                    if (distances.status == 'OK') {
                        var origin = distances.origin_addresses[0];
                        var destination = distances.destination_addresses[0];
                        if(distances.rows[0].elements[0].distance!=undefined || distances.rows[0].elements[0].distance) {
                            var distance = distances.rows[0].elements[0].distance.text;

                            console.log('Distance from ' + origin + ' to ' + destination + ' is ' + distance);
                            res.json({
                                message: 'SUCCESS',
                                data: distance,
                                status: 1
                            });
                        }else
                            res.json({
                                message: 'Invalid Place',
                                status: 2
                            });
                    }
                });
            } else {
                res.json({
                    message: 'INVALID_TOKEN',
                    status: 2
                });
            }
        });
    }
});




app.post('/api/updateFile', function (req, res) {
    console.log(req.body.fields)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {

                    if (objFile != null) {
                        console.log(req.body.productFields)
                        objFile.username = req.body.username;
                        objFile.branchName = req.body.branchName;
                        for(var i=0;i<req.body.productFields.length;i++){
                            if(req.body.productFields[i].DEFAULT=='username'){
                                req.body.productFields[i].VALUE = req.body.username;
                            }
                            if(req.body.productFields[i].DEFAULT=='productName'){
                                req.body.productFields[i].VALUE = req.body.productName;
                            }
                            if(req.body.productFields[i].DEFAULT=='branchName'){
                                req.body.productFields[i].VALUE = req.body.branchName;
                            }
                        }



                        objFile.productFields = req.body.productFields;

                        let address = '';
                        for (let i = 0; i < objFile.productFields.length; i++) {
                            if (objFile.productFields[i].FIELD === 'Office_Address_1') {
                                if (objFile.productFields[i].VALUE) {
                                    address = objFile.productFields[i].VALUE + ' ,';
                                }

                            }
                            if(objFile.productFields[i].FIELD === 'Office_Address_2'){
                                if(objFile.productFields[i].VALUE) {
                                    address = address + objFile.productFields[i].VALUE + ' ,';
                                }
                            }
                            if(objFile.productFields[i].FIELD === 'Office_Address_3') {
                                if(objFile.productFields[i].VALUE){
                                    address = address + objFile.productFields[i].VALUE + ' ,';
                                }
                            }

                            if(objFile.productFields[i].FIELD === 'Office_Address_4') {
                                if(objFile.productFields[i].VALUE){
                                    address = address + objFile.productFields[i].VALUE + ' ,';
                                }
                            }
                            if(objFile.productFields[i].FIELD === 'Office_Address_5') {
                                if(objFile.productFields[i].VALUE){
                                    address= address + objFile.productFields[i].VALUE ;
                                }
                            }
                        }
                        objFile.customer_office_full_address = address;


                        objFile.productName = req.body.productName;
                        //console.log("after================>")
                        // console.log(objFile.productFields)
                        model.updateFile(objFile)
                        res.json({message: 'SUCCESS', status: 1,data:objFile.productFields});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR DELETE BANK
app.post('/api/deleteFile', function (req, res) {
    if (!req.headers.authorization ) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                var verified = 0,stat = 0;
                model.getFileDetails(req, function (err, objFile) {
                    console.log("objFile====")
                    // console.log(objFile)
                    if (objFile != null) {
                        /* if(req.body.status=="active"){


                         }else*/

                        if(obj.user.userType=='sampler'){
                            if(req.body.status=="delete")
                                model.removeFile(req);
                        }else{
                            objFile.is_active = req.body.is_active;
                        }

                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR GET FILELIST SAMPLER & SUPERVISOR
app.post('/api/getSentFiles', function (req, res) {
    if(!req.headers.authorization || !req.body.from || !req.body.t){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getSentFile(req, function (err, objFile) {
                    if (objFile.length!=0) {
                        res.json({message: 'SUCCESS', status: 1, data: objFile});
                    }else
                        res.json({message: 'NO FILES FOUND', status: 4});
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});

''
// API FOR GET FILELIST SAMPLER & SUPERVISOR
app.post('/api/getFileList', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                req.body.userId =  obj.user.emp_id;

                if(obj.user.userType=='sampler/verifier' || obj.user.userType=='sampler') {
                    console.log("hereeeeeeeeeee")
                    model.getFileById(req, function (err, objFile) {
                        if (objFile != null) {

                            res.json({message: 'SUCCESS', status: 1, data: objFile});
                        } else
                            res.json({message: 'FILE_NOT_FOUND', status: 4});
                    });
                }else{

                    model.getAllFile(req, function (err, objFile) {
                        // console.log("objFile====")
                        // console.log(objFile)
                        var dataArr = [];
                        if (objFile != null) {

                            for (var i = 0; i < objFile.length; i++) {
                                var len  =  objFile[i].document.length;


                                /* var nowDate = objFile[i].createdAt;

                                 objFile[i].createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                                 nowDate = objFile[i].updatedAt;
                                 objFile[i].updatedAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();*/
                                var count = 0,newCount = 0;
                                for (var j = 0; j < objFile[i].document.length; j++) {
                                    // console.log("document================")
                                    // console.log(objFile[i].document[j])
                                    // if(objFile[i].document[j].is_active!='TEMP') {
                                    if (objFile[i].document[j]) {
                                        if (objFile[i].document[j].is_active == 'delete' || objFile[i].document[j].is_active == 'inactive') {
                                            len = len - 1;
                                        }
                                        if (objFile[i].document[j].verification_status == "COMPLETED" && objFile[i].document[j].is_active != 'delete' && objFile[i].document[j].is_active != 'inactive') {
                                            count = count + 1;
                                        }
                                        if (objFile[i].document[j].verification_status != "NEW" && objFile[i].document[j].is_active != 'delete' && objFile[i].document[j].is_active != 'inactive') {
                                            newCount = newCount + 1;
                                        }
                                    }
                                    // }
                                }

                                if(newCount==len)
                                    newCount = 0;

                                objFile[i].pending_count = count + "/" + len;
                                objFile[i].allocation_count = newCount + "/" + len;
                            }

                            // console.log(objFile)
                            res.json({message: 'SUCCESS', status: 1, data: objFile});
                        } else
                            res.json({message: 'FILE_NOT_FOUND', status: 4});
                    });
                }
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


app.get('/api/getDisableFileList', function (req, res) {

    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getDisableFile(req, function (err, objFile) {
                    if (objFile != null) {
                        // console.log(objFile)

                        for (var i = 0; i < objFile.length; i++) {
                            var len  =  objFile[i].document.length;


                            /* var nowDate = objFile[i].createdAt;

                             objFile[i].createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                             nowDate = objFile[i].updatedAt;
                             objFile[i].updatedAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();*/
                            var count = 0,newCount = 0;
                            for (var j = 0; j < objFile[i].document.length; j++) {
                                // console.log("document================")
                                // console.log(objFile[i].document[j])
                                // if(objFile[i].document[j].is_active!='TEMP') {
                                if (objFile[i].document[j]) {
                                    if (objFile[i].document[j].is_active == 'delete' || objFile[i].document[j].is_active == 'inactive') {
                                        len = len - 1;
                                    }
                                    if (objFile[i].document[j].verification_status == "COMPLETED" && objFile[i].document[j].is_active != 'delete' && objFile[i].document[j].is_active != 'inactive') {
                                        count = count + 1;
                                    }
                                    if (objFile[i].document[j].verification_status != "NEW" && objFile[i].document[j].is_active != 'delete' && objFile[i].document[j].is_active != 'inactive') {
                                        newCount = newCount + 1;
                                    }
                                }
                                // }
                            }

                            if(newCount==len)
                                newCount = 0;

                            objFile[i].pending_count = count + "/" + len;
                            objFile[i].allocation_count = newCount + "/" + len;
                        }
                        res.json({message: 'SUCCESS', status: 1, data: objFile});
                    }else{
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                    }
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});




// API FOR GET FILE DETAILS VIEW SAMPLER
app.post('/api/getFileDetails', function (req, res) {
    if (!req.headers.authorization || !req.body.internalRef_id) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {
                    // console.log("objFile====")
                    // console.log(objFile)
                    if (objFile != null) {

                        for(var i=0;i<objFile.length;i++){
                            var nowDate = objFile[i].createdAt;
                            objFile[i].createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                            nowDate = objFile[i].updatedAt;
                            objFile[i].updatedAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                        }
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

// API FOR PROCESS FILE
app.post('/api/processFile', function (req, res) {
    var limit_distance = 30;
    if (!req.headers.authorization || !req.body.internalRef_id) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        var file_verification_remark = [];
        var file_verification_remarks;
        var verifier_arr = [];
        var doc_arr = [];
        var place_arr = [];
        var ogl_doc_arr = [];
        var ogl_place_arr = [];
        var stat = 'Positive',
            ITR=0,
            bank_statement=0,
            paySlip=0,
            salarySlip=0,
            form16=0,
            Residence_Profile=0,
            buisness=0,
            office=0,
            driving=0,
            pan_card=0,
            voters_id=0,
            adhar_card=0,
            ration_card=0,
            passport=0,
            utility_bills=0,
            trade_licence=0,
            authority_check=0,
            total_distance=0,
            dist_flag=0,
            financials=0,
            totalCount = 0;
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {

                    if (objFile != null) {
                        var arr = objFile.productFields;
                        objFile.productFields = [];
                        objFile.save(function(err, file2) {

                            if (err) {
                                return console.error(err);
                            }
                            //console.log('Updated file1111111: '+ file2);
                        });

                        for(var i=0;i<objFile.document.length;i++){

                            if(objFile.document[i].verification_status=='COMPLETED' && objFile.document[i].is_active=='active'){


                                if(parseFloat(objFile.document[i].distance)>=limit_distance) {
                                    dist_flag = 1;
                                }

                                if(verifier_arr.indexOf(objFile.document[i].verifier)==-1)
                                    verifier_arr.push(objFile.document[i].verifier)

                                if(doc_arr.indexOf(objFile.document[i].docType)==-1)
                                    doc_arr.push(objFile.document[i].docType)

                                if(objFile.document[i].location!=undefined) {
                                    if (place_arr.indexOf(objFile.document[i].location.inputLocation) == -1)
                                        place_arr.push(objFile.document[i].location.inputLocation)
                                }


                                if (objFile.document[i].distance != undefined) {
                                    if (parseFloat(objFile.document[i].distance) >= limit_distance) {
                                        console.log("distance", objFile.document[i].distance)
                                        if (ogl_doc_arr.indexOf(objFile.document[i].docType) == -1)
                                            ogl_doc_arr.push(objFile.document[i].docType)
                                        if (objFile.document[i].location != undefined) {
                                            if (ogl_place_arr.indexOf(objFile.document[i].location.inputLocation) == -1)
                                                ogl_place_arr.push(objFile.document[i].location.inputLocation)
                                        }
                                    }
                                }

                                if(objFile.document[i].docType.toUpperCase()=='BUSINESS PROFILE OTHER'){
                                    objFile.document[i].docType = 'Business Profile';
                                }


                                if(file_verification_remarks==undefined)
                                    file_verification_remarks = objFile.document[i].docType + '<br>' + objFile.document[i].verification_remarks + '<br>';
                                else
                                    file_verification_remarks = file_verification_remarks  + objFile.document[i].docType + '<br>' + objFile.document[i].verification_remarks + '<br>';

                                var docs = {doc_type:objFile.document[i].docType,remark:objFile.document[i].verification_remarks}
                                if(objFile.document[i].otherRemarks) {
                                    docs = {doc_type:objFile.document[i].docType,remark:objFile.document[i].verification_remarks,otherRemarks:objFile.document[i].otherRemarks}
                                    if(file_verification_remarks==undefined)
                                        file_verification_remarks = "Other Observations" + '<br>' + objFile.document[i].otherRemarks + '<br>';
                                    else
                                        file_verification_remarks = file_verification_remarks  + "Other Observations" + '<br>' + objFile.document[i].otherRemarks + '<br>';

                                }
                                file_verification_remarks = file_verification_remarks + '<br>';
                                file_verification_remark.push(docs);


                                if(objFile.document[i].docType.toUpperCase()=='ITR' || objFile.document[i].docType.toUpperCase()=='INCOME TAX RETURN')
                                    ITR = ITR + 1;
                                if(objFile.document[i].docType.toUpperCase()=='BANK STATEMENT')
                                    bank_statement = bank_statement + 1;
                                if(objFile.document[i].docType.toUpperCase()=='PAY SLIP')
                                    paySlip = paySlip + 1;
                                if(objFile.document[i].docType.toUpperCase()=='SALARY CERTIFICATE' || objFile.document[i].docType.toUpperCase()=='SALARY SLIP')
                                    salarySlip = salarySlip + 1;
                                if(objFile.document[i].docType.toUpperCase()=='FORM 16')
                                    form16 = form16 + 1;
                                if(objFile.document[i].docType.toUpperCase()=='FINANCIALS')
                                    financials = financials + 1;
                                if(objFile.document[i].docType.toUpperCase()=='RESIDENCE PROFILE')
                                    Residence_Profile = Residence_Profile + 1;
                                if(objFile.document[i].docType.toUpperCase()=='BUSINESS PROFILE' || objFile.document[i].docType.toUpperCase()=='BUSINESS PROFILE OTHER') {
                                    console.log("buisness")
                                    buisness = buisness + 1;
                                }
                                if(objFile.document[i].docType.toUpperCase()=='OFFICE PROFILE')
                                    office = office + 1;
                                if(objFile.document[i].docType.toUpperCase()=='DRIVING LICENCE')
                                    driving = driving + 1;
                                if(objFile.document[i].docType.toUpperCase()=='PAN CARD')
                                    pan_card = pan_card + 1;
                                if(objFile.document[i].docType.toUpperCase()=='VOTERS ID')
                                    voters_id = voters_id + 1;
                                if(objFile.document[i].docType.toUpperCase()=='ADHAR CARD')
                                    adhar_card = adhar_card + 1;
                                if(objFile.document[i].docType.toUpperCase()=='RATION CARD')
                                    ration_card = ration_card + 1;
                                if(objFile.document[i].docType.toUpperCase()=='PASSPORT')
                                    passport = passport + 1;
                                if(objFile.document[i].docType.toUpperCase()=='UTILITY BILLS')
                                    utility_bills = utility_bills + 1;
                                if(objFile.document[i].docType.toUpperCase()=='TRADE LICENCE')
                                    trade_licence = trade_licence + 1;
                                if(objFile.document[i].docType.toUpperCase()=='AUTHORITY CHECK')
                                    authority_check = authority_check + 1;

                                if(objFile.document[i].distance!=undefined){
                                    if (parseFloat(objFile.document[i].distance) >= limit_distance)
                                        total_distance = total_distance + parseFloat(objFile.document[i].distance);
                                }


                            }


                            /*if (objFile.document[i].remarks_status.toUpperCase() == 'FRAUD' || objFile.document[i].remarks_status.toUpperCase() == 'DOCUMENT DECLINE' || objFile.document[i].remarks_status.toUpperCase() == 'DISCREPANT' || objFile.document[i].remarks_status.toUpperCase() == 'PROFILE DISCREPANT') {
                                stat = 'Fraud'
                            }else if (objFile.document[i].remarks_status.toUpperCase() == 'NEGATIVE' || objFile.document[i].remarks_status.toUpperCase() == 'CREDIT REFERRED') {
                                stat = 'Credit referred'
                            }*/
                            req.body.ITR = ITR;
                            req.body.bank_statement = bank_statement;
                            req.body.pay_sal_form16 = parseInt(paySlip + salarySlip + form16);
                            req.body.Residence_Profile = Residence_Profile;
                            req.body.buisness_office = parseInt(buisness + office);
                            req.body.driving = driving;
                            req.body.pan_card = pan_card;
                            req.body.voters_adhar = parseInt(voters_id + adhar_card);
                            req.body.ration_card = ration_card;
                            req.body.passport = passport;
                            req.body.utility_bills = utility_bills;
                            req.body.trade_licence = trade_licence;
                            req.body.authority_check = authority_check;
                            req.body.financials = financials;

                        }

                        let docDecline = objFile.document.find(x => x.remarks_status.toUpperCase() === 'DOCUMENT DECLINE');

                        if (docDecline) {
                            objFile.feedback_status = 'Document decline';
                        } else {
                            let docProfile = objFile.document.find(x => x.remarks_status.toUpperCase() === 'PROFILE DECLINE');
                            if (docProfile) {
                                objFile.feedback_status = 'Profile decline';
                            } else {
                                let docCredit = objFile.document.find(x => x.remarks_status.toUpperCase() === 'CREDIT REFERRED');
                                if (docCredit) {
                                    objFile.feedback_status = 'Credit referred';
                                } else {
                                    let docNegative = objFile.document.find(x => x.remarks_status.toUpperCase() === 'NEGATIVE');
                                    if (docNegative) {
                                        objFile.feedback_status = 'Negative';
                                    } else {
                                        let docFailed = objFile.document.find(x => x.remarks_status.toUpperCase() === 'FAILED');
                                        if (docFailed) {
                                            objFile.feedback_status = 'Failed';
                                        } else {
                                            objFile.feedback_status = 'Positive';
                                        }

                                    }
                                }

                            }
                        }


                        var countAll_in_MIS = parseInt(ITR + bank_statement + paySlip + salarySlip + form16 + Residence_Profile + buisness + office + driving +
                            pan_card + voters_id + adhar_card + ration_card + passport + utility_bills + trade_licence + financials);

                        req.body.authority_check = parseInt(objFile.document.length - countAll_in_MIS);
                        req.body.totalCount = objFile.document.length;

                        req.body.doc_arr = doc_arr;
                        req.body.place_arr = place_arr;



                        if(dist_flag==1) {
                            req.body.total_distance = total_distance;
                            req.body.ogl_doc_arr = ogl_doc_arr;
                            req.body.ogl_place_arr = ogl_place_arr;
                            if(total_distance>=limit_distance)
                                req.body.local_ogl = 'OGL'
                            else
                                req.body.local_ogl = 'LOCAL'
                        }else{
                            req.body.total_distance = 0;
                            req.body.ogl_doc_arr = [];
                            req.body.ogl_place_arr = [];
                            req.body.local_ogl = 'LOCAL'
                        }

                        if(objFile.location!=undefined)
                            req.body.sampler_loc = objFile.location.inputLocation;




                        req.body.verifier_arr = verifier_arr;
                        objFile.verification_remarks = file_verification_remark;
                        objFile.file_verification_remarks = file_verification_remarks;
                        objFile.submitDate = fun.getCurrentDate();
                        if(objFile.status!='SENT') {
                            if(objFile.status=='COMPLETED'){
                                objFile.status = "VERIFIED";
                                objFile.feedback_status = '';
                                // objFile.verifiedAt = new Date();
                            }else
                                objFile.status = "COMPLETED";
                        }else{
                            objFile.status = "VERIFIED";
                            objFile.feedback_status = '';
                            //objFile.verifiedAt = new Date();
                        }

                        var nowDate = new Date();
                        objFile.updatedAt = nowDate;



                        /* if (stat  == 'Document decline') {
                             objFile.feedback_status = 'Document decline'
                         }else if (stat == 'Profile decline') {
                             objFile.feedback_status = 'Profile decline'
                         }else if (stat == 'Credit referred') {
                             objFile.feedback_status = 'Credit referred'
                         }else
                             objFile.feedback_status = 'Positive';*/

                        console.log("feedback status")
                        console.log(objFile.feedback_status)

                        if(arr) {
                            arr.forEach(element => {
                                if (element.FILLED_BY == 'auto') {
                                    // Save file: - All the default values will be processed
                                    data = processFile(element,req,objFile);
                                    element.VALUE = data.VALUE;
                                }
                            });
                            //req.body.fields = arr;
                            objFile.productFields = arr;

                        }

                        objFile.save(function(err, file2) {

                            if (err) {
                                return console.error(err);
                            }
                            //console.log('Updated file1111111: '+ file2);
                        });
                        res.json({message: 'SUCCESS', status: 1,data:file_verification_remark});
                        //res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


function processFile(data,req,objFile){
    //console.log("Save File Fields")

    //console.log(data)
    if(data.FIELD.toUpperCase()=='DECLINE_TYPE'){
        if(objFile.feedback_status.toUpperCase()!='POSITIVE'){
            data.VALUE = objFile.feedback_status
        }
    }
    if(data.POST_DEFAULT) {

        switch (data.POST_DEFAULT) {
            case 'VERIFIER_NAME':
                var verifiers_list = '';
                for(var i=0;i<req.body.verifier_arr.length;i++){
                    if(i!=0)
                        verifiers_list = verifiers_list + ',' + req.body.verifier_arr[i];
                    else
                        verifiers_list = req.body.verifier_arr[i];
                }
                data.VALUE = verifiers_list;
                break;
            case 'NA':
                data.VALUE = 'NA';
                break;
            case 'CURRENT_DATE':
                console.log("inside======>")
                data.VALUE = fun.getCurrentDate();
                console.log(data.VALUE)
                break;
            case 'AGENCY_REMARKS':
                // console.log("inside======AGENCY>")
                //console.log(objFile.file_verification_remarks)
                data.VALUE = objFile.file_verification_remarks;
                //  console.log(data.VALUE)
                break;
            case 'STATUS':
                // console.log("inside======>")
                data.VALUE = objFile.feedback_status;
                //  console.log(data.VALUE)
                break;
            default:
                var val = data.VALUE;
                if(data.POST_DEFAULT!="")
                    data.VALUE = fun.callFunction(data.POST_DEFAULT,objFile,req);
                //console.log("TAT VALUE")
                //console.log(data.VALUE)
                if(data.VALUE==null) {
                    data.VALUE = val;
                }
                break;
        }
    }
    return data;
}


//ADD FILE DETAILS
app.post('/api/updateVerifierImage', function (req, res) {

    if(!req.headers.authorization || !req.body.internalRef_id || !req.body.docRefId || !req.body.verifier_image){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        for(var i=0;i<objFile.document.length;i++){
                            if(objFile.document[i].docRefId==req.body.docRefId){
                                objFile.document[i].verifier_image = req.body.verifier_image;
                            }
                        }
                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    }else{
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                    }
                });
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }

});

//ADD FILE DETAILS
app.post('/api/getProductFields', function (req, res) {
    if(!req.headers.authorization || !req.body.bankName || !req.body.productName){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getProductFields(req, function (err, objFile) {
                    if (objFile != null) {
                        //  console.log("In Product")
                        if(objFile.fields.length!=0)
                            res.json({message: 'SUCCESS', status: 1,data:objFile});
                        else{
                            req.body.branch_name = req.body.branchName;
                            model.getBranchByBank(req, function (err, objBranch) {
                                if (objBranch != null) {
                                    if(objBranch.fields.length!=0)
                                        res.json({message: 'SUCCESS', status: 1, data: objBranch});
                                    else{
                                        model.getBank(req, function (err, objBank) {
                                            if (objBank != null) {
                                                //  console.log("In Bank")
                                                if(objBank.fields.length!=0)
                                                    res.json({message: 'SUCCESS', status: 1, data: objBank});
                                                else
                                                    res.json({message: 'DATA_NOT_FOUND', status: 4});
                                            } else
                                                res.json({message: 'DATA_NOT_FOUND', status: 4});
                                        });
                                    }
                                } else{
                                    model.getBank(req, function (err, objBank) {
                                        if (objBank != null) {
                                            //console.log("In Bank")
                                            if(objBank.fields.length!=0)
                                                res.json({message: 'SUCCESS', status: 1, data: objBank});
                                        } else
                                            res.json({message: 'DATA_NOT_FOUND', status: 4});
                                    });
                                }
                                //res.json({message: 'FILE_NOT_FOUND', status: 4});
                            });
                        }
                    } else {
                        req.body.branch_name = req.body.branchName;
                        model.getBranchByBank(req, function (err, objBranch) {
                            if (objBranch != null) {
                                if(objBranch.fields.length!=0)
                                    res.json({message: 'SUCCESS', status: 1, data: objBranch});
                                else{
                                    model.getBank(req, function (err, objBank) {
                                        if (objBank != null) {
                                            //  console.log("In Bank")
                                            if(objBank.fields.length!=0)
                                                res.json({message: 'SUCCESS', status: 1, data: objBank});
                                            else
                                                res.json({message: 'DATA_NOT_FOUND', status: 4});
                                        } else
                                            res.json({message: 'DATA_NOT_FOUND', status: 4});
                                    });
                                }
                            } else{
                                model.getBank(req, function (err, objBank) {
                                    if (objBank != null) {
                                        // console.log("In Bank")
                                        if(objBank.fields.length!=0)
                                            res.json({message: 'SUCCESS', status: 1, data: objBank});
                                        else
                                            res.json({message: 'DATA_NOT_FOUND', status: 4});
                                    } else
                                        res.json({message: 'DATA_NOT_FOUND', status: 4});
                                });
                            }
                            //res.json({message: 'FILE_NOT_FOUND', status: 4});
                        });
                    }
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

//ADD FILE DETAILS
app.post('/api/addProductFields', function (req, res) {
    if(!req.headers.authorization || !req.body.fileName){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var fields;
        // var fieldValue = ;
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {

                        // console.log("exists")
                        objFile.fields = "";
                        objFile.productFields = req.body.fields;
                        objFile.productName = req.body.productName;
                        objFile.verificationType = req.body.verificationType;
                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});



//EDIT FILE DETAILS
app.post('/api/editProductFields', function (req, res) {
    if(!req.headers.authorization || !req.body.fileName){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var fields;
        // var fieldValue = ;
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {

                        // objFile.productFields = req.body.fields;
                        objFile.username = req.body.username;
                        for(var i=0;i<req.body.fields.length;i++){
                            if(req.body.fields[i].DEFAULT=='username'){
                                req.body.fields[i].VALUE = req.body.username;
                            }
                        }
                        objFile.productFields = req.body.fields;

                        // console.log('ProductFields',objFile.productFields)
                        //  objFile.verificationType = req.body.verificationType;
                        model.updateFile(objFile);
                        model.docList(req, function (err, objDoc) {
                            //console.log(objDoc.length)
                            if (objDoc.length != 0) {
                                objDoc.sort(function(a, b){
                                    if(a.document_type.toUpperCase() < b.document_type.toUpperCase()) { return -1; }
                                    if(a.document_type.toUpperCase() > b.document_type.toUpperCase()) { return 1; }
                                    return 0;
                                })
                                res.json({message: 'SUCCESS', status: 1,data:objDoc});
                            }else
                                res.json({message: 'SUCCESS', status: 1,data:[]});
                        });
                        //res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

app.post('/api/addDocFields', function (req, res) {
    console.log("req.bodddddddyyyyyyyyyyyyyy")
    console.log(req.body)
    if(!req.headers.authorization || !req.body.fileName || !req.body.doc_type){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {
                        // console.log(objFile.document.length)

                        var data = {
                            docType:req.body.doc_type,
                            fields:req.body.fields,
                            verifier:"",
                            verification_status:"NEW"
                        }

                        objFile.document = data;

                        // console.log(data)
                        model.updateFile(objFile);

                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


//SUBMIT DOCUMENT VALUES
app.post('/api/saveDocValues', function (req, res) {

    console.log(req.body)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var fields;
        var docs = req.body.document;
        var demo = [];
        var docList = [];
        var arrDemo = [];
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                // console.log("userType===================")
                // console.log(obj.user.userType)
                model.docList(req, function (err, objDoc) {
                    if (objDoc != null) {
                        docList = objDoc;
                        //  console.log('[o9ik', docList.length);


                        model.getFileByName(req, function (err, objFile) {
                            if (objFile != null) {
                                if (req.body.userType == 'sampler') {

                                    objFile.location = req.body.location;
                                    var deviceToken = [];
                                    if (objFile.status == 'TEMP') {
                                        objFile.status = 'NEW';
                                        model.getDeviceIds(req, function (err, objDev) {
                                            if (objDev != null) {
                                                for (var i = 0; i < objDev.length; i++) {

                                                    if (deviceToken.indexOf(objDev[i].deviceId) == -1) {

                                                        deviceToken.push(objDev[i].deviceId)
                                                    }

                                                }
                                                var data = {
                                                    deviceToken: deviceToken,
                                                    msg: "You have a new file",
                                                    file_Id:objFile.file_Id
                                                }

                                                notification.sendPush(data)
                                            }
                                        });
                                    }


                                    for (var i = 0; i < docs.length; i++) {
                                        //    console.log("doc found first");
                                        //  console.log('jntgvbyhv', docList.length);

                                        if (objFile.document.length == 0) {
                                            objFile.document.push(addDoc(req, docs[i], objFile, docList));
                                        }
                                        else {
                                            var exitallReady = 0;
                                            for (var j = 0; j < objFile.document.length; j++) {

                                                if(docs[i].docRefId!=null) {
                                                    if (objFile.document[j].docRefId == docs[i].docRefId) {
                                                        exitallReady = 1;
                                                        objFile.document[j].fields = docs[i].fields;
                                                        //objFile.document[j].is_active = 'active'
                                                    }
                                                    // else{
                                                    //      objFile.document.push(docs[i])
                                                    //
                                                    // }
                                                }
                                            }
                                            if (exitallReady == 0) {
                                                objFile.document.push(addDoc(req, docs[i], objFile, docList));
                                            }

                                        }
                                    }


                                    for (var i = 0; i < objFile.document.length; i++) {
                                        for (var j = 0; j < docs.length; j++) {
                                            demo.push(objFile.document[i].docRefId)
                                        }
                                    }


                                }

                                var remark, verified = 0;
                                var remark_stat = 'Positive';

                                if (req.body.userType == 'verifier') {

                                    for (var i = 0; i < docs.length; i++) {
                                        // console.log("doc found first")
                                        //console.log(objFile.document[i])
                                        for (var j = 0; j < objFile.document.length; j++) {
                                            if (objFile.document[j]) {
                                                if (objFile.document[j].docRefId == docs[i].docRefId) {
                                                    objFile.document[j].fields = docs[i].fields;
                                                    objFile.document[j].location = req.body.location;
                                                    objFile.document[j].verification_status = 'COMPLETED';
                                                    objFile.document[j].verifiedAt = new Date();
                                                    // if(docs[i].fields[d].VALUE!=undefined) {
                                                    for (var d = 0; d < docs[i].fields.length; d++) {
                                                        // console.log(docs[i].fields[d].VALUE.toUpperCase())
                                                        /*if (docs[i].fields[d].VALUE.toUpperCase() == 'FRAUD' || docs[i].fields[d].VALUE.toUpperCase() == 'DOCUMENT DECLINE' || docs[i].fields[d].VALUE.toUpperCase() == 'DISCREPANT' || docs[i].fields[d].VALUE.toUpperCase() == 'PROFILE DISCREPANT' || docs[i].fields[d].VALUE.toUpperCase() == 'PROFILE DECLINE') {
                                                            remark_stat = 'Fraud'
                                                        } else if (docs[i].fields[d].VALUE.toUpperCase() == 'NEGATIVE' || docs[i].fields[d].VALUE.toUpperCase() == 'CREDIT REFERRED') {
                                                            remark_stat = 'Credit referred'
                                                        }*/
                                                        if(objFile.document[j].fields[d].FIELD.toUpperCase()=='STATUS') {


                                                            if (docs[i].fields[d].VALUE.toUpperCase() == 'DOCUMENT DECLINE') {
                                                                remark_stat = 'Document decline'
                                                            } else if (docs[i].fields[d].VALUE.toUpperCase() == 'PROFILE DECLINE') {
                                                                remark_stat = 'Profile decline'
                                                            } else if (docs[i].fields[d].VALUE.toUpperCase() == 'CREDIT REFERRED') {
                                                                remark_stat = 'Credit referred'
                                                            }else if (docs[i].fields[d].VALUE.toUpperCase() == 'NEGATIVE') {
                                                                remark_stat = 'Negative'
                                                            } else if (docs[i].fields[d].VALUE.toUpperCase() == 'FAILED') {
                                                                remark_stat = 'Failed';
                                                            }
                                                            else
                                                                remark_stat = 'Positive';

                                                        }
                                                    }
                                                    // }
                                                    if (remark_stat == 'Document decline'){
                                                        objFile.document[j].remarks_status = 'Document decline';
                                                        if (objFile.document[j].remarks.negative_remarks)
                                                            remark = objFile.document[j].remarks.negative_remarks;
                                                    }else if (remark_stat == 'Profile decline'){
                                                        objFile.document[j].remarks_status = 'Profile decline';
                                                        if (objFile.document[j].remarks.negative_remarks)
                                                            remark = objFile.document[j].remarks.negative_remarks;
                                                    }else if (remark_stat == 'Credit referred'){
                                                        objFile.document[j].remarks_status = 'Credit referred';
                                                        if (objFile.document[j].remarks.negative_remarks)
                                                            remark = objFile.document[j].remarks.negative_remarks;
                                                    } else if (remark_stat.toUpperCase() == 'NEGATIVE') {
                                                        objFile.document[j].remarks_status = 'Negative';
                                                        if (objFile.document[j].remarks.negative_remarks)
                                                            remark = objFile.document[j].remarks.negative_remarks;
                                                    } else if (remark_stat.toUpperCase() == 'FAILED') {
                                                        objFile.document[j].remarks_status = 'Failed';
                                                        if (objFile.document[j].remarks.negative_remarks)
                                                            remark = objFile.document[j].remarks.negative_remarks;
                                                    }else {
                                                        objFile.document[j].remarks_status = 'positive';
                                                        if (objFile.document[j].remarks.positive_remarks)
                                                            remark = objFile.document[j].remarks.positive_remarks;
                                                    }
                                                    /* if (remark_stat == 'Positive') {
                                                         objFile.document[j].remarks_status = 'positive';
                                                         if (objFile.document[j].remarks.positive_remarks)
                                                             remark = objFile.document[j].remarks.positive_remarks;
                                                     } else if (remark_stat == 'Fraud'){
                                                         objFile.document[j].remarks_status = 'Fraud';
                                                         if (objFile.document[j].remarks.negative_remarks)
                                                             remark = objFile.document[j].remarks.negative_remarks;
                                                     }else{
                                                         objFile.document[j].remarks_status = 'Credit referred';
                                                         if (objFile.document[j].remarks.negative_remarks)
                                                             remark = objFile.document[j].remarks.negative_remarks;
                                                     }*/


                                                    for (var d = 0; d < docs[i].fields.length; d++) {
                                                        //console.log(docs[j])
                                                        if (docs[i].fields[d].VALUE != "" && docs[i].fields[d].VALUE != undefined) {
                                                            if (remark != undefined) {
                                                                if(docs[i].fields[d].VALUE=='Other'){
                                                                    //  console.log("Other value mapping")
                                                                    //   console.log(docs[i].fields[d].MAPPING)
                                                                    // console.log(docs[i].fields[d].OTHER_VALUE)
                                                                    remark = remark.replace('{' + docs[i].fields[d].MAPPING + '}', docs[i].fields[d].OTHER_VALUE);
                                                                }else {
                                                                    // console.log("value mapping")
                                                                    //  console.log(docs[i].fields[d].MAPPING)
                                                                    //  console.log(docs[i].fields[d].OTHER_VALUE)
                                                                    remark = remark.replace('{' + docs[i].fields[d].MAPPING + '}', docs[i].fields[d].VALUE);
                                                                }
                                                            }
                                                            else
                                                                remark = "";
                                                        }
                                                    }
                                                    objFile.document[j].verification_remarks = remark;

                                                    if (req.body.otherRemarks) {
                                                        objFile.document[j].otherRemarks = req.body.otherRemarks;
                                                    } else
                                                        objFile.document[j].otherRemarks = "";

                                                    //console.log("verification status========>")
                                                    //console.log(objFile.document[j].verification_status)

                                                    //  }

                                                }

                                            }
                                            if ((objFile.document[j].verification_status == 'IN_PROGRESS'  || objFile.document[j].verification_status == 'NEW') && objFile.document[j].is_active != 'delete' && objFile.document[j].is_active != 'inactive') {
                                                // console.log("verified")
                                                verified = 1;
                                            }
                                        }
                                    }
                                    if (verified == 0) {
                                        // console.log("ddddddddddddddddddddd")
                                        objFile.status = 'VERIFIED';
                                        objFile.verifiedAt = new Date();


                                        for (var j = 0; j < objFile.productFields.length; j++) {
                                            if(objFile.productFields[j].FIELD=='COMPLETION_DATE'){
                                                objFile.productFields[j].VALUE = fun.getCurrentDate();
                                            }
                                        }



                                        var deviceToken = [];
                                        model.getDeviceIds(req, function (err, objDev) {
                                            if (objDev != null) {
                                                for (var i = 0; i < objDev.length; i++) {
                                                    if(objDev[i].deviceId!=undefined)
                                                        if (deviceToken.indexOf(objDev[i].deviceId) == -1) {

                                                            deviceToken.push(objDev[i].deviceId)
                                                        }

                                                }
                                                var data = {
                                                    deviceToken: deviceToken,
                                                    msg: "You have a verified File",
                                                    file_Id:objFile.file_Id
                                                }

                                                notification.sendPush(data)
                                            }
                                        });
                                    }
                                }

                                if (req.body.userType == 'supervisor') {
                                    console.log("supervison")
                                    for (var j = 0; j < objFile.document.length; j++) {

                                        console.log(objFile.document[j].docRefId)
                                        console.log(req.body.docRefId)

                                        if (objFile.document[j].docRefId == req.body.docRefId) {
                                            console.log("insideeeeeeeeeeee")
                                            objFile.document[j].fields = req.body.fields;
                                            //console.log(objFile.document[j].docRefId)
                                            console.log(objFile.document[j].fields)
                                            for (var d = 0; d < objFile.document[j].fields.length; d++) {
                                                console.log(objFile.document[j].fields[d].VALUE.toUpperCase())
                                                /* if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'FRAUD' || objFile.document[j].fields[d].VALUE.toUpperCase() == 'DOCUMENT DECLINE' || objFile.document[j].fields[d].VALUE.toUpperCase() == 'DISCREPANT' || objFile.document[j].fields[d].VALUE.toUpperCase() == 'PROFILE DISCREPANT' || objFile.document[j].fields[d].VALUE.toUpperCase()=='PROFILE DECLINE') {
                                                     remark_stat = 'Fraud'
                                                 }else if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'NEGATIVE' || objFile.document[j].fields[d].VALUE.toUpperCase() == 'CREDIT REFERRED') {
                                                     remark_stat = 'Credit referred'
                                                 }*/
                                                if(objFile.document[j].fields[d].FIELD.toUpperCase()=='STATUS') {

                                                    if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'DOCUMENT DECLINE') {
                                                        console.log("yessssssss")
                                                        remark_stat = 'Document decline'
                                                    } else if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'PROFILE DECLINE') {
                                                        remark_stat = 'Profile decline'
                                                    } else if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'CREDIT REFERRED') {
                                                        remark_stat = 'Credit referred'
                                                    }else if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'NEGATIVE') {
                                                        remark_stat = 'Negative'
                                                    } else if (objFile.document[j].fields[d].VALUE.toUpperCase() == 'FAILED') {
                                                        remark_stat = 'Failed'
                                                    }
                                                    else
                                                        remark_stat = 'Positive';
                                                }



                                            }
                                            //console.log("File Status===============>",remark_stat)

                                            if (remark_stat == 'Document decline'){
                                                objFile.document[j].remarks_status = 'Document decline';
                                                if (objFile.document[j].remarks.negative_remarks)
                                                    remark = objFile.document[j].remarks.negative_remarks;
                                            }else if (remark_stat == 'Profile decline'){
                                                objFile.document[j].remarks_status = 'Profile decline';
                                                if (objFile.document[j].remarks.negative_remarks)
                                                    remark = objFile.document[j].remarks.negative_remarks;
                                            }else if (remark_stat == 'Credit referred'){
                                                objFile.document[j].remarks_status = 'Credit referred';
                                                if (objFile.document[j].remarks.negative_remarks)
                                                    remark = objFile.document[j].remarks.negative_remarks;
                                            } else if (remark_stat.toUpperCase() == 'NEGATIVE') {
                                                objFile.document[j].remarks_status = 'Negative';
                                                if (objFile.document[j].remarks.negative_remarks)
                                                    remark = objFile.document[j].remarks.negative_remarks;
                                            } else if (remark_stat.toUpperCase() == 'FAILED') {
                                                objFile.document[j].remarks_status = 'Failed';
                                                if (objFile.document[j].remarks.negative_remarks)
                                                    remark = objFile.document[j].remarks.negative_remarks;
                                            }else {
                                                objFile.document[j].remarks_status = 'positive';
                                                if (objFile.document[j].remarks.positive_remarks)
                                                    remark = objFile.document[j].remarks.positive_remarks;
                                            }

                                            // console.log("File Status2222222===============>",remark)

                                            /* if (remark_stat == 'Positive') {
                                                 objFile.document[j].remarks_status = 'positive';
                                                 if (objFile.document[j].remarks.positive_remarks)
                                                     remark = objFile.document[j].remarks.positive_remarks;
                                             } else if (remark_stat == 'Fraud'){
                                                 objFile.document[j].remarks_status = 'Fraud';
                                                 if (objFile.document[j].remarks.negative_remarks)
                                                     remark = objFile.document[j].remarks.negative_remarks;
                                             }else{
                                                 objFile.document[j].remarks_status = 'Credit referred';
                                                 if (objFile.document[j].remarks.negative_remarks)
                                                     remark = objFile.document[j].remarks.negative_remarks;
                                             }*/

                                            for (var d = 0; d < objFile.document[j].fields.length; d++) {
                                                //console.log(docs[j])
                                                if (objFile.document[j].fields[d].VALUE != "" && objFile.document[j].fields[d].VALUE != undefined) {
                                                    if (remark != undefined)
                                                        if(objFile.document[j].fields[d].VALUE=='Other')
                                                            remark = remark.replace('{' + objFile.document[j].fields[d].MAPPING + '}', objFile.document[j].fields[d].OTHER_VALUE);
                                                        else
                                                            remark = remark.replace('{' + objFile.document[j].fields[d].MAPPING + '}', objFile.document[j].fields[d].VALUE);
                                                    else
                                                        remark = "";
                                                }
                                            }
                                            objFile.document[j].verification_remarks = remark;
                                            console.log("verification_remarks===============>",objFile.document[j].verification_remarks)

                                        }
                                    }
                                    model.updateFile(objFile);
                                }

                                if (req.body.userType == 'sampler') {
                                    objFile.status = 'NEW';
                                }
                                if (objFile.document.length != 0) {

                                    arrDemo = objFile.productFields;
                                    objFile.productFields = [];
                                    model.updateFile(objFile);
                                    console.log("is??")
                                    console.log(arrDemo)
                                    objFile.productFields = arrDemo;
                                    model.updateFile(objFile);
                                }
                                res.json({message: 'SUCCESS', status: 1, data: objFile});
                            } else
                                res.json({message: 'FILE_NOT_FOUND', status: 4});
                        });
                    }
                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

function addDoc(req,docs,objFile,docList){

    console.log("inside addDoc")
    console.log(docs)
    var positive_remark = "";

    var nowDate = new Date();
    //req.body.createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
    req.body.createdAt = nowDate;
    req.body.updatedAt = nowDate;

    console.log('ugujht6fty',docList.length);
    for(var i=0;i<docList.length;i++){
        if(docList[i].document_type==docs.doc_type){
            positive_remark = docList[i].positive_remarks;
            negative_remark = docList[i].negative_remarks;
        }
    }



    var docLength = objFile.document.length;
    var num = 101,docRefId;
    if(docLength > 0) {

        docRefId = objFile.document[docLength - 1].docRefId
        docRefId = docRefId.split('-');
        var no = parseInt(docRefId[1]) + 1;
        docRefId = docRefId[0] + '-' + no;
        // console.log("doc idddddddddddddddddd===>1111111111111111")
        // console.log(docRefId)
    }
    else
        docRefId = 'File'+objFile.file_Id + docs.doc_type + '-'+num

    var doc = {
        docRefId: docRefId,
        docType: docs.doc_type,
        fields:docs.fields,
        verifier:"",
        verification_status:"NEW",
        bankName:"",
        remarks:{positive_remarks:positive_remark,negative_remarks:negative_remark},
        doc_image:[{url:"",page:""}],
        remarks_status:"",
        verification_remarks:"",
        otherRemarks:"",
        is_active:"active",
        createdAt   : req.body.createdAt,
        updatedAt   : req.body.updatedAt
    }

    // if(doc) {
    //     if(objFile.document!=undefined) {
    //         console.log("not undefineddddddd")
    //         console.log(objFile.document)
    //         console.log(doc.docType)
    //         console.log(objFile.document.indexOf(doc.docType))
    if (objFile.document.indexOf(doc.docRefId) == -1) {
        console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
        return doc;
    }
    //     }
    // }


    /* objFile.save(function(err, file2) {

         if (err) {
             return console.error(err);
         }
         console.log('Updated file1111111: '+ file2);
     });*/

}


//SUBMIT DOCUMENT VALUES
app.post('/api/edit', function (req, res) {
    if (!req.headers.authorization) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        var fields;
        var docs = req.body.document;
        var demo = [];
        var docList = [];

        model.getToken(data, function (err, obj) {
            if (obj != null) {

            }
        });
    }
});



//edit Remark by supervisor
app.post('/api/editRemark', function (req, res) {

    console.log("edit verfication remark")
    if(!req.headers.authorization || !req.body.internalRef_id || !req.body.docRefId || !req.body.verification_remarks){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }

        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        for (var i = 0; i < objFile.document.length; i++) {
                            if (objFile.document[i].docRefId == req.body.docRefId) {
                                // console.log()
                                objFile.document[i].verification_remarks = req.body.verification_remarks;
                                if(req.body.otherRemarks!=undefined)
                                    objFile.document[i].otherRemarks = req.body.otherRemarks;
                            }
                        }
                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1, data: objFile});
                    } else {
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                    }
                });
            } else {
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }

});


//edit Remark by supervisor
app.post('/api/reassignSampler', function (req, res) {

    if(!req.headers.authorization || !req.body.internalRef_id){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        if(objFile.status=='NEW') {
                            objFile.status = 'TEMP';
                            model.updateFile(objFile);

                            var msg = 'You have a file for sampling';
                            var deviceToken = [];
                            req.body.userId = objFile.userId;

                            model.getTokenId(req, function (err, objDEV) {
                                if (objDEV != null) {
                                    // console.log("obj===========>")
                                    // console.log(objDEV)
                                    for (var i = 0; i < objDEV.length; i++) {
                                        // console.log(objDEV[i].deviceId)
                                        if (deviceToken.indexOf(objDEV[i].deviceId) == -1) {

                                            deviceToken.push(objDEV[i].deviceId)
                                        }
                                        // deviceToken.push(obj[i].deviceId)
                                    }

                                    // console.log("deviceIdsssssssssssss")
                                    // console.log(deviceToken)
                                    var data = {
                                        deviceToken: deviceToken,
                                        msg: msg,
                                        file_Id:objFile.file_Id
                                    }

                                    notification.sendPush(data)
                                }
                            });
                            res.json({message: 'SUCCESS', status: 1});
                        }else{
                            res.json({message: 'ALREADY ASSIGNED FILE', status: 4});
                        }
                    }else{
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                    }
                })
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }

});

//DELETE DOCUMENT VALUES
app.post('/api/deleteDocValues', function (req, res) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var fields,verifier;
        var verified = 0,stat = 0;
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {
                        for(var i=0;i<objFile.document.length;i++){
                            if(objFile.document[i].docRefId == req.body.docRefId){
                                // console.log()
                                if(obj.user.userType!='sampler' && obj.user.userType!='sampler/verifier') {
                                    objFile.document[i].is_active = req.body.is_active;
                                }else{
                                    objFile.document.splice(i,1);
                                }
                                if(obj.user.userType!='sampler' && obj.user.userType!='sampler/verifier') {
                                    if (objFile.document[i].verification_status != 'NEW' && objFile.document[i].verification_status != 'TEMP') {
                                        verifier = objFile.document[i].verifier;
                                    }
                                }
                            }
                            // console.log("staus====================>")
                            //console.log(objFile.document[i].is_active)
                            if(obj.user.userType!='sampler' && obj.user.userType!='sampler/verifier') {
                                if (objFile.document[i].verification_status != 'COMPLETED' && objFile.document[i].is_active != 'delete' && objFile.document[i].is_active != 'inactive') {
                                    if (objFile.document[i].verification_status == 'NEW') {
                                        stat = 1;
                                    }
                                    verified = 1;
                                }
                            }
                        }

                        if(obj.user.userType!='sampler' && obj.user.userType!='sampler/verifier') {
                            if (verified == 0) {
                                objFile.status = 'VERIFIED';
                                //objFile.verifiedAt = new Date();

                            } else {
                                objFile.status = 'NEW';
                                if (stat == 0) {
                                    objFile.status = 'IN_PROGRESS';
                                }
                            }

                        }

                        var msg;
                        var deviceToken = [];
                        if(req.body.is_active=='active')
                            msg = 'Document Enabled';
                        else
                            msg = 'Document Disabled';

                        if(verifier!=undefined && verifier!="") {
                            req.body.verifier = verifier;
                            // console.log("dsfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
                            // console.log(req.body.userId)
                            model.getTokenName(req, function (err, objDEV) {
                                if (objDEV != null) {
                                    console.log("obj===========>")
                                    console.log(objDEV)
                                    for (var i = 0; i < objDEV.length; i++) {
                                        console.log(objDEV[i].deviceId)
                                        if (deviceToken.indexOf(objDEV[i].deviceId) == -1) {

                                            deviceToken.push(objDEV[i].deviceId)
                                        }
                                        // deviceToken.push(obj[i].deviceId)
                                    }

                                    // console.log("deviceIdsssssssssssss")
                                    // console.log(deviceToken)
                                    var data = {
                                        deviceToken: deviceToken,
                                        msg: msg,
                                        file_Id:objFile.file_Id
                                    }

                                    notification.sendPush(data)
                                }
                            });
                        }
                        // console.log(objFile)
                        model.updateFile(objFile);
                        res.json({message: 'SUCCESS', status: 1,data:objFile});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


app.post('/api/clearProcess', function (req, res) {
    if (!req.headers.authorization || !req.body.internalRef_id) {
        res.json({message: 'PARAMS_REQUIRED', status: 3});
    } else {
        var data = {
            accessToken: req.headers.authorization
        }
        var arr = [];
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                model.getFileDetails(req, function (err, objFile) {
                    if (objFile != null) {
                        //for(var i=0;i<objFile.length;i++){
                        if(objFile.status=='IN_PROGRESS' || objFile.status=='COMPLETED' || objFile.status=='NEW'){
                            objFile.status = 'NEW';
                            objFile.file_verification_remarks = '';
                            objFile.verification_remarks = [];
                            if(objFile.document.length!=0) {
                                for (var j = 0; j < objFile.document.length; j++) {
                                    sendPush(req,objFile.document[j].verifier,objFile);
                                    objFile.document[j].verifier = '';
                                    objFile.document[j].verification_status = 'NEW';
                                    //objFile.document[j].doc_image = [];
                                    objFile.document[j].remarks_status = '';
                                    objFile.document[j].verification_remarks = '';
                                    objFile.document[j].otherRemarks = '';
                                    objFile.document[j].verifier_record = [];
                                    objFile.document[j].verifier_image = [];
                                    objFile.document[j].reason_for_rejection = '';
                                    objFile.document[j].location = '';
                                    arr = objFile.document[j].fields;
                                    for(var i=0;i<arr.length;i++){
                                        if(arr[i].FILLED_BY=='verifier'){
                                            console.log("verifierrrrrrrrrrrr")
                                            arr[i].VALUE = '';
                                        }
                                    }

                                    objFile.document[j].fields = [];
                                    model.updateFile(objFile);
                                    objFile.document[j].fields = arr;
                                    model.updateFile(objFile);

                                }
                            }
                        }
                        // }
                        //  model.updateFile(objFile);
                        //console.log("objFile===")
                        //  console.log(objFile)
                        res.json({message: 'SUCCESS', status: 1});
                    }else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

function sendPush(req,verifier,objFile){
    req.body.verifier = verifier;
    model.getTokenName(req, function (err, objDEV) {

        var msg = 'You document has been cleared';
        //var type = 'DOCUMENT';
        var deviceToken = [];
        if (objDEV != null) {
            // console.log("obj===========>")
            // console.log(objDEV)
            for (var i = 0; i < objDEV.length; i++) {
                console.log(objDEV[i].deviceId)
                if (deviceToken.indexOf(objDEV[i].deviceId) == -1) {

                    deviceToken.push(objDEV[i].deviceId)
                }
                // deviceToken.push(obj[i].deviceId)
            }

            // console.log("deviceIdsssssssssssss")
            // console.log(deviceToken)
            var data = {
                deviceToken: deviceToken,
                msg: msg,
                file_Id:objFile.file_Id
            }

            notification.sendPush(data)
        }
    });
}
//ASSIGN VERIFIER
app.post('/api/assignVerifier', function (req, res) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        if(req.body.verifier!=null || req.body.verifier!="") {

            var data = {
                accessToken: req.headers.authorization
            }
            var fields,prev_verifier = null;
            var stat = 0,file_stat = 0;
            model.getToken(data, function (err, obj) {
                if (obj != null) {
                    model.getFileByName(req, function (err, objFile) {
                        if (objFile != null) {
                            for (var i = 0; i < objFile.document.length; i++) {
                                if (objFile.document[i].docRefId == req.body.docRefId) {
                                    // console.log("assign verifierrrrrrrr")
                                    if(objFile.document[i].verification_status!='COMPLETED') {
                                        prev_verifier = objFile.document[i].verifier;
                                        objFile.document[i].verifier = req.body.verifier;
                                        objFile.document[i].verification_status = "IN_PROGRESS";
                                        //  console.log(req.body.verifier)
                                        //  console.log(objFile.document[i].verifier)
                                    }else{
                                        stat = 1;
                                    }
                                }else{
                                    if(objFile.document[i].verification_status=="NEW") {
                                        objFile.status = "NEW";
                                        file_stat = 1;
                                    }
                                }
                            }

                            if(file_stat == 0){
                                objFile.status = "IN_PROGRESS";
                            }else
                                objFile.status = "NEW";

                            if(stat==0) {
                                // console.log(objFile)
                                model.updateFile(objFile);


                                model.getTokenName(req, function (err, objDEV) {

                                    var msg = 'You have a document to verify';
                                    //var type = 'DOCUMENT';
                                    var deviceToken = [];
                                    if (objDEV != null) {
                                        // console.log("obj===========>")
                                        // console.log(objDEV)
                                        for (var i = 0; i < objDEV.length; i++) {
                                            console.log(objDEV[i].deviceId)
                                            if (deviceToken.indexOf(objDEV[i].deviceId) == -1) {

                                                deviceToken.push(objDEV[i].deviceId)
                                            }
                                            // deviceToken.push(obj[i].deviceId)
                                        }

                                        // console.log("deviceIdsssssssssssss")
                                        // console.log(deviceToken)
                                        var data = {
                                            deviceToken: deviceToken,
                                            msg: msg,
                                            file_Id:objFile.file_Id
                                        }

                                        notification.sendPush(data)
                                    }
                                });

                                if(prev_verifier!=null){

                                    model.getTokenNames(prev_verifier, function (err, objDEV) {
                                        if (objDEV != null) {
                                            // console.log("obj=========pushessssssssssssssssssssssssssssss==>")
                                            // console.log(objDEV)
                                            var msg1 = 'Your document is reassigned';
                                            //var type = 'DOCUMENT';
                                            var deviceToken1 = [];
                                            for (var i = 0; i < objDEV.length; i++) {
                                                //console.log(objDEV[i].deviceId)
                                                if (deviceToken1.indexOf(objDEV[i].deviceId) == -1) {

                                                    deviceToken1.push(objDEV[i].deviceId)
                                                }
                                                // deviceToken.push(obj[i].deviceId)
                                            }

                                            //console.log("deviceIdsssssssssssss")
                                            //console.log(deviceToken)
                                            var data = {
                                                deviceToken: deviceToken1,
                                                msg: msg1,
                                                file_Id:objFile.file_Id
                                            }

                                            notification.sendPush(data)
                                        }
                                    });

                                }

                                res.json({message: 'SUCCESS', status: 1, data: objFile});
                            }else
                                res.json({message: 'DOCUMENT ALREADY VERIFIED', status: 2});
                        } else
                            res.json({message: 'FILE_NOT_FOUND', status: 4});
                    });
                } else
                    res.json({message: 'INVALID_TOKEN', status: 2});
            });
        }else
            res.json({message: "VERIFIER NAME CAN'T BE NULL", status: 3});
    }
});



app.post('/api/getDocDetails', function (req, res) {
    if(!req.headers.authorization || !req.body.fileName || !req.body.docRefId || !req.body.verifier){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var docs = [];
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {
                        //   console.log(objFile.document.length)
                        for(var i=0;i<objFile.document.length;i++){
                            //console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
                            // console.log(objFile.document.length)
                            if(objFile.document[i].docRefId==req.body.docRefId && objFile.document[i].verifier==req.body.verifier){
                                docs.push({file:objFile,document: objFile.document[i]})
                            }
                        }

                        res.json({message: 'SUCCESS', status: 1,data:docs});
                    } else
                        res.json({message: 'FILE_NOT_FOUND', status: 4});
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

app.post('/api/logoUpload',function (req, res,next) {

    var bank,ext,oldpath;
    var codelength = 4;
    var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
    new formidable.IncomingForm().parse(req)
        .on('file', function (name, file) {
            oldpath = file.path;
            ext = path.extname(file.name).toLowerCase();
            console.log('Got file:', oldpath);
        })
        .on('field', function (name, field) {
            console.log('Got a field:', field);
            bank = name;
            console.log(bank)
        })
        .on('error', function (err) {
            console.log(err + "error")
            next(err);
        })
        .on('end', function () {
            // if ((typeof bank != 'undefined') && (bank != '')) {
            var newpath = config.uploadPath + code + ext;
            //console.log(newpath)
            //console.log(ext)
            if (ext == '.pdf' || ext == '.jpg' || ext == '.jpeg' || ext == '.png') {

                fs.rename(oldpath, newpath, function (err) {
                    if (err) {
                        res.json({

                            message: 'ERROR IN UPLOAD',
                            status: 2
                        })
                    } else {
                        res.json({
                            message: 'FILE_UPLOAD_SUCCESS',
                            status: 1,
                            logo: config.baseUrl + code + ext
                        });

                    }
                });
            }else
                res.json({
                    message: 'EXTENSION_NOT_SUPPORT',
                    status: 2
                })
            // }
        });

});

app.post('/api/voiceUpload',function (req, res,next) {
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var codelength = 4;
        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                // if(obj.user.userType=="verifier"){
                var fileName, oldpath, ext, doc_type;
                new formidable.IncomingForm().parse(req)
                    .on('file', function (name, file) {
                        oldpath = file.path;
                        ext = path.extname(file.name).toLowerCase();
                        // console.log("name===========>",name)
                        // console.log("file========>",file)
                        // console.log('Got file:', oldpath);
                    })
                    .on('field', function (name, field) {
                        // console.log('Got a field:', field);
                        // console.log('Got a field:', name);
                        fileName = name;
                        doc_type = field;
                        // console.log(fileName)
                        // console.log(doc_type)
                    })
                    .on('error', function (err) {
                        console.log(err + "error")
                        next(err);
                    })
                    .on('end', function () {
                        // res.end();
                        // console.log(fileName + " hai   ");

                        // console.log(ext)
                        if (ext == '.mp4' || ext == '.m4a' || ext == '.pdf' || ext == '.jpg' || ext == '.jpeg' || ext == '.weba' ||  ext == 'audio/wav' || ext == '.aac') {

                            req.body.fileName = fileName;
                            // console.log(req.body.fileName)
                            model.getFileByName(req, function (err, objFile) {
                                // console.log(objFile)
                                if (objFile != null) {
                                    var doc = doc_type.split(" ");
                                    //  console.log("doccccccc")
                                    // console.log(doc)
                                    var newpath;
                                    if (ext == '.mp4' || ext == '.m4a' || ext == '.aac') {
                                        newpath = config.uploadPath + fileName + doc[0] + '-RECORD-' + code + ext;
                                    }else{
                                        newpath = config.uploadPath + fileName + doc[0] + '-VERIFY-' + code + ext;
                                    }

                                    fs.rename(oldpath, newpath, function (err) {
                                        if (err) {
                                            res.json({

                                                message: 'ERROR IN UPLOAD',
                                                status: 2
                                            })
                                        } else {

                                            if (ext == '.mp4' || ext == '.m4a' || ext == '.aac') {
                                                var doc_voice = config.baseUrl + fileName + doc[0] + '-RECORD-' + code+'toMP3.mp3';
                                                //  console.log(appln)
                                                var mp3 = config.uploadPath + fileName + doc[0] + '-RECORD-' + code+'toMP3.mp3';
                                                var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
                                                var ffmpeg = require('fluent-ffmpeg');
                                                ffmpeg.setFfmpegPath(ffmpegPath)
                                                // const ffmpeg = require('@ffmpeg-installer/ffmpeg');
                                                /**
                                                 *    input - string, path of input file
                                                 *    output - string, path of output file
                                                 *    callback - function, node-style callback fn (error, result)
                                                 */
                                                function convert(input, output, callback) {
                                                    ffmpeg(input)
                                                        .output(output)
                                                        .on('end', function() {
                                                            console.log('conversion ended');
                                                            callback(null);
                                                        }).on('error', function(err){
                                                        console.log('error: ', err);
                                                        callback(err);
                                                    }).run();
                                                }

                                                convert(newpath,mp3, function(err) {
                                                    if (!err) {
                                                        console.log('conversion complete');
                                                        //...
                                                    }
                                                });
                                                if(req.headers.usertype=="verifier") {
                                                    var appln = {url: doc_voice, page: ""}

                                                    for (var i = 0; i < objFile.document.length; i++) {
                                                        // console.log(objFile.document[i])
                                                        if (objFile.document[i].docRefId == doc_type) {
                                                            objFile.document[i].verifier_record.push(appln);
                                                        }
                                                    }

                                                    model.updateFile(objFile);
                                                    res.json({
                                                        message: 'FILE_UPLOAD_SUCCESS',
                                                        status: 1,
                                                        verifier_record: doc_voice
                                                    });
                                                }else if(req.headers.usertype=="sampler"){
                                                    // var samplerVoice = doc_voice;
                                                    objFile.sampler_record = doc_voice;
                                                    model.updateFile(objFile);
                                                    res.json({
                                                        message: 'FILE_UPLOAD_SUCCESS',
                                                        status: 1,
                                                        sampler_record: doc_voice
                                                    });
                                                }
                                            }else{

                                                var verify_image = {image:config.baseUrl + fileName + doc[0] + '-VERIFY-' + code + ext,checked:false};

                                                for (var i = 0; i < objFile.document.length; i++) {
                                                    // console.log(objFile.document[i])
                                                    if (objFile.document[i].docRefId == doc_type) {
                                                        objFile.document[i].verifier_image.push(verify_image);
                                                    }
                                                }

                                                model.updateFile(objFile);
                                                res.json({
                                                    message: 'FILE_UPLOAD_SUCCESS',
                                                    status: 1,
                                                    verifier_image: verify_image
                                                });

                                            }


                                        }
                                    });
                                } else
                                    res.json({
                                        message: 'NO_FILE_FOUND',
                                        status: 4
                                    })
                            });
                        }
                        else{
                            res.json({
                                message: 'EXTENSION_NOT_SUPPORT',
                                status: 2
                            })
                        }
                    });
                // }else
                //    res.json({message: 'PERMISSION_DENIED',status:2});
            }else{
                res.json({message: 'INVALID_TOKEN',status:2});
            }
        });
    }
});


app.post('/api/superVisorUpload',function (req, res,next) {

    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {

        var data = {
            accessToken: req.headers.authorization
        }
        var codelength = 4;
        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));

        model.getToken(data, function(err, obj) {
            if (obj != null) {


                var fileName;
                ///var form = new formidable.IncomingForm();
                new formidable.IncomingForm().parse(req)
                    .on('file', function (name, file) {
                        console.log(file)
                    })
                    .on('field', function (name, field) {
                        console.log(name)
                        fileName = name;
                    })
                    .on('error', function (err) {
                        console.log(err + "error")
                        next(err);
                    }).on('end', function (fields, files) {
                    /* Temporary location of our uploaded file */
                    var temp_path = this.openedFiles[0].path;
                    var new_location, file_name;
                    /* The file name of the uploaded file */
                    file_name = this.openedFiles[0].name;
                    /* Location where we want to copy the uploaded file */
                    req.body.fileName = fileName;
                    //console.log(req.body.fileName)
                    new_location = config.uploadPath;
                    model.getFileByName(req, function (err, objFile) {
                        // console.log(objFile)
                        if (objFile != null) {
                            fs_extra.copy(temp_path, new_location + code + file_name +'.mp3', function (err) {
                                if (err) {
                                    console.error(err);
                                    res.json({message: 'ERROR',status:2});
                                } else {
                                    console.log("success!")
                                    objFile.supervisor_record = config.baseUrl + code + file_name +'.mp3';
                                    model.updateFile(objFile);
                                    res.json({
                                        message: 'FILE_UPLOAD_SUCCESS',
                                        status: 1,
                                        data:objFile
                                    });
                                }
                            });
                        }else
                            res.json({
                                message: 'NO_DATA_FOUND',
                                status: 4
                            })
                    });

                });

            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });

    }
});


app.post('/api/docDataBySupervisor',function (req, res,next) {

    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var codelength = 4,stat = 0;
        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                req.body.fileName = req.body.internalRef_id;

                var positive_remark = "";
                var negative_remark = "";
                model.getFileByName(req, function (err, objFile) {
                    if (objFile != null) {
                        if(req.body.docRefId!=null) {
                            for (var i = 0; i < objFile.document.length; i++) {
                                if (objFile.document[i].docType == req.body.docType) {
                                    objFile.document[i].fields = req.body.fields;
                                    stat = 1;
                                }
                            }
                        }
                        console.log("stat==========")
                        console.log(stat)
                        if(stat==0){
                            console.log("hhhhhhhhhhhhhhhhhhh")
                            console.log(req.body)
                            req.body.doc_type = req.body.docType;

                            model.getDocs(req, function (err, objDoc) {
                                console.log(objDoc)
                                if (objDoc != null) {
                                    console.log("resultt")
                                    positive_remark = objDoc.positive_remarks;
                                    negative_remark = objDoc.negative_remarks;
                                }
                                var docLength = objFile.document.length;
                                var num = 101, docRefNum;
                                if (docLength > 0) {

                                    docRefNum = objFile.document[docLength - 1].docRefId
                                    docRefNum = docRefNum.split('-');
                                    var no = parseInt(docRefNum[1]) + 1;
                                    docRefNum = docRefNum[0] + '-' + no;
                                    // console.log("doc idddddddddddddddddd===>1111111111111111")
                                    // console.log(docRefId)
                                }
                                else
                                    docRefNum = 'File' + objFile.file_Id + req.body.docType + '-' + num

                                var doc = {
                                    docRefId: docRefNum,
                                    docType: req.body.docType,
                                    fields: req.body.fields,
                                    verifier: "",
                                    verification_status: "NEW",
                                    bankName: "",
                                    remarks: {positive_remarks: positive_remark, negative_remarks: negative_remark},
                                    doc_image: [{url: "", page: ""}],
                                    remarks_status: "",
                                    verification_remarks: "",
                                    otherRemarks: "",
                                    is_active: "active",
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                }
                                console.log("fileeeeeeeee")
                                console.log(doc)
                                objFile.document.push(doc);
                                model.updateFile(objFile);
                            });

                        }

                        model.updateFile(objFile);
                        res.json({
                            message: 'SUCCESS',
                            status: 1,
                            data:objFile
                        });

                    }else{
                        res.json({
                            message: 'FILE NOT FOUND',
                            status: 4
                        })
                    }
                });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }

});


//supervisor image upload against docs

app.post('/api/docImageBySupervisor',function (req, res,next) {
    console.log("superVisor image ============>")
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var codelength = 4;
        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
        model.getToken(data, function (err, obj) {
            if (obj != null) {
                var  oldpath, ext,docRefId,fileName,stat=0;
                new formidable.IncomingForm().parse(req)
                    .on('file', function (name, file) {
                        oldpath = file.path;
                        ext = path.extname(file.name).toLowerCase();
                        console.log('Got file:', oldpath);
                    })
                    .on('field', function (name, field) {
                        console.log('Got a field:', field);
                        console.log('Got a field:', name);
                        docRefId = name;
                        fileName = field;
                        console.log(docRefId)
                    })
                    .on('error', function (err) {
                        console.log(err + "error")
                        next(err);
                    })
                    .on('end', function () {
                        var doc = docRefId.split("-");
                        var newpath = config.uploadPath + fileName + doc[0] + code + ext;
                        if (ext == '.pdf' || ext == '.jpg' || ext == '.jpeg') {

                            req.body.fileName = fileName;
                            model.getFileByName(req, function (err, objFile) {
                                if (objFile != null) {
                                    fs.rename(oldpath, newpath, function (err) {
                                        if (err) {
                                            res.json({

                                                message: 'ERROR IN UPLOAD',
                                                status: 2
                                            })
                                        } else {



                                            var doc_image = config.baseUrl + fileName + doc[0] + code + ext;
                                            var appln = {url: doc_image, page: ""}

                                            if (docRefId == 'application') {
                                                objFile.application_image.push(appln);
                                                // docRefId = null;
                                            } else {
                                                //  var stat = 0;
                                                for (var i = 0; i < objFile.document.length; i++) {
                                                    console.log("dsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

                                                    if (docRefId != null) {
                                                        if (objFile.document[i].docRefId == docRefId) {
                                                            console.log("docRefId================testttttttttttttttttttttttt")
                                                            objFile.document[i].doc_image.push(appln);
                                                            stat = 1;
                                                        }
                                                    }
                                                }

                                                if(stat==0){
                                                    req.body.doc_type = docRefId;
                                                    var positive_remark = "";
                                                    var negative_remark = "";
                                                    var docRefNum = "";

                                                    var docLength = objFile.document.length;
                                                    var num = 101;
                                                    if(docLength > 0) {
                                                        docRefNum = objFile.document[docLength - 1].docRefId
                                                        docRefNum = docRefNum.split('-');
                                                        var no = parseInt(docRefNum[1]) + 1;
                                                        docRefNum = docRefNum[0] +'-'+ no;
                                                    }
                                                    else {
                                                        docRefNum = 'File' + objFile.file_Id + doc[0] + '-' + num
                                                    }

                                                    model.getDocs(req, function (err, objDoc) {

                                                        if (objDoc != null) {
                                                            console.log("resultt")
                                                            positive_remark = objDoc.positive_remarks;
                                                            negative_remark = objDoc.negative_remarks;

                                                            var doc = {
                                                                docRefId:docRefNum,
                                                                docType:docRefId,
                                                                fields:"",
                                                                verifier:"",
                                                                verification_status:"NEW",
                                                                bankName:"",
                                                                remarks:{positive_remarks:positive_remark,negative_remarks:negative_remark},
                                                                doc_image:[{url:doc_image,page:""}],
                                                                remarks_status:"",
                                                                verification_remarks:"",
                                                                otherRemarks:"",
                                                                is_active:"active",
                                                                createdAt   : new Date(),
                                                                updatedAt   : new Date()
                                                            }
                                                            objFile.document.push(doc);
                                                        }else{
                                                            var doc = {
                                                                docRefId:docRefNum,
                                                                docType:docRefId,
                                                                fields:"",
                                                                verifier:"",
                                                                verification_status:"NEW",
                                                                bankName:"",
                                                                remarks:{positive_remarks:positive_remark,negative_remarks:negative_remark},
                                                                doc_image:[{url:doc_image,page:""}],
                                                                remarks_status:"",
                                                                verification_remarks:"",
                                                                otherRemarks:"",
                                                                is_active:"active",
                                                                createdAt   : new Date(),
                                                                updatedAt   : new Date()
                                                            }
                                                            objFile.document.push(doc);
                                                        }
                                                        model.updateFile(objFile);
                                                    });

                                                }

                                            }
                                            model.updateFile(objFile);
                                            res.json({
                                                message: 'FILE_UPLOAD_SUCCESS',
                                                status: 1,
                                                docPath: doc_image,
                                                docRefId:docRefId
                                            });
                                        }
                                    });
                                }else
                                    res.json({
                                        message: 'FILE_NOT_FOUND',
                                        status: 4
                                    })
                            });

                        }else
                            res.json({message: 'EXTENSION NOT SUPPORT',status:2});
                    });
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});


// API FOR IMAGE UPLOAD
app.post('/api/upload',function (req, res,next) {

    var docRef = req.headers.docrefid;
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        var codelength = 4;
        var code = Math.floor(Math.random() * (Math.pow(10, (codelength - 1)) * 9)) + Math.pow(10, (codelength - 1));
        model.getToken(data, function(err, obj) {
            if (obj != null) {

                if(req.headers.usertype=="admin" ) {

                    var emp_id, oldpath, ext, doc_type;
                    new formidable.IncomingForm().parse(req)
                        .on('file', function (name, file) {
                            oldpath = file.path;
                            ext = path.extname(file.name).toLowerCase();
                            console.log('Got file:', oldpath);
                        })
                        .on('field', function (name, field) {
                            console.log('Got a field:', field);
                            console.log('Got a field:', name);
                            emp_id = name;
                            doc_type = field;
                            console.log(emp_id)
                        })
                        .on('error', function (err) {
                            console.log(err + "error")
                            next(err);
                        })
                        .on('end', function () {
                            // res.end();
                            console.log(emp_id + " hai   ");

                            if ((typeof emp_id != 'undefined') && (emp_id != '')) {
                                var newpath = config.uploadPath + emp_id + doc_type + code + ext;
                                if (ext == '.pdf' || ext == '.jpg' || ext == '.jpeg') {
                                    req.body.emp_id = emp_id;
                                    model.loginUser(req, function (err, objUser) {
                                        if (objUser != null) {
                                            fs.rename(oldpath, newpath, function (err) {
                                                if (err) {
                                                    res.json({

                                                        message: 'ERROR IN UPLOAD',
                                                        status: 2
                                                    })
                                                } else {
                                                    // var doc = {};
                                                    var doc = {
                                                        doc_type: doc_type,
                                                        doc_image: config.baseUrl + emp_id + doc_type + code +ext
                                                    }

                                                    var stat = 0;
                                                    for (var i = 0; i < objUser.kyc_doc.length; i++) {
                                                        // console.log(objFile.document[i])
                                                        if (objUser.kyc_doc[i].doc_type == doc_type) {
                                                            stat = 1;
                                                            objUser.kyc_doc[i].doc_image = config.baseUrl + emp_id + doc_type + code +ext;
                                                        }
                                                    }

                                                    if(stat==0){
                                                        objUser.kyc_doc.push(doc);
                                                    }


                                                    model.updateUser(objUser);
                                                    res.json({
                                                        message: 'FILE_UPLOAD_SUCCESS',
                                                        status: 1,
                                                        docPath: config.baseUrl + emp_id + doc_type + code + ext
                                                    });

                                                }
                                            });
                                        } else
                                            res.json({
                                                message: 'NO_DATA_FOUND',
                                                status: 4
                                            })
                                    })
                                } else
                                    res.json({
                                        message: 'EXTENSION_NOT_SUPPORT',
                                        status: 2
                                    })
                            }
                            else {
                                res.json({
                                    message: 'INVALID_OR_MISSING_USERNAME',
                                    status: 2
                                })
                            }
                        });
                }else if(req.headers.usertype=="sampler"){
                    var fileName, oldpath, ext, doc_type,page;
                    new formidable.IncomingForm().parse(req)
                        .on('file', function (name, file) {
                            oldpath = file.path;
                            ext = path.extname(file.name).toLowerCase();
                            console.log('Got file:', oldpath);
                        })
                        .on('field', function (name, field,val) {
                            console.log('Got a field:', field);
                            console.log('Got a field:', name);
                            fileName = name;
                            doc_type = field;
                            console.log(fileName)
                            console.log(doc_type)
                            page = val;
                        })
                        .on('error', function (err) {
                            console.log(err + "error")
                            next(err);
                        })
                        .on('end', function () {
                            // res.end();
                            console.log(emp_id + " hai   ");

                            if ((typeof fileName != 'undefined') && (fileName != '') && (typeof doc_type != 'undefined') && (doc_type != '')) {
                                var doc = doc_type.split(" ");

                                var docRefId;

                                var newpath = config.uploadPath + fileName + doc[0] + code + ext;
                                if (ext == '.pdf' || ext == '.jpg' || ext == '.jpeg') {
                                    req.body.fileName = fileName;
                                    model.getFileByName(req, function (err, objFile) {
                                        if (objFile != null) {
                                            fs.rename(oldpath, newpath, function (err) {
                                                if (err) {
                                                    res.json({

                                                        message: 'ERROR IN UPLOAD',
                                                        status: 2
                                                    })
                                                } else {
                                                    var doc = doc_type.split(" ");


                                                    var doc_image =  config.baseUrl + fileName + doc[0] + code + ext;
                                                    var appln = {url:doc_image,page:page}

                                                    if(doc_type=='application'){
                                                        objFile.application_image.push(appln);
                                                        docRefId = null;
                                                    }else {
                                                        var stat = 0;
                                                        for (var i = 0; i < objFile.document.length; i++) {
                                                            console.log("dsaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

                                                            if(docRef!=null) {
                                                                if (objFile.document[i].docRefId == docRef) {
                                                                    console.log("docRefId================testttttttttttttttttttttttt")
                                                                    objFile.document[i].doc_image.push(appln);
                                                                    stat = 1;
                                                                    docRefId = docRef;
                                                                }
                                                            }
                                                        }
                                                        var nowDate = new Date();
                                                        //req.body.createdAt = ("0" + nowDate.getDate()).slice(-2) + '/' + ("0" + (nowDate.getMonth() + 1)).slice(-2) + '/' + nowDate.getFullYear();
                                                        req.body.createdAt = nowDate;
                                                        req.body.updatedAt = nowDate;
                                                        if(stat==0){
                                                            req.body.doc_type = doc_type;
                                                            var positive_remark = "";
                                                            var negative_remark = "";

                                                            var docLength = objFile.document.length;
                                                            var num = 101;
                                                            if(docLength > 0) {
                                                                docRefId = objFile.document[docLength - 1].docRefId
                                                                docRefId = docRefId.split('-');
                                                                var no = parseInt(docRefId[1]) + 1;
                                                                docRefId = docRefId[0] +'-'+ no;
                                                            }
                                                            else {
                                                                docRefId = 'File' + objFile.file_Id + doc_type + '-' + num
                                                            }

                                                            model.getDocs(req, function (err, objDoc) {

                                                                if (objDoc != null) {
                                                                    console.log("resultt")
                                                                    positive_remark = objDoc.positive_remarks;
                                                                    negative_remark = objDoc.negative_remarks;

                                                                    var doc = {
                                                                        docRefId:docRefId,
                                                                        docType:doc_type,
                                                                        fields:"",
                                                                        verifier:"",
                                                                        verification_status:"NEW",
                                                                        bankName:"",
                                                                        remarks:{positive_remarks:positive_remark,negative_remarks:negative_remark},
                                                                        doc_image:[{url:doc_image,page:""}],
                                                                        remarks_status:"",
                                                                        verification_remarks:"",
                                                                        otherRemarks:"",
                                                                        is_active:"active",
                                                                        createdAt   : req.body.createdAt,
                                                                        updatedAt   : req.body.updatedAt
                                                                    }
                                                                    objFile.document.push(doc);
                                                                }else{
                                                                    var doc = {
                                                                        docRefId:docRefId,
                                                                        docType:doc_type,
                                                                        fields:"",
                                                                        verifier:"",
                                                                        verification_status:"NEW",
                                                                        bankName:"",
                                                                        remarks:{positive_remarks:positive_remark,negative_remarks:negative_remark},
                                                                        doc_image:[{url:doc_image,page:""}],
                                                                        remarks_status:"",
                                                                        verification_remarks:"",
                                                                        otherRemarks:"",
                                                                        is_active:"active",
                                                                        createdAt   : req.body.createdAt,
                                                                        updatedAt   : req.body.updatedAt
                                                                    }
                                                                    objFile.document.push(doc);
                                                                }
                                                                model.updateFile(objFile);
                                                            });

                                                        }
                                                    }

                                                    model.updateFile(objFile);
                                                    res.json({
                                                        message: 'FILE_UPLOAD_SUCCESS',
                                                        status: 1,
                                                        docPath: doc_image,
                                                        docRefId:docRefId
                                                    });

                                                }
                                            });
                                        } else
                                            res.json({
                                                message: 'NO_DATA_FOUND',
                                                status: 4
                                            })
                                    })
                                } else
                                    res.json({
                                        message: 'EXTENSION_NOT_SUPPORT',
                                        status: 2
                                    })
                            }
                            else {
                                res.json({
                                    message: 'INVALID_OR_MISSING_PARAMS',
                                    status: 3
                                })
                            }
                        });
                }
            }else
                res.json({message: 'INVALID_TOKEN',status:2});
        });
    }
});

// API FOR LOGOUT
app.post('/api/logOut', function (req, res) {
    console.log(req.headers.authorization)
    if(!req.headers.authorization){
        res.json({message: 'PARAMS_REQUIRED',status:3});
    }else {
        var data = {
            accessToken: req.headers.authorization
        }
        model.getToken(data, function(err, obj) {
            if (obj != null) {
                model.removeToken(obj);
                res.json({message: 'SUCCESS',status:1});
            }else{
                res.json({message: 'INVALID_USER_CREDENTIALS',status:2});
            }
        });
    }
});

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

function sendSMS(toNumber){
    console.log(toNumber)


    var options = {
        "method": "GET",
        "hostname": "2factor.in",
        "port": null,
        "path": "API/R1/?module=TRANS_SMS&apikey="+config.APIKEY+"&from=BVAS&templatename=BVAS&var1=User&var2=You are added?",
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
    });

    req.write(qs.stringify({}));
    req.end();
    return code;
}


app.listen(config.serverport);
