// Configuration & State
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Akan dihubungkan ke Supabase
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Array lokal untuk menyimpan data sementara jika belum tersambung ke Supabase
let customersData = [];
let ordersData = [];
let costsData = [];
let paymentsData = [];

// FUNGSI NAVIGASI TAB
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

// HANDLER FORM PELANGGAN
function setupCustomerForm() {
    const formCustomer = document.getElementById('form-customer');
    if (!formCustomer) return;

    formCustomer.addEventListener('submit', function(e) {
        e.preventDefault();

        const code = document.getElementById('cust-code').value;
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;

        // Tambahkan ke array pelanggan
        const newCustomer = { code, name, phone, address };
        customersData.push(newCustomer);

        // Render ulang tabel & dropdown
        renderCustomers();
        updateCustomerDropdowns();

        // Reset form
        formCustomer.reset();
        alert('Data pelanggan berhasil disimpan!');
    });
}

function renderCustomers() {
    const tbody = document.getElementById('table-customers');
    if (!tbody) return;

    tbody.innerHTML = '';
    customersData.forEach(cust => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cust.code}</td>
            <td>${cust.name}</td>
            <td>${cust.phone || '-'}</td>
            <td>${cust.address || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateCustomerDropdowns() {
    const selectOrder = document.getElementById('order-customer');
    if (!selectOrder) return;

    selectOrder.innerHTML = '<option value="">-- Pilih Pelanggan --</option>';
    customersData.forEach(cust => {
        const opt = document.createElement('option');
        opt.value = cust.code;
        opt.textContent = `${cust.code} - ${cust.name}`;
        selectOrder.appendChild(opt);
    });
}

// HANDLER FORM PESANAN (JOB ORDERS)
function setupOrderForm() {
    const formOrder = document.getElementById('form-order');
    if (!formOrder) return;

    formOrder.addEventListener('submit', function(e) {
        e.preventDefault();

        const customerCode = document.getElementById('order-customer').value;
        const orderNumber = document.getElementById('order-number').value;
        const product = document.getElementById('order-product').value;
        const qty = document.getElementById('order-qty').value;
        const price = document.getElementById('order-price').value;

        const newOrder = {
            date: new Date().toLocaleDateString('id-ID'),
            orderNumber,
            customerCode,
            product,
            qty,
            price,
            totalCost: 0,
            status: 'Dalam Proses'
        };

        ordersData.push(newOrder);
        renderOrders();
        updateOrderDropdowns();
        updateDashboard();

        formOrder.reset();
        alert('Pesanan baru berhasil dibuat!');
    });
}

function renderOrders() {
    const tbody = document.getElementById('table-orders');
    if (!tbody) return;

    tbody.innerHTML = '';
    ordersData.forEach(ord => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ord.date}</td>
            <td>${ord.orderNumber}</td>
            <td>${ord.customerCode}</td>
            <td>${ord.product}</td>
            <td>${ord.qty}</td>
            <td>Rp ${Number(ord.price).toLocaleString('id-ID')}</td>
            <td>Rp ${Number(ord.totalCost).toLocaleString('id-ID')}</td>
            <td><span class="badge">${ord.status}</span></td>
            <td>-</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateOrderDropdowns() {
    const costSelect = document.getElementById('cost-order-id');
    const paymentSelect = document.getElementById('payment-order-id');

    const optionsHtml = '<option value="">-- Pilih Pesanan --</option>' +
        ordersData.map(o => `<option value="${o.orderNumber}">${o.orderNumber} - ${o.product}</option>`).join('');

    if (costSelect) costSelect.innerHTML = optionsHtml;
    if (paymentSelect) paymentSelect.innerHTML = optionsHtml;
}

function updateDashboard() {
    document.getElementById('dash-total-orders').textContent = ordersData.length;
    document.getElementById('dash-in-progress').textContent = ordersData.filter(o => o.status === 'Dalam Proses').length;
    document.getElementById('dash-finished').textContent = ordersData.filter(o => o.status === 'Selesai').length;
    document.getElementById('dash-completed').textContent = ordersData.filter(o => o.status === 'Lunas').length;
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
    setupCustomerForm();
    setupOrderForm();
});
