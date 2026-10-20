import { initial } from "./core.js";
let db;
let accountId = null;
export const storageContext = () => ({ accountId });
export const setStorageAccount = (id) => {
  accountId = id || null;
};
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
export function saveDB(data, context = storageContext()) {
  const snapshot = structuredClone(data);
  return new Promise((resolve, reject) => {
    try {
      const t = db.transaction("state", "readwrite");
      const store = t.objectStore("state");
      if (!context.accountId) store.put(snapshot, "app");
      else {
        const key = "user:" + context.accountId;
        const r = store.get(key);
        r.onsuccess = () =>
          store.put(
            {
              ...r.result,
              state: snapshot,
              revision: r.result?.revision || 0,
              dirty: true,
              changeId: crypto.randomUUID(),
            },
            key,
          );
      }
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || Error("Gravação interrompida"));
    } catch (e) {
      reject(e);
    }
  });
}
export function readCloudCache(id) {
  return new Promise((resolve, reject) => {
    const r = db
      .transaction("state")
      .objectStore("state")
      .get("user:" + id);
    r.onsuccess = () => resolve(r.result || null);
    r.onerror = () => reject(r.error);
  });
}
export function loadGuestState() {
  return new Promise((resolve, reject) => {
    const r = db.transaction("state").objectStore("state").get("app");
    r.onsuccess = () => resolve(r.result || initial());
    r.onerror = () => reject(r.error);
  });
}
export function updateCloudCache(id, update) {
  return new Promise((resolve, reject) => {
    const t = db.transaction("state", "readwrite"),
      store = t.objectStore("state");
    const r = store.get("user:" + id);
    let result;
    r.onsuccess = () => {
      try {
        result = update(r.result || null);
        if (result) store.put(result, "user:" + id);
      } catch (e) {
        reject(e);
        t.abort();
      }
    };
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || Error("Gravação interrompida"));
  });
}
