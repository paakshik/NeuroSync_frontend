import { getDB } from './db';

const STORE_NAME = "Keys";
const KEY_ID = "device-key";

export async function getOrCreateKey() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const getReq = store.get(KEY_ID);

  return new Promise((resolve, reject) => {
    getReq.onsuccess = async () => {
      if (getReq.result) {
        resolve(getReq.result);
      } else {
        const newKey = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 }, 
          false, 
          ["encrypt", "decrypt"]
        );
        store.add(newKey, KEY_ID);
        resolve(newKey);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function silentEncrypt(data) {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  
  return {
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
}

export async function silentDecrypt(vault) {
  const key = await getOrCreateKey();
  const iv = new Uint8Array(atob(vault.iv).split("").map(c => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(vault.data).split("").map(c => c.charCodeAt(0)));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}