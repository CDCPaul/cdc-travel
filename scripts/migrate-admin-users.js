"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: '.env.local' });
// scripts/migrate-admin-users.ts
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
// 환경변수 또는 직접 입력
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)({
        credential: (0, app_1.cert)(serviceAccount),
    });
}
const db = (0, firestore_1.getFirestore)();
const adminList = [
    { email: "air@cebudirectclub.com", uid: "qgfMbGmDvnXYvql7bkFF4dXN4553" },
    { email: "ticket@cebudirectclub.com", uid: "zKUxA9UKiWdiy6qtMMUBHTaFnTY2" },
    { email: "visa2@cebudirectclub.com", uid: "ny4wNSFsCRNqCMKhfJav3d4pkFl1" },
    { email: "tour@cebudirectclub.com", uid: "goMnHj7YmPdgblX0l8dmzrlzEvE2" },
    { email: "outbound@cebudirectclub.com", uid: "JJiK8HwfvWessADUZ37B7gZv2ly2" },
    { email: "jessibel@cebudirectclub.com", uid: "lfrCEiyhxqdctiSyejMK5TVvx3m1" },
    { email: "zeus@cebudirectclub.com", uid: "5YxQd1Exl0RP04HiTyaNdtZKBOZ2" },
    { email: "visa@cebudirectclub.com", uid: "J33Ujuh9qbPgSrD7RxP4bZYWlhV2" },
    { email: "bohol2@cebudirectclub.com", uid: "hVftpO4UYCbdOy1LJg0XGUtZpQM2" },
    { email: "bohol@cebudirectclub.com", uid: "kwNzZmFi9xPOhPxQddBmKNlutjn1" },
    { email: "nadia@cebudirectclub.com", uid: "n0EYjzh9bXW0Y8z8NMADtfMqLAU2" },
    { email: "ahn@cebudirectclub.com", uid: "0nZfqIxp3DXU4g4AX61oGXaAS7f2" },
    { email: "cebu@cebudirectclub.com", uid: "zu2z6EDdLk9meoLwqhL8vvcllWq2" },
];
async function migrate() {
    for (const { email, uid } of adminList) {
        const ref = db.collection("users").doc(uid);
        await ref.set({
            uid,
            email,
            name: email.split("@")[0],
            role: "admin",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });
        console.log(`관리자 등록 완료: ${email} (${uid})`);
    }
    console.log("모든 관리자 등록이 완료되었습니다.");
}
migrate().catch(console.error);
