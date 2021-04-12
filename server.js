require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const GoogleMeet = require('./google-meet');


const app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Values
let email = process.env.EMAIL;
let password = process.env.PASSWORD;

let head = true;
let strict = true;

let obj = new GoogleMeet(email, password, head, strict);

//Cache Store
let url = {};
let ind = 0;

app.get('/', (req, res) => {
    res.render('index', { url, email, password })
});
app.post('/postlink', (req, res) => {
    ind++;
    url[ind] = {};
    url[ind].url = req.body.url;
    url[ind].startTime = Date.parse(req.body.startDate);
    url[ind].endTime = Date.parse(req.body.endDate);
    res.redirect("/");
});

app.get('/signin',async(req,res)=>{
    obj.getSignInScreenshot();
    res.send({"message":"Sign In Screenshot Request Initiated"});
});

app.get('/screenshot',async(req,res)=>{
    obj.getScreenshot();
    res.send({"message":"Screenshot Request Initiated"});
});

app.get('/exit',async(req,res)=>{
    obj.end();
    res.send({"message":"Browser Exited Successfully"});
});

const listener = app.listen(3000 || process.env.PORT, () => {

    setInterval(() => {
        for (x in url) {
            if (url[x].startTime < Date.now()) {
                obj.notify(`Request For Joining Meet ${url[x].url}`);
                obj.schedule(url[x].url);
                url[x].startTime = url[x].endTime + 2000;
            }
            if (url[x].endTime < Date.now()) {
                obj.notify(`Request For Leaving Meet ${url[x].url}`);
                obj.end();
                delete url[x]
            }
        }
    }, 1000);

    console.log(`App Listening On Port ${listener.address().port}`);
})
