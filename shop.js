// shop.js (เวอร์ชันใหม่ - Pop-up โอนเงิน)

// --- 🔥 ข้อมูลการชำระเงินของคุณ ---
const PROMPT_PAY_QR_URL = "https://res.cloudinary.com/ddpgaowiq/image/upload/v1760798023/screenshot_20251018_212152_tivgnm.png";
const TRUE_MONEY_NUMBER = "064-897-6803";
// ---------------------------------


// (รอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {

    // (เราต้องใช้ db จาก Firebase - ซึ่งถูกโหลดมาจาก shop.html)
    const db = firebase.firestore();

    // --- 1. หาตำแหน่งที่จะใส่สินค้า ---
    const productListDiv = document.getElementById('product-list');

    // --- 2. ฟังก์ชันสร้าง Pop-up ---
    function showPaymentModal(product) {
        
        // 2.1 สร้างพื้นหลังสีดำ
        const backdrop = document.createElement('div');
        backdrop.className = 'payment-modal-backdrop';

        // 2.2 สร้างกล่อง Pop-up
        const modal = document.createElement('div');
        modal.className = 'payment-modal-content';

        // 2.3 ใส่เนื้อหาลงใน Pop-up
        modal.innerHTML = `
            <button class="payment-modal-close">&times;</button>
            
            <h2>ขอบคุณสำหรับคำสั่งซื้อ!</h2>
            <p>กรุณาชำระเงินสำหรับ <strong>${product.name}</strong></p>
            <h3 style="color: #007FFF; margin: 0.5rem 0;">ยอดรวม: ${product.price} บาท</h3>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 1rem 0;">
            
            <div>
                <strong>1. สแกน PromptPay (แนะนำ)</strong>
                <img src="${PROMPT_PAY_QR_URL}" alt="PromptPay QR Code" class="payment-qr-code">
            </div>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 1rem 0;">

            <div>
                <strong>2. หรือโอน TrueMoney Wallet</strong>
                <div class="truemoney-info">
                    ${TRUE_MONEY_NUMBER}
                </div>
            </div>
            
            <p style="font-size: 0.9rem; color: #666; margin-top: 1.5rem;">
                *โอนแล้ว กรุณาส่งสลิปไปที่หน้า 'Contact' เพื่อยืนยันการสั่งซื้อ
            </p>
        `;

        // 2.4 เอา Pop-up ไปแปะในหน้าเว็บ
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        // 2.5 สั่งให้ปุ่มปิด (กากบาท) ทำงาน
        modal.querySelector('.payment-modal-close').onclick = () => {
            document.body.removeChild(backdrop);
        };
        // (หรือคลิกที่พื้นหลังสีดำเพื่อปิด)
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                document.body.removeChild(backdrop);
            }
        };
    }


    // --- 3. ฟังก์ชันดึงสินค้า (เหมือนเดิม) ---
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
                
                // --- 🔥 4. (สำคัญ!) เปลี่ยน OnClick ให้เรียก Pop-up 🔥 ---
                const buyButton = card.querySelector('.btn-buy');
                buyButton.onclick = () => {
                    // (ไม่ใช่ alert แล้ว!)
                    showPaymentModal(product); 
                };

                productListDiv.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading products: ", error);
            productListDiv.innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดสินค้า</h2>';
        }
    }

    // --- 5. สั่งให้โหลดสินค้าทันที (เหมือนเดิม) ---
    loadProducts();
});
