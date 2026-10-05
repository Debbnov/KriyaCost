// Fungsi untuk berpindah tab/menu sidebar
function showTab(tabId) {
    // Sembunyikan semua konten tab
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });

    // Tampilkan tab yang diklik
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
}

// Jalankan saat halaman web selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    showTab('dashboard');
});
