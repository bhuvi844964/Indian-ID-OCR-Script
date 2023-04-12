const express = require('express');
const multer = require('multer');
const app = express();
const fs = require('fs');
const Tesseract = require('tesseract.js');

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Use middleware to parse urlencoded and JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure multer to store uploaded files in the images directory
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, __dirname + '/images');
  },
  filename: (req, file, callback) => {
    callback(null, file.originalname);
  }
});

// Use multer middleware to handle file uploads
const upload = multer({
  storage: storage
}).single('image');

// Define the routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', (req, res) => {
  upload(req, res, err => {
    if (err) {
      console.log(err);
      return res.send('Something went wrong');
    }

    // Read the uploaded image file
    const image = fs.readFileSync(
      __dirname + '/images/' + req.file.originalname,
      {
        encoding: null
      }
    );

    // Perform OCR on the image data
    Tesseract.recognize(image)
      .progress(function(p) {
        console.log('progress', p);
      })
      .then(function(result) {
        const text = result.text;
console.log(text)
        // Extract ID type and number
        let idType = '';

        if (text.includes('INCOME')) {
          idType = 'panCard';

        }  else {
          return res.send({ error: 'Unknown ID type' });
        }

        const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]/;
        const namePattern = /(?<=\n)[A-Z\s]+(?=\n\d)/i;
        const fatherPattern = /[A-Z\s]+(?=\n\d)/i;
        const dobPattern = /\d{2}\/\d{2}\/\d{4}/;
        
        const panMatch = text.match(panPattern);
        const nameMatch = text.match(namePattern);
        const fatherMatch = text.match(fatherPattern);
        const dobMatch = text.match(dobPattern);
        
        const details = {
          idType: 'panCard',
          idNumber: panMatch ? panMatch[1] : '',
          info: {
            name: nameMatch ? nameMatch[0].trim() : '', 
            fatherName: fatherMatch ? fatherMatch[0].trim() : '',
            dob: dobMatch ? dobMatch[0].trim() : "",
          }
        };
        
  
        res.send(details);
      })
      .catch(function(err) {
        console.error(err);
        return res.send({ error: 'Error processing image' });
      });
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on Port ${port}`);
});

  


