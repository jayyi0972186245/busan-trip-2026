import { firebaseConfig, cloudEnabled, tripDocumentId } from "./cloud-config.js";

const loginButton = document.querySelector("#cloud-login");
const logoutButton = document.querySelector("#cloud-logout");
const app = window.BusanApp;

if (!cloudEnabled || !firebaseConfig.projectId) {
  app.setSyncStatus("雲端同步尚未啟用；目前資料只保存在這台裝置。");
  loginButton.disabled = true;
} else {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js");
  const { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } =
    await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js");
  const { getFirestore, doc, onSnapshot, setDoc, serverTimestamp } =
    await import("https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js");

  const firebaseApp = initializeApp(firebaseConfig);
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);
  const tripRef = doc(db, "sharedTrips", tripDocumentId);
  let signedIn = false;
  let applyingRemote = false;
  let unsubscribe = null;

  loginButton.addEventListener("click", () => signInWithPopup(auth, new GoogleAuthProvider())
    .catch(() => app.setSyncStatus("登入失敗，請確認帳號已受邀。")));
  logoutButton.addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, user => {
    signedIn = Boolean(user);
    loginButton.hidden = signedIn;
    logoutButton.hidden = !signedIn;
    unsubscribe?.();
    if (!user) {
      app.setSyncStatus("請使用受邀的旅伴帳號登入。");
      return;
    }
    app.setSyncStatus(`已登入：${user.email}，正在同步公開行程。`);
    unsubscribe = onSnapshot(tripRef, snapshot => {
      if (!snapshot.exists()) return;
      applyingRemote = true;
      app.applyPublicData(snapshot.data().publicData);
      applyingRemote = false;
      app.toast("已同步旅伴的最新修改");
    }, () => app.setSyncStatus("此帳號不在邀請名單，無法讀取行程。"));
  });

  window.addEventListener("busan-public-data-changed", async () => {
    if (!signedIn || applyingRemote) return;
    try {
      await setDoc(tripRef, { publicData: app.getPublicData(), updatedAt: serverTimestamp() });
      app.setSyncStatus(`已同步：${auth.currentUser.email}`);
    } catch {
      app.setSyncStatus("同步失敗：請確認帳號已受邀。");
    }
  });
}
