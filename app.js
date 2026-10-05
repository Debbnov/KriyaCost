// =============================================================
// KONFIGURASI SUPABASE
// =============================================================
// Pastikan URL & ANON KEY ini sudah diisi dengan benar
const SUPABASE_URL = 'https://cwgxbborfgeagpozrrvk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nuwL8Lj0kPSA80nEJGiQ5A_q8o62w5d';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// =============================================================
// FUNGSI NAVIGASI TAB
// =============================================================
function showTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// =============================================================
// DATA PELANGGAN (CUSTOMERS)
// =============================================================
async function loadCustomers() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('customers')
        .select('*');

    if (error) {
        console.error('Gagal mengambil data pelanggan:', error);
        return;
    }

    renderCustomers(data || []);
    updateCustomerDropdowns(data || []);
}

function renderCustomers(customers) {
    const tbody = document.getElementById('table-customers');
    if (!tbody) return;

    tbody.innerHTML = '';
    customers.forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cust.customer_code || '-'}</td>
            <td>${cust.name || '-'}</td>
            <td>${cust.phone || '-'}</td>
            <td>${cust.address || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateCustomerDropdowns(customers) {
    const selectOrder = document.getElementById('order-customer');
    if (!selectOrder) return;

    selectOrder.innerHTML = '<option value="">-- Pilih Pelanggan --</option>';
    customers.forEach(cust => {
        const opt = document.createElement('option');
        // Menggunakan customer_code untuk value dropdown pesanan
        opt.value = cust.customer_code || cust.id;
        opt.textContent = `${cust.customer_code || ''} - ${cust.name}`;
        selectOrder.appendChild(opt);
    });
}

function setupCustomerForm() {
    const formCustomer = document.getElementById('form-customer');
    if (!formCustomer) return;

    formCustomer.addEventListener('submit', async function(e) {
        e.preventDefault();

        const code = document.getElementById('cust-code').value;
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;

        if (!supabaseClient) {
            alert('Supabase belum terkonfigurasi dengan benar.');
            return;
        }

        // Sesuai tabel customers: customer_code, name, phone, address
        const { error } = await supabaseClient
            .from('customers')
            .insert([{
                customer_code: code,
                name: name,
                phone: phone,
                address: address
            }]);

        if (error) {
            alert('Gagal simpan pelanggan ke Supabase:\n' + error.message);
            console.error('Detail Error:', error);
            return;
        }

        alert('Data pelanggan berhasil disimpan permanen ke Supabase!');
        formCustomer.reset();
        loadCustomers();
    });
}

// =============================================================
// DATA PESANAN (JOB ORDERS)
// =============================================================
async function loadOrders() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('orders')
        .select('*');

    if (error) {
        console.error('Gagal mengambil data pesanan:', error);
        return;
    }

    renderOrders(data || []);
    updateDashboard(data || []);
}

function renderOrders(orders) {
    const tbody = document.getElementById('table-orders');
    if (!tbody) return;

    tbody.innerHTML = '';
    orders.forEach(ord => {
        const tr = document.createElement('tr');
        const createdDate = ord.created_at ? new Date(ord.created_at).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID');
        
        tr.innerHTML = `
            <td>${createdDate}</td>
            <td>${ord.order_number || '-'}</td>
            <td>${ord.customer_id || '-'}</td>
            <td>${ord.product_name || '-'}</td>
            <td>${ord.quantity || 0}</td>
            <td>Rp ${Number(ord.selling_price || 0).toLocaleString('id-ID')}</td>
            <td>Rp ${Number(ord.total_cost || 0).toLocaleString('id-ID')}</td>
            <td><span class="badge">${ord.status || 'Dalam Proses'}</span></td>
            <td>-</td>
        `;
        tbody.appendChild(tr);
    });
}

function setupOrderForm() {
    const formOrder = document.getElementById('form-order');
    if (!formOrder) return;

    formOrder.addEventListener('submit', async function(e) {
        e.preventDefault();

        const customerCode = document.getElementById('order-customer').value;
        const orderNumber = document.getElementById('order-number').value;
        const product = document.getElementById('order-product').value;
        const qty = parseInt(document.getElementById('order-qty').value, 10);
        const price = parseFloat(document.getElementById('order-price').value);

        if (!supabaseClient) {
            alert('Supabase belum terkonfigurasi dengan benar.');
            return;
        }

        // Sesuai tabel orders: customer_id, order_number, product_name, quantity, selling_price, total_cost, status
        const { error } = await supabaseClient
            .from('orders')
            .insert([{
                customer_id: customerCode,
                order_number: orderNumber,
                product_name: product,
                quantity: qty,
                selling_price: price,
                total_cost: 0,
                status: 'Dalam Proses'
            }]);

        if (error) {
            alert('Gagal membuat pesanan:\n' + error.message);
            console.error('Detail Error:', error);
            return;
        }

        alert('Pesanan baru berhasil disimpan permanen ke Supabase!');
        formOrder.reset();
        loadOrders();
    });
}

function updateDashboard(orders) {
    const totalOrders = document.getElementById('dash-total-orders');
    const inProgress = document.getElementById('dash-in-progress');
    const finished = document.getElementById('dash-finished');
    const completed = document.getElementById('dash-completed');

    if (totalOrders) totalOrders.textContent = orders.length;
    if (inProgress) inProgress.textContent = orders.filter(o => o.status === 'Dalam Proses').length;
    if (finished) finished.textContent = orders.filter(o => o.status === 'Selesai').length;
    if (completed) completed.textContent = orders.filter(o => o.status === 'Lunas').length;
}

// =============================================================
// INISIALISASI
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
    setupCustomerForm();
    setupOrderForm();
    loadCustomers();
    loadOrders();
});
