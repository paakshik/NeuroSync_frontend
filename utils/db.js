const DB_NAME = "NeuroVault";
const VERSION = 2; // Always use 2 now to ensure the new stores exist

export async function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      // Store 1: For Encryption Keys (used by crypto.js)
      if (!db.objectStoreNames.contains("Keys")) {
        db.createObjectStore("Keys");
      }
      // Store 2: For App Data (Streaks, Vault, Diagnosis)
      if (!db.objectStoreNames.contains("AppData")) {
        db.createObjectStore("AppData");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    // Prevents the "VersionError" if another tab has an older version open
    request.onblocked = () => {
      alert("Please close other tabs of this app to update.");
    };
  });
}

export const setValue = async (key, value) => {
  const db = await getDB();
  const tx = db.transaction("AppData", "readwrite");
  tx.objectStore("AppData").put(value, key);
};

export const getValue = async (key) => {
  const db = await getDB();
  const tx = db.transaction("AppData", "readonly");
  return new Promise((resolve) => {
    const req = tx.objectStore("AppData").get(key);
    req.onsuccess = () => resolve(req.result);
  });
};

export const clearAllData = async () => {
  const db = await getDB();
  const tx = db.transaction(["AppData", "Keys"], "readwrite");
  tx.objectStore("AppData").clear();
  tx.objectStore("Keys").clear();
};