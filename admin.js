// admin.js (เวอร์ชันใหม่ - Cloudinary)

// --- 🔥 กุญแจ Cloudinary ของคุณ ---
const CLOUD_NAME = "ddpgaowiq";
const UPLOAD_PRESET = "afpw0luz";
// ---------------------------------

// (รอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {

    // (เรายังต้องใช้ Firestore (db) และ Auth (auth) จาก nav.js)
    const db = firebase.firestore();

    // --- 1. ตรวจสอบสิทธิ์ Admin (เหมือนเดิม) ---
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            // (ADMIN_EMAIL มาจาก nav.js)
            alert('คุณไม่มีสิทธิ์เข้าหน้านี้!');
            window.location.href = 'index.html'; 
        }
    });

    // --- 2. หา Element ในหน้า (เหมือนเดิม) ---
    const addProductForm = document.getElementById('add-product-form');
    const submitBtn = document.getElementById('submit-btn');
    const uploadStatus = document.getElementById('upload-status');
    const productListAdmin = document.getElementById('product-list-admin');

    // --- 3. ฟังก์ชันเพิ่มสินค้า (อัปเกรด!) ---
    if (addProductForm) {
        addProductForm.onsubmit = async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('product-name').value;
            const price = Number(document.getElementById('product-price').value);
            const desc = document.getElementById('product-desc').value;
            const file = document.getElementById('product-image').files[0];

            if (!name || !price || !file) {
                uploadStatus.innerText = 'กรุณากรอกข้อมูลและใส่รูปภาพให้ครบ';
                uploadStatus.style.color = 'red';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังอัปโหลด...';
            uploadStatus.innerText = 'กำลังอัปโหลดรูปภาพไป Cloudinary...';
            uploadStatus.style.color = 'blue';

            try {
                // 3.1 (ใหม่) อัปโหลดรูปไปที่ Cloudinary
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                
                if (data.error) {
                    throw new Error(data.error.message);
                }

                // 3.2 (ใหม่) เอา URL ของรูป (secure_url)
                const imageUrl = data.secure_url;
                uploadStatus.innerText = 'รูปภาพอัปโหลดสำเร็จ! กำลังบันทึกข้อมูล...';
                
                // 3.3 (เหมือนเดิม) บันทึกข้อมูลลง Firestore
                await db.collection('products').add({
                    name: name,
                    price: price,
                    description: desc,
                    imageUrl: imageUrl, // <-- ใช้ URL จาก Cloudinary
                    // (เราไม่จำเป็นต้องเก็บ imagePath แล้ว)
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                });

                // 3.4 (เหมือนเดิม) เคลียร์ฟอร์ม และแจ้งผล
                uploadStatus.innerText = 'เพิ่มสินค้าสำเร็จ!';
                uploadStatus.style.color = 'green';
                addProductForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerText = 'เพิ่มสินค้า';
                
                await loadProducts();

            } catch (error) {
                console.error("Error adding product: ", error);
                uploadStatus.innerText = 'เกิดข้อผิดพลาด: ' + error.message;
                uploadStatus.style.color = 'red';
                submitBtn.disabled = false;
                submitBtn.innerText = 'เพิ่มสินค้า';
            }
        };
    }

    // --- 4. ฟังก์ชันดึงสินค้ามาโชว์ (อัปเกรด!) ---
    async function loadProducts() {
        if (!productListAdmin) return;
        
        productListAdmin.innerHTML = 'กำลังโหลดสินค้า...';
        
        const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        
        productListAdmin.innerHTML = ''; 
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const productId = doc.id;
            
            const item = document.createElement('div');
            item.className = 'product-item';
            
            item.innerHTML = `
                <span>
                    <img src="${product.imageUrl}" alt="${product.name}">
                    ${product.name} (${product.price} บาท)
                </span>
                <button class="btn-delete" data-id="${productId}">
                    ลบ
                </button>
            `;
            
            productListAdmin.appendChild(item);
        });

        // (เพิ่ม Event ให้ปุ่มลบทุกปุ่ม)
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = async (e) => {
                const id = e.target.dataset.id;
                
                if (confirm('คุณแน่ใจนะว่าจะลบสินค้านี้? (รูปจะยังค้างในระบบ Cloudinary)')) {
                    try {
                        // (ใหม่) ลบข้อมูลใน Firestore เท่านั้น
                        await db.collection('products').doc(id).delete();
                        
                        alert('ลบข้อมูลสินค้าสำเร็จ!');
                        await loadProducts(); // โหลดรายการใหม่
                        
                    } catch (error) {
                        console.error('Error deleting product data: ', error);
                        alert('เกิดข้อผิดพลาดตอนลบข้อมูล');
                    }
                }
            };
        });
    }

    // --- 5. สั่งให้โหลดสินค้าทันที (เหมือนเดิม) ---
    loadProducts();

});
