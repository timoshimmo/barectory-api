import firebase from 'firebase/compat/app'
import "firebase/compat/firestore"

const firebaseConfig = {
   apiKey: "AIzaSyDJmeQztEmf4vSTv_OMCJlX5dD_VVa-pAc",
   authDomain: "barectory.firebaseapp.com",
   projectId: "barectory",
   storageBucket: "barectory.appspot.com",
   messagingSenderId: "563702995272",
   appId: "1:563702995272:web:0490ef5141d594a98efb7d",
   measurementId: "G-047STTNWYV"
};

//firebase.initializeApp(firebaseConfig);
//const instance = firebase.firestore();

firebase.initializeApp(firebaseConfig);
//const auth = getAuth(app);
const instance = firebase.firestore();

export default instance;
