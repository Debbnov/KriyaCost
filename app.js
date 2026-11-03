// ==========================================================
// 1. KONFIGURASI SUPABASE
// ==========================================================
const SUPABASE_URL = 'https://uupwezyzfwfaupbreykx.supabase.co';
// Ganti nilai kunci di bawah dengan anon public key kamu yang diawali "eyJ..."
const SUPABASE_KEY = 'TEMPEL_ANON_PUBLIC_KEY_EYJ_KAMU_DI_SINI';

const supabaseClient = (typeof supabase !== 'undefined' && supabase.createClient)
  ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : (window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null);

let revenueChartInstance = null;

// ==========================================================
// 2. FUNGSI NAVIGASI TAB
// ==========================================================
function showTab(tabId) {
  // Sembunyikan semua tab
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.add('hidden');
    tab.classList.remove('block');
  });

  // Tampilkan tab yang dipilih
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.remove('hidden');
    activeTab.classList.add('block');
  }

  // Update styling tombol tab navigasi
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-indigo-600', 'text-indigo-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });

  const activeBtn = document.getElementById(`btn-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.remove('border-transparent', 'text-gray-500');
    activeBtn.classList.add('border-indigo-600', 'text-indigo-600');
  }

  // Aksi spesifik saat tab tertentu dibuka
  if (tabId === 'tab-dashboard') {
    renderRevenueChart();
    updateDashboardStats();
  } else if (tabId === 'tab-pelanggan') {
    setAutoCustomerCode();
    loadCustomers();
  } else if (tabId === 'tab-pesanan') {
    populateCustomerDropdown();
    loadOrders();
  }
}

// ==========================================================
// 3. FITUR OTOMATIS KODE PELANGGAN (CUST-001, dst.)
// ==========================================================
async function generateNextCustomerCode() {
  if (!supabaseClient) return 'CUST-001';

  try {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('customer_code');

    if (error) throw error;
    if (!data || data.length === 0) return 'CUST-001';

    // Ambil angka dari kode pelanggan yang ada
    const numbers = data
      .map(c => {
        if (!c.customer_code) return 0;
        const match = c.customer_code.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNum = maxNum + 1;
    return `CUST-${String(nextNum).padStart(3, '0')}`;
  } catch (err) {
    console.error('Gagal membuat kode pelanggan otomatis:', err);
    return `CUST-${Date.now().toString().slice(-3)}`;
  }
}

async function setAutoCustomerCode() {
  const codeInput = document.getElementById('customer-code');
  if (codeInput) {
    const nextCode = await generateNextCustomerCode();
    codeInput.value = nextCode;
    codeInput.readOnly = true;
  }
}

// ==========================================================
// 4. KELOLA DATA PELANGGAN
// ==========================================================
async function handleSaveCustomer(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-save-customer');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  const customerCode = document.getElementById('customer-code').value.trim();
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();

  try {
    const { data, error } = await supabaseClient
      .from('customers')
      .insert([{
        customer_code: customerCode,
        name: name,
        phone: phone,
        address: address
      }])
      .select();

    if (error) throw error;

    alert(`Pelanggan ${name} (${customerCode}) berhasil disimpan!`);
    document.getElementById('form-customer').reset();
    await setAutoCustomerCode();
    await loadCustomers();
  } catch (err) {
    console.error('Error simpan pelanggan:', err);
    alert('Gagal simpan pelanggan ke Supabase:\n' + (err.message || JSON.stringify(err)));
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function loadCustomers() {
  const tbody = document.getElementById('table-customer-body');
  if (!tbody) return;

  try {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-slate-400">Belum ada data pelanggan yang tersimpan.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(c => `
      <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
        <td class="py-3 px-3 font-semibold text-indigo-700">${c.customer_code || '-'}</td>
        <td class="py-3 px-3 font-medium text-slate-800">${c.name}</td>
        <td class="py-3 px-3 text-slate-600">${c.phone || '-'}</td>
        <td class="py-3 px-3 text-slate-500 max-w-xs truncate">${c.address || '-'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Error load customers:', err);
    tbody.innerHTML = `<tr><td colspan="4" class="py-4 text-center text-rose-500 font-semibold">Gagal memuat data pelanggan.</td></tr>`;
  }
}

// Mengisi pilihan dropdown pelanggan di form Pesanan
async function populateCustomerDropdown() {
  const select = document.getElementById('order-customer-select');
  if (!select) return;

  try {
    const { data, error } = await supabaseClient
      .from('customers')
      .select('customer_code, name')
      .order('id', { ascending: true });

    if (error) throw error;

    select.innerHTML = '<option value="">-- Pilih Pelanggan --</option>';
    if (data && data.length > 0) {
      data.forEach(c => {
        const option = document.createElement('option');
        option.value = c.customer_code || c.name;
        option.textContent = `${c.customer_code ? '[' + c.customer_code + '] ' : ''}${c.name}`;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error populate customer dropdown:', err);
  }
}

// ==========================================================
// 5. KELOLA DATA JOB ORDERS (PESANAN)
// ==========================================================
async function handleSaveOrder(event) {
  event.preventDefault();
  const btn = document.getElementById('btn-save-order');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';

  const customerId = document.getElementById('order-customer-select').value;
  const productName = document.getElementById('order-product-name').value.trim();
  const quantity = parseInt(document.getElementById('order-quantity').value, 10) || 1;
  const status = document.getElementById('order-status').value;
  const sellingPrice = parseFloat(document.getElementById('order-selling-price').value) || 0;
  const amountPaid = parseFloat(document.getElementById('order-amount-paid').value) || 0;
  const notes = document.getElementById('order-notes').value.trim();

  // Buat nomor invoice/order unik
  const orderNumber = `ORD-${Date.now().toString().slice(-4)}`;

  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_id: customerId,
        product_name: productName,
        quantity: quantity,
        selling_price: sellingPrice,
        amount_paid: amountPaid,
        total_paid: amountPaid,
        status: status,
        notes: notes
      }])
      .select();

    if (error) throw error;

    alert(`Pesanan ${orderNumber} (${productName}) berhasil dibuat!`);
    document.getElementById('form-order').reset();
    await loadOrders();
    await updateDashboardStats();
    await renderRevenueChart();
  } catch (err) {
    console.error('Error buat pesanan:', err);
    alert('Gagal membuat pesanan:\n' + (err.message || JSON.stringify(err)));
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

async function loadOrders() {
  const tbody = document.getElementById('table-order-body');
  if (!tbody) return;

  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400">Belum ada pesanan aktif.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(o => {
      let badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
      if (o.status === 'Produksi') badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
      if (o.status === 'Finishing') badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
      if (o.status === 'Selesai') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

      return `
        <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
          <td class="py-3 px-3 font-semibold text-slate-800">${o.order_number || ('#ORD-' + o.id)}</td>
          <td class="py-3 px-3 text-slate-700">${o.customer_id || '-'}</td>
          <td class="py-3 px-3">
            <span class="font-medium text-slate-900">${o.product_name}</span>
            <span class="text-xs text-slate-500">(${o.quantity || 1} pcs)</span>
          </td>
          <td class="py-3 px-3 font-semibold text-slate-800">Rp ${Number(o.selling_price || 0).toLocaleString('id-ID')}</td>
          <td class="py-3 px-3">
            <span class="text-[11px] px-2.5 py-1 rounded-full font-semibold border ${badgeColor}">
              ${o.status || 'Antrian'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error load orders:', err);
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-rose-500 font-semibold">Gagal memuat daftar pesanan.</td></tr>`;
  }
}

// ==========================================================
// 6. DASHBOARD & GRAFIK PENDAPATAN (CHART.JS)
// ==========================================================
async function updateDashboardStats() {
  if (!supabaseClient) return;

  try {
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('selling_price');

    if (error) throw error;

    let totalRevenue = 0;
    let totalOrders = 0;

    if (orders && orders.length > 0) {
      totalOrders = orders.length;
      totalRevenue = orders.reduce((sum, item) => sum + (parseFloat(item.selling_price) || 0), 0);
    }

    const statRev = document.getElementById('stat-total-revenue');
    const statOrd = document.getElementById('stat-total-orders');

    if (statRev) statRev.textContent = 'Rp ' + totalRevenue.toLocaleString('id-ID');
    if (statOrd) statOrd.textContent = totalOrders.toString();
  } catch (err) {
    console.error('Error update dashboard stats:', err);
  }
}

async function renderRevenueChart() {
  const canvas = document.getElementById('revenueChart');
  if (!canvas || typeof Chart === 'undefined' || !supabaseClient) return;

  try {
    const { data: orders, error } = await supabaseClient
      .from('orders')
      .select('selling_price, created_at');

    if (error) throw error;

    const monthlyTotals = new Array(12).fill(0);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    if (orders && orders.length > 0) {
      orders.forEach(order => {
        const date = new Date(order.created_at);
        const monthIndex = date.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyTotals[monthIndex] += (parseFloat(order.selling_price) || 0);
        }
      });
    }

    if (revenueChartInstance) {
      revenueChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    revenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Total Pendapatan (Rp)',
          data: monthlyTotals,
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#4f46e5',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Pendapatan: Rp ' + Number(context.raw).toLocaleString('id-ID');
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + ' Jt';
                if (value >= 1000) return 'Rp ' + (value / 1000) + ' Rb';
                return 'Rp ' + value;
              }
            },
            grid: { color: 'rgba(226, 232, 240, 0.6)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  } catch (err) {
    console.error('Error render chart:', err);
  }
}

// ==========================================================
// 7. INISIALISASI SAAT HALAMAN DIBUKA
// ==========================================================
window.addEventListener('DOMContentLoaded', async () => {
  await setAutoCustomerCode();
  await updateDashboardStats();
  await renderRevenueChart();
});
