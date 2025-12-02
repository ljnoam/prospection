import { db } from '../firebase';
import { Prospect } from '../types';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs,
  getDoc,
  where 
} from 'firebase/firestore';

const COLLECTION_NAME = 'prospects';

// --- SÉCURITÉ DB ---
const checkDb = () => {
  if (!db) {
    console.error("[Service] ERREUR CRITIQUE: L'instance Firestore (db) est null ou undefined.");
    throw new Error("Service de base de données non disponible. Veuillez rafraîchir la page.");
  }
};

// --- LECTURE (Realtime) ---
export const subscribeToProspects = (
  onUpdate: (data: Prospect[]) => void, 
  onError?: (error: any) => void
) => {
  checkDb();
  console.log("[Service] Abonnement aux prospects...");
  const q = query(
    collection(db, COLLECTION_NAME), 
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, 
    (snapshot) => {
      console.log(`[Service] Mise à jour reçue : ${snapshot.docs.length} prospects.`);
      const prospects: Prospect[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Prospect));
      onUpdate(prospects);
    }, 
    (error) => {
      console.error("[Service] ERREUR CRITIQUE Lecture Firestore:", error);
      if (onError) onError(error);
    }
  );
};

// --- RÉCUPÉRATION DES VILLES ---
export const getUniqueCities = async (): Promise<string[]> => {
  checkDb();
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const cities = new Set<string>();
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data.city) {
        cities.add(data.city.trim());
      }
    });

    return Array.from(cities).sort();
  } catch (error) {
    console.error("Erreur chargement villes:", error);
    return [];
  }
};

// --- MISE À JOUR ---
export const updateProspect = async (id: string, data: Partial<Prospect>) => {
  checkDb();
  if (!id) return;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error(`Erreur update ${id}:`, error);
    throw error;
  }
};

// --- SUPPRESSION UNITAIRE (DEBUG MODE) ---
export const deleteProspect = async (id: string) => {
  checkDb();
  const cleanId = id.trim();
  console.log(`[Service] 1. Demande de suppression reçue pour ID: "${cleanId}"`);
  
  if (!cleanId) {
    console.error("[Service] ID vide ! Annulation.");
    return;
  }

  const docRef = doc(db, COLLECTION_NAME, cleanId);

  try {
    // Étape de vérification (DEBUG)
    console.log(`[Service] 2. Vérification de l'existence du document dans Firestore...`);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.error(`[Service] ❌ ERREUR: Le document ${cleanId} N'EXISTE PAS dans la base !`);
      console.error(`[Service] Cela signifie que l'ID affiché dans l'UI ne correspond à rien dans Firestore.`);
      throw new Error(`Document ${cleanId} introuvable.`);
    }

    console.log(`[Service] 3. Document trouvé ! Tentative de suppression effective...`);
    await deleteDoc(docRef);
    console.log(`[Service] ✅ 4. SUCCÈS : Document ${cleanId} supprimé.`);

  } catch (error: any) {
    console.error(`[Service] ❌ ERREUR FATALE lors de la suppression de ${cleanId}:`, error);
    console.error(`[Service] Code erreur:`, error.code);
    console.error(`[Service] Message erreur:`, error.message);
    throw error;
  }
};

// --- SUPPRESSION PAR LOT (BATCH) ---
export const batchDeleteProspects = async (ids: string[]) => {
  checkDb();
  console.log(`[Service] Démarrage batch delete pour ${ids.length} items.`);
  const BATCH_SIZE = 450;
  
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    
    chunk.forEach(id => {
      if (id) {
        const docRef = doc(db, COLLECTION_NAME, id);
        batch.delete(docRef);
      }
    });
    
    try {
      console.log(`[Service] Commit du batch ${i}...`);
      await batch.commit();
      console.log(`[Service] Chunk de ${chunk.length} items supprimé.`);
    } catch (error) {
      console.error("[Service] Erreur lors du batch commit:", error);
      throw error;
    }
  }
};

// --- SUPPRESSION PAR VILLE ---
export const deleteProspectsByCity = async (cityName: string) => {
    checkDb();
    console.log(`[Service] Recherche pour suppression ville : ${cityName}`);
    
    // 1. Recherche par champ 'city'
    const q = query(collection(db, COLLECTION_NAME), where('city', '==', cityName));
    const snapshot = await getDocs(q);

    let idsToDelete: string[] = [];

    if (snapshot.empty) {
        console.warn(`[Service] Rien trouvé pour ${cityName} via 'city'. Essai avec 'addr:city'...`);
        const q2 = query(collection(db, COLLECTION_NAME), where('addr:city', '==', cityName));
        const snapshot2 = await getDocs(q2);
        
        if (!snapshot2.empty) {
             idsToDelete = snapshot2.docs.map(d => d.id);
        }
    } else {
        idsToDelete = snapshot.docs.map(d => d.id);
    }

    if (idsToDelete.length === 0) {
        console.log(`[Service] Aucun prospect trouvé pour la ville: ${cityName}`);
        return 0;
    }

    console.log(`[Service] IDs trouvés à supprimer:`, idsToDelete);
    await batchDeleteProspects(idsToDelete);
    return idsToDelete.length;
};

// --- AJOUT PAR LOT ---
export const batchAddProspects = async (prospects: Omit<Prospect, 'id'>[]) => {
  checkDb();
  const BATCH_SIZE = 450;
  
  for (let i = 0; i < prospects.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = prospects.slice(i, i + BATCH_SIZE);

    chunk.forEach(p => {
      const newDocRef = doc(collection(db, COLLECTION_NAME));
      const dataToSave = {
          ...p,
          createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now()
      };
      batch.set(newDocRef, dataToSave);
    });

    await batch.commit();
  }
};