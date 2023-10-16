// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCy5cD-drk4Q_Rjuo_iefGBF7aXNGlloSg",
  authDomain: "rsa-saferchat.firebaseapp.com",
  databaseURL: "https://rsa-saferchat-default-rtdb.firebaseio.com",
  projectId: "rsa-saferchat",
  storageBucket: "rsa-saferchat.appspot.com",
  messagingSenderId: "124194170665",
  appId: "1:124194170665:web:c0ace82581d846b9c0b938"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app)