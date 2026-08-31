// 1. Supabase Initialization
const SUPABASE_URL = 'https://gtynotqcwgdeynzmgbly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2c6dYLHIeaR6ohv7Tl5bQQ_QkDAOwsq';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. High-Quality Fallback Products (لو قاعدة البيانات فارغة)
const MOCK_PRODUCTS = [
  {
    id: 'mock-1',
    name: 'مكتب Kinetic Executive Pro',
    category: 'Executive',
    price: 185.000,
    main_image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=800',
    description: 'مصنوع من خشب الجوز الإيطالي ومزود بمحرك هادئ للتحكم بالارتفاع إلكترونياً.'
  },
  {
    id: 'mock-2',
    name: 'مكتب CyberSpace Gaming Desk',
    category: 'Gaming',
    price: 125.000,
    main_image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800',
    description: 'مكتب قيمنج احترافي بقواعد ألومنيوم معززة مع إضاءة RGB مخفية ومخرج كابلات ذكي.'
  },
  {
    id: 'mock-3',
    name: 'مكتب Minimalist Studio Desk',
    category: 'Office',
    price: 95.000,
    main_image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?q=80&w=800',
    description: 'تصميم بسيط وعصري يناسب المساحات الحديثة، متين وعالي التحمل.'
  },
  {
    id: 'mock-4',
    name: 'مكتب Workstation Computer Desk',
    category: 'Computer',
    price: 110.000,
    main_image: 'https://images.unsplash.com/photo-1527038939684-727dfe3ca893?q=80&w=800',
    description: 'مخصص للمبرمجين والمصممين مع رفوف شاشات مدمجة وحوامل الملحقات.'
  }
];

// App State
let allProducts = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('kinetic_cart')) || [];
let currentCategory = 'All';

lucide.createIcons();

// DOM Elements
const productGrid = document.getElementById('product-grid');
const countLabel = document.getElementById('product-count-label');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

const cartDrawer = document.getElementById('cart-drawer');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const whatsappBtn = document.getElementById('whatsapp-checkout-btn');

const adminModal = document.getElementById('admin-modal');
const addProductForm = document.getElementById('add-product-form');
const adminInventoryList = document.getElementById('admin-inventory-list');

// --- Core Data Fetching ---
async function loadCatalog() {
  try {
    let { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });

    // إذا فشل الاتصال أو كانت قاعدة البيانات فارغة، نستخدم المنتجات المبدئية + الإضافات المحلية
    const localAdds = JSON.parse(localStorage.getItem('kinetic_custom_products')) || [];
    
    if (error || !data || data.length === 0) {
      allProducts = [...MOCK_PRODUCTS, ...localAdds];
    } else {
      allProducts = [...data, ...localAdds];
    }
  } catch (err) {
    console.warn('استخدام وضع العرض المبدئي المحلي:', err);
    allProducts = MOCK_PRODUCTS;
  }

  applyFilters();
  renderAdminInventory();
}

// Filters & Sort Application
function applyFilters() {
  let result = [...allProducts];

  // Category Filter
  if (currentCategory !== 'All') {
    result = result.filter(p => p.category === currentCategory);
  }

  // Search Filter
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    result = result.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      (p.description && p.description.toLowerCase().includes(searchTerm))
    );
  }

  // Sort
  const sortVal = sortSelect.value;
  if (sortVal === 'price-low') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortVal === 'price-high') {
    result.sort((a, b) => b.price - a.price);
  }

  filteredProducts = result;
  renderProductsGrid(filteredProducts);
}

// Render Products Grid
function renderProductsGrid(products) {
  countLabel.textContent = `عرض ${products.length} من أصل ${allProducts.length} منتجات`;

  if (products.length === 0) {
    productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 60px 0;">لم يتم العثور على أي مكاتب تطابق بحثك.</p>`;
    return;
  }

  productGrid.innerHTML = products.map(product => `
    <div class="product-card">
      <div class="product-img-wrapper">
        <img src="${product.main_image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div>
          <span class="product-category">${product.category}</span>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-desc">${product.description || 'مكتب فاخر بتصميم عصري وخامات عالية الجودة.'}</p>
        </div>
        <div class="product-price-row">
          <span class="price-tag">${Number(product.price).toFixed(3)} ر.ع</span>
          <button class="btn-add" onclick="addToCart('${product.id}')">
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- Admin Features: Add & Delete Products ---
addProductForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newProduct = {
    id: 'prod-' + Date.now(),
    name: document.getElementById('p-name').value,
    slug: document.getElementById('p-name').value.toLowerCase().replace(/\s+/g, '-'),
    category: document.getElementById('p-category').value,
    price: parseFloat(document.getElementById('p-price').value),
    main_image: document.getElementById('p-image').value,
    description: document.getElementById('p-desc').value
  };

  // 1. محاولة الإضافة المباشرة في Supabase
  try {
    await db.from('products').insert([newProduct]);
  } catch (err) {
    console.log('حفظ محلي مؤقت للمنتج...');
  }

  // 2. الحفظ المحلي المباشر لضمان الشغل 100%
  const localAdds = JSON.parse(localStorage.getItem('kinetic_custom_products')) || [];
  localAdds.unshift(newProduct);
  localStorage.setItem('kinetic_custom_products', JSON.stringify(localAdds));

  alert('تمت إضافة المنتج بنجاح وتحديث كتالوج المتجر!');
  addProductForm.reset();
  adminModal.classList.remove('open');
  
  loadCatalog();
});

function deleteProduct(id) {
  if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج؟')) return;

  // الحذف من القائمة المحلية
  let localAdds = JSON.parse(localStorage.getItem('kinetic_custom_products')) || [];
  localAdds = localAdds.filter(p => p.id !== id);
  localStorage.setItem('kinetic_custom_products', JSON.stringify(localAdds));

  allProducts = allProducts.filter(p => p.id !== id);
  applyFilters();
  renderAdminInventory();
}

function renderAdminInventory() {
  adminInventoryList.innerHTML = allProducts.map(p => `
    <div class="inventory-item">
      <div>
        <strong>${p.name}</strong>
        <div style="font-size:0.75rem; color: var(--text-muted);">${p.category} - ${Number(p.price).toFixed(3)} OMR</div>
      </div>
      <button class="btn-delete" onclick="deleteProduct('${p.id}')">حذف</button>
    </div>
  `).join('');
}

// --- Cart Operations ---
window.addToCart = function(id) {
  const product = allProducts.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  updateCartUI();
  openCart();
};

window.updateQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCartUI();
};

function updateCartUI() {
  localStorage.setItem('kinetic_cart', JSON.stringify(cart));
  
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = totalCount;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">سلة المشتريات فارغة حالياً.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.main_image}" alt="${item.name}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-price">${Number(item.price).toFixed(3)} ر.ع</div>
          <div class="cart-controls">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  cartSubtotal.textContent = `${subtotal.toFixed(3)} ر.ع`;

  generateWhatsAppInvoice(subtotal);
}

function generateWhatsAppInvoice(subtotal) {
  const phone = '96872420073';
  if (cart.length === 0) {
    whatsappBtn.href = '#';
    return;
  }

  let message = `السلام عليكم، أرغب في طلب المنتجات التالية من المتجر:\n\n📋 *تفاصيل الفاتورة والطلب*\n`;
  
  cart.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(3);
    message += `\n• *${item.name}*\n  الكمية: ${item.quantity}\n  سعر الوحدة: ${Number(item.price).toFixed(3)} ر.ع\n  الإجمالي: ${itemTotal} ر.ع\n`;
  });

  message += `\n━━━━━━━━━━━━━━\n`;
  message += `*الإجمالي الكلي: ${subtotal.toFixed(3)} ر.ع*\n`;
  message += `━━━━━━━━━━━━━━\n\n`;
  message += `أرغب في إكمال الطلب ومعرفة تفاصيل الشحن والتسليم داخل عمان.`;

  whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Modal Toggle Event Listeners
function openCart() { cartDrawer.classList.add('open'); }
function closeCart() { cartDrawer.classList.remove('open'); }

document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
document.getElementById('close-cart-backdrop').addEventListener('click', closeCart);

document.getElementById('open-admin').addEventListener('click', () => adminModal.classList.add('open'));
document.getElementById('close-admin').addEventListener('click', () => adminModal.classList.remove('open'));
document.getElementById('close-admin-backdrop').addEventListener('click', () => adminModal.classList.remove('open'));

// Event Listeners for Filters
searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentCategory = e.target.dataset.category;
    applyFilters();
  });
});

// App Run
loadCatalog();
updateCartUI();
