// nav.js

// 1. ใส่ Config (เช็กให้ชัวร์ว่าคัดลอกมาครบ)
const firebaseConfig = {
  apiKey: "AIzaSyAz9PWhBDPWUQ1ZGN52rXW6bxMSUxanAVo",
  authDomain: "nonkungshop.firebaseapp.com",
  projectId: "nonkungshop",
  storageBucket: "nonkungshop.firebasestorage.app",
  messagingSenderId: "961630356337",
  appId: "1:961630356337:web:0268966e8635f54b68acd0"
};

// 2. อีเมล Admin
const ADMIN_EMAIL = "admin@nonkungshop.com";

// 3. เชื่อมต่อ Firebase
// (เราต้องเช็กก่อนว่าเคย initializeApp แล้วหรือยัง กัน Error)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 4. Logic ควบคุม Navbar
// (เราจะรอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {
    
    auth.onAuthStateChanged(user => {
        
        const navLinks = document.querySelector('.nav-links');
        const navLogin = document.querySelector('.nav-login');

        // (เคลียร์ลิงก์ Admin เก่า กันมันซ้ำซ้อน)
        const oldAdminLink = document.getElementById('admin-link');
        if (oldAdminLink) oldAdminLink.remove();

        if (user) {
            // --- ถ้าล็อกอินแล้ว ---

            if (user.email === ADMIN_EMAIL) {
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-link';
                adminLink.id = 'admin-link'; // เพิ่ม ID
                adminLink.innerText = 'Admin Panel';
                adminLink.style.color = '#FFD700';
                navLinks.appendChild(adminLink);
            }

            navLogin.innerHTML = '';
            const logoutButton = document.createElement('button');
            logoutButton.className = 'nav-link-button';
            logoutButton.innerText = 'Logout';
            logoutButton.style.backgroundColor = '#8B0000';
            
            logoutButton.onclick = async () => {
                await auth.signOut();
                alert('คุณออกจากระบบแล้ว');
                window.location.href = 'index.html';
            };

            navLogin.appendChild(logoutButton);

        } else {
            // --- ถ้ายังไม่ล็อกอิน ---
            navLogin.innerHTML = '';
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.className = 'nav-link-button';
            loginLink.innerText = 'Login';
            navLogin.appendChild(loginLink);
        }
    });

});
