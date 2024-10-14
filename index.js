const express = require('express')
const admin = require('firebase-admin');
const app = express()
const port = 3000

const serviceAccount = require("./serviceAccountKey.json");
const bodyParser = require('body-parser');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://b9is123-certifyhub-default-rtdb.europe-west1.firebasedatabase.app/'
});

const db = admin.database();

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
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        res.json({ user: user });
        // ...
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
      });

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

    res.status(200).send({ userId });

  } catch (error) {
    res.status(500).send(error);
  }

});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
