// قائمة منتجات أولية تضمن عمل الموقع مباشرة فور الفتح
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'مكتب Kinetic Apex Pro Standing Desk',
    category: 'Executive',
    price: 185.000,
    main_image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800',
    description: 'مكتب تنفيذي ذكي بمحرك مزدوج هادئ للغاية، محطة شحن لاسلكية مدمجة، وسلالم خشبية فاخرة.'
  },
  {
    id: '2',
    name: 'مكتب CyberSpace RGB Gaming Desk',
    category: 'Gaming',
    price: 125.000,
    main_image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800',
    description: 'مصمم خصيصاً للجيمرز: دعم كامل لإدارة الكوابل، حامل سماعة، وحامل كوب مع إضاءة متكيفة.'
  },
  {
    id: '3',
    name: 'مكتب Minimalist Studio Workstation',
    category: 'Office',
    price: 95.000,
    main_image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800',
    description: 'مكتب مكتبي عصري بتصميم مينيملست يناسب المساحات الصغيرة مع متانة عالية وأرجل فولاذية.'
  }
];

// حفظ المنتجات والسلة في الذاكرة المحلية حتى يظل الموقع متفاعلاً
let productsList = JSON.parse(localStorage.getItem('kinetic_products')) || DEFAULT_PRODUCTS;
let cart = JSON.parse(localStorage.getItem('kinetic_cart')) || [];
let activeCategory = 'All';

// ==========================================
// 1. عرض البطاقات والمنتجات
// ==========================================
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');

  if (!grid) return;

  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const sort = sortSelect ? sortSelect.value : 'featured';

  let filtered = productsList.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search) || 
                          (p.description && p.description.toLowerCase().includes(search));
    return matchesCat && matchesSearch;
  });

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);

  const countLabel = document.getElementById('product-count-label');
  if (countLabel) countLabel.textContent = `عرض ${filtered.length} منتج`;

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 50px 0;">لا توجد منتجات تطابق البحث.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="product-card">
      <div class="card-image-box">
        <span class="card-tag">${product.category}</span>
        <img src="${product.main_image}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800'">
      </div>
      <div class="card-body">
        <div>
          <h3 class="card-title">${product.name}</h3>
          <p class="card-desc">${product.description || 'مكتب فاخر بتصميم عصري وخامات عالية الجودة.'}</p>
        </div>
        <div class="card-footer">
          <span class="card-price">${Number(product.price).toFixed(3)} ر.ع</span>
          <div class="btn-group">
            <button class="btn-icon" onclick="showProductDetails('${product.id}')" title="عرض التفاصيل">
              <i data-lucide="eye"></i>
            </button>
            <button class="btn-add-cart" onclick="addToCart('${product.id}')">
              <i data-lucide="shopping-bag" style="width:14px; height:14px; margin-left:4px;"></i> إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// 2. تفعيل نموذج إضافة منتج جديد
// ==========================================
const addForm = document.getElementById('add-product-form');
if (addForm) {
  addForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newProduct = {
      id: Date.now().toString(),
      name: document.getElementById('p-name').value,
      category: document.getElementById('p-category').value,
      price: parseFloat(document.getElementById('p-price').value),
      main_image: document.getElementById('p-image').value,
      description: document.getElementById('p-desc').value
    };

    productsList.unshift(newProduct);
    localStorage.setItem('kinetic_products', JSON.stringify(productsList));

    alert('✅ تم نشر المنتج وإضافته للكتالوج بنجاح!');
    
    addForm.reset();
    document.getElementById('admin-modal').classList.remove('open');
    renderProducts();
  });
}

// ==========================================
// 3. عرض التفاصيل في النافذة المنبثقة
// ==========================================
window.showProductDetails = function(id) {
  const p = productsList.find(item => item.id == id);
  if (!p) return;

  const titleElem = document.getElementById('details-title');
  const bodyElem = document.getElementById('details-body');

  if (titleElem) titleElem.textContent = p.name;
  if (bodyElem) {
    bodyElem.innerHTML = `
      <img src="${p.main_image}" style="width:100%; height:220px; object-fit:cover; border-radius:8px; margin-bottom:14px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="background:rgba(212,175,55,0.2); color:var(--accent-gold); padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:bold;">${p.category}</span>
        <span style="color: var(--accent-gold); font-weight:bold; font-size:1.2rem;">${Number(p.price).toFixed(3)} ر.ع</span>
      </div>
      <p style="font-size:0.9rem; color: var(--text-muted); line-height:1.6;">${p.description || 'لا يوجد وصف إضافي متوفر.'}</p>
      <button class="btn btn-primary" style="width:100%; margin-top:20px;" onclick="addToCart('${p.id}'); document.getElementById('details-modal').classList.remove('open');">
        إضافة للسلة الآن
      </button>
    `;
  }

  document.getElementById('details-modal').classList.add('open');
  if (window.lucide) lucide.createIcons();
};

// ==========================================
// 4. إدارة السلة وتغيير الكميات
// ==========================================
window.addToCart = function(id) {
  const p = productsList.find(item => item.id == id);
  if (!p) return;

  const exist = cart.find(item => item.id == id);
  if (exist) {
    exist.qty += 1;
  } else {
    cart.push({ ...p, qty: 1 });
  }

  updateCart();
  document.getElementById('cart-drawer').classList.add('open');
};

window.changeCartQty = function(id, delta) {
  const item = cart.find(i => i.id == id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id != id);
  }

  updateCart();
};

function updateCart() {
  localStorage.setItem('kinetic_cart', JSON.stringify(cart));
  
  const countElem = document.getElementById('cart-count');
  if (countElem) countElem.textContent = cart.reduce((acc, i) => acc + i.qty, 0);

  const container = document.getElementById('cart-items');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center; color: var(--text-muted); margin-top: 40px;">السلة فارغة حالياً.</p>`;
    document.getElementById('cart-subtotal').textContent = '0.000 ر.ع';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border-color); padding-bottom:12px;">
      <div style="display:flex; gap:10px; align-items:center;">
        <img src="${item.main_image}" alt="${item.name}" style="width:50px; height:50px; border-radius:6px; object-fit:cover;">
        <div>
          <strong style="font-size:0.85rem; color:#fff; display:block;">${item.name}</strong>
          <span style="font-size:0.8rem; color: var(--accent-gold);">${Number(item.price).toFixed(3)} ر.ع</span>
        </div>
      </div>
      
      <div style="display:flex; align-items:center; gap:8px;">
        <button onclick="changeCartQty('${item.id}', -1)" style="background:var(--bg-surface); color:#fff; border:1px solid var(--border-color); width:24px; height:24px; border-radius:4px; cursor:pointer;">-</button>
        <span style="font-size:0.85rem; font-weight:bold;">${item.qty}</span>
        <button onclick="changeCartQty('${item.id}', 1)" style="background:var(--bg-surface); color:#fff; border:1px solid var(--border-color); width:24px; height:24px; border-radius:4px; cursor:pointer;">+</button>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  document.getElementById('cart-subtotal').textContent = `${total.toFixed(3)} ر.ع`;

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// 5. تجهيز الفاتورة الاحترافية وفتح الواتساب
// ==========================================
const whatsappBtn = document.getElementById('whatsapp-checkout-btn');
if (whatsappBtn) {
  whatsappBtn.onclick = () => {
    if (cart.length === 0) {
      alert('السلة فارغة! يرجى إضافة منتجات أولاً.');
      return;
    }

    const name = document.getElementById('cust-name').value.trim() || 'عميل غير مسجل';
    const city = document.getElementById('cust-city').value.trim() || 'غير محدد';
    const invNum = 'INV-' + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toLocaleDateString('ar-EG');
    const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);

    // بناء نص الفاتورة المنظم
    let invoiceText = `🧾 *فاتورة طلب جديدة - KINETIC DESKS*\n`;
    invoiceText += `----------------------------------------\n`;
    invoiceText += `📌 *رقم الفاتورة:* ${invNum}\n`;
    invoiceText += `📅 *التاريخ:* ${date}\n`;
    invoiceText += `👤 *العميل:* ${name}\n`;
    invoiceText += `📍 *الولاية/المدينة:* ${city}\n`;
    invoiceText += `----------------------------------------\n\n`;
    invoiceText += `📦 *المنتجات المطلوب شراءها:*\n`;

    cart.forEach((item, index) => {
      const itemTotal = (item.price * item.qty).toFixed(3);
      invoiceText += `${index + 1}. *${item.name}*\n`;
      invoiceText += `   العدد: ${item.qty} | السعر: ${Number(item.price).toFixed(3)} ر.ع | الإجمالي: ${itemTotal} ر.ع\n\n`;
    });

    invoiceText += `----------------------------------------\n`;
    invoiceText += `💰 *المجموع النهائي للفاتورة:* ${total.toFixed(3)} ر.ع\n`;
    invoiceText += `----------------------------------------\n`;
    invoiceText += `✨ *شكراً لتسوقك معنا، يرجى تأكيد الطلب للبدء في الشحن.*`;

    // رقم الواتساب بالرمز الدولي
    const phone = '96872420073';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(invoiceText)}`;
    window.open(url, '_blank');
  };
}

// ==========================================
// 6. التحكم بالأزرار والتفاعل
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const openAdmin = document.getElementById('open-admin');
  if (openAdmin) openAdmin.onclick = () => document.getElementById('admin-modal').classList.add('open');

  const closeAdmin = document.getElementById('close-admin');
  if (closeAdmin) closeAdmin.onclick = () => document.getElementById('admin-modal').classList.remove('open');

  const closeAdminBackdrop = document.getElementById('close-admin-backdrop');
  if (closeAdminBackdrop) closeAdminBackdrop.onclick = () => document.getElementById('admin-modal').classList.remove('open');

  const closeDetails = document.getElementById('close-details');
  if (closeDetails) closeDetails.onclick = () => document.getElementById('details-modal').classList.remove('open');

  const closeDetailsBackdrop = document.getElementById('close-details-backdrop');
  if (closeDetailsBackdrop) closeDetailsBackdrop.onclick = () => document.getElementById('details-modal').classList.remove('open');

  const openCart = document.getElementById('open-cart');
  if (openCart) openCart.onclick = () => document.getElementById('cart-drawer').classList.add('open');

  const closeCart = document.getElementById('close-cart');
  if (closeCart) closeCart.onclick = () => document.getElementById('cart-drawer').classList.remove('open');

  const closeCartBackdrop = document.getElementById('close-cart-backdrop');
  if (closeCartBackdrop) closeCartBackdrop.onclick = () => document.getElementById('cart-drawer').classList.remove('open');

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.oninput = renderProducts;

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.onchange = renderProducts;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.dataset.category;
      renderProducts();
    };
  });

  renderProducts();
  updateCart();
});
