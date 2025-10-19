// admin.js (เวอร์ชัน 3.0 - หลายเวอร์ชัน)

// --- 🔥 กุญแจ Cloudinary ของคุณ ---
const CLOUD_NAME = "ddpgaowiq";
const UPLOAD_PRESET = "nonkungshop";
// ---------------------------------

// (ฟังก์ชันใหม่: แปลง Textarea เป็น Object)
function parseVersions(text) {
    const versions = {};
    const lines = text.split('\n'); // แยกทีละบรรทัด
    
    for (const line of lines) {
        const parts = line.split(':'); // แยก "ชื่อ" กับ "ลิงก์"
        if (parts.length >= 2) {
            const version_name = parts[0].trim(); // "1.0 (Stable)"
            const version_url = parts.slice(1).join(':').trim(); // "https://..."
            
            if (version_name && version_url) {
                versions[version_name] = version_url;
            }
        }
    }
    return versions;
}


// (รอให้ DOM โหลดเสร็จก่อน)
document.addEventListener('DOMContentLoaded', () => {

    const db = firebase.firestore();
    // (เราไม่ใช้ Firebase Storage)

    // --- 1. ตรวจสอบสิทธิ์ Admin (เหมือนเดิม) ---
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert('คุณไม่มีสิทธิ์เข้าหน้านี้!');
            window.location.href = 'index.html'; 
        }
    });

    // --- 2. หา Element (เหมือนเดิม) ---
    const addProductForm = document.getElementById('add-product-form');
    // ... (หาปุ่มอื่นๆ เหมือนเดิม) ...
    const submitBtn = document.getElementById('submit-btn');
    const uploadStatus = document.getElementById('upload-status');
    const productListAdmin = document.getElementById('product-list-admin');

    // --- 3. ฟังก์ชันเพิ่มสินค้า (อัปเกรด!) ---
    if (addProductForm) {
        addProductForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // ดึงข้อมูลจากฟอร์ม
            const name = document.getElementById('product-name').value;
            const price = Number(document.getElementById('product-price').value);
            const desc = document.getElementById('product-desc').value;
            const file = document.getElementById('product-image').files[0];
            
            // 🔥 (ดึงข้อมูลช่องใหม่) 🔥
            const versionsText = document.getElementById('product-versions').value; 
            const versionsObject = parseVersions(versionsText); // (แปลงเป็น Object)

            if (!name || !price || !file || Object.keys(versionsObject).length === 0) {
                uploadStatus.innerText = 'กรุณากรอกข้อมูล, ใส่รูปภาพ, และใส่เวอร์ชันไฟล์ให้ถูกต้อง';
                uploadStatus.style.color = 'red';
                return;
            }

            // ... (โค้ด "กำลังอัปโหลด..." เหมือนเดิม) ...
            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังอัปโหลด...';
            uploadStatus.innerText = 'กำลังอัปโหลดรูปภาพปกไป Cloudinary...';

            try {
                // 3.1 อัปโหลด "รูปปก" (เหมือนเดิม)
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', UPLOAD_PRESET);

                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await res.json();
                if (data.error) throw new Error(data.error.message);

                const imageUrl = data.secure_url;
                uploadStatus.innerText = 'รูปภาพอัปโหลดสำเร็จ! กำลังบันทึกข้อมูล...';
                
                // 3.2 บันทึกข้อมูลลง Firestore (อัปเกรด!)
                await db.collection('products').add({
                    name: name,
                    price: price,
                    description: desc,
                    imageUrl: imageUrl, 
                    versions: versionsObject,  // 🔥 (บันทึก Object ของเวอร์ชัน) 🔥
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                });

                // 3.3 เคลียร์ฟอร์ม (เหมือนเดิม)
                uploadStatus.innerText = 'เพิ่มสินค้าสำเร็จ!';
                addProductForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerText = 'เพิ่มสินค้า';
                await loadProducts();

            } catch (error) {
                console.error("Error adding product: ", error);
                uploadStatus.innerText = 'เกิดข้อผิดพลาด: ' + error.message;
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
            
            // (นับว่ามีกี่เวอร์ชัน)
            let versionCount = product.versions ? Object.keys(product.versions).length : 0;

            item.innerHTML = `
                <span>
                    <img src="${product.imageUrl}" alt="${product.name}">
                    ${product.name} (${product.price} บาท)
                    <br>
                    <small style="color: #555;">มี ${versionCount} เวอร์ชัน</small>
                </span>
                <button class="btn-delete" data-id="${productId}">
                    ลบ
                </button>
            `;
            
            productListAdmin.appendChild(item);
        });

        // (ปุ่มลบ - เหมือนเดิม)
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = async (e) => {
                const id = e.target.dataset.id;
                
                if (confirm('คุณแน่ใจนะว่าจะลบสินค้านี้?')) {
                    try {
                        await db.collection('products').doc(id).delete();
                        alert('ลบข้อมูลสินค้าสำเร็จ!');
                        await loadProducts();
                    } catch (error) {
                        console.error('Error deleting product data: ', error);
                    }
                }
            };
        });
    }

    // --- 5. สั่งให้โหลดสินค้าทันที (เหมือนเดิม) ---
    loadProducts();

});
