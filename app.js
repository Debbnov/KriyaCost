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

        alert('Data pelanggan berhasil disimpan!');
        formCustomer.reset();
        loadCustomers();
    });
}

// =============================================================
// DATA PESANAN (JOB ORDERS) & FUNGSI AKSI STATUS
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
    updateOrderDropdowns(data || []);
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
            <td>
                <select onchange="updateOrderStatus('${ord.order_number}', this.value)" style="padding: 4px; border-radius: 4px; border: 1px solid #ccc; font-size: 12px; cursor: pointer;">
                    <option value="" disabled selected>Ubah Status...</option>
                    <option value="Dalam Antrian">Dalam Antrian</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai Produksi</option>
                    <option value="Lunas">Lunas</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateOrderStatus(orderNumber, newStatus) {
    if (!supabaseClient) return;

    const { error } = await supabaseClient
        .from('orders')
        .update({ status: newStatus })
        .eq('order_number', orderNumber);

    if (error) {
        alert('Gagal memperbarui status: ' + error.message);
        return;
    }

    alert(`Status pesanan ${orderNumber} berhasil diubah menjadi "${newStatus}"!`);
    loadOrders();
}

function updateOrderDropdowns(orders) {
    const costSelect = document.getElementById('cost-order-id');
    const paymentSelect = document.getElementById('payment-order-id');

    const optionsHtml = '<option value="">-- Pilih Pesanan --</option>' +
        orders.map(o => `<option value="${o.order_number}">${o.order_number} - ${o.product_name}</option>`).join('');

    if (costSelect) costSelect.innerHTML = optionsHtml;
    if (paymentSelect) paymentSelect.innerHTML = optionsHtml;
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

        const { error } = await supabaseClient
            .from('orders')
            .insert([{
                customer_id: customerCode,
                order_number: orderNumber,
                product_name: product,
                quantity: qty,
                selling_price: price,
                total_cost: 0,
                total_paid: 0,
                status: 'Dalam Antrian'
            }]);

        if (error) {
            alert('Gagal membuat pesanan:\n' + error.message);
            console.error('Detail Error:', error);
            return;
        }

        alert('Pesanan baru berhasil disimpan!');
        formOrder.reset();
        loadOrders();
    });
}

// =============================================================
// PENCATATAN BIAYA (COSTS)
// =============================================================
function setupCostForm() {
    const formCost = document.getElementById('form-cost');
    if (!formCost) return;

    formCost.addEventListener('submit', async function(e) {
        e.preventDefault();

        const orderNumber = document.getElementById('cost-order-id').value;
        const category = document.getElementById('cost-category').value;
        const description = document.getElementById('cost-desc').value;
        const amount = parseFloat(document.getElementById('cost-amount').value);

        if (!supabaseClient) {
            alert('Supabase belum terkonfigurasi dengan benar.');
            return;
        }

        const { data: currentOrder } = await supabaseClient
            .from('orders')
            .select('total_cost')
            .eq('order_number', orderNumber)
            .single();

        const newTotalCost = ((currentOrder ? currentOrder.total_cost : 0) || 0) + amount;

        const { error } = await supabaseClient
            .from('orders')
            .update({ total_cost: newTotalCost })
            .eq('order_number', orderNumber);

        if (error) {
            alert('Gagal mencatat biaya: ' + error.message);
            return;
        }

        alert('Biaya berhasil dicatat!');
        formCost.reset();
        loadOrders();
    });
}

// =============================================================
// PENCATATAN PEMBAYARAN (LOGIKA ANGSURAN/CICILAN BENAR)
// =============================================================
function setupPaymentForm() {
    const formPayment = document.getElementById('form-payment');
    if (!formPayment) return;

    formPayment.addEventListener('submit', async function(e) {
        e.preventDefault();

        const orderNumber = document.getElementById('payment-order-id').value;
        const amount = parseFloat(document.getElementById('payment-amount').value);
        const method = document.getElementById('payment-method').value;

        if (!supabaseClient) {
            alert('Supabase belum terkonfigurasi dengan benar.');
            return;
        }

        const { data: order, error: fetchError } = await supabaseClient
            .from('orders')
            .select('selling_price, status, total_paid')
            .eq('order_number', orderNumber)
            .single();

        if (fetchError || !order) {
            alert('Gagal mengambil data pesanan: ' + (fetchError ? fetchError.message : 'Pesanan tidak ditemukan'));
            return;
        }

        const sellingPrice = parseFloat(order.selling_price || 0);
        const currentPaid = parseFloat(order.total_paid || 0);
        const newTotalPaid = currentPaid + amount;

        let newStatus = order.status;
        if (newTotalPaid >= sellingPrice) {
            newStatus = 'Lunas';
        }

        const { error: updateError } = await supabaseClient
            .from('orders')
            .update({ 
                total_paid: newTotalPaid,
                status: newStatus 
            })
            .eq('order_number', orderNumber);

        if (updateError) {
            alert('Gagal menyimpan pembayaran: ' + updateError.message);
            return;
        }

        const sisaTagihan = sellingPrice - newTotalPaid;
        if (newStatus === 'Lunas') {
            alert(`Pembayaran Rp ${amount.toLocaleString('id-ID')} via ${method} berhasil!\nStatus: LUNAS 🎉`);
        } else {
            alert(`Pembayaran Rp ${amount.toLocaleString('id-ID')} via ${method} berhasil!\nTerbayar: Rp ${newTotalPaid.toLocaleString('id-ID')}\nSisa Tagihan: Rp ${sisaTagihan.toLocaleString('id-ID')}\nStatus: Belum Lunas`);
        }

        formPayment.reset();
        loadOrders();
    });
}

// =============================================================
// DASHBOARD & INISIALISASI
// =============================================================
function updateDashboard(orders) {
    const totalOrders = document.getElementById('dash-total-orders');
    const inProgress = document.getElementById('dash-in-progress');
    const finished = document.getElementById('dash-finished');
    const completed = document.getElementById('dash-completed');

    if (totalOrders) totalOrders.textContent = orders.length;
    if (inProgress) inProgress.textContent = orders.filter(o => o.status === 'Dalam Proses' || o.status === 'Dalam Antrian').length;
    if (finished) finished.textContent = orders.filter(o => o.status === 'Selesai').length;
    if (completed) completed.textContent = orders.filter(o => o.status === 'Lunas').length;
}

document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
    setupCustomerForm();
    setupOrderForm();
    setupCostForm();
    setupPaymentForm();
    loadCustomers();
    loadOrders();
});
