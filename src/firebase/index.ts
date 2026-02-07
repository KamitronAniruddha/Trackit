import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
};

let firebaseServices: FirebaseServices | null = null;

export const initializeFirebase = (): FirebaseServices => {
  if (firebaseServices) {
    return firebaseServices;
  }

  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  
  firebaseServices = { app, auth, firestore, storage };
  return firebaseServices;
};
