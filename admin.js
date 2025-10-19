// admin.js (เวอร์ชัน 4.0 - ระบบ Edit)

// --- 🔥 กุญแจ Cloudinary (เหมือนเดิม) ---
const CLOUD_NAME = "ddpgaowiq";
const UPLOAD_PRESET = "nonkungshop";
// ---------------------------------

// (ตัวแปรเก็บ ID สินค้าที่กำลังแก้ไข)
let currentEditId = null; 

// (ฟังก์ชันแปลง Textarea เป็น Object)
function parseVersions(text) {
    const versions = {};
    const lines = text.split('\n'); 
    for (const line of lines) {
        const parts = line.split(':'); 
        if (parts.length >= 2) {
            const version_name = parts[0].trim();
            const version_url = parts.slice(1).join(':').trim(); 
            if (version_name && version_url) {
                versions[version_name] = version_url;
            }
        }
    }
    return versions;
}

// (ฟังก์ชันใหม่: แปลง Object กลับเป็น Textarea)
function formatVersions(versions) {
    if (!versions) return '';
    const lines = [];
    for (const [name, url] of Object.entries(versions)) {
        lines.push(`${name}: ${url}`);
    }
    return lines.join('\n'); // (เอามาต่อกันด้วย Enter)
}


// (รอให้ DOM โหลดเสร็จก่อน)
document.addEventListener('DOMContentLoaded', () => {

    const db = firebase.firestore();

    // --- 1. ตรวจสอบสิทธิ์ Admin (เหมือนเดิม) ---
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            alert('คุณไม่มีสิทธิ์เข้าหน้านี้!');
            window.location.href = 'index.html'; 
        }
    });

    // --- 2. หา Element (เพิ่มปุ่มใหม่ๆ) ---
    const addProductForm = document.getElementById('add-product-form');
    const submitBtn = document.getElementById('submit-btn');
    const uploadStatus = document.getElementById('upload-status');
    const productListAdmin = document.getElementById('product-list-admin');
    
    // (Element ใหม่สำหรับระบบ Edit)
    const formTitle = document.getElementById('form-title');
    const editProductIdInput = document.getElementById('edit-product-id');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    
    // (หาช่องกรอกข้อมูลทั้งหมด)
    const productNameInput = document.getElementById('product-name');
    const productPriceInput = document.getElementById('product-price');
    const productDescInput = document.getElementById('product-desc');
    const productImageInput = document.getElementById('product-image');
    const productVersionsInput = document.getElementById('product-versions');


    // --- 3. ฟังก์ชันรีเซ็ตฟอร์ม (ใหม่!) ---
    function resetForm() {
        currentEditId = null; // (ล้าง ID ที่กำลังแก้)
        addProductForm.reset(); // (ล้างข้อมูลในฟอร์ม)
        editProductIdInput.value = '';
        
        formTitle.innerText = 'เพิ่มสินค้าใหม่';
        submitBtn.innerText = 'เพิ่มสินค้า';
        btnCancelEdit.style.display = 'none'; // (ซ่อนปุ่มยกเลิก)
        uploadStatus.innerText = '';
        
        // (สำคัญ) เปลี่ยน requirement ของรูปภาพกลับมา
        productImageInput.required = true; 
    }

    // (สั่งให้ปุ่มยกเลิก ทำงาน)
    btnCancelEdit.onclick = resetForm;


    // --- 4. ฟังก์ชันเพิ่ม/แก้ไขสินค้า (อัปเกรด!) ---
    if (addProductForm) {
        addProductForm.onsubmit = async (e) => {
            e.preventDefault();
            
            // ดึงข้อมูลจากฟอร์ม
            const name = productNameInput.value;
            const price = Number(productPriceInput.value);
            const desc = productDescInput.value;
            const file = productImageInput.files[0]; // (อาจจะเป็น null ถ้าไม่ได้เลือกใหม่)
            
            const versionsText = productVersionsInput.value; 
            const versionsObject = parseVersions(versionsText); 

            if (!name || !price || Object.keys(versionsObject).length === 0) {
                uploadStatus.innerText = 'กรุณากรอกชื่อ, ราคา, และเวอร์ชันไฟล์';
                uploadStatus.style.color = 'red';
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังบันทึก...';
            uploadStatus.innerText = 'กำลังบันทึกข้อมูล...';
            uploadStatus.style.color = 'blue';

            try {
                // (สร้าง Object ข้อมูลที่จะบันทึก)
                let dataToSave = {
                    name: name,
                    price: price,
                    description: desc,
                    versions: versionsObject,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp() // (เพิ่มเวลาอัปเดต)
                };

                // (เช็กว่าอยู่ใน "โหมดแก้ไข" หรือไม่)
                if (currentEditId) {
                    // --- โหมดแก้ไข (UPDATE) ---
                    
                    if (file) {
                        // (ถ้ามีการอัปโหลด "รูปใหม่")
                        uploadStatus.innerText = 'กำลังอัปโหลดรูปใหม่...';
                        const imageUrl = await uploadToCloudinary(file);
                        dataToSave.imageUrl = imageUrl; // (เพิ่มรูปลงในข้อมูลที่จะอัปเดต)
                    }
                    // (ถ้าไม่เลือกรูปใหม่... เราก็จะไม่ยุ่งกับ imageUrl ของเก่า)
                    
                    uploadStatus.innerText = 'กำลังอัปเดตข้อมูลสินค้า...';
                    await db.collection('products').doc(currentEditId).update(dataToSave);
                    uploadStatus.innerText = 'อัปเดตสินค้าสำเร็จ!';

                } else {
                    // --- โหมดเพิ่มใหม่ (ADD) ---
                    
                    // (โหมดนี้ "ต้อง" มีรูป)
                    if (!file) {
                        uploadStatus.innerText = 'กรุณาใส่รูปภาพสินค้า (หน้าปก)';
                        uploadStatus.style.color = 'red';
                        submitBtn.disabled = false;
                        submitBtn.innerText = 'เพิ่มสินค้า';
                        return;
                    }

                    uploadStatus.innerText = 'กำลังอัปโหลดรูปปก...';
                    const imageUrl = await uploadToCloudinary(file);
                    dataToSave.imageUrl = imageUrl;
                    dataToSave.createdAt = firebase.firestore.FieldValue.serverTimestamp(); // (เพิ่มเวลาสร้าง)

                    uploadStatus.innerText = 'กำลังเพิ่มสินค้าใหม่...';
                    await db.collection('products').add(dataToSave);
                    uploadStatus.innerText = 'เพิ่มสินค้าสำเร็จ!';
                }
                
                // (เคลียร์ฟอร์ม และ โหลดรายการใหม่)
                resetForm();
                await loadProducts();

            } catch (error) {
                console.error("Error saving product: ", error);
                uploadStatus.innerText = 'เกิดข้อผิดพลาด: ' + error.message;
                submitBtn.disabled = false;
                submitBtn.innerText = currentEditId ? 'อัปเดตสินค้า' : 'เพิ่มสินค้า';
            }
        };
    }
    
    // (ฟังก์ชันอัปโหลดไป Cloudinary - แยกออกมา)
    async function uploadToCloudinary(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        return data.secure_url;
    }


    // --- 5. ฟังก์ชันดึงสินค้ามาโชว์ (อัปเกรด!) ---
    async function loadProducts() {
        if (!productListAdmin) return;
        productListAdmin.innerHTML = 'กำลังโหลดสินค้า...';
        
        // (เราจะดึงข้อมูลมาเก็บไว้ก่อน)
        const productsMap = {}; 
        
        const querySnapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        productListAdmin.innerHTML = ''; 
        
        querySnapshot.forEach(doc => {
            const product = doc.data();
            const productId = doc.id;
            
            // (เก็บข้อมูลสินค้าใน Map)
            productsMap[productId] = product; 
            
            const item = document.createElement('div');
            item.className = 'product-item';
            
            let versionCount = product.versions ? Object.keys(product.versions).length : 0;

            item.innerHTML = `
                <span>
                    <img src="${product.imageUrl}" alt="${product.name}">
                    ${product.name} (${product.price} บาท)
                    <br>
                    <small style="color: #555;">มี ${versionCount} เวอร์ชัน</small>
                </span>
                <span>
                    <button class="btn-edit" data-id="${productId}">แก้ไข</button>
                    <button class="btn-delete" data-id="${productId}">ลบ</button>
                </span>
            `;
            
            productListAdmin.appendChild(item);
        });

        // (เพิ่ม Event ให้ปุ่ม "แก้ไข")
        document.querySelectorAll('.btn-edit').forEach(button => {
            button.onclick = (e) => {
                const id = e.target.dataset.id;
                const productToEdit = productsMap[id];
                
                if (productToEdit) {
                    // (เข้าสู่ "โหมดแก้ไข")
                    formTitle.innerText = `กำลังแก้ไข: ${productToEdit.name}`;
                    submitBtn.innerText = 'อัปเดตสินค้า';
                    btnCancelEdit.style.display = 'inline-block';
                    
                    // (ตั้งค่า ID ที่กำลังแก้ไข)
                    currentEditId = id;
                    editProductIdInput.value = id;
                    
                    // (เอาข้อมูลเก่ามาใส่ฟอร์ม)
                    productNameInput.value = productToEdit.name || '';
                    productPriceInput.value = productToEdit.price || '';
                    productDescInput.value = productToEdit.description || '';
                    productVersionsInput.value = formatVersions(productToEdit.versions);
                    
                    // (ยกเลิก "required" ของรูปภาพ)
                    productImageInput.required = false; 

                    // (เลื่อนจอขึ้นไปบนสุด)
                    window.scrollTo(0, 0); 
                }
            };
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

    // --- 6. สั่งให้โหลดสินค้าทันที ---
    loadProducts();

});
