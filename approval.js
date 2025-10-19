// approval.js

// (รอให้ DOM โหลดเสร็จก่อน)
document.addEventListener('DOMContentLoaded', () => {

    const db = firebase.firestore();
    const orderListDiv = document.getElementById('pending-orders-list');

    // --- 1. ตรวจสอบสิทธิ์ Admin (สำคัญที่สุด) ---
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== ADMIN_EMAIL) {
            // (ADMIN_EMAIL มาจาก nav.js)
            alert('คุณไม่มีสิทธิ์เข้าหน้านี้!');
            window.location.href = 'index.html'; // เด้งกลับหน้าแรก
            return;
        }
        
        // (ถ้าเป็น Admin -> โหลดออเดอร์)
        loadPendingOrders();
    });


    // --- 2. ฟังก์ชันโหลดออเดอร์ที่ "รอตรวจสอบ" ---
    async function loadPendingOrders() {
        if (!orderListDiv) return;
        
        orderListDiv.innerHTML = '<h2>กำลังโหลดออเดอร์ที่รออนุมัติ...</h2>';
        
        try {
            // (ดึงออเดอร์ "เฉพาะ" ที่สถานะเป็น 'pending_review')
            const q = db.collection('orders')
                        .where('status', '==', 'pending_review')
                        .orderBy('createdAt', 'asc');
                        
            const querySnapshot = await q.get();
            
            orderListDiv.innerHTML = ''; // ล้าง...
            
            if (querySnapshot.empty) {
                orderListDiv.innerHTML = '<p>ไม่มีออเดอร์ที่รออนุมัติในตอนนี้</p>';
                return;
            }

            // (วนลูปสร้างการ์ดออเดอร์)
            querySnapshot.forEach(doc => {
                const order = doc.data();
                const orderId = doc.id;
                
                const card = document.createElement('div');
                card.className = 'order-card';
                card.id = `order-${orderId}`; // (ตั้ง ID ไว้เผื่อลบทีหลัง)
                
                card.innerHTML = `
                    <div style="display: flex; align-items: center;">
                        <a href="${order.slipUrl}" target="_blank">
                            <img src="${order.slipUrl}" alt="Slip" class="slip-image">
                        </a>
                        <div class="order-info">
                            <strong>ลูกค้า:</strong> ${order.userEmail || order.userId}
                            <br>
                            <strong>สินค้า ID:</strong> ${order.productId}
                            <br>
                            <strong>เวลาส่ง:</strong> ${new Date(order.createdAt.toDate()).toLocaleString()}
                        </div>
                    </div>
                    
                    <button class="btn-approve" data-order-id="${orderId}" data-user-id="${order.userId}" data-product-id="${order.productId}">
                        อนุมัติ
                    </button>
                `;
                
                orderListDiv.appendChild(card);
            });

            // (เพิ่ม Event ให้ปุ่ม "อนุมัติ" ทุกปุ่ม)
            document.querySelectorAll('.btn-approve').forEach(button => {
                button.onclick = async (e) => {
                    const btn = e.target;
                    const { orderId, userId, productId } = btn.dataset;
                    
                    if (confirm(`คุณเช็กยอดเงินของ ${productId} แล้วใช่ไหม?`)) {
                        await approveOrder(btn, orderId, userId, productId);
                    }
                };
            });

        } catch (error) {
            console.error("Error loading orders: ", error);
            orderListDiv.innerHTML = `<h2 style="color: red;">เกิดข้อผิดพลาด: ${error.message}</h2>`;
            orderListDiv.innerHTML += `<p>เช็ก Security Rules (Part 1) หรือยัง?</p>`;
        }
    }


    // --- 3. ฟังก์ชัน "อนุมัติ" (หัวใจของระบบ) ---
    async function approveOrder(buttonEl, orderId, userId, productId) {
        buttonEl.disabled = true;
        buttonEl.innerText = "กำลังอนุมัติ...";

        try {
            // 1. "ติ๊กชื่อ" (เพิ่มสิทธิ์) ให้ User
            // (เราจะใช้ .set() กับ {merge: true} เพื่อสร้างหรืออัปเดต Array)
            const userPermRef = db.collection('user_permissions').doc(userId);
            await userPermRef.set({
                owned_products: firebase.firestore.FieldValue.arrayUnion(productId) // (เพิ่ม ID สินค้าลงใน Array)
            }, { merge: true }); // (ถ้ายังไม่มีเอกสาร ให้สร้าง / ถ้ามีแล้ว ให้อัปเดต)

            // 2. "อัปเดตสถานะ" ออเดอร์ (เปลี่ยนจาก 'pending' เป็น 'approved')
            const orderRef = db.collection('orders').doc(orderId);
            await orderRef.update({
                status: 'approved',
                approvedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 3. (สำเร็จ) ลบการ์ดนี้ออกจากหน้าจอ
            buttonEl.innerText = "อนุมัติสำเร็จ!";
            buttonEl.style.backgroundColor = "#17a2b8";
            
            // (หน่วงเวลา 1 วิ แล้วซ่อนการ์ดนี้)
            setTimeout(() => {
                document.getElementById(`order-${orderId}`).style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error("Error approving order: ", error);
            buttonEl.innerText = "ล้มเหลว!";
            buttonEl.style.backgroundColor = "#dc3545";
            alert("เกิดข้อผิดพลาด: " + error.message);
            buttonEl.disabled = false;
        }
    }

});

