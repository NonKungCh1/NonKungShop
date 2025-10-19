// shop.js (เวอร์ชัน 4.0 - ระบบ Ownership + หลายเวอร์ชัน)

// --- 🔥 ข้อมูลการชำระเงินของคุณ ---
const PROMPT_PAY_QR_URL = "https://res.cloudinary.com/ddpgaowiq/image/upload/v1760798023/screenshot_20251018_212152_tivgnm.png";
const TRUE_MONEY_NUMBER = "064-897-6803";

// --- 🔥 กุญแจ Cloudinary ของคุณ ---
const CLOUD_NAME = "ddpgaowiq";
const UPLOAD_PRESET = "nonkungshop";
// ---------------------------------

// (ตัวแปรส่วนกลางสำหรับเก็บ "สิทธิ์" ของ User)
let userOwnedProducts = []; // (ตอนแรกเป็นค่าว่าง)


// (รอให้ DOM โหลดเสร็จก่อน)
document.addEventListener('DOMContentLoaded', () => {

    const db = firebase.firestore();
    const productListDiv = document.getElementById('product-list');

    // --- 1. ฟังก์ชันสร้าง Pop-up จ่ายเงิน (อัปโหลดสลิป) ---
    function showPaymentModal(product, productId) { // (เราต้องการ productId เพื่อกันแฮก)
        
        const backdrop = document.createElement('div');
        backdrop.className = 'payment-modal-backdrop';
        const modal = document.createElement('div');
        modal.className = 'payment-modal-content';

        modal.innerHTML = `
            <button class="payment-modal-close">&times;</button>
            <h2>ขอบคุณสำหรับคำสั่งซื้อ!</h2>
            <p>กรุณาชำระเงินสำหรับ <strong>${product.name}</strong></p>
            <h3 style="color: #007FFF;">ยอดรวม: ${product.price} บาท</h3>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 1rem 0;">
            
            <strong>1. โอน/สแกน (PromptPay หรือ TrueMoney)</strong>
            <img src="${PROMPT_PAY_QR_URL}" alt="PromptPay QR Code" class="payment-qr-code">
            <div class="truemoney-info" style="margin-top: 1rem;">
                หรือโอน TrueMoney: ${TRUE_MONEY_NUMBER}
            </div>
            
            <div class="slip-uploader">
                <strong>2. ยืนยันการชำระเงิน</strong>
                <p style="font-size: 0.9rem; color: #666;">*โอนเงินแล้ว กรุณาอัปโหลดสลิปที่นี่</p>
                <label for="slip-file-input" class="slip-uploader-label">เลือกไฟล์สลิป</label>
                <input type="file" id="slip-file-input" accept="image/*">
                <span class="slip-file-name">ยังไม่ได้เลือกไฟล์...</span>
                <button class="btn-confirm-payment" id="btn-confirm" disabled>ยืนยัน (ยังอัปโหลดไม่ได้)</button>
                <div id="upload-status" style="margin-top: 0.5rem;"></div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // --- (Logic การทำงานของ Pop-up: เลือกไฟล์, กดยืนยัน) ---
        const slipFileInput = modal.querySelector('#slip-file-input');
        const slipFileName = modal.querySelector('.slip-file-name');
        const btnConfirm = modal.querySelector('#btn-confirm');
        const uploadStatus = modal.querySelector('#upload-status');
        let selectedFile = null;

        slipFileInput.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                slipFileName.innerText = selectedFile.name;
                btnConfirm.innerText = "ยืนยันการชำระเงิน";
                btnConfirm.disabled = false;
            }
        };

        btnConfirm.onclick = async () => {
            if (!selectedFile) return;
            if (!auth.currentUser) {
                alert('กรุณาล็อกอินก่อนยืนยันการสั่งซื้อครับ!');
                return;
            }

            btnConfirm.disabled = true;
            btnConfirm.innerText = "กำลังอัปโหลดสลิป...";
            uploadStatus.innerText = "กำลังอัปโหลด... (ห้ามปิดหน้านี้)";
            uploadStatus.style.color = "blue";

            try {
                const slipUrl = await uploadSlipToCloudinary(selectedFile);
                await saveOrderToFirestore(productId, slipUrl);

                uploadStatus.innerText = "ส่งสลิปสำเร็จ! เราจะตรวจสอบและอนุมัติใน 24 ชม.";
                uploadStatus.style.color = "green";
                
                setTimeout(() => { document.body.removeChild(backdrop); }, 4000);
            } catch (error) {
                console.error("Upload failed: ", error);
                uploadStatus.innerText = "อัปโหลดล้มเหลว: " + error.message;
                btnConfirm.disabled = false;
                btnConfirm.innerText = "ลองใหม่อีกครั้ง";
            }
        };

        modal.querySelector('.payment-modal-close').onclick = () => {
            document.body.removeChild(backdrop);
        };
    }

    // --- (ฟังก์ชันอัปโหลด/บันทึก ... เหมือนเดิม) ---
    async function uploadSlipToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'slips');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.secure_url;
    }
    async function saveOrderToFirestore(productId, slipUrl) {
        await db.collection('orders').add({
            productId: productId,
            slipUrl: slipUrl,
            status: "pending_review",
            userId: auth.currentUser.uid,
            userEmail: auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }


    // --- 🔥 2. ฟังก์ชันใหม่: สร้าง Pop-up "ดาวน์โหลด" 🔥 ---
    function showDownloadModal(productName, versions) {
        const backdrop = document.createElement('div');
        backdrop.className = 'payment-modal-backdrop';

        const modal = document.createElement('div');
        modal.className = 'payment-modal-content';

        let versionLinksHTML = ''; // (สร้าง HTML ของลิงก์)
        
        // (วนลูปสร้างลิงก์ดาวน์โหลดสำหรับทุกเวอร์ชัน)
        if (versions && Object.keys(versions).length > 0) {
            for (const [versionName, versionUrl] of Object.entries(versions)) {
                versionLinksHTML += `
                    <a href="${versionUrl}" class="btn-download" target="_blank" rel="noopener noreferrer">
                        ดาวน์โหลด ${versionName}
                    </a>
                `;
            }
        } else {
            versionLinksHTML = '<p>ขออภัย, ยังไม่มีไฟล์ให้ดาวน์โหลดสำหรับสินค้านี้</p>';
        }

        modal.innerHTML = `
            <button class="payment-modal-close">&times;</button>
            <h2>ดาวน์โหลดไฟล์</h2>
            <p>คุณเป็นเจ้าของ <strong>${productName}</strong></p>
            <div class="download-links-container">
                ${versionLinksHTML}
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // (ปุ่มปิด)
        modal.querySelector('.payment-modal-close').onclick = () => {
            document.body.removeChild(backdrop);
        };
    }


    // --- 🔥 3. ฟังก์ชันดึง "สิทธิ์" ของ User (ใหม่!) 🔥 ---
    async function fetchUserPermissions() {
        if (auth.currentUser) {
            try {
                // (ดึง "สิทธิ์" ของเรา จาก "กฎ" ที่เราตั้งไว้)
                const docRef = db.collection('user_permissions').doc(auth.currentUser.uid);
                const docSnap = await docRef.get();

                if (docSnap.exists()) {
                    // (ถ้าเจอเอกสาร)
                    userOwnedProducts = docSnap.data().owned_products || [];
                } else {
                    // (ถ้าไม่เจอ = User ใหม่)
                    userOwnedProducts = [];
                }
            } catch (error) {
                console.error("Error fetching permissions: ", error);
                userOwnedProducts = []; // (ถ้า Error ก็แปลว่าไม่มีสิทธิ์)
            }
        } else {
            userOwnedProducts = []; // (ถ้าไม่ล็อกอิน ก็ไม่มีสิทธิ์)
        }
    }


    // --- 4. ฟังก์ชันดึงสินค้า (อัปเกรด!) ---
    async function loadProducts() {
        if (!productListDiv) return;
        productListDiv.innerHTML = '<h2>กำลังโหลดสินค้า...</h2>';

        // (1. ดึง "สิทธิ์" ของ User มาเก็บไว้ก่อน)
        await fetchUserPermissions(); 
        
        // (2. ดึง "สินค้า" ทั้งหมด)
        try {
            const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            productListDiv.innerHTML = ''; 
            if (querySnapshot.empty) {
                productListDiv.innerHTML = '<h2>ยังไม่มีสินค้าในร้านครับ</h2>';
                return;
            }

            querySnapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id;
                
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // (สร้าง HTML พื้นฐาน)
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-desc">${product.description}</p>
                        <p class="product-price">${product.price} บาท</p>
                        </div>
                `;
                
                // --- 🔥 5. (สำคัญ!) Logic การสลับปุ่ม 🔥 ---
                const productInfoDiv = card.querySelector('.product-info');
                
                // (เช็กว่า User มี ID สินค้านี้ใน "สิทธิ์" หรือไม่)
                if (userOwnedProducts.includes(productId)) {
                    // --- ถ้า "ใช่" (เป็นเจ้าของ) ---
                    const downloadButton = document.createElement('button');
                    downloadButton.className = 'btn-download'; // (ใช้ CSS ใหม่)
                    downloadButton.innerText = 'ดาวน์โหลด';
                    downloadButton.onclick = () => {
                        showDownloadModal(product.name, product.versions);
                    };
                    productInfoDiv.appendChild(downloadButton);

                } else {
                    // --- ถ้า "ไม่" (ยังไม่ซื้อ) ---
                    const buyButton = document.createElement('button');
                    buyButton.className = 'btn-buy'; // (ใช้ CSS เดิม)
                    buyButton.innerText = 'ซื้อเลย';
                    buyButton.onclick = () => {
                        showPaymentModal(product, productId); 
                    };
                    productInfoDiv.appendChild(buyButton);
                }

                productListDiv.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading products: ", error);
            productListDiv.innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดสินค้า</h2>';
        }
    }

    // --- 5. สั่งให้โหลดสินค้าทันที ---
    // (เราจะรอให้ระบบ Auth พร้อมก่อน ค่อยโหลด)
    auth.onAuthStateChanged(user => {
        // (ไม่ว่า user จะล็อกอินหรือไม่ ก็ให้โหลดสินค้า)
        loadProducts();
    });
});
