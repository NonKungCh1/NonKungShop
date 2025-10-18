// shop.js (เวอร์ชัน 3.0 - อัปโหลดสลิป + กันแฮก)

// --- 🔥 ข้อมูลการชำระเงินของคุณ ---
const PROMPT_PAY_QR_URL = "https://res.cloudinary.com/ddpgaowiq/image/upload/v1760798023/screenshot_20251018_212152_tivgnm.png";
const TRUE_MONEY_NUMBER = "064-897-6803";

// --- 🔥 กุญแจ Cloudinary ของคุณ ---
const CLOUD_NAME = "ddpgaowiq";
const UPLOAD_PRESET = "nonkungshop"; // (ใช้ 'nonkungshop' ที่เราตั้งชื่อเอง)
// ---------------------------------


// (รอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {

    const db = firebase.firestore();
    const productListDiv = document.getElementById('product-list');

    // --- 1. ฟังก์ชันสร้าง Pop-up (อัปเกรด!) ---
    function showPaymentModal(product, productId) { // (เราต้องการ productId เพื่อกันแฮก)
        
        const backdrop = document.createElement('div');
        backdrop.className = 'payment-modal-backdrop';

        const modal = document.createElement('div');
        modal.className = 'payment-modal-content';

        modal.innerHTML = `
            <button class="payment-modal-close">&times;</button>
            
            <h2>ขอบคุณสำหรับคำสั่งซื้อ!</h2>
            <p>กรุณาชำระเงินสำหรับ <strong>${product.name}</strong></p>
            <h3 style="color: #007FFF; margin: 0.5rem 0;">ยอดรวม: ${product.price} บาท</h3>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 1rem 0;">
            
            <strong>1. โอน/สแกน (PromptPay หรือ TrueMoney)</strong>
            <img src="${PROMPT_PAY_QR_URL}" alt="PromptPay QR Code" class="payment-qr-code">
            <div class="truemoney-info" style="margin-top: 1rem;">
                หรือโอน TrueMoney: ${TRUE_MONEY_NUMBER}
            </div>
            
            <div class="slip-uploader">
                <strong>2. ยืนยันการชำระเงิน</strong>
                <p style="font-size: 0.9rem; color: #666;">*โอนเงินแล้ว กรุณาอัปโหลดสลิปที่นี่</p>
                
                <label for="slip-file-input" class="slip-uploader-label">
                    เลือกไฟล์สลิป
                </label>
                <input type="file" id="slip-file-input" accept="image/*">
                
                <span class="slip-file-name">ยังไม่ได้เลือกไฟล์...</span>
                
                <button class="btn-confirm-payment" id="btn-confirm">
                    ยืนยัน (ยังอัปโหลดไม่ได้)
                </button>
                <div id="upload-status" style="margin-top: 0.5rem;"></div>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // --- (เพิ่ม Logic การทำงานให้ Pop-up) ---
        const slipFileInput = modal.querySelector('#slip-file-input');
        const slipFileName = modal.querySelector('.slip-file-name');
        const btnConfirm = modal.querySelector('#btn-confirm');
        const uploadStatus = modal.querySelector('#upload-status');
        let selectedFile = null;

        // (ทำให้ปุ่ม "ยืนยัน" ใช้งานไม่ได้ จนกว่าจะเลือกไฟล์)
        btnConfirm.disabled = true;

        // (เมื่อเลือกไฟล์)
        slipFileInput.onchange = (e) => {
            if (e.target.files && e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                slipFileName.innerText = selectedFile.name;
                btnConfirm.innerText = "ยืนยันการชำระเงิน";
                btnConfirm.disabled = false; // เปิดปุ่ม
            }
        };

        // (เมื่อกดยืนยัน)
        btnConfirm.onclick = async () => {
            if (!selectedFile) return;
            
            // (เช็กว่าล็อกอินหรือยัง)
            if (!auth.currentUser) {
                alert('กรุณาล็อกอินก่อนยืนยันการสั่งซื้อครับ!');
                return;
            }

            btnConfirm.disabled = true;
            btnConfirm.innerText = "กำลังอัปโหลดสลิป...";
            uploadStatus.innerText = "กำลังอัปโหลด... (ห้ามปิดหน้านี้)";
            uploadStatus.style.color = "blue";

            try {
                // (ฟังก์ชันอัปโหลดสลิป)
                const slipUrl = await uploadSlipToCloudinary(selectedFile);
                
                // (ฟังก์ชันบันทึกออเดอร์ - กันแฮก)
                await saveOrderToFirestore(productId, slipUrl);

                uploadStatus.innerText = "ส่งสลิปสำเร็จ! ขอบคุณครับ";
                uploadStatus.style.color = "green";
                
                setTimeout(() => { // (หน่วงเวลา 3 วิ แล้วปิด Pop-up)
                   document.body.removeChild(backdrop);
                }, 3000);

            } catch (error) {
                console.error("Upload failed: ", error);
                uploadStatus.innerText = "อัปโหลดล้มเหลว: " + error.message;
                uploadStatus.style.color = "red";
                btnConfirm.disabled = false;
                btnConfirm.innerText = "ลองใหม่อีกครั้ง";
            }
        };

        // (ปุ่มปิด)
        modal.querySelector('.payment-modal-close').onclick = () => {
            document.body.removeChild(backdrop);
        };
    }

    // --- ฟังก์ชันอัปโหลดไป Cloudinary (ใหม่!) ---
    async function uploadSlipToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET); // (ใช้ Preset ที่เราตั้งชื่อเอง)
        formData.append('folder', 'slips'); // (เก็บสลิปไว้ในโฟลเดอร์ slips)

        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.secure_url; // คืนค่าลิงก์สลิป
    }

    // --- ฟังก์ชันบันทึกออเดอร์ (ใหม่! - กันแฮก) ---
    async function saveOrderToFirestore(productId, slipUrl) {
        // (เรา "ไม่" ส่งราคาจากหน้าเว็บ)
        // (เราส่งแค่ ID และลิงก์สลิป)
        await db.collection('orders').add({
            productId: productId, // (ส่ง ID สินค้า)
            slipUrl: slipUrl, // (ส่งลิงก์สลิป)
            status: "pending_review", // (สถานะ: รอตรวจสอบ)
            userId: auth.currentUser.uid, // (ID ลูกค้าที่ล็อกอิน)
            userEmail: auth.currentUser.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }


    // --- ฟังก์ชันดึงสินค้า (อัปเกรด!) ---
    async function loadProducts() {
        if (!productListDiv) return;
        
        productListDiv.innerHTML = '<h2>กำลังโหลดสินค้า...</h2>';
        
        try {
            const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            productListDiv.innerHTML = ''; 
            if (querySnapshot.empty) {
                productListDiv.innerHTML = '<h2>ยังไม่มีสินค้าในร้านครับ</h2>';
                return;
            }

            querySnapshot.forEach(doc => {
                const product = doc.data();
                const productId = doc.id; // <-- 🔥 (สำคัญ) เราดึง ID ของสินค้ามาด้วย
                
                const card = document.createElement('div');
                card.className = 'product-card';
                
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-desc">${product.description}</p>
                        <p class="product-price">${product.price} บาท</p>
                        <button class="btn-buy">ซื้อเลย</button> 
                    </div>
                `;
                
                const buyButton = card.querySelector('.btn-buy');
                buyButton.onclick = () => {
                    // (ส่ง product (สำหรับโชว์ราคา) และ productId (สำหรับกันแฮก))
                    showPaymentModal(product, productId); 
                };

                productListDiv.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading products: ", error);
            productListDiv.innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดสินค้า</h2>';
        }
    }

    // --- สั่งให้โหลดสินค้าทันที ---
    loadProducts();
});

