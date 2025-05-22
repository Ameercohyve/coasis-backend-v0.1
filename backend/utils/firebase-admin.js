// firebase-admin.js
const admin = require("firebase-admin");
const serviceAccount = require("./service-account-key.json"); // Download from Firebase console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
