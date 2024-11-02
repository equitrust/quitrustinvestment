const express = require('express');
const app = express();
const port = 4500;
const cors = require('cors');
const path = require('path');


// Set the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 
//set cross origin resource 
app.use(cors());
//host static files on my node server
app.use(express.static(path.join(__dirname, 'assets')));


app.get('/', (req, res)=>{
    res.render('index')
})

app.get('/about', (req, res)=>{
    res.render('about')
})

app.get('/service', (req, res)=>{
    res.render('service')
})

app.get('/team', (req, res)=>{
    res.render('team')
})

app.get('/offer', (req, res)=>{
    res.render('offer')
})

app.get('/feature', (req, res)=>{
    res.render('feature')
})

app.get('/contact', (req, res)=>{
    res.render('contact')
})


app.use((req, res, next) => {
    res.status(404).render('404');
  });

  
app.listen(port, (req, res)=>{
    console.log(`server running at port http://localhost:${port}/`)
})
