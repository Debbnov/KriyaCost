document.addEventListener('DOMContentLoaded', () => {
    fetchJobsForSelect();
    fetchJobSummary();

    document.getElementById('job-form').addEventListener('submit', handleCreateJob);
    document.getElementById('cost-form').addEventListener('submit', handleAddCost);
});

// Helper: Format Angka ke Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
};

// 1. Tambah Pesanan Baru
async function handleCreateJob(e) {
    e.preventDefault();
    const jobNumber = document.getElementById('job-number').value;
    const customerName = document.getElementById('customer-name').value;
    const productName = document.getElementById('product-name').value;
    const quantity = parseInt(document.getElementById('quantity').value);

    const { data, error } = await supabaseClient
        .from('jobs')
        .insert([{ 
            job_number: jobNumber, 
            customer_name: customerName, 
            product_name: productName, 
            quantity: quantity 
        }]);

    if (error) {
        alert('Gagal menambah pesanan: ' + error.message);
    } else {
        alert('Pesanan berhasil dibuat!');
        document.getElementById('job-form').reset();
        fetchJobsForSelect();
        fetchJobSummary();
    }
}

// 2. Tambah Biaya Produksi ke Pesanan
async function handleAddCost(e) {
    e.preventDefault();
    const jobId = document.getElementById('select-job').value;
    const category = document.getElementById('cost-category').value;
    const description = document.getElementById('cost-desc').value;
    const amount = parseFloat(document.getElementById('cost-amount').value);

    const { data, error } = await supabaseClient
        .from('cost_components')
        .insert([{ 
            job_id: jobId, 
            cost_category: category, 
            description: description, 
            amount: amount 
        }]);

    if (error) {
        alert('Gagal mencatat biaya: ' + error.message);
    } else {
        alert('Biaya berhasil ditambahkan!');
        document.getElementById('cost-form').reset();
        fetchJobSummary();
    }
}

// 3. Populate Dropdown Pilihan Pesanan (Hanya menampilkan pesanan IN_PROGRESS)
async function fetchJobsForSelect() {
    const { data: jobs, error } = await supabaseClient
        .from('jobs')
        .select('id, job_number, product_name')
        .eq('status', 'IN_PROGRESS');

    if (!error && jobs) {
        const select = document.getElementById('select-job');
        select.innerHTML = '<option value="">-- Pilih Pesanan --</option>';
        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = `${job.job_number} - ${job.product_name}`;
            select.appendChild(option);
        });
    }
}

// 4. Tampilkan Ringkasan Kartu Biaya (HPP) dari View Supabase
async function fetchJobSummary() {
    const { data: summary, error } = await supabaseClient
        .from('job_cost_summary')
        .select('*');

    if (error) {
        console.error('Error fetching summary:', error);
        return;
    }

    const tbody = document.getElementById('job-summary-table');
    tbody.innerHTML = '';

    summary.forEach(row => {
        // Ambil ID pekerjaan (mendeteksi row.id atau row.job_id)
        const jobId = row.id || row.job_id;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.job_number}</strong></td>
            <td>${row.customer_name}</td>
            <td>${row.product_name}</td>
            <td>${row.quantity}</td>
            <td>${formatRupiah(row.total_raw_materials)}</td>
            <td>${formatRupiah(row.total_direct_labor)}</td>
            <td>${formatRupiah(row.total_overhead)}</td>
            <td><strong>${formatRupiah(row.total_job_cost)}</strong></td>
            <td><strong>${formatRupiah(row.unit_cost)}</strong></td>
            <td>
                <!-- Dropdown Status yang bisa diganti Penjual -->
                <select onchange="updateJobStatus(${jobId}, this.value)">
                    <option value="IN_PROGRESS" ${row.status === 'IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                    <option value="COMPLETED" ${row.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
                    <option value="CANCELLED" ${row.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. Fungsi Ubah Status Pesanan
async function updateJobStatus(jobId, newStatus) {
    if (!jobId) {
        alert('ID Pesanan tidak ditemukan!');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('jobs')
            .update({ status: newStatus })
            .eq('id', jobId);

        if (error) {
            console.error('Detail Error Supabase:', error);
            alert('Gagal memperbarui status pesanan: ' + error.message);
            return;
        }

        alert(`Status pesanan berhasil diubah menjadi: ${newStatus}`);

        // Refresh tabel ringkasan dan dropdown pilihan pesanan
        fetchJobSummary();
        fetchJobsForSelect();

    } catch (err) {
        console.error('Error server:', err);
    }
}