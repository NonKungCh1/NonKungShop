// auth.js

// --- 🔥 V V V สำคัญมาก V V V ---
// 1. เข้าไปที่ Firebase Console
// 2. ไปที่ Project Settings (รูปเฟือง) > General
// 3. เลื่อนลงมาที่ "Your apps"
// 4. คัดลอกอ็อบเจกต์ `firebaseConfig` ของคุณมาวางแทนที่ตรงนี้
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// อีเมลของ Admin (ตั้งค่าอีเมลที่คุณจะใช้ล็อกอินหลังบ้านที่นี่)
// (คุณต้องไปสร้าง user นี้ใน Firebase Authentication ด้วยนะ)
const ADMIN_EMAIL = "admin@nonkungshop.com"; 

// --- 🔥 ^ ^ ^ สำคัญมาก ^ ^ ^ ---


// 1. เริ่มการเชื่อมต่อ Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); // สร้างตัวแปร 'auth'
const googleProvider = new firebase.auth.GoogleAuthProvider(); // สร้างตัวแปร 'googleProvider'


// 2. หาปุ่มและฟอร์มในหน้า login.html
const googleLoginButton = document.getElementById('google-login-btn');
const adminLoginForm = document.getElementById('admin-login-form');
const errorMessageDiv = document.getElementById('error-message');

// 3. (สำหรับลูกค้า) สร้างฟังก์ชันให้ปุ่ม Google
if (googleLoginButton) {
    googleLoginButton.onclick = async () => {
        try {
            // สั่งให้ Firebase เปิดหน้า Popup
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            console.log('Google Login สำเร็จ:', user);
            alert('ยินดีต้อนรับ, ' + user.displayName);
            
            // ล็อกอินสำเร็จ, พาไปหน้า Shop
            window.location.href = 'shop.html'; 

        } catch (error) {
            console.error('Google Login ผิดพลาด:', error);
            errorMessageDiv.innerText = error.message;
        }
    };
}

// 4. (สำหรับ Admin) สร้างฟังก์ชันให้ฟอร์ม Admin
if (adminLoginForm) {
    adminLoginForm.onsubmit = async (event) => {
        event.preventDefault(); // กันไม่ให้หน้าเว็บโหลดใหม่

        // ดึงค่า email/password ที่พิมพ์
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        try {
            // สั่งให้ Firebase ลองล็อกอิน
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // เช็กว่าใช่อีเมล Admin ที่เราตั้งค่าไว้หรือไม่
            if (userCredential.user.email === ADMIN_EMAIL) {
                console.log('Admin Login สำเร็จ:', userCredential.user);
                alert('ยินดีต้อนรับ Admin!');
                
                // ล็อกอิน Admin สำเร็จ, พาไปหน้า Admin (เดี๋ยวเราค่อยสร้าง)
                window.location.href = 'admin.html'; 

            } else {
                // ล็อกอินได้ แต่ไม่ใช่อีเมล Admin
                await auth.signOut(); // ล็อกเอาท์ออกไป
                alert('คุณล็อกอินสำเร็จ แต่บัญชีนี้ไม่ใช่ Admin ครับ');
                errorMessageDiv.innerText = 'บัญชีนี้ไม่ใช่ Admin';
            }

        } catch (error) {
            console.error('Admin Login ผิดพลาด:', error);
            errorMessageDiv.innerText = 'รหัสผ่านหรืออีเมลไม่ถูกต้อง';
        }
    };
}
