import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Production Firebase Configuration for ckxr-webapp
const firebaseConfig = {
  apiKey: "AIzaSyAksEbd907afwMTl-8XRixUtKEGwRF5L8I",
  authDomain: "ckxr-webapp.firebaseapp.com",
  projectId: "ckxr-webapp",
  storageBucket: "ckxr-webapp.firebasestorage.app",
  messagingSenderId: "597300419746",
  appId: "1:597300419746:web:926b4362faed5ba9c70bfb",
  measurementId: "G-V6TFHW69E3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Clones a creator document and its sub-collections to a new ID.
 */
export async function migrateFolder(oldId, newId) {
    console.log(`🚀 Starting migration: ${oldId} -> ${newId}`);

    try {
        // 1. Copy the Main Document
        const oldDocRef = doc(db, "creators", oldId);
        const oldDocSnap = await getDoc(oldDocRef);

        if (!oldDocSnap.exists()) {
            throw new Error("The legacy folder ID was not found in the 'creators' collection.");
        }

        const data = oldDocSnap.data();
        await setDoc(doc(db, "creators", newId), data);
        console.log("✅ Main document copied to 'MasterCreatorFolder'.");

        // 2. Handle known Sub-collections
        const subCollections = ["Voices of Codie", "Emotions", "Settings"]; 

        for (const subName of subCollections) {
            const subRef = collection(db, `creators/${oldId}/${subName}`);
            const subSnap = await getDocs(subRef);

            if (!subSnap.empty) {
                console.log(`Syncing sub-collection data: ${subName}...`);
                for (const subDoc of subSnap.docs) {
                    await setDoc(doc(db, `creators/${newId}/${subName}`, subDoc.id), subDoc.data());
                }
                console.log(`✅ Sub-collection '${subName}' duplicated successfully.`);
            }
        }

        console.log("🎉 DATABASE MIGRATION COMPLETE!");
        return true;

    } catch (error) {
        console.error("❌ Migration Handshake Failure:", error);
        throw error;
    }
}
