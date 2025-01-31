// src/config/firebase.js
const admin = require('firebase-admin');
require('dotenv').config();

// Function to validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL'
  ];

  const missingFields = requiredFields.filter(field => !process.env[field]);
  if (missingFields.length > 0) {
    console.error('Missing required Firebase configuration fields:', missingFields);
    return false;
  }
  return true;
};

// Initialize Firebase Admin
try {
  if (!validateFirebaseConfig()) {
    throw new Error('Invalid Firebase configuration');
  }

  const firebaseConfig = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID || undefined,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  // Initialize the app
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig)
    });
    
    // Test the configuration
    admin.auth().listUsers(1)
      .then(() => {
        console.log('Firebase Admin SDK initialized successfully');
      })
      .catch((error) => {
        console.error('Error initializing Firebase Admin SDK:', error);
      });
  }

} catch (error) {
  console.error('Firebase initialization error:', error);
}

module.exports = admin;