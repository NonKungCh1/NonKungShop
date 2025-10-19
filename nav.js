// nav.js (Updated with Approval Link)

// 1. Firebase Config (Make sure this matches your Firebase project)
const firebaseConfig = {
  apiKey: "AIzaSyCPeHRJASYNFtMIpikn8ASPz7kQosL3ftQ",
  authDomain: "nonkungshop1.firebaseapp.com",
  projectId: "nonkungshop1",
  storageBucket: "nonkungshop1.firebasestorage.app",
  messagingSenderId: "776950833243",
  appId: "1:776950833243:web:55b6609a7f547cd8ea5f7e"
};


// 2. Admin Email
const ADMIN_EMAIL = "admin@nonkungshop.com";

// 3. Initialize Firebase
// (Check if already initialized to prevent errors)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 4. Navbar Logic
// (Wait for the DOM to load before running)
document.addEventListener('DOMContentLoaded', () => {

    auth.onAuthStateChanged(user => {

        const navLinks = document.querySelector('.nav-links');
        const navLogin = document.querySelector('.nav-login');

        // (Clear old Admin links to prevent duplicates)
        const oldAdminLink = document.getElementById('admin-link');
        const oldApprovalLink = document.getElementById('approval-link'); // <-- Clear approval link too
        if (oldAdminLink) oldAdminLink.remove();
        if (oldApprovalLink) oldApprovalLink.remove(); // <-- Clear approval link too

        if (user) {
            // --- If Logged In ---

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
            // --- If Not Logged In ---
            navLogin.innerHTML = ''; // Clear previous button (Logout)
            const loginLink = document.createElement('a');
            loginLink.href = 'login.html';
            loginLink.className = 'nav-link-button';
            loginLink.innerText = 'Login';
            navLogin.appendChild(loginLink);
        }
    });

});
