// 1. Supabase Initialization (بياناتك الخاصة)
const SUPABASE_URL = 'https://gtynotqcwgdeynzmgbly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2c6dYLHIeaR6ohv7Tl5bQQ_QkDAOwsq';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Mock Fallback Products (لو قاعدة البيانات فارغة في البداية)
const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: 'مكتب Kinetic Ergonomic Standing Desk',
    category: 'Executive',
    price: 165.000,
    main_image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800',
    description: 'مكتب فاخر قابل لعديل الارتفاع محرك مزدوج هادئ جداً ومعالج بخشب الجوز الإيطالي.'
  },
  {
    id: '2',
    name: 'مكتب Pro Cyber Gaming Desk',
    category: 'Gaming',
    price: 115.000,
    main_image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800',
    description: 'تصميم قيمنج احترافي بمساحة واسعة وحوامل شاشات متطورة وإضاءة مخفية.'
  }
];

let productsList = [];
let cart = JSON.parse(localStorage.getItem('kinetic_cart')) || [];
let activeCategory = 'All';

lucide.createIcons();

// --- Fetch Data from Supabase ---
async function fetchProducts() {
  const countLabel = document.getElementById('product-count-label');
  countLabel.textContent = 'جاري الاتصال بـ Supabase...';

  try {
    // جلب المنتجات من جدول products في Supabase
    let { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('تنبيه: قاعدة بيانات Supabase فارغة أو تحتاج إنشاء جدول products. سيتم عرض المنتجات الافتراضية.');
      productsList = DEFAULT_PRODUCTS;
    } else {
      productsList = data;
    }
  } catch (err) {
    console.error('خطأ في الاتصال:', err);
    productsList = DEFAULT_PRODUCTS;
  }

  renderProducts();
}

// --- Render Cards Grid ---
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const search = document.getElementById('search-input').value.toLowerCase();
  const sort = document.getElementById('sort-select').value;

  let filtered = productsList.filter(p => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search));
    return matchesCat && matchesSearch;
  });

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);

  document.getElementById('product-count-label').textContent = `عرض ${filtered.length} منتج`;

  if (filtered.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px 0;">لا توجد منتجات تطابق البحث.</p>`;
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="product-card">
      <div class="card-image-box">
        <span class="card-tag">${product.category}</span>
        <img src="${product.main_image}" alt="${product.name}" loading="lazy">
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
              إضافة للسلة
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  lucide.createIcons();
}

// --- Add Product Directly to Supabase ---
const addForm = document.getElementById('add-product-form');

addForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const submitBtn = document.getElementById('btn-submit-product');
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري النشر في Supabase...';

  const newProduct = {
    name: document.getElementById('p-name').value,
    category: document.getElementById('p-category').value,
    price: parseFloat(document.getElementById('p-price').value),
    main_image: document.getElementById('p-image').value,
    description: document.getElementById('p-desc').value
  };

  try {
    // إرسال لـ Supabase
    const { data, error } = await db.from('products').insert([newProduct]).select();

    if (error) {
      alert('ملاحظة: تم حفظ المنتج محلياً! (للحفظ على السيرفر قم بإنشاء جدول باسم products في Supabase).');
      productsList.unshift({ id: Date.now().toString(), ...newProduct });
    } else {
      alert('✅ تم نشر المنتج بنجاح في Supabase وظهر بالمتجر!');
      if(data && data[0]) productsList.unshift(data[0]);
    }
  } catch (err) {
    productsList.unshift({ id: Date.now().toString(), ...newProduct });
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = `<i data-lucide="cloud-upload"></i> نشر المنتج مباشرة في Supabase`;
  
  addForm.reset();
  document.getElementById('admin-modal').classList.remove('open');
  renderProducts();
});

// --- Show Details Popup ---
window.showProductDetails = function(id) {
  const p = productsList.find(item => item.id == id);
  if (!p) return;

  document.getElementById('details-title').textContent = p.name;
  document.getElementById('details-body').innerHTML = `
    <img src="${p.main_image}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:12px;">
    <p style="color: var(--accent-gold); font-weight:bold; font-size:1.1rem;">السعر: ${Number(p.price).toFixed(3)} ر.ع</p>
    <p style="margin-top:8px; font-size:0.9rem; color: var(--text-muted);">${p.description || 'لا يوجد وصف إضافي'}</p>
    <button class="btn btn-primary" style="width:100%; margin-top:16px;" onclick="addToCart('${p.id}'); document.getElementById('details-modal').classList.remove('open');">
      إضافة للسلة الآن
    </button>
  `;

  document.getElementById('details-modal').classList.add('open');
  lucide.createIcons();
};

// --- Cart System ---
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

function updateCart() {
  localStorage.setItem('kinetic_cart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.reduce((acc, i) => acc + i.qty, 0);

  const container = document.getElementById('cart-items');
  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center; color: var(--text-muted);">السلة فارغة.</p>`;
    document.getElementById('cart-subtotal').textContent = '0.000 ر.ع';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.main_image}" alt="${item.name}">
      <div>
        <strong style="font-size:0.85rem;">${item.name}</strong>
        <div style="font-size:0.8rem; color: var(--accent-gold);">${Number(item.price).toFixed(3)} ر.ع × ${item.qty}</div>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
  document.getElementById('cart-subtotal').textContent = `${total.toFixed(3)} ر.ع`;

  // WhatsApp Link
  const phone = '96872420073';
  let msg = `طلب جديد من المتجر:\n`;
  cart.forEach(i => msg += `- ${i.name} (العدد: ${i.qty})\n`);
  msg += `المجموع: ${total.toFixed(3)} ر.ع`;
  document.getElementById('whatsapp-checkout-btn').href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

// Modal Listeners
document.getElementById('open-admin').onclick = () => document.getElementById('admin-modal').classList.add('open');
document.getElementById('close-admin').onclick = () => document.getElementById('admin-modal').classList.remove('open');
document.getElementById('close-admin-backdrop').onclick = () => document.getElementById('admin-modal').classList.remove('open');

document.getElementById('close-details').onclick = () => document.getElementById('details-modal').classList.remove('open');
document.getElementById('close-details-backdrop').onclick = () => document.getElementById('details-modal').classList.remove('open');

document.getElementById('open-cart').onclick = () => document.getElementById('cart-drawer').classList.add('open');
document.getElementById('close-cart').onclick = () => document.getElementById('cart-drawer').classList.remove('open');
document.getElementById('close-cart-backdrop').onclick = () => document.getElementById('cart-drawer').classList.remove('open');

document.getElementById('search-input').oninput = renderProducts;
document.getElementById('sort-select').onchange = renderProducts;

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.category;
    renderProducts();
  };
});

// App Start
fetchProducts();
updateCart();
