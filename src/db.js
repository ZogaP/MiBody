import { initial } from "./core.js";
let db;
export async function openDB() {
  db = await new Promise((resolve, reject) => {
    const r = indexedDB.open("mibody", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("state");
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  db.onversionchange = () => db.close();
  return new Promise((resolve, reject) => {
    const r = db.transaction("state").objectStore("state").get("app");
    r.onsuccess = () => resolve(r.result || initial());
    r.onerror = () => reject(r.error);
  });
}
export function saveDB(data) {
  const snapshot = structuredClone(data);
  return new Promise((resolve, reject) => {
    try {
      const t = db.transaction("state", "readwrite");
      t.objectStore("state").put(snapshot, "app");
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || Error("Gravação interrompida"));
    } catch (e) {
      reject(e);
    }
  });
}
