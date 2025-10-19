// nav.js (Updated with Approval Link)

// 1. ใส่ Config (เช็กให้ชัวร์ว่าคัดลอกมาครบ)
const firebaseConfig = {
  apiKey: "AIzaSyCPeHRJASYNFtMIpikn8ASPz7kQosL3ftQ",
  authDomain: "nonkungshop1.firebaseapp.com",
  projectId: "nonkungshop1",
  storageBucket: "nonkungshop1.firebasestorage.app",
  messagingSenderId: "776950833243",
  appId: "1:776950833243:web:55b6609a7f547cd8ea5f7e"
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
        const oldApprovalLink = document.getElementById('approval-link'); // <-- Clear approval link too
        if (oldAdminLink) oldAdminLink.remove();
        if (oldApprovalLink) oldApprovalLink.remove(); // <-- Clear approval link too

        if (user) {
            // --- ถ้าล็อกอินแล้ว ---

            // **Check if user is Admin**
            if (user.email === ADMIN_EMAIL) {
                // **Create Admin Panel link**
                const adminLink = document.createElement('a');
                adminLink.href = 'admin.html';
                adminLink.className = 'nav-link';
                adminLink.id = 'admin-link'; // Add ID
                adminLink.innerText = 'Admin Panel';
                adminLink.style.color = '#FFD700'; // Gold
                navLinks.appendChild(adminLink);

                // 🔥 **(Add Approval link here)** 🔥
                const approvalLink = document.createElement('a');
                approvalLink.href = 'approval.html'; // <-- Link to the new approval page
                approvalLink.className = 'nav-link';
                approvalLink.id = 'approval-link'; // <-- Add ID for clearing
                approvalLink.innerText = 'Approval';   // <-- Text for the link
                approvalLink.style.color = '#ffc107'; // <-- Yellow color
                navLinks.appendChild(approvalLink); // <-- Add it to the navbar
            }

            // **Create Logout Button**
            navLogin.innerHTML = ''; // Clear previous button (Login)
            const logoutButton = document.createElement('button');
            logoutButton.className = 'nav-link-button';
            logoutButton.innerText = 'Logout';
            logoutButton.style.backgroundColor = '#8B0000'; // Dark Red

            logoutButton.onclick = async () => {
                await auth.signOut();
                alert('คุณออกจากระบบแล้ว');
                window.location.href = 'index.html';
            };

            navLogin.appendChild(logoutButton);

        } else {
            // --- ถ้ายังไม่ล็อกอิน ---
            navLogin.innerHTML = ''; // Clear previous button (Logout)
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.className = 'nav-link-button';
            loginLink.innerText = 'Login';
            navLogin.appendChild(loginLink);
        }
    });

});
