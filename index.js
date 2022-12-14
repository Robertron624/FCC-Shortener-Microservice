require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('dns')
const mongoose = require('mongoose')
const router = express.Router

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL, {useNewUrlParser:true, useUnifiedTopology:true})

let db = mongoose.connection;

db.on('error', console.error.bind(console, "connection error:"));
db.once("open", function(){
  console.log("conectado a la BD!")
})

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({extended:false}))

app.use(bodyParser.json())

const urlScheme = new mongoose.Schema({
  original_url: String,
  short_url: String
});

let urlModel = mongoose.model('url', urlScheme)

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Store url in database
app.post('/api/shorturl', function(req, res){
  const myRegex= /https:\/\/(www.)?|http:\/\/(www.)?/g;

  const bodyOfRequest = req.body.url

  dns.lookup(req.body.url.replace(myRegex, ""), (err, address, family) => {
    if(err || !myRegex.test(bodyOfRequest)){
      res.json({
        "error": "invalid url"
      })
    }
    else{
      const myRandomId = parseInt(Math.random() * 999999)
      urlModel
      .find()
      .exec()
      .then(data => {
        new urlModel({
          original_url: bodyOfRequest,
          short_url: myRandomId
        })
        .save()
        .then(()=>{
          res.json({
            original_url: bodyOfRequest,
            short_url: myRandomId
          })
        })
        .catch(err => {
          res.json(err)
        })
      })
    }
  })
})

// Get url from DB and redirect
app.get('/api/shorturl/:number', function(req, res){
  urlModel
  .find({
    short_url: req.params.number
  })
  .exec()
  .then((url)=>{
    console.log('objeto recibido al hacer busqueda -> ', url)
    console.log('redirigiendo a -> ', url[0].original_url)

    res.redirect(url[0]["original_url"]);
  });
})

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
