const express = require('express')
const admin = require('firebase-admin');
const multer = require('multer');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000

// allow to read request body
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors());

// initialize firebase
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://b9is123-certifyhub-default-rtdb.europe-west1.firebasedatabase.app/',
  storageBucket: 'gs://b9is123-certifyhub.appspot.com'
});

// get an instance of firebase database
const db = admin.database();

// get an instance of storage bucket
const bucket = admin.storage().bucket();

// setup multer to cache file in memory without saving it locally
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to check if userId is available in the header for specific routes
const checkUserId = (req, res, next) => {
  if (req.path !== '/login' && req.path !== '/signup' && req.path !== '/') {
    if (!req.headers.userid) {
      return res.status(400).send({ error: 'UserId is required' });
    }
  }
  next();
};

app.use(checkUserId);

app.get('/', (req, res) => {
  res.send('Hello World!!!')
})

app.get('/add', (req, res) => {
  db.ref('/user/sfasdfsf').set({
    key1: 'value1',
    key2: 'value2'
  });
  return res.send('added')
})

// login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Query to find user with matching email
    const snapshot = await admin.database().ref('users').orderByChild('details/email').equalTo(email).once('value');

    if (snapshot.exists()) {
      // Loop through the matching records to find the one with the correct password
      snapshot.forEach(userSnapshot => {

        const user = userSnapshot.val();
        // check if password match
        if (user.details.password === password) {
          return res.status(200).send({ message: 'Login successful', data: { userId: userSnapshot.key } });
        } else {
          return res.status(400).send({ error: 'Invalid password' });
        }
      });

    } else {
      return res.status(400).send({ error: 'Email not found' });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// signup user
app.post('/signup', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  try {

    // Check if email already exists inside the details object
    const snapshot = await admin.database().ref('users').orderByChild('details/email').equalTo(email).once('value');
    if (snapshot.exists())
      return res.status(400).send({ error: 'Email already exists' });


    // Generate a unique ID for the user
    const newUserRef = db.ref('users').push();
    const userId = newUserRef.key;

    // Save user details in the database
    await newUserRef.set({
      details: {
        userId,
        firstName,
        lastName,
        email,
        password,
      }
    });

    return res.status(200).send({ message: 'SignUp successful', data: { userId } });

  } catch (error) {
    return res.status(500).send(error);
  }

});

// add certificate
app.post('/certificate/add', upload.single('uploaded_file'), async function (req, res) {
  try {
    // req.file is the name of your file in the form above, here 'uploaded_file'
    // req.body will hold the text fields, if there were any 
    console.log(req.file, req.body);
    const file = req.file.buffer;
    const originalName = req.file.originalname; // Or generate a unique filename if needed

    const extension = originalName.split('.').pop(); // Get file extension

    // Generate a unique filename with UUID and timestamp
    const timestamp = Date.now();
    const fileName = `${uuidv4()}-${timestamp}.${extension}`;

    const fileRef = bucket.file(fileName);

    // upload the file to storage bucket
    await fileRef.save(file, {
      metadata: {
        contentType: 'application/pdf', // content type of the file
      }
    });

    // Generate a public URL for the uploaded file
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileRef.name}?alt=media`;

    // Generate a unique ID for the certificate
    const newCertRef = db.ref(`users/${req.headers.userid}/certificates`).push();
    const certificateId = newCertRef.key;

    // Save certificate details in the database
    await newCertRef.set({
      ...req.body,
      certificateId,
      fileUrl: publicUrl,
      fileName
    });

    return res.status(200).send({ message: 'Certificate Added', data: { publicUrl } });
  } catch (error) {
    console.log("error ", error)
    return res.status(500).send(error);
  }
});

// get all certificates per user by user
app.get('/certificate/get/all', async (req, res) => {
  const userId = req.headers.userid;
  try {
    // Query to find certificates per user id
    const snapshot = await admin.database().ref(`users/${userId}/certificates`).once('value');
    return res.status(200).send({ message: 'Certificates fetched', data: snapshot.val() });

  } catch (error) {
    return res.status(500).send(error);
  }
});

// get single certificate
app.get('/certificate/:certificateId/get', async (req, res) => {
  const userId = req.headers.userid;
  const certificateId = req.params.certificateId;
  try {
    // Query to find certificate with id
    const snapshot = await admin.database().ref(`users/${userId}/certificates/${certificateId}`).once('value');

    return res.status(200).send({ message: 'Certificate fetched', data: snapshot.val() });

  } catch (error) {
    return res.status(500).send(error);
  }
});

// remove a certificate
app.delete('/certificate/:certificateId/remove', async (req, res) => {
  const userId = req.headers.userid;
  const certificateId = req.params.certificateId;
  try {
    // Query to find certificate with id and get fileName
    const snapshot = await admin.database().ref(`users/${userId}/certificates/${certificateId}`).once('value');
    const fileName = snapshot.val()?.fileName;
    if (!fileName) return res.status(404).send({ error: 'File Not Found' });

    // remove file details from database
    await admin.database().ref(`users/${userId}/certificates/${certificateId}`).remove();
    // remove file from storage
    const fileRef = bucket.file(fileName);
    await fileRef.delete();

    return res.status(200).send({ message: 'Certificate removed', data: null });

  } catch (error) {
    console.log("errr ", error)
    return res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
