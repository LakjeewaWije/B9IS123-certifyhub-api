const express = require('express')
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000

// allow to read request body
const bodyParser = require('body-parser');
app.use(bodyParser.json());

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

app.get('/', (req, res) => {
  res.send('Hello World!!!')
})

app.get('/add', (req, res) => {
  db.ref('/user/sfasdfsf').set({
    key1: 'value1',
    key2: 'value2'
  });
  res.send('added')
})

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
          res.status(200).send({ message: 'Login successful', data: { userId: userSnapshot.key } });
        } else {
          res.status(400).send({ error: 'Invalid password' });
        }
      });

    } else {
      res.status(400).send({ error: 'Email not found' });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

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
        firstName,
        lastName,
        email,
        password,
      }
    });

    res.status(200).send({ message: 'Login successful', data: { userId } });

  } catch (error) {
    res.status(500).send(error);
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
