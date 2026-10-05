// =============================================================
// KONFIGURASI SUPABASE
// Pastikan Kamu Mengisi URL dan Anon Key dengan Benar
// =============================================================
const SUPABASE_URL = 'https://cwgxbborfgeagpozrrvk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nuwL8Lj0kPSA80nEJGiQ5A_q8o62w5d';

const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

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

// =============================================================
// DATA PELANGGAN (CUSTOMERS)
// =============================================================
async function loadCustomers() {
    if (!supabase) return;

    const { data, error } = await supabase
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
            <td>${cust.code || cust.customer_code || '-'}</td>
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
        opt.value = cust.code || cust.customer_code || cust.id;
        opt.textContent = `${cust.code || cust.customer_code || ''} - ${cust.name}`;
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

        if (!supabase) {
            alert('Supabase belum terkonfigurasi! Cek URL dan Anon Key di app.js.');
            return;
        }

        // Mencoba kirim dengan format kolom 'code' atau 'customer_code'
        let payload = { code, name, phone, address };
        let { error } = await supabase.from('customers').insert([payload]);

        // Jika error karena kolom bernama customer_code, coba payload cadangan
        if (error && error.message.includes('customer_code')) {
            payload = { customer_code: code, name, phone, address };
            const res = await supabase.from('customers').insert([payload]);
            error = res.error;
        }

        if (error) {
            alert('Gagal simpan ke Supabase!\nPesan Error: ' + error.message);
            console.error('Detail Error:', error);
            return;
        }

        alert('Data pelanggan berhasil disimpan ke Supabase!');
        formCustomer.reset();
        loadCustomers(); // Refresh daftar tabel
    });
}

// INISIALISASI
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
    setupCustomerForm();
    loadCustomers();
});
