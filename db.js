const firebase = require('firebase');

 
var config = {
    apiKey: "AIzaSyDQ5qj4hEubWpuf6pWoQFJbQTdoBysWGbo",
    authDomain: "autopay-425eb.firebaseapp.com",
    databaseURL: "https://autopay-425eb.firebaseio.com",
    projectId: "autopay-425eb",
    storageBucket: "autopay-425eb.appspot.com",
    messagingSenderId: "716415279306",
    appId: "1:716415279306:web:621ce0acb5000044ef1433",
    measurementId: "G-125LVMX3Q7"
  };
const db = firebase.initializeApp(config);

module.exports = db;