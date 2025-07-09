// firebase-init.js
const firebaseConfig = {
  apiKey: "AIzaSyD3VkepMFnqNckroCSjXot1AsWkFCcZr3Q",
  authDomain: "ia-jw-44d10.firebaseapp.com",
  projectId: "ia-jw-44d10",
  storageBucket: "ia-jw-44d10.firebasestorage.app",
  messagingSenderId: "336134615491",
  appId: "1:336134615491:web:24154851afe41e4827cd76",
  measurementId: "G-2Q96R643CK"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
