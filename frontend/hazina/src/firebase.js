import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAS6TSHRKT_OdAt6aHTqAlP0JSQNI-8q4M",
  authDomain: "hazina-wholesale.firebaseapp.com",
  projectId: "hazina-wholesale",
  storageBucket: "hazina-wholesale.firebasestorage.app",
  messagingSenderId: "186829155254",
  appId: "1:186829155254:web:3d13ed273b1202df772f17",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;