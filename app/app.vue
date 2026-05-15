<template>
  <div>
    <div v-if="initialAppLoading" class="app-loading-screen" role="status" aria-live="polite">
      <div class="app-loading-card">
        <div class="app-loading-logo">
          <img src="/img/MoriBites Logotext.webp" alt="MoriBites" @error="hideBrokenImage" />
        </div>
        <div class="app-loading-spinner"></div>
        <h1>MoriBites</h1>
        <p>Mengambil data terbaru</p>
      </div>
    </div>

    <nav v-show="!initialAppLoading">
      <button class="nav-logo nav-logo-button" title="Admin Login" type="button" @click="handleLogoClick">
        <div class="nav-logo-img">
          <img src="/img/MoriBites Logotext.webp" alt="MoriBites" @error="hideBrokenImage" />
        </div>
        <span class="nav-brand">
          Mori<span>Bites</span>
          <span v-if="isAdmin" class="admin-badge">Admin</span>
        </span>
      </button>

      <button class="hamburger" type="button" aria-label="Menu" @click="mobileMenuOpen = !mobileMenuOpen">
        <span></span><span></span><span></span>
      </button>

      <ul class="nav-links" :class="{ open: mobileMenuOpen }">
        <li><a href="#produk" @click="mobileMenuOpen = false">Produk</a></li>
        <li>
          <a
            href="#pesan"
            class="nav-order-btn"
            :class="{ 'closed-state': !canOrder }"
            @click="mobileMenuOpen = false"
          >
            {{ canOrder ? 'Pesan Sekarang' : 'Pemesanan Ditutup' }}
          </a>
        </li>
      </ul>
    </nav>

    <main v-show="!initialAppLoading">
    <section class="hero" id="home">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <p class="hero-eyebrow">Healthy Cookies in Town</p>
        <h1 class="hero-title">Nyemil Manis Tanpa<br /><em>Rasa Bersalah</em></h1>
        <p class="hero-subtitle">Suka nyemil manis tapi pengen tetap sehat? Temukan cookies manis sehatmu di sini!</p>
        <div class="hero-cta">
          <a href="#produk" class="btn-primary">Lihat Produk</a>
          <a href="#pesan" class="btn-outline">Pesan Sekarang</a>
        </div>
      </div>
      <div class="scroll-arrow">v</div>
    </section>

    <section class="section section-bg" id="produk">
      <div class="section-header">
        <p class="section-eyebrow">Koleksi MoriBites</p>
        <h2 class="section-title">Varian Cookies</h2>
        <p class="section-sub">Kita punya banyak cookies yang bisa jadi favoritmu.</p>
      </div>

      <div class="slider-wrapper">
        <div class="slider-track" :style="{ transform: `translateX(-${sliderOffset}px)` }">
          <article v-for="product in activeProducts" :key="product.id" class="product-card">
            <div class="product-img">
              <img v-if="product.image" :src="product.image" :alt="product.name" />
              <span v-else style="position:relative;z-index:1;">MB</span>
              <span v-if="product.badge" class="product-badge">{{ product.badge }}</span>
            </div>
            <div class="product-info">
              <p class="product-category">{{ product.category }}</p>
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-desc">{{ product.description }}</p>
              <div class="product-footer">
                <span class="product-price">{{ formatPrice(product.price) }}</span>
                <button
                  class="product-order-btn"
                  type="button"
                  :disabled="!canOrder"
                  :class="{ closed: !canOrder }"
                  @click="scrollToOrder(product.id)"
                >
                  Pesan
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="slider-nav">
        <button class="slider-btn" type="button" aria-label="Previous" @click="goToSlide(currentIndex - 1)">&#8592;</button>
        <div class="slider-dots">
          <button
            v-for="index in dotCount"
            :key="index"
            class="dot"
            :class="{ active: currentIndex === index - 1 }"
            type="button"
            :aria-label="`Slide ${index}`"
            @click="goToSlide(index - 1)"
          ></button>
        </div>
        <button class="slider-btn" type="button" aria-label="Next" @click="goToSlide(currentIndex + 1)">&#8594;</button>
      </div>
    </section>

    <section class="order-section" id="pesan">
      <div class="order-container">
        <div class="section-header">
          <p class="section-eyebrow">Form Pemesanan</p>
          <h2 class="section-title">Pesan Sekarang</h2>
          <div class="order-status-pill" :class="canOrder ? 'open' : 'closed'">
            <span class="dot-live"></span>
            <span>{{ orderDataLoading ? 'Memuat Status Pemesanan' : canOrder ? `Menerima Pesanan ${activeBatch.name}` : 'Tidak Menerima Pesanan' }}</span>
          </div>
        </div>

        <div v-if="orderDataLoading" class="order-closed-msg">
          <div class="closed-icon">...</div>
          <h3>Memuat Status Pemesanan</h3>
          <p>Sedang mengambil status PO batch terbaru.<br />Mohon tunggu sebentar.</p>
        </div>

        <div v-else-if="!canOrder" class="order-closed-msg">
          <div class="closed-icon">!</div>
          <h3>Pemesanan Ditutup</h3>
          <p>Belum ada PO batch yang sedang dibuka.<br />Silakan kembali lagi nanti atau hubungi kami melalui media sosial.</p>
        </div>

        <div v-else class="order-form-wrap">
          <h3 class="order-form-title">Isi Form Pemesanan</h3>
          
          <form @submit.prevent="submitOrder">
            <div class="form-grid">
              <div class="form-group">
                <label>Nama Lengkap *</label>
                <input v-model.trim="orderForm.nama" type="text" placeholder="Nama kamu" required />
              </div>
              <div class="form-group">
                <label>No. WhatsApp *</label>
                <input v-model.trim="orderForm.wa" type="tel" placeholder="08xxxxxxxxxx" required />
              </div>
              <div class="form-group form-full">
                <label>Alamat Pengiriman *</label>
                <input v-model.trim="orderForm.alamat" type="text" placeholder="Jl. Contoh No. 123, Kota" required />
              </div>
              <div class="form-group">
                <label>Jumlah *</label>
                <input v-model.number="orderForm.qty" type="number" placeholder="1" min="1" required />
              </div>
              <div class="order-items-field form-full">
                <div class="order-items-head">
                  <label>Produk per Item *</label>
                  <span>{{ orderItemSelections.length }} item</span>
                </div>
                <div class="order-item-list">
                  <div v-for="(item, index) in orderItemSelections" :key="index" class="order-item-row">
                    <span class="order-item-number">Item {{ index + 1 }}</span>
                    <select v-model="item.produkId" class="product-select" required>
                      <option value="" disabled>Pilih produk</option>
                      <option v-for="product in activeProducts" :key="product.id" :value="product.id">
                        {{ product.name }} - {{ formatPrice(product.price) }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="order-total-preview">
                  <span>Total Harga</span>
                  <strong>{{ formatPrice(orderTotal) }}</strong>
                </div>
              </div>
              <div class="form-group form-full">
                <label>Metode Pembayaran *</label>
                <select v-model="orderForm.metodePembayaran" required>
                  <option value="cash">Cash</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
              <div v-if="orderForm.metodePembayaran === 'qris'" class="payment-qris-box form-full">
                <div class="payment-qris-image">
                  <img :src="qrisImage" alt="QRIS MoriBites" />
                </div>
                <div class="form-group">
                  <label>Upload Bukti Pembayaran *</label>
                  <input type="file" accept="image/*" required @change="handlePaymentProof" />
                  <small v-if="orderForm.buktiPembayaran">Bukti pembayaran siap dikirim.</small>
                </div>
              </div>
              <div class="form-group form-full">
                <label>Catatan / Pesan Tambahan</label>
                <textarea v-model.trim="orderForm.catatan" placeholder="Ambil waktu sore, ambil di dekat gerbang UNEJ, dll."></textarea>
              </div>
            </div>
            <button type="submit" class="submit-btn" :disabled="submittingOrder">
              {{ submittingOrder ? 'Mengirim...' : 'Kirim Pesanan' }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <footer id="about">
      <div class="footer-logo"><img src="/img/MoriBites Logotext.webp" alt="MoriBites" /></div>
      <div class="footer-social">
        <a href="https://instagram.com/moribitesidn" target="_blank" rel="noopener noreferrer">
          <i class="bi bi-instagram"></i>
          @moribitesidn
        </a>
      </div>
      <p>Nyemil manis, tanpa rasa bersalah!</p>
      <p style="margin-top:0.5rem;">&copy; 2026 MoriBites. Hak cipta dilindungi.</p>
    </footer>
    </main>

    <div class="admin-bar" :class="{ visible: isAdmin }">
      <div class="admin-bar-info">
        Masuk sebagai <strong>Admin</strong> - <span>{{ orders.length }} pesanan, {{ pendingOrders }} pending</span>
      </div>
      <div class="admin-controls">
        <button class="admin-dashboard-btn" type="button" @click="openAdminDashboard">Dashboard</button>
        <button class="toggle-order-btn" :class="orderOpen ? 'close-btn' : 'open-btn'" type="button" @click="toggleOrderStatus">
          {{ orderOpen ? 'Tutup Pemesanan' : 'Buka Pemesanan' }}
        </button>
        <button class="admin-logout-btn" type="button" @click="adminLogout">Keluar</button>
      </div>
    </div>

    <div class="modal-overlay" :class="{ active: loginModalOpen }" @click.self="closeAdminModal">
      <div class="modal-box">
        <div class="modal-logo">Admin</div>
        <h3 class="modal-title">Admin Login</h3>
        <p class="modal-sub">Masukkan kredensial admin untuk mengelola pemesanan dan produk.</p>
        <form class="modal-form" @submit.prevent="submitAdminLogin">
          <div class="modal-err" :class="{ show: loginError }">Username atau password salah.</div>
          <div class="form-group">
            <label>Username</label>
            <input v-model.trim="loginForm.username" type="text" placeholder="Username" autocomplete="off" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input v-model.trim="loginForm.password" type="password" placeholder="Password" autocomplete="off" />
          </div>
          <div class="modal-actions">
            <button class="modal-cancel" type="button" @click="closeAdminModal">Batal</button>
            <button class="modal-submit" type="submit">Masuk</button>
          </div>
        </form>
      </div>
    </div>

    <div class="dashboard-overlay" :class="{ active: dashboardOpen }" @click.self="closeAdminDashboard">
      <div class="dashboard-shell">
        <div class="dashboard-header">
          <div>
            <p class="dashboard-kicker">MoriBites Admin</p>
            <h2>Dashboard</h2>
          </div>
          <button class="dashboard-close" type="button" aria-label="Tutup dashboard" @click="closeAdminDashboard">x</button>
        </div>

        <div class="dashboard-stats">
          <div class="stat-card">
            <span>Total Pesanan</span>
            <strong>{{ orders.length }}</strong>
          </div>
          <div class="stat-card">
            <span>Pending</span>
            <strong>{{ pendingOrders }}</strong>
          </div>
          <div class="stat-card">
            <span>Produk Aktif</span>
            <strong>{{ activeProducts.length }}</strong>
          </div>
          <div class="stat-card">
            <span>Status Form</span>
            <strong>{{ orderOpen ? 'Buka' : 'Tutup' }}</strong>
          </div>
          <div class="stat-card">
            <span>Batch Aktif</span>
            <strong>{{ activeBatch ? activeBatch.name : '-' }}</strong>
          </div>
        </div>

        <div class="dashboard-tabs">
          <button
            v-for="tab in adminTabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeAdminTab === tab.id }"
            type="button"
            @click="activeAdminTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <section v-show="activeAdminTab === 'orders'" class="dashboard-panel active">
          <div class="panel-head">
            <div>
              <h3>Pesanan Masuk</h3>
              <p>Kelola status order, filter berdasarkan batch PO, dan salin nomor WhatsApp pelanggan.</p>
            </div>
            <div class="panel-actions">
              <button class="panel-action export-action" type="button" @click="exportOrders">Export Excel</button>
              <button class="panel-action" type="button" @click="clearCompletedOrders">Bersihkan Selesai</button>
            </div>
          </div>
          <div class="orders-filter">
            <label>Filter Batch</label>
            <select v-model="selectedBatchFilter" class="status-select">
              <option value="all">Semua Batch</option>
              <option value="none">Tanpa Batch</option>
              <option v-for="batch in batches" :key="batch.id" :value="batch.id">{{ batch.name }}</option>
            </select>
          </div>
          <div class="orders-table-wrap">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Batch</th>
                  <th>Pelanggan</th>
                  <th>Produk</th>
                  <th>Total</th>
                  <th>Pembayaran</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in filteredOrders" :key="order.id">
                  <td>{{ formatDate(order.waktu) }}</td>
                  <td>{{ order.batchName || 'Tanpa Batch' }}</td>
                  <td>
                    <strong>{{ order.nama }}</strong>
                    <span>{{ order.wa }}</span>
                    <small>{{ order.alamat }}</small>
                  </td>
                  <td>
                    <strong>{{ order.produk }}</strong>
                    <template v-if="order.items?.length">
                      <span v-for="(item, index) in order.items" :key="`${order.id}-${index}`">
                        {{ item.name }} - {{ formatPrice(item.price) }}
                      </span>
                    </template>
                    <span v-else>{{ order.qty }} x {{ formatPrice(order.harga) }}</span>
                    <small>{{ order.catatan || '-' }}</small>
                  </td>
                  <td>{{ formatPrice(order.total) }}</td>
                  <td>
                    <strong>{{ formatPaymentMethod(order.metodePembayaran) }}</strong>
                    <button
                      v-if="order.buktiPembayaran"
                      class="proof-link"
                      type="button"
                      @click="openPaymentProof(order.buktiPembayaran)"
                    >
                      Lihat bukti
                    </button>
                    <small v-else>-</small>
                  </td>
                  <td>
                    <select v-model="order.status" class="status-select" @change="updateOrderStatus(order)">
                      <option v-for="status in orderStatuses" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button type="button" @click="copyWhatsApp(order.wa)">Salin WA</button>
                      <button type="button" @click="deleteOrder(order.id)">Hapus</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="empty-state" :style="{ display: filteredOrders.length ? 'none' : 'block' }">Belum ada pesanan pada filter batch ini.</div>
        </section>

        <section v-show="activeAdminTab === 'products'" class="dashboard-panel active">
          <div class="panel-head">
            <div>
              <h3>Produk</h3>
              <p>Tambah produk, ubah harga, dan upload foto yang tampil di katalog.</p>
            </div>
          </div>

          <form class="product-admin-form" @submit.prevent="saveProduct">
            <div class="form-grid">
              <div class="form-group">
                <label>Nama Produk *</label>
                <input v-model.trim="productForm.name" type="text" required />
              </div>
              <div class="form-group">
                <label>Kategori *</label>
                <input v-model.trim="productForm.category" type="text" required />
              </div>
              <div class="form-group">
                <label>Harga *</label>
                <input v-model.number="productForm.price" type="number" min="0" required />
              </div>
              <div class="form-group">
                <label>Badge</label>
                <input v-model.trim="productForm.badge" type="text" placeholder="Terlaris, Baru, Hot" />
              </div>
              <div class="form-group form-full">
                <label>Deskripsi</label>
                <textarea v-model.trim="productForm.description"></textarea>
              </div>
              <div class="form-group form-full">
                <label>Foto Produk</label>
                <input type="file" accept="image/*" @change="handleProductImage" />
                <div class="image-preview" :class="{ 'has-image': Boolean(productForm.image) }">
                  <img v-if="productForm.image" :src="productForm.image" alt="Preview produk" />
                  <span v-else>Belum ada foto</span>
                </div>
              </div>
              <label class="checkbox-row form-full">
                <input v-model="productForm.active" type="checkbox" />
                <span>Produk aktif dan tampil di website</span>
              </label>
            </div>
            <div class="product-form-actions">
              <button type="button" class="modal-cancel" @click="resetProductForm">Reset</button>
              <button type="submit" class="modal-submit">Simpan Produk</button>
            </div>
          </form>

          <div class="product-admin-list">
            <article v-for="product in products" :key="product.id" class="product-admin-item">
              <div class="product-admin-thumb">
                <img v-if="product.image" :src="product.image" :alt="product.name" />
                <span v-else>MB</span>
              </div>
              <div class="product-admin-info">
                <strong>{{ product.name }}</strong>
                <span>{{ product.category }} - {{ formatPrice(product.price) }}</span>
                <small>{{ product.active ? 'Aktif' : 'Nonaktif' }}{{ product.badge ? ` - ${product.badge}` : '' }}</small>
              </div>
              <div class="row-actions">
                <button type="button" @click="editProduct(product)">Edit</button>
                <button type="button" @click="toggleProductActive(product.id)">{{ product.active ? 'Nonaktifkan' : 'Aktifkan' }}</button>
                <button type="button" @click="deleteProduct(product.id)">Hapus</button>
              </div>
            </article>
          </div>
        </section>

        <section v-show="activeAdminTab === 'settings'" class="dashboard-panel active">
          <div class="panel-head">
            <div>
              <h3>Status Pemesanan</h3>
              <p>Buka atau tutup form pemesanan yang terlihat oleh pelanggan.</p>
            </div>
          </div>
          <div class="settings-card">
            <div>
              <strong>{{ orderOpen ? 'Form pemesanan buka' : 'Form pemesanan tutup' }}</strong>
              <p>{{ orderOpen ? 'Pelanggan bisa mengirim pesanan baru.' : 'Pelanggan hanya melihat pesan bahwa pemesanan sedang ditutup.' }}</p>
            </div>
            <button class="toggle-order-btn" :class="orderOpen ? 'close-btn' : 'open-btn'" type="button" @click="toggleOrderStatus">
              {{ orderOpen ? 'Tutup Pemesanan' : 'Buka Pemesanan' }}
            </button>
          </div>
        </section>

        <section v-show="activeAdminTab === 'batches'" class="dashboard-panel active">
          <div class="panel-head">
            <div>
              <h3>PO Batch</h3>
              <p>Buat batch PO baru, buka satu batch aktif, lalu pesanan otomatis masuk ke batch tersebut.</p>
            </div>
          </div>

          <form class="product-admin-form" @submit.prevent="saveBatch">
            <div class="form-grid">
              <div class="form-group">
                <label>Nama Batch *</label>
                <input v-model.trim="batchForm.name" type="text" placeholder="Batch 1" required />
              </div>
              <div class="form-group form-full">
                <label>Catatan</label>
                <textarea v-model.trim="batchForm.note" placeholder="Contoh: PO minggu pertama, close Jumat 20.00"></textarea>
              </div>
              <label class="checkbox-row form-full">
                <input v-model="batchForm.openNow" type="checkbox" />
                <span>Langsung buka batch ini untuk pemesanan</span>
              </label>
            </div>
            <div class="product-form-actions">
              <button type="button" class="modal-cancel" @click="resetBatchForm">Reset</button>
              <button type="submit" class="modal-submit">Simpan Batch</button>
            </div>
          </form>

          <div class="product-admin-list">
            <article v-for="batch in batches" :key="batch.id" class="product-admin-item">
              <div class="product-admin-info">
                <strong>{{ batch.name }}</strong>
                <span>{{ batch.note || 'Tanpa catatan' }}</span>
                <small>{{ batch.status }} - {{ countOrdersByBatch(batch.id) }} pesanan</small>
              </div>
              <div class="row-actions">
                <button type="button" @click="editBatch(batch)">Edit</button>
                <button v-if="batch.status !== 'Open'" type="button" @click="openBatch(batch.id)">Buka PO</button>
                <button v-else type="button" @click="closeBatch(batch.id)">Tutup PO</button>
                <button v-if="countOrdersByBatch(batch.id) === 0" type="button" @click="deleteBatch(batch.id)">Hapus</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <div class="toast" :class="{ show: toast.show }" :style="{ borderLeftColor: toast.success ? 'var(--accent)' : '#f87171' }">
      <div class="toast-title">{{ toast.title }}</div>
      <div>{{ toast.message }}</div>
    </div>
  </div>
</template>

<script setup>
import qrisImage from '../assets/payment/qris.jpeg'

const GOOGLE_SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbys8K_9eovp8ieVQ8nQeZTpvS49BIiDyUyj7PQ3yfJXJrI1o8QVh5-T-_MincwryiYCqw/exec'

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'morichansukakelor'
}

const STORAGE_KEYS = {
  orderOpen: 'moribites.orderOpen',
  orders: 'moribites.orders',
  products: 'moribites.products'
}

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-alpha',
    name: 'Produk Unggulan Alpha',
    category: 'Kategori A',
    description: 'Deskripsi singkat produk ini. Dibuat dengan bahan pilihan, nyaman untuk camilan harian.',
    price: 150000,
    image: '',
    badge: 'Terlaris',
    active: true
  },
  {
    id: 'prod-beta',
    name: 'Produk Premium Beta',
    category: 'Kategori B',
    description: 'Varian premium dengan rasa lebih kaya. Cocok untuk kamu yang menginginkan yang terbaik.',
    price: 220000,
    image: '',
    badge: '',
    active: true
  },
  {
    id: 'prod-gamma',
    name: 'Produk Natural Gamma',
    category: 'Kategori C',
    description: 'Rasa natural dengan komposisi yang ringan untuk teman aktivitas.',
    price: 180000,
    image: '',
    badge: 'Baru',
    active: true
  },
  {
    id: 'prod-delta',
    name: 'Produk Spesial Delta',
    category: 'Kategori D',
    description: 'Edisi spesial untuk pesanan terbatas dengan rasa yang lebih berani.',
    price: 295000,
    image: '',
    badge: 'Hot',
    active: true
  },
  {
    id: 'prod-epsilon',
    name: 'Produk Exclusive Epsilon',
    category: 'Kategori E',
    description: 'Formulasi eksklusif yang hanya tersedia di MoriBites.',
    price: 350000,
    image: '',
    badge: '',
    active: true
  },
  {
    id: 'prod-zeta',
    name: 'Paket Hemat Zeta',
    category: 'Paket Bundling',
    description: 'Beli lebih, hemat lebih. Cocok untuk keluarga atau hadiah.',
    price: 450000,
    image: '',
    badge: '',
    active: true
  }
]

useHead({
  title: 'MoriBitesIDN',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
  ],
  link: [
    { rel: 'icon', href: '/img/MoriBites Logotext.webp', type: 'image/webp' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;900&display=swap' },
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css' },
    { rel: 'stylesheet', href: '/style.css' }
  ]
})

const isAdmin = ref(false)
const mobileMenuOpen = ref(false)
const loginModalOpen = ref(false)
const dashboardOpen = ref(false)
const loginError = ref(false)
const orderOpen = ref(true)
const activeBatchId = ref('')
const orders = ref([])
const products = ref([...DEFAULT_PRODUCTS])
const batches = ref([])
const activeAdminTab = ref('orders')
const selectedBatchFilter = ref('all')
const currentIndex = ref(0)
const cardsPerView = ref(3)
const cardWidth = ref(0)
const submittingOrder = ref(false)
const orderDataLoading = ref(true)
const initialAppLoading = ref(true)
const toastTimer = ref(null)
const sliderTimer = ref(null)
const toast = reactive({
  show: false,
  title: 'Berhasil',
  message: '',
  success: true
})

const loginForm = reactive({
  username: '',
  password: ''
})

const orderForm = reactive({
  nama: '',
  wa: '',
  alamat: '',
  qty: 1,
  produkItems: [{ produkId: '' }],
  metodePembayaran: 'cash',
  buktiPembayaran: '',
  catatan: ''
})

const productForm = reactive(emptyProductForm())
const batchForm = reactive(emptyBatchForm())

const adminTabs = [
  { id: 'orders', label: 'Pesanan' },
  { id: 'batches', label: 'Batch PO' },
  { id: 'products', label: 'Produk' },
  { id: 'settings', label: 'Pengaturan' }
]

const orderStatuses = ['Pending', 'Diproses', 'Selesai', 'Dibatalkan']

const activeProducts = computed(() => products.value.filter((product) => product.active))
const activeBatch = computed(() => {
  const selectedBatch = batches.value.find((batch) => batch.id === activeBatchId.value && batch.status === 'Open')
  return selectedBatch || batches.value.find((batch) => batch.status === 'Open')
})
const canOrder = computed(() => orderOpen.value && Boolean(activeBatch.value))
const filteredOrders = computed(() => {
  if (selectedBatchFilter.value === 'all') return orders.value
  if (selectedBatchFilter.value === 'none') return orders.value.filter((order) => !order.batchId)
  return orders.value.filter((order) => order.batchId === selectedBatchFilter.value)
})
const pendingOrders = computed(() => filteredOrders.value.filter((order) => order.status === 'Pending').length)
const maxIndex = computed(() => Math.max(0, activeProducts.value.length - cardsPerView.value))
const dotCount = computed(() => maxIndex.value + 1)
const sliderOffset = computed(() => currentIndex.value * cardWidth.value)
const orderItemSelections = computed(() => orderForm.produkItems)
const selectedOrderItems = computed(() => orderForm.produkItems.map((item) => {
  const product = products.value.find((productItem) => productItem.id === item.produkId)
  return product
    ? { id: product.id, name: product.name, price: Number(product.price || 0) }
    : null
}))
const orderTotal = computed(() => selectedOrderItems.value.reduce((sum, product) => sum + Number(product?.price || 0), 0))
const orderProductSummary = computed(() => {
  const counts = new Map()
  selectedOrderItems.value.filter(Boolean).forEach((product) => {
    const current = counts.get(product.id) || { name: product.name, qty: 0 }
    current.qty += 1
    counts.set(product.id, current)
  })

  return Array.from(counts.values()).map((item) => `${item.name} (${item.qty})`).join(', ')
})

onMounted(async () => {
  orderOpen.value = loadJSON(STORAGE_KEYS.orderOpen, true)
  orders.value = loadJSON(STORAGE_KEYS.orders, [])
  products.value = loadJSON(STORAGE_KEYS.products, DEFAULT_PRODUCTS)
  await loadDashboardData()
  updateSliderSizing()
  window.addEventListener('resize', updateSliderSizing)
  sliderTimer.value = window.setInterval(() => {
    if (maxIndex.value <= 0) return
    goToSlide(currentIndex.value < maxIndex.value ? currentIndex.value + 1 : 0)
  }, 5000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateSliderSizing)
  if (sliderTimer.value) window.clearInterval(sliderTimer.value)
  if (toastTimer.value) window.clearTimeout(toastTimer.value)
})

watch(activeProducts, async () => {
  await nextTick()
  updateSliderSizing()
  currentIndex.value = Math.min(currentIndex.value, maxIndex.value)
}, { deep: true })

watch(orderOpen, (value) => saveJSON(STORAGE_KEYS.orderOpen, value))
watch(products, (value) => saveJSON(STORAGE_KEYS.products, value), { deep: true })
watch(orders, (value) => saveJSON(STORAGE_KEYS.orders, value), { deep: true })
watch(() => orderForm.metodePembayaran, (value) => {
  if (value !== 'qris') orderForm.buktiPembayaran = ''
})
watch(() => orderForm.qty, syncOrderItems)

function emptyProductForm() {
  return {
    id: '',
    name: '',
    category: '',
    description: '',
    price: 0,
    image: '',
    badge: '',
    active: true
  }
}

function emptyBatchForm() {
  return {
    id: '',
    name: '',
    note: '',
    openNow: true
  }
}

function loadJSON(key, fallback) {
  if (!import.meta.client) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch (error) {
    console.warn('Gagal membaca localStorage', key, error)
    return fallback
  }
}

function saveJSON(key, value) {
  if (!import.meta.client) return
  localStorage.setItem(key, JSON.stringify(value))
}

async function loadDashboardData() {
  orderDataLoading.value = true
  try {
    const [productData, orderData, batchData, settingData] = await Promise.all([
      $fetch('/api/products'),
      $fetch('/api/orders'),
      $fetch('/api/batches'),
      $fetch('/api/settings/order-status')
    ])

    products.value = productData
    orders.value = orderData
    batches.value = batchData
    orderOpen.value = settingData.orderOpen
    activeBatchId.value = settingData.activeBatchId || batchData.find((batch) => batch.status === 'Open')?.id || ''
  } catch (error) {
    console.error('Gagal memuat data', error)
    showToast('Database Tidak Terhubung', 'Data sementara dibaca dari cache browser.', false)
  } finally {
    orderDataLoading.value = false
    initialAppLoading.value = false
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatDate(value) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function formatPaymentMethod(value) {
  return value === 'qris' ? 'QRIS' : 'Cash'
}

function hideBrokenImage(event) {
  event.target.style.display = 'none'
}

function handleLogoClick() {
  if (!isAdmin.value) openAdminModal()
}

function openAdminModal() {
  loginModalOpen.value = true
  loginError.value = false
  loginForm.username = ''
  loginForm.password = ''
}

function closeAdminModal() {
  loginModalOpen.value = false
}

function submitAdminLogin() {
  if (loginForm.username === ADMIN_CREDENTIALS.username && loginForm.password === ADMIN_CREDENTIALS.password) {
    isAdmin.value = true
    closeAdminModal()
    openAdminDashboard()
    showToast('Login Admin', 'Berhasil masuk sebagai Admin.', true)
    return
  }

  loginError.value = true
  loginForm.password = ''
}

function adminLogout() {
  isAdmin.value = false
  closeAdminDashboard()
  showToast('Logout', 'Kamu telah keluar dari mode Admin.', false)
}

function openAdminDashboard() {
  if (!isAdmin.value) {
    openAdminModal()
    return
  }
  dashboardOpen.value = true
}

function closeAdminDashboard() {
  dashboardOpen.value = false
}

async function toggleOrderStatus() {
  const nextValue = !orderOpen.value
  if (nextValue && !activeBatch.value) {
    activeAdminTab.value = 'batches'
    showToast('Pilih Batch PO', 'Buka salah satu batch PO terlebih dahulu untuk menerima pesanan.', false)
    return
  }

  try {
    const response = await $fetch('/api/settings/order-status', {
      method: 'PUT',
      body: { orderOpen: nextValue }
    })
    orderOpen.value = response.orderOpen
    activeBatchId.value = response.activeBatchId || activeBatchId.value
    await loadDashboardData()
    showToast('Status Pemesanan', orderOpen.value ? 'Form pemesanan dibuka.' : 'Form pemesanan ditutup.', orderOpen.value)
  } catch (error) {
    console.error('Gagal mengubah status pemesanan', error)
    showToast('Gagal Menyimpan', 'Status pemesanan belum tersimpan ke database.', false)
  }
}

function scrollToOrder(productId) {
  document.getElementById('pesan')?.scrollIntoView({ behavior: 'smooth' })
  if (!orderOpen.value) return
  syncOrderItems()
  orderForm.produkItems.forEach((item) => {
    item.produkId = productId
  })
}

async function submitOrder() {
  if (!orderOpen.value) {
    showToast('Pemesanan Ditutup', 'Saat ini form pemesanan belum dibuka.', false)
    return
  }

  if (!activeBatch.value) {
    showToast('Batch Belum Dibuka', 'Admin belum membuka PO batch untuk menerima pesanan.', false)
    return
  }

  syncOrderItems()
  const orderedItems = selectedOrderItems.value
  if (orderedItems.some((item) => !item)) {
    showToast('Produk Belum Dipilih', 'Pilih produk yang ingin dipesan.', false)
    return
  }

  if (orderForm.metodePembayaran === 'qris' && !orderForm.buktiPembayaran) {
    showToast('Bukti Pembayaran Wajib', 'Upload bukti pembayaran QRIS terlebih dahulu.', false)
    return
  }

  submittingOrder.value = true
  const quantity = Math.max(1, Number(orderForm.qty || 1))
  const productItems = orderedItems.map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price)
  }))
  const order = {
    id: `order-${Date.now()}`,
    nama: orderForm.nama,
    wa: orderForm.wa,
    alamat: orderForm.alamat,
    produkId: productItems.length === 1 ? productItems[0].id : '',
    produk: orderProductSummary.value,
    produkItems: productItems,
    batchId: activeBatch.value.id,
    harga: productItems.length === 1 ? Number(productItems[0].price) : 0,
    qty: quantity,
    total: orderTotal.value,
    metodePembayaran: orderForm.metodePembayaran,
    buktiPembayaran: orderForm.metodePembayaran === 'qris' ? orderForm.buktiPembayaran : '',
    catatan: orderForm.catatan,
    status: 'Pending',
    waktu: new Date().toISOString()
  }

  try {
    const savedOrder = await $fetch('/api/orders', {
      method: 'POST',
      body: order
    })
    orders.value.unshift(savedOrder)

    fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        nama: savedOrder.nama,
        wa: savedOrder.wa,
        alamat: savedOrder.alamat,
        produk: savedOrder.produk,
        qty: savedOrder.qty,
        total: savedOrder.total,
        metodePembayaran: formatPaymentMethod(savedOrder.metodePembayaran),
        catatan: savedOrder.catatan,
        waktu: new Date(savedOrder.waktu).toLocaleString('id-ID')
      })
    }).catch((error) => console.warn('Gagal sinkron Google Sheet', error))

    resetOrderForm()
    showToast('Pesanan Terkirim', 'Pesanan Berhasil, Terimakasih telah memesan moribites!.', true)
  } catch (error) {
    console.error('Gagal menyimpan pesanan', error)
    showToast('Gagal Menyimpan', 'Pesanan belum tersimpan ke database.', false)
  } finally {
    submittingOrder.value = false
  }
}

function resetOrderForm() {
  orderForm.nama = ''
  orderForm.wa = ''
  orderForm.alamat = ''
  orderForm.qty = 1
  orderForm.produkItems = [{ produkId: '' }]
  orderForm.metodePembayaran = 'cash'
  orderForm.buktiPembayaran = ''
  orderForm.catatan = ''
}

function syncOrderItems() {
  const quantity = Math.max(1, Number(orderForm.qty || 1))
  orderForm.qty = quantity

  while (orderForm.produkItems.length < quantity) {
    orderForm.produkItems.push({ produkId: '' })
  }

  if (orderForm.produkItems.length > quantity) {
    orderForm.produkItems.splice(quantity)
  }
}

async function updateOrderStatus(order) {
  try {
    const updatedOrder = await $fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      body: { status: order.status }
    })
    const index = orders.value.findIndex((item) => item.id === order.id)
    if (index >= 0) orders.value.splice(index, 1, updatedOrder)
  } catch (error) {
    console.error('Gagal mengubah status pesanan', error)
    showToast('Gagal Menyimpan', 'Status pesanan belum tersimpan ke database.', false)
    await loadDashboardData()
  }
}

async function deleteOrder(orderId) {
  try {
    await $fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
    orders.value = orders.value.filter((order) => order.id !== orderId)
    showToast('Pesanan Dihapus', 'Data pesanan sudah dihapus dari database.', false)
  } catch (error) {
    console.error('Gagal menghapus pesanan', error)
    showToast('Gagal Menghapus', 'Pesanan belum terhapus dari database.', false)
  }
}

async function clearCompletedOrders() {
  try {
    const response = await $fetch('/api/orders/clear-completed', { method: 'DELETE' })
    orders.value = orders.value.filter((order) => !['Selesai', 'Dibatalkan'].includes(order.status))
    showToast('Dashboard Dibersihkan', `${response.deleted} pesanan selesai/dibatalkan dihapus.`, true)
  } catch (error) {
    console.error('Gagal membersihkan pesanan', error)
    showToast('Gagal Membersihkan', 'Data pesanan belum terhapus dari database.', false)
  }
}

function countOrdersByBatch(batchId) {
  return orders.value.filter((order) => order.batchId === batchId).length
}

function exportOrders() {
  const query = new URLSearchParams({ batchId: selectedBatchFilter.value })
  window.open(`/api/orders/export?${query.toString()}`, '_blank')
}

async function saveBatch() {
  const payload = {
    name: batchForm.name,
    note: batchForm.note,
    openNow: batchForm.openNow
  }

  try {
    const isExistingBatch = batches.value.some((batch) => batch.id === batchForm.id)
    const savedBatch = await $fetch(isExistingBatch ? `/api/batches/${batchForm.id}` : '/api/batches', {
      method: isExistingBatch ? 'PUT' : 'POST',
      body: payload
    })

    const index = batches.value.findIndex((batch) => batch.id === savedBatch.id)
    if (index >= 0) {
      batches.value.splice(index, 1, savedBatch)
    } else {
      batches.value.unshift(savedBatch)
    }

    if (batchForm.openNow && isExistingBatch) {
      await $fetch(`/api/batches/${batchForm.id}/open`, { method: 'PUT' })
      await loadDashboardData()
    } else if (!batchForm.openNow && isExistingBatch && savedBatch.status === 'Open') {
      await $fetch(`/api/batches/${batchForm.id}/close`, { method: 'PUT' })
      await loadDashboardData()
    } else if (batchForm.openNow && !isExistingBatch) {
      await loadDashboardData()
    }

    resetBatchForm()
    showToast('Batch Disimpan', 'PO batch sudah tersimpan.', true)
  } catch (error) {
    console.error('Gagal menyimpan batch', error)
    showToast('Gagal Menyimpan', 'Batch belum tersimpan ke database.', false)
  }
}

function editBatch(batch) {
  batchForm.id = batch.id
  batchForm.name = batch.name
  batchForm.note = batch.note
  batchForm.openNow = batch.status === 'Open'
  activeAdminTab.value = 'batches'
}

function resetBatchForm() {
  Object.assign(batchForm, emptyBatchForm())
}

async function openBatch(batchId) {
  try {
    await $fetch(`/api/batches/${batchId}/open`, { method: 'PUT' })
    await loadDashboardData()
    selectedBatchFilter.value = batchId
    showToast('PO Dibuka', 'Batch ini sekarang menerima pesanan.', true)
  } catch (error) {
    console.error('Gagal membuka batch', error)
    showToast('Gagal Membuka PO', 'Batch belum bisa dibuka.', false)
  }
}

async function closeBatch(batchId) {
  try {
    await $fetch(`/api/batches/${batchId}/close`, { method: 'PUT' })
    await loadDashboardData()
    showToast('PO Ditutup', 'Batch ini sudah ditutup.', false)
  } catch (error) {
    console.error('Gagal menutup batch', error)
    showToast('Gagal Menutup PO', 'Batch belum bisa ditutup.', false)
  }
}

async function deleteBatch(batchId) {
  if (countOrdersByBatch(batchId) > 0) {
    showToast('Tidak Bisa Dihapus', 'Batch masih memiliki pesanan.', false)
    return
  }

  try {
    await $fetch(`/api/batches/${batchId}`, { method: 'DELETE' })
    batches.value = batches.value.filter((batch) => batch.id !== batchId)
    if (batchForm.id === batchId) resetBatchForm()
    if (selectedBatchFilter.value === batchId) selectedBatchFilter.value = 'all'
    showToast('Batch Dihapus', 'Batch kosong sudah dihapus.', false)
  } catch (error) {
    console.error('Gagal menghapus batch', error)
    showToast('Gagal Menghapus', 'Batch hanya bisa dihapus jika belum punya pesanan.', false)
  }
}

function copyWhatsApp(number) {
  navigator.clipboard.writeText(number).then(() => {
    showToast('Nomor Disalin', number, true)
  }).catch(() => {
    showToast('Gagal Menyalin', 'Browser tidak mengizinkan akses clipboard.', false)
  })
}

function handlePaymentProof(event) {
  const file = event.target.files?.[0]
  if (!file) {
    orderForm.buktiPembayaran = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    orderForm.buktiPembayaran = ''
    event.target.value = ''
    showToast('File Tidak Valid', 'Upload bukti pembayaran dalam format gambar.', false)
    return
  }

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    orderForm.buktiPembayaran = ''
    event.target.value = ''
    showToast('File Terlalu Besar', 'Ukuran bukti pembayaran maksimal 2 MB.', false)
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    orderForm.buktiPembayaran = String(reader.result)
  }
  reader.readAsDataURL(file)
}

function openPaymentProof(proof) {
  if (!proof) return
  const tab = window.open()
  if (!tab) {
    showToast('Gagal Membuka Bukti', 'Browser memblokir tab baru.', false)
    return
  }
  tab.document.body.style.margin = '0'
  tab.document.body.style.background = '#111'
  const image = tab.document.createElement('img')
  image.src = proof
  image.alt = 'Bukti Pembayaran'
  image.style.maxWidth = '100%'
  image.style.height = 'auto'
  image.style.display = 'block'
  image.style.margin = '0 auto'
  tab.document.body.appendChild(image)
  tab.document.close()
}

function handleProductImage(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    productForm.image = String(reader.result)
  }
  reader.readAsDataURL(file)
}

async function saveProduct() {
  const product = {
    id: productForm.id || `prod-${Date.now()}`,
    name: productForm.name,
    category: productForm.category,
    description: productForm.description,
    price: Number(productForm.price || 0),
    image: productForm.image,
    badge: productForm.badge,
    active: productForm.active
  }

  try {
    const isExistingProduct = products.value.some((item) => item.id === productForm.id)
    const savedProduct = await $fetch(isExistingProduct ? `/api/products/${productForm.id}` : '/api/products', {
      method: isExistingProduct ? 'PUT' : 'POST',
      body: product
    })

    const index = products.value.findIndex((item) => item.id === savedProduct.id)
    if (index >= 0) {
      products.value.splice(index, 1, savedProduct)
    } else {
      products.value.unshift(savedProduct)
    }

    resetProductForm()
    showToast('Produk Disimpan', 'Katalog produk sudah tersimpan.', true)
  } catch (error) {
    console.error('Gagal menyimpan produk', error)
    showToast('Gagal Menyimpan', 'Produk belum tersimpan ke database.', false)
  }
}

function editProduct(product) {
  Object.assign(productForm, { ...product })
  activeAdminTab.value = 'products'
}

function resetProductForm() {
  Object.assign(productForm, emptyProductForm())
}

async function toggleProductActive(productId) {
  const product = products.value.find((item) => item.id === productId)
  if (!product) return

  try {
    const updatedProduct = await $fetch(`/api/products/${productId}`, {
      method: 'PUT',
      body: { ...product, active: !product.active }
    })
    const index = products.value.findIndex((item) => item.id === productId)
    if (index >= 0) products.value.splice(index, 1, updatedProduct)
  } catch (error) {
    console.error('Gagal mengubah status produk', error)
    showToast('Gagal Menyimpan', 'Status produk belum tersimpan ke database.', false)
  }
}

async function deleteProduct(productId) {
  try {
    await $fetch(`/api/products/${productId}`, { method: 'DELETE' })
    products.value = products.value.filter((product) => product.id !== productId)
    if (productForm.id === productId) resetProductForm()
    showToast('Produk Dihapus', 'Produk sudah dihapus dari database.', false)
  } catch (error) {
    console.error('Gagal menghapus produk', error)
    showToast('Gagal Menghapus', 'Produk belum terhapus dari database.', false)
  }
}

function showToast(title, message, success) {
  toast.title = title
  toast.message = message
  toast.success = success
  toast.show = true

  if (toastTimer.value) window.clearTimeout(toastTimer.value)
  toastTimer.value = window.setTimeout(() => {
    toast.show = false
  }, 4000)
}

function updateSliderSizing() {
  cardsPerView.value = window.innerWidth <= 640 ? 1 : window.innerWidth <= 900 ? 2 : 3
  const viewport = document.querySelector('.slider-wrapper')
  const firstCard = document.querySelector('.product-card')
  cardWidth.value = firstCard ? firstCard.getBoundingClientRect().width + 24 : Number(viewport?.clientWidth || 0)
  currentIndex.value = Math.min(currentIndex.value, maxIndex.value)
}

function goToSlide(index) {
  currentIndex.value = Math.max(0, Math.min(index, maxIndex.value))
}
</script>
