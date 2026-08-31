// 1. إعداد الاتصال بـ Supabase
const SUPABASE_URL = 'https://gtynotqcwgdeynzmgbly.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2c6dYLHIeaR6ohv7Tl5bQQ_QkDAOwsq';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. إدارة حالة سلة المشتريات (LocalStorage Persist)
let cart = JSON.parse(localStorage.getItem('kinetic_cart')) || [];
let currentCategory = 'All';

// Icons Initialization
lucide.createIcons();

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartDrawer = document.getElementById('cart-drawer');
const cartCount = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const whatsappBtn = document.getElementById('whatsapp-checkout-btn');

// --- Functions ---

// Fetch Products from Supabase
async function fetchProducts(category = 'All') {
  renderSkeletons();

  try {
    let query = db.from('products').select('*').order('created_at', { ascending: false });
    
    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: products, error } = await query;

    if (error) throw error;
    renderProducts(products || []);
  } catch (err) {
    console.error('Error:', err.message);
    productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #EF4444;">تعذر تحميل المنتجات حالياً. يرجى المحاولة لاحقاً.</p>`;
  }
}

// Render Loading Skeletons
function renderSkeletons() {
  productGrid.innerHTML = Array(6).fill(0).map(() => `
    <div class="product-card" style="height: 380px;">
      <div class="skeleton" style="height: 200px; width: 100%;"></div>
      <div style="padding: 20px;">
        <div class="skeleton" style="height: 15px; width: 40%; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 20px; width: 80%; margin-bottom: 20px;"></div>
        <div class="skeleton" style="height: 35px; width: 100%;"></div>
      </div>
    </div>
  `).join('');
}

// Render Products Dynamic Grid
function renderProducts(products) {
  if (products.length === 0) {
    productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">لا توجد منتجات متاحة في هذه الفئة.</p>`;
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
        </div>
        <div class="product-price-row">
          <span class="price-tag">${Number(product.price).toFixed(3)} ر.ع</span>
          <button class="btn-add" onclick="addToCart('${product.id}', '${escapeQuotes(product.name)}', ${product.price}, '${product.main_image}')">
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// Add to Cart
window.addToCart = function(id, name, price, image) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }
  updateCartUI();
  openCart();
};

// Update Cart Quantity
window.updateQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  updateCartUI();
};

// Update UI & LocalStorage
function updateCartUI() {
  localStorage.setItem('kinetic_cart', JSON.stringify(cart));
  
  // Total Count
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = totalCount;

  // Render Items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 40px;">سلة المشتريات فارغة.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
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

  // Calculate Subtotal & WhatsApp Link
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  cartSubtotal.textContent = `${subtotal.toFixed(3)} ر.ع`;

  generateWhatsAppLink(subtotal);
}

// Generate Pre-filled Dynamic WhatsApp Link
function generateWhatsAppLink(subtotal) {
  const phone = '96872420073';
  if (cart.length === 0) {
    whatsappBtn.href = '#';
    return;
  }

  let message = `السلام عليكم، أرغب في طلب المنتجات التالية:\n\n📋 *تفاصيل الطلب*\n`;
  
  cart.forEach(item => {
    const itemTotal = (item.price * item.quantity).toFixed(3);
    message += `\n• *${item.name}*\n  الكمية: ${item.quantity}\n  السعر: ${Number(item.price).toFixed(3)} ر.ع\n  الإجمالي: ${itemTotal} ر.ع\n`;
  });

  message += `\n━━━━━━━━━━━━━━\n`;
  message += `*الإجمالي النهائي: ${subtotal.toFixed(3)} ر.ع*\n`;
  message += `━━━━━━━━━━━━━━\n\n`;
  message += `أرغب في إكمال الطلب ومعرفة تفاصيل التوصيل والدفع.`;

  whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Cart Drawer Controls
function openCart() { cartDrawer.classList.add('open'); }
function closeCart() { cartDrawer.classList.remove('open'); }

document.getElementById('open-cart').addEventListener('click', openCart);
document.getElementById('close-cart').addEventListener('click', closeCart);
document.getElementById('close-cart-backdrop').addEventListener('click', closeCart);

// Filter Categories
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    fetchProducts(e.target.dataset.category);
  });
});

// Initial Load
fetchProducts();
updateCartUI();
