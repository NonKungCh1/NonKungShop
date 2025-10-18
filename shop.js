// shop.js (ไฟล์สำหรับดึงสินค้ามาโชว์)

// (รอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {

    // (เราต้องใช้ db จาก Firebase - ซึ่งถูกโหลดมาจาก shop.html)
    const db = firebase.firestore();

    // --- 1. หาตำแหน่งที่จะใส่สินค้า ---
    const productListDiv = document.getElementById('product-list');

    // --- 2. ฟังก์ชันดึงสินค้า ---
    async function loadProducts() {
        if (!productListDiv) return;
        
        productListDiv.innerHTML = '<h2>กำลังโหลดสินค้า...</h2>';
        
        try {
            // 1. ดึงข้อมูลจาก 'products' โดยเรียงตาม 'createdAt' (ใหม่สุดก่อน)
            const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
            
            productListDiv.innerHTML = ''; // ล้างคำว่า "กำลังโหลด..."
            
            if (querySnapshot.empty) {
                productListDiv.innerHTML = '<h2>ยังไม่มีสินค้าในร้านครับ</h2>';
                return;
            }

            // 2. วนลูปสร้างการ์ดสินค้า
            querySnapshot.forEach(doc => {
                const product = doc.data();
                
                // สร้างกล่อง (div) สำหรับสินค้า
                const card = document.createElement('div');
                card.className = 'product-card'; // (ใช้ CSS จาก style.css)
                
                // ใส่ HTML ของการ์ดสินค้า
                card.innerHTML = `
                    <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <p class="product-desc">${product.description}</p>
                        <p class="product-price">${product.price} บาท</p>
                        
                        <button class="btn-buy">ซื้อเลย</button> 
                        
                    </div>
                `;
                
                // 3. (สำคัญ) เพิ่ม Event ให้ปุ่ม "ซื้อเลย" ที่เพิ่งสร้าง
                const buyButton = card.querySelector('.btn-buy');
                buyButton.onclick = () => {
                    // (ในอนาคต ตรงนี้เราจะทำระบบตะกร้าสินค้า)
                    alert('คุณเลือก ' + product.name + ' ราคา ' + product.price + ' บาท'); 
                };

                // 4. เอากล่องไปแปะในหน้าเว็บ
                productListDiv.appendChild(card);
            });

        } catch (error) {
            console.error("Error loading products: ", error);
            productListDiv.innerHTML = '<h2>เกิดข้อผิดพลาดในการโหลดสินค้า</h2>';
        }
    }

    // --- 3. สั่งให้โหลดสินค้าทันที ---
    loadProducts();
});
