import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

// --- CONFIGURATION FIREBASE VIA ENV VARS (VITE STANDARD) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

console.log("[Firebase] Initialisation du module...");

// Initialisation de l'App (Singleton Pattern)
let app;
if (getApps().length > 0) {
  app = getApp();
  console.log("[Firebase] Application existante récupérée.");
} else {
  // Vérification basique si la config est présente
  if (!firebaseConfig.apiKey) {
    console.error("[Firebase] ERREUR: Clé API manquante. Vérifiez vos variables d'environnement Vercel (préfixe VITE_ requis).");
  }
  app = initializeApp(firebaseConfig);
  console.log("[Firebase] Nouvelle application initialisée.");
}

// Initialisation Firestore avec EXPERIMENTAL FORCE LONG POLLING
let firestoreDb;
try {
  // On tente d'initialiser avec les options spécifiques pour éviter les bugs de socket
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  console.log("[Firebase] Firestore initialisé avec Long Polling (OK).");
} catch (e: any) {
  // Si déjà initialisé, on récupère l'instance par défaut
  console.warn("[Firebase] Attention : Firestore était déjà initialisé. Récupération de l'instance existante.");
  console.warn("[Firebase] Erreur capturée :", e.message);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;