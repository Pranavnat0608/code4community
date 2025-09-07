import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANRvFxmAayPX_4EERpCFIOFNZJTzFG1eE",
  authDomain: "brhs25.firebaseapp.com",
  projectId: "brhs25",
  storageBucket: "brhs25.firebasestorage.app",
  messagingSenderId: "25085414917",
  appId: "1:25085414917:web:1da35607a96dd2fe2d166c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

export { auth, provider, firestore, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail };
export default app;
