// auth.js (ไฟล์ควบคุมหน้า login.html เท่านั้น)
// เรา "ไม่" ต้องใส่ firebaseConfig หรือ initializeApp ที่นี่อีกแล้ว
// เพราะ "nav.js" (ที่โหลดก่อน) ทำให้เราเรียบร้อยแล้ว!

// 2. หาปุ่มและฟอร์มในหน้า login.html
const googleLoginButton = document.getElementById('google-login-btn');
const adminLoginForm = document.getElementById('admin-login-form');
const errorMessageDiv = document.getElementById('error-message');

// 3. (สำหรับลูกค้า) สร้างฟังก์ชันให้ปุ่ม Google
if (googleLoginButton) {
    googleLoginButton.onclick = async () => {
        try {
            // "auth" และ "googleProvider" ถูกสร้างไว้แล้วใน nav.js
            const result = await auth.signInWithPopup(googleProvider); 
            const user = result.user;
            
            console.log('Google Login สำเร็จ:', user);
            alert('ยินดีต้อนรับ, ' + user.displayName);
            
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
        event.preventDefault(); 

        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            if (userCredential.user.email === ADMIN_EMAIL) { // (ADMIN_EMAIL มาจาก nav.js)
                console.log('Admin Login สำเร็จ:', userCredential.user);
                alert('ยินดีต้อนรับ Admin!');
                
                window.location.href = 'admin.html'; 

            } else {
                await auth.signOut(); 
                alert('บัญชีนี้ไม่ใช่ Admin ครับ');
                errorMessageDiv.innerText = 'บัญชีนี้ไม่ใช่ Admin';
            }

        } catch (error) {
            console.error('Admin Login ผิดพลาด:', error);
            errorMessageDiv.innerText = 'รหัสผ่านหรืออีเมลไม่ถูกต้อง';
        }
    };
}
