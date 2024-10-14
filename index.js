const express = require('express')
const admin = require('firebase-admin');
const app = express()
const port = 3000

const serviceAccount = require("./serviceAccountKey.json");

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
