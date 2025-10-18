// admin.js

// (รอให้ DOM โหลดเสร็จก่อน ค่อยทำงาน)
document.addEventListener('DOMContentLoaded', () => {

    // (เราต้องใช้ auth, ADMIN_EMAIL จาก nav.js)
    // (และเราต้องสร้างตัวแปร db, storage)
    const db = firebase.firestore();
    const storage = firebase.storage();

    // --- 1. ตรวจสอบสิทธิ์ Admin ---
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            // ถ้าไม่ใช่ Admin หรือยังไม่ล็อกอิน
            alert('คุณไม่มีสิทธิ์เข้าหน้านี้!');
            window.location.href = 'index.html'; // เด้งกลับหน้าแรก
        }
    });

    // --- 2. หา Element ในหน้า ---
    const addProductForm = document.getElementById('add-product-form');
    const submitBtn = document.getElementById('submit-btn');
    const uploadStatus = document.getElementById('upload-status');
    const productListAdmin = document.getElementById('product-list-admin');

    // --- 3. ฟังก์ชันเพิ่มสินค้า (เมื่อกด Submit) ---
    if (addProductForm) {
        addProductForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // ดึงข้อมูลจากฟอร์ม
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
            uploadStatus.innerText = 'กำลังอัปโหลดรูปภาพ...';
            uploadStatus.style.color = 'blue';

            try {
                // 3.1 อัปโหลดรูปไปที่ Storage
                const filePath = `products/${Date.now()}_${file.name}`;
                const fileRef = storage.ref(filePath);
                await fileRef.put(file);

                // 3.2 เอา Download URL ของรูป
                const imageUrl = await fileRef.getDownloadURL();
                uploadStatus.innerText = 'รูปภาพอัปโหลดสำเร็จ! กำลังบันทึกข้อมูล...';
                
                // 3.3 บันทึกข้อมูลลง Firestore
                await db.collection('products').add({
                    name: name,
                    price: price,
                    description: desc,
                    imageUrl: imageUrl,
                    imagePath: filePath, // (เก็บ Path ไว้ใช้ตอนลบรูป)
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // เก็บเวลา
                });

                // 3.4 เคลียร์ฟอร์ม และแจ้งผล
                uploadStatus.innerText = 'เพิ่มสินค้าสำเร็จ!';
                uploadStatus.style.color = 'green';
                addProductForm.reset();
                submitBtn.disabled = false;
                submitBtn.innerText = 'เพิ่มสินค้า';
                
                // (โหลดรายการสินค้าใหม่)
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

    // --- 4. ฟังก์ชันดึงสินค้ามาโชว์ (สำหรับลบ) ---
    async function loadProducts() {
        if (!productListAdmin) return;
        
        productListAdmin.innerHTML = 'กำลังโหลดสินค้า...';
        
        const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        
        productListAdmin.innerHTML = ''; // ล้างของเก่า
        
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
                <button class="btn-delete" data-id="${productId}" data-path="${product.imagePath}">
                    ลบ
                </button>
            `;
            
            productListAdmin.appendChild(item);
        });

        // (เพิ่ม Event ให้ปุ่มลบทุกปุ่ม)
        document.querySelectorAll('.btn-delete').forEach(button => {
            button.onclick = async (e) => {
                const id = e.target.dataset.id;
                const path = e.target.dataset.path;
                
                if (confirm('คุณแน่ใจนะว่าจะลบสินค้านี้?')) {
                    try {
                        // 1. ลบข้อมูลใน Firestore
                        await db.collection('products').doc(id).delete();
                        // 2. ลบรูปใน Storage
                        await storage.ref(path).delete();
                        
                        alert('ลบสินค้าสำเร็จ!');
                        await loadProducts(); // โหลดรายการใหม่
                        
                    } catch (error) {
                        console.error('Error deleting product: ', error);
                        alert('เกิดข้อผิดพลาดตอนลบ');
                    }
                }
            };
        });
    }

    // --- 5. สั่งให้โหลดสินค้าทันทีที่เปิดหน้า ---
    loadProducts();

});
                                         
