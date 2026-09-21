# 🚨 Quick Fix: "Missing or insufficient permissions" Error

This error occurs because your **Firestore Database** is currently running in **Locked Mode** (default Firebase security rules), which blocks writes unless rules are set to Test Mode.

Follow these 3 quick steps in the [Firebase Console](https://console.firebase.google.com/project/cricket-auction-a2f15) to enable read/write access:

---

## 1. Fix Firestore Rules (10 Seconds)

1. Go to **[Firebase Console > Firestore Database > Rules](https://console.firebase.google.com/project/cricket-auction-a2f15/firestore/rules)**.
2. Replace everything in the editor with:
   ```groovy
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click the blue **Publish** button at the top right.

---

## 2. Fix Realtime Database Rules (10 Seconds)

1. Go to **[Firebase Console > Realtime Database > Rules](https://console.firebase.google.com/project/cricket-auction-a2f15/database/rules)**.
2. Replace the rules with:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
3. Click **Publish**.

---

## 3. Fix Storage Rules (Optional for Image Uploads)

1. Go to **[Firebase Console > Storage > Rules](https://console.firebase.google.com/project/cricket-auction-a2f15/storage/rules)**.
2. Replace rules with:
   ```groovy
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. Click **Publish**.

---

### 🎯 Test Again!
Once you click **Publish** in the Firebase Console:
- Go back to `http://localhost:5173/admin`.
- Click **"⚡ Quick Auto-Seed Demo Data"** or **"🌐 Fetch & Import Live API Players"**.
- It will work instantly and populate your database with 0 permission errors!
