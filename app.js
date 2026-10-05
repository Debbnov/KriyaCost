// =============================================================
// KONFIGURASI SUPABASE
// =============================================================
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
        opt.value = cust.customer_code || cust.id;
        opt.textContent = `${cust.customer_code || ''} - ${cust.name}`;
        selectOrder.appendChild(opt);
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

        // Kita coba kirim dengan nama kolom 'customer_id' dulu
        let payload = {
            customer_id: customerCode,
            order_number: orderNumber,
            product: product,
            qty: qty,
            price: price,
            status: 'Dalam Proses',
            total_cost: 0
        };

        let { error } = await supabaseClient.from('orders').insert([payload]);

        // Kalau ternyata nama kolomnya 'customer_code' atau 'cust_code', ini fallback-nya
        if (error && error.message.includes('customer_id')) {
            payload.cust_code = customerCode;
            delete payload.customer_id;
            const res = await supabaseClient.from('orders').insert([payload]);
            error = res.error;
        }

        if (error) {
            alert('Gagal membuat pesanan: ' + error.message);
            console.error(error);
            return;
        }

        alert('Pesanan baru berhasil disimpan!');
        formOrder.reset();
        loadOrders();
    });
}
