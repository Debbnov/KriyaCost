function showTab(tabId) {
    // Sembunyikan semua tab content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    // Tampilkan tab yang dipilih
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// Inisialisasi awal saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
});
}
