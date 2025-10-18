// nav.js (ไฟล์ควบคุม Navbar ส่วนกลาง)

// --- 1. ใส่ Config ของคุณ (เหมือนเดิม) ---
const firebaseConfig = {
  apiKey: "AIzaSyAZ9PwHBDPWUQ1ZGN52rXW6bxMSUXAnAVo",
  authDomain: "nonkungshop.firebaseapp.com",
  projectId: "nonkungshop",
  storageBucket: "nonkungshop.firebasestorage.app",
  messagingSenderId: "961630356337",
  appId: "1:961630356337:web:0268966e8635f54b68acd0"
};

// --- 2. อีเมล Admin ---
const ADMIN_EMAIL = "admin@nonkungshop.com";

// --- 3. เชื่อมต่อ Firebase ---
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider(); // ทำให้ auth.js ใช้ได้ด้วย

// --- 4. Logic ควบคุม Navbar (หัวใจ) ---
// ฟังก์ชันนี้จะทำงานทันทีที่หน้าเว็บโหลด และทุกครั้งที่สถานะล็อกอินเปลี่ยน
auth.onAuthStateChanged(user => {
    
    // หาตำแหน่งที่จะใส่ลิงก์
    const navLinks = document.querySelector('.nav-links');
    const navLogin = document.querySelector('.nav-login');

    if (user) {
        // --- ถ้าล็อกอินแล้ว ---

        // 1. เช็กว่าเป็น Admin หรือไม่
        if (user.email === ADMIN_EMAIL) {
            // ถ้าใช่, สร้างลิงก์ "Admin"
            const adminLink = document.createElement('a');
            adminLink.href = 'admin.html';
            adminLink.className = 'nav-link';
            adminLink.innerText = 'Admin Panel';
            adminLink.style.color = '#FFD700'; // สีทอง
            navLinks.appendChild(adminLink); // เพิ่มลิงก์เข้าไปในเมนู
        }

        // 2. สร้างปุ่ม "Logout"
        navLogin.innerHTML = ''; // ล้างปุ่ม Login เก่าทิ้ง
        const logoutButton = document.createElement('button');
        logoutButton.className = 'nav-link-button'; // ใช้ CSS เดิม
        logoutButton.innerText = 'Logout';
        logoutButton.style.backgroundColor = '#8B0000'; // สีแดงเข้ม
        
        // 3. สั่งให้ปุ่ม Logout ทำงาน
        logoutButton.onclick = async () => {
            await auth.signOut();
            alert('คุณออกจากระบบแล้ว');
            window.location.href = 'index.html'; // กลับไปหน้าแรก
        };

        navLogin.appendChild(logoutButton); // เพิ่มปุ่ม Logout

    } else {
        // --- ถ้ายังไม่ล็อกอิน (หรือเพิ่ง Logout) ---
        
        // 1. สร้างปุ่ม "Login" (เหมือนเดิม)
        navLogin.innerHTML = ''; // ล้างปุ่ม (ถ้ามี)
        const loginLink = document.createElement('a');
        loginLink.href = 'login.html';
        loginLink.className = 'nav-link-button';
        loginLink.innerText = 'Login';
        navLogin.appendChild(loginLink);
    }
});
            
