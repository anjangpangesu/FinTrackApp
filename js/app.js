let state = {
    keuangan: [],
    hutang: [],
    categories: {
        Pemasukan: ['Gaji', 'Keuntungan', 'Bonus', 'Lainnya'],
        Pengeluaran: ['Beli Makanan / Minuman', 'Pulsa / Paket Data', 'Belanja Online', 'Kebutuhan Peliharaan', 'Langganan Aplikasi', 'Games', 'Liburan / Jalan-jalan', 'Sedekah', 'Kerugian', 'Bensin', 'Transportasi Online', 'Top Up E-Money', 'Potong Rambut', 'Keperluan Lainnya']
    }
};

let selectedKeuanganIds = new Set();
let selectedHutangIds = new Set();

// ==== UTILITIES ====
function formatRibuan(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}

function showLoading(show) {
    const el = document.getElementById('loading-overlay');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    const tTitle = document.getElementById('toast-title');
    const tMsg = document.getElementById('toast-message');
    const tIcon = document.getElementById('toast-icon');

    tTitle.textContent = title;
    tMsg.textContent = message;

    if (isError) {
        toast.classList.remove('border-emerald-500');
        toast.classList.add('border-rose-500');
        tIcon.className = 'fa-solid fa-circle-xmark text-rose-500 text-xl mr-3';
    } else {
        toast.classList.remove('border-rose-500');
        toast.classList.add('border-emerald-500');
        tIcon.className = 'fa-solid fa-circle-check text-emerald-500 text-xl mr-3';
    }

    toast.classList.remove('translate-x-full', 'opacity-0');

    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
    }, 3000);
}

function showConfirm(message, onConfirm) {
    document.getElementById('modal-confirm-msg').textContent = message;
    document.getElementById('modal-confirm').classList.remove('hidden');
    document.body.classList.add('modal-open');

    const btn = document.getElementById('btn-confirm-action');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
    });
}

window.closeConfirmModal = () => {
    document.getElementById('modal-confirm').classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// ==== LOGIN & CLOCK LOGIC ====
function initClock() {
    const updateTime = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('id-ID');
        const text = `${dateStr} • ${timeStr}`;
        const el1 = document.getElementById('header-clock-keuangan');
        const el2 = document.getElementById('header-clock-hutang');
        if (el1) el1.textContent = text;
        if (el2) el2.textContent = text;
    };
    updateTime(); // call immediately once
    setInterval(updateTime, 1000);
}

window.handleLogout = () => {
    showConfirm("Yakin ingin logout?", () => {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    });
}

document.getElementById('form-login').addEventListener('submit', async(e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showLoading(true);
    try {
        const res = await api.login({ email, password });
        if (res.status === 'success') {
            localStorage.setItem('isLoggedIn', 'true');
            document.getElementById('login-screen').classList.add('hidden');
            loadData();
        } else {
            showToast('Login Gagal', res.message || 'Email atau password salah', true);
        }
    } catch (err) {
        showToast('Login Error', 'Gagal menghubungi server', true);
    }
    showLoading(false);
});

// ==== THEME TOGGLE ====
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon && text) {
        if (isDark) {
            icon.className = 'fa-solid fa-sun text-xl md:mr-3';
            text.textContent = 'Mode Terang';
        } else {
            icon.className = 'fa-solid fa-moon text-xl md:mr-3';
            text.textContent = 'Mode Gelap';
        }
    }
}

// ==== INIT & TAB NAVIGATION ====
document.addEventListener('DOMContentLoaded', () => {
    // Init theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('theme-icon');
        const text = document.getElementById('theme-text');
        if (icon && text) {
            icon.className = 'fa-solid fa-sun text-xl md:mr-3';
            text.textContent = 'Mode Terang';
        }
    } else {
        document.documentElement.classList.remove('dark');
    }

    initClock();
    initCharts();
    updateKategoriOptions();

    document.querySelectorAll('select').forEach(el => el.classList.add('btn-select'));

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fk-tanggal').value = today;
    document.getElementById('fh-tanggal').value = today;
    document.getElementById('mb-tanggal').value = today;

    // Login Check
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-screen').classList.add('hidden');
        loadData();
    }

    // Allow Enter key to trigger login
    document.getElementById('login-email').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('login-password').focus();
        }
    });
    
    document.getElementById('login-password').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.querySelector('#form-login button[type="submit"]').click();
        }
    });
});

function switchTab(tab) {
    const tKeuangan = document.getElementById('tab-keuangan');
    const tHutang = document.getElementById('tab-hutang');
    const nKeuangan = document.getElementById('nav-keuangan');
    const nHutang = document.getElementById('nav-hutang');

    if (tab === 'keuangan') {
        tKeuangan.classList.remove('hidden');
        tHutang.classList.add('hidden');

        nKeuangan.className = 'flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start py-2 md:py-3 md:px-4 rounded-xl transition-all font-bold text-white bg-primary shadow-lg shadow-primary/30 transform scale-105 border border-primary';
        nHutang.className = 'flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start py-2 md:py-3 md:px-4 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent';
    } else {
        tKeuangan.classList.add('hidden');
        tHutang.classList.remove('hidden');

        nHutang.className = 'flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start py-2 md:py-3 md:px-4 rounded-xl transition-all font-bold text-white bg-primary shadow-lg shadow-primary/30 transform scale-105 border border-primary';
        nKeuangan.className = 'flex-1 md:flex-none flex flex-col md:flex-row items-center justify-center md:justify-start py-2 md:py-3 md:px-4 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent';
    }
}

// ==== DATA FETCHING ====
async function loadData() {
    // Note: since GAS URL is not provided by default, we'll try to load, if error, we'll use dummy for preview.
    showLoading(true);
    try {
        const res = await api.getAll();
        if (res.status === 'success') {
            const fixDate = (arr) => arr.map(item => {
                if (item.tanggal && item.tanggal.includes('T')) {
                    const d = new Date(item.tanggal);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    item.tanggal = `${year}-${month}-${day}`;
                }
                return item;
            });
            state.keuangan = fixDate(res.keuangan || []).reverse();
            state.hutang = fixDate(res.hutang || []).reverse();
        } else {
            console.warn(res.message);
            // Fallback to empty if failed
        }
    } catch (e) {
        console.warn("Using local state because API failed (or URL not set)");
        showToast('Offline Mode', 'Tidak dapat terhubung ke Google Sheets.', true);
    }

    updateUI();
    showLoading(false);
}

function updateUI() {
    calculateBalances();
    renderHistoriKeuangan();
    renderHistoriHutang();
    updateCharts(state.keuangan);
}

// ==== CALCULATIONS ====
function calculateBalances() {
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    let saldoTunai = 0;
    let saldoNonTunai = 0;

    let pemasukanBulan = 0;
    let pengeluaranBulan = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Process Keuangan
    state.keuangan.forEach(k => {
        const nom = parseFloat(k.nominal) || 0;
        const d = new Date(k.tanggal);
        const isThisMonth = (d.getMonth() === currentMonth && d.getFullYear() === currentYear);

        if (k.jenis === 'Pemasukan') {
            totalPemasukan += nom;
            if (k.metode === 'Tunai') saldoTunai += nom;
            else saldoNonTunai += nom;
            if (isThisMonth) pemasukanBulan += nom;
        } else if (k.jenis === 'Pengeluaran') {
            totalPengeluaran += nom;
            if (k.metode === 'Tunai') saldoTunai -= nom;
            else saldoNonTunai -= nom;
            if (isThisMonth) pengeluaranBulan += nom;
        } else if (k.jenis === 'Transfer') {
            // Transfer does not affect total Pemasukan / Pengeluaran
            if (k.kategori === 'Tunai ke Non Tunai') {
                saldoTunai -= nom;
                saldoNonTunai += nom;
            } else if (k.kategori === 'Non Tunai ke Tunai') {
                saldoNonTunai -= nom;
                saldoTunai += nom;
            }
        }
    });

    // 2. Process Hutang (Mengurangi Saldo saat kita meminjamkan)
    let totalDiHutangin = 0;
    let totalOrang = 0;
    let totalBelumLunas = 0;

    // We group by name to count people accurately, but simple length is fine for now
    const uniqOrang = new Set();
    const uniqBelumLunas = new Set();

    state.hutang.forEach(h => {
        const sisa = parseFloat(h.sisaHutang) || 0;
        const awal = parseFloat(h.hutangAwal) || 0;
        const paidAmount = awal - sisa;

        // When we give debt, our balance decreases
        // We assume hutangAwal is the money we lent out.
        // Wait, did we lend money out or did we borrow?
        // "Total hutang yang dihutangin" usually means people owe us (Piutang).
        // Yes, "Total yang minjam", meaning people borrowing from us.
        // Therefore, we lent money -> our cash decreases.
        // When they pay (sisa decreases), the payment should increase our balance.
        // Cek apakah ada record pengeluaran terkait pemberian hutang ini di Keuangan
        // Agar tidak double deduction, kita hanya kurangi jika tidak ada record Pengeluaran.
        const hasKeuanganRecord = state.keuangan.some(k => 
            k.jenis === 'Pengeluaran' && 
            k.kategori === ('Pemberian Hutang: ' + h.nama) &&
            parseFloat(k.nominal) === awal
        );

        if (!hasKeuanganRecord) {
            if (h.metode === 'Tunai') saldoTunai -= awal;
            else saldoNonTunai -= awal;
        }

        totalDiHutangin += sisa; // Currently active debt
        uniqOrang.add(h.nama);
        if (sisa > 0) uniqBelumLunas.add(h.nama);
    });

    totalOrang = uniqOrang.size;
    totalBelumLunas = uniqBelumLunas.size;

    const saldoTerkini = saldoTunai + saldoNonTunai;

    // Update DOM
    document.getElementById('k-saldo-terkini').textContent = 'Rp ' + formatRibuan(saldoTerkini);
    document.getElementById('k-saldo-tunai').textContent = 'Rp ' + formatRibuan(saldoTunai);
    document.getElementById('k-saldo-nontunai').textContent = 'Rp ' + formatRibuan(saldoNonTunai);
    document.getElementById('k-masuk-bulan').textContent = 'Rp ' + formatRibuan(pemasukanBulan);
    document.getElementById('k-keluar-bulan').textContent = 'Rp ' + formatRibuan(pengeluaranBulan);

    document.getElementById('h-total-hutang').textContent = 'Rp ' + formatRibuan(totalDiHutangin);
    document.getElementById('h-total-orang').textContent = totalOrang + ' Orang';
    document.getElementById('h-belum-lunas').textContent = totalBelumLunas + ' Orang';

    // Dynamic month strings
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthYearStr = monthNames[currentMonth] + " " + currentYear;
    
    if (document.getElementById('label-masuk-bulan')) document.getElementById('label-masuk-bulan').textContent = "Pemasukan " + monthYearStr;
    if (document.getElementById('label-keluar-bulan')) document.getElementById('label-keluar-bulan').textContent = "Pengeluaran " + monthYearStr;
    if (document.getElementById('label-chart-masuk')) document.getElementById('label-chart-masuk').textContent = "Grafik Pemasukan (" + monthYearStr + ")";
    if (document.getElementById('label-chart-keluar')) document.getElementById('label-chart-keluar').textContent = "Grafik Pengeluaran (" + monthYearStr + ")";
}

// ==== KEUANGAN LOGIC ====
function updateKategoriOptions() {
    const jenis = document.querySelector('input[name="fk-jenis"]:checked').value;
    const select = document.getElementById('fk-kategori');
    select.innerHTML = '';

    const metodeContainer = document.getElementById('fk-metode-container');

    if (jenis === 'Transfer') {
        metodeContainer.classList.add('hidden');
        const opt1 = document.createElement('option');
        opt1.value = 'Tunai ke Non Tunai';
        opt1.textContent = 'Tunai ke Non Tunai (Setor Tunai)';
        select.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = 'Non Tunai ke Tunai';
        opt2.textContent = 'Non Tunai ke Tunai (Tarik Tunai)';
        select.appendChild(opt2);
    } else {
        metodeContainer.classList.remove('hidden');
        state.categories[jenis].forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            select.appendChild(opt);
        });
    }

    // Update filter dropdown as well
    const filterSelect = document.getElementById('filter-k-kategori');
    filterSelect.innerHTML = '<option value="semua">Semua Kategori</option>';
    const allCats = [...state.categories.Pemasukan, ...state.categories.Pengeluaran, 'Tunai ke Non Tunai', 'Non Tunai ke Tunai'];
    // get unique
    [...new Set(allCats)].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        filterSelect.appendChild(opt);
    });
}

document.getElementById('form-keuangan').addEventListener('submit', async(e) => {
    e.preventDefault();

    const id = document.getElementById('fk-id').value;
    const jenis = document.querySelector('input[name="fk-jenis"]:checked').value;
    const payload = {
        jenis: jenis,
        nominal: parseFloat(document.getElementById('fk-nominal').value),
        metode: jenis === 'Transfer' ? 'Mutasi' : document.getElementById('fk-metode').value,
        kategori: document.getElementById('fk-kategori').value,
        keterangan: document.getElementById('fk-keterangan').value,
        tanggal: document.getElementById('fk-tanggal').value,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    showLoading(true);
    try {
        if (id) {
            payload.id = id;
            // optimistic update
            const idx = state.keuangan.findIndex(k => k.id === id);
            if (idx > -1) state.keuangan[idx] = payload;

            await api.updateKeuangan(payload);
            showToast('Berhasil', 'Data berhasil diperbarui');
        } else {
            // optimistic update
            const tempId = 'temp-' + Date.now();
            payload.id = tempId;
            state.keuangan.unshift(payload);

            const res = await api.addKeuangan(payload);
            if (res.status === 'success' && res.id) {
                // update temp id
                const idx = state.keuangan.findIndex(k => k.id === tempId);
                if (idx > -1) state.keuangan[idx].id = res.id;
            }
            showToast('Berhasil', 'Data berhasil ditambahkan');
        }
        resetFormKeuangan();
        updateUI();
    } catch (error) {
        showToast('Error', 'Gagal menyimpan data', true);
    }
    showLoading(false);
});

function resetFormKeuangan() {
    document.getElementById('fk-id').value = '';
    document.getElementById('fk-nominal').value = '';
    document.getElementById('fk-keterangan').value = '';
    document.getElementById('fk-tanggal').value = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="fk-jenis"][value="Pemasukan"]').checked = true;
    updateKategoriOptions();

    document.getElementById('fk-submit-btn').innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Tambah Keuangan';
    document.getElementById('fk-cancel-btn').classList.add('hidden');
}

window.editKeuangan = (id) => {
    const item = state.keuangan.find(k => k.id === id);
    if (!item) return;

    document.getElementById('fk-id').value = item.id;
    document.querySelector(`input[name="fk-jenis"][value="${item.jenis}"]`).checked = true;
    updateKategoriOptions();

    document.getElementById('fk-nominal').value = item.nominal;
    if (item.jenis !== 'Transfer') {
        document.getElementById('fk-metode').value = item.metode;
    }
    document.getElementById('fk-kategori').value = item.kategori;
    document.getElementById('fk-keterangan').value = item.keterangan || '';
    document.getElementById('fk-tanggal').value = item.tanggal;

    document.getElementById('fk-submit-btn').innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Perubahan';
    document.getElementById('fk-cancel-btn').classList.remove('hidden');

    // Scroll to form
    document.getElementById('form-keuangan').scrollIntoView({ behavior: 'smooth' });
}

window.deleteKeuangan = async(id) => {
    showConfirm("Yakin ingin menghapus data ini?", async() => {
        showLoading(true);
        try {
            state.keuangan = state.keuangan.filter(k => k.id !== id);
            await api.deleteKeuangan(id);
            showToast('Berhasil', 'Data berhasil dihapus');
            updateUI();
        } catch (e) {
            showToast('Error', 'Gagal menghapus data', true);
        }
        showLoading(false);
    });
}

function renderHistoriKeuangan() {
    const list = document.getElementById('list-keuangan');
    list.innerHTML = '';

    const filterWaktu = document.getElementById('filter-k-waktu').value;
    const filterJenis = document.getElementById('filter-k-jenis').value;
    const filterKategori = document.getElementById('filter-k-kategori').value;
    const search = document.getElementById('search-keuangan').value.toLowerCase();

    let filtered = [...state.keuangan];

    // Search
    if (search) {
        filtered = filtered.filter(k =>
            (k.kategori || '').toLowerCase().includes(search) ||
            (k.jenis || '').toLowerCase().includes(search)
        );
    }

    // Filter Jenis
    if (filterJenis !== 'semua') {
        filtered = filtered.filter(k => k.jenis === filterJenis);
    }

    // Filter Kategori
    if (filterKategori !== 'semua') {
        filtered = filtered.filter(k => k.kategori === filterKategori);
    }

    // Sort Waktu
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Terbaru by default
    if (filterWaktu === 'terlama') {
        filtered.reverse();
    }

    if (filtered.length === 0) {
        list.innerHTML = `<div class="text-center text-slate-400 py-10">Tidak ada data ditemukan.</div>`;
        return;
    }

    filtered.forEach(k => {
        const isMasuk = k.jenis === 'Pemasukan';
        const isTransfer = k.jenis === 'Transfer';
        
        let colorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400';
        let icon = 'fa-right-left';
        let sign = '';
        let shadowColor = 'blue';
        let borderColor = 'border-l-blue-500';
        let textNominalColor = 'text-blue-600 dark:text-blue-400';

        if (!isTransfer) {
            colorClass = isMasuk ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' : 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400';
            icon = isMasuk ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            sign = isMasuk ? '+' : '-';
            shadowColor = isMasuk ? 'emerald' : 'rose';
            borderColor = isMasuk ? 'border-l-emerald-500' : 'border-l-rose-500';
            textNominalColor = isMasuk ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
        }

        const displayTanggal = k.tanggal ? k.tanggal.split('T')[0] : '';

        const html = `
            <div class="flex items-center w-full">
                <div class="w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-${shadowColor}-500/50 border-l-4 ${borderColor} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm hover:shadow-lg hover:shadow-${shadowColor}-500/30 hover:-translate-y-1 transition-all duration-300 relative">
                    <div class="flex items-center gap-3 md:gap-4">
                        <input type="checkbox" value="${k.id}" class="w-4 h-4 rounded border-slate-300 text-${shadowColor}-500 focus:ring-${shadowColor}-500 cursor-pointer shrink-0" onchange="toggleSelectKeuangan('${k.id}')" ${selectedKeuanganIds.has(k.id) ? 'checked' : ''}>
                        <div class="px-3 h-10 rounded-full flex items-center justify-center gap-2 ${colorClass}">
                            <i class="fa-solid ${icon}"></i>
                            <span class="text-xs font-bold uppercase tracking-wider">${k.jenis}</span>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-800 dark:text-white">${k.kategori}</h5>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${displayTanggal} ${k.waktu ? '• ' + k.waktu : ''} • ${k.metode}</p>
                            ${k.keterangan ? `<p class="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">"${k.keterangan}"</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center justify-between md:flex-col md:items-end gap-2 mt-2 md:mt-0">
                        <div class="font-bold ${textNominalColor}">
                            ${sign}Rp ${formatRibuan(k.nominal)}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editKeuangan('${k.id}')" class="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteKeuangan('${k.id}')" class="text-xs bg-rose-50 hover:bg-rose-100 text-rose-500 px-2 py-1 rounded transition-colors dark:bg-rose-900/30 dark:hover:bg-rose-900/50"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });
}

window.toggleSelectKeuangan = (id) => {
    if (selectedKeuanganIds.has(id)) selectedKeuanganIds.delete(id);
    else selectedKeuanganIds.add(id);
    updateKeuanganSelectionUI();
};

window.toggleSelectAllKeuangan = () => {
    const isChecked = document.getElementById('selectAllKeuangan').checked;
    const checkboxes = document.getElementById('list-keuangan').querySelectorAll('input[type="checkbox"]');
    selectedKeuanganIds.clear();
    if (isChecked) {
        checkboxes.forEach(cb => { cb.checked = true; selectedKeuanganIds.add(cb.value); });
    } else {
        checkboxes.forEach(cb => cb.checked = false);
    }
    updateKeuanganSelectionUI();
};

function updateKeuanganSelectionUI() {
    const btn = document.getElementById('btnDeleteSelectedKeuangan');
    const count = document.getElementById('countSelectedKeuangan');
    const checkboxes = document.getElementById('list-keuangan').querySelectorAll('input[type="checkbox"]');
    const listCount = checkboxes.length;
    const selectAllCb = document.getElementById('selectAllKeuangan');
    
    if (selectedKeuanganIds.size > 0) {
        btn.classList.remove('hidden');
        count.innerText = selectedKeuanganIds.size;
    } else {
        btn.classList.add('hidden');
    }

    if (listCount > 0 && selectedKeuanganIds.size === listCount) {
        selectAllCb.checked = true;
    } else {
        selectAllCb.checked = false;
    }
}

window.deleteSelectedKeuangan = () => {
    if (selectedKeuanganIds.size === 0) return;
    showConfirm(`Yakin ingin menghapus ${selectedKeuanganIds.size} data keuangan terpilih?`, async() => {
        showLoading(true);
        try {
            const ids = Array.from(selectedKeuanganIds);
            state.keuangan = state.keuangan.filter(k => !selectedKeuanganIds.has(k.id));
            selectedKeuanganIds.clear();
            updateKeuanganSelectionUI();
            updateUI();
            await api.deleteMultipleKeuangan(ids);
            showToast('Berhasil', `${ids.length} data berhasil dihapus`);
        } catch (error) {
            showToast('Error', 'Gagal menghapus data massal', true);
            await loadData();
        }
        showLoading(false);
    });
};

// ==== HUTANG LOGIC ====
document.getElementById('form-hutang').addEventListener('submit', async(e) => {
    e.preventDefault();

    const id = document.getElementById('fh-id').value;
    const payload = {
        nama: document.getElementById('fh-nama').value,
        nominal: parseFloat(document.getElementById('fh-nominal').value),
        hutangAwal: parseFloat(document.getElementById('fh-nominal').value), // Initial is same
        keterangan: document.getElementById('fh-keterangan').value,
        metode: document.getElementById('fh-metode').value,
        tanggal: document.getElementById('fh-tanggal').value,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    showLoading(true);
    try {
        if (id) {
            payload.id = id;
            // optimistic
            const idx = state.hutang.findIndex(h => h.id === id);
            if (idx > -1) {
                // If editing initial hutang, sisa might change. We calculate roughly here for optimistic UI
                const oldAwal = parseFloat(state.hutang[idx].hutangAwal);
                const oldSisa = parseFloat(state.hutang[idx].sisaHutang);
                const paid = oldAwal - oldSisa;

                payload.sisaHutang = payload.hutangAwal - paid;
                if (payload.sisaHutang < 0) payload.sisaHutang = 0;
                payload.status = payload.sisaHutang === 0 ? "Lunas" : "Belum Lunas";

                state.hutang[idx] = {...state.hutang[idx], ...payload };
            }
            await api.updateHutang(payload);
            showToast('Berhasil', 'Data berhasil diperbarui');
        } else {
            const tempId = 'temp-' + Date.now();
            payload.id = tempId;
            payload.sisaHutang = payload.hutangAwal;
            payload.status = "Belum Lunas";
            state.hutang.unshift(payload);
            
            // Optimistic update Keuangan as well
            state.keuangan.unshift({
                id: 'temp-k-' + Date.now(),
                jenis: 'Pengeluaran',
                nominal: payload.hutangAwal,
                metode: payload.metode,
                kategori: 'Pemberian Hutang: ' + payload.nama,
                keterangan: payload.keterangan || 'Pemberian hutang otomatis',
                tanggal: payload.tanggal,
                waktu: payload.waktu
            });

            const res = await api.addHutang(payload);
            if (res.status === 'success' && res.id) {
                const idx = state.hutang.findIndex(h => h.id === tempId);
                if (idx > -1) state.hutang[idx].id = res.id;
            }
            showToast('Berhasil', 'Data berhasil ditambahkan');
        }
        resetFormHutang();
        updateUI();
    } catch (error) {
        showToast('Error', 'Gagal menyimpan data', true);
    }
    showLoading(false);
});

function resetFormHutang() {
    document.getElementById('fh-id').value = '';
    document.getElementById('fh-nama').value = '';
    document.getElementById('fh-nominal').value = '';
    document.getElementById('fh-keterangan').value = '';
    document.getElementById('fh-tanggal').value = new Date().toISOString().split('T')[0];

    document.getElementById('fh-submit-btn').innerHTML = '<i class="fa-solid fa-plus mr-1"></i> Tambah Hutang';
    document.getElementById('fh-cancel-btn').classList.add('hidden');
}

window.editHutang = (id) => {
    const item = state.hutang.find(h => h.id === id);
    if (!item) return;

    document.getElementById('fh-id').value = item.id;
    document.getElementById('fh-nama').value = item.nama;
    document.getElementById('fh-nominal').value = item.hutangAwal;
    document.getElementById('fh-keterangan').value = item.keterangan;
    document.getElementById('fh-metode').value = item.metode;
    document.getElementById('fh-tanggal').value = item.tanggal;

    document.getElementById('fh-submit-btn').innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Perubahan';
    document.getElementById('fh-cancel-btn').classList.remove('hidden');

    document.getElementById('form-hutang').scrollIntoView({ behavior: 'smooth' });
}

window.deleteHutang = async(id) => {
    showConfirm("Yakin ingin menghapus data ini?", async() => {
        showLoading(true);
        try {
            const hutangToDelete = state.hutang.find(h => h.id === id);
            if (hutangToDelete) {
                state.hutang = state.hutang.filter(h => h.id !== id);
            }

            await api.deleteHutang(id);
            showToast('Berhasil', 'Data berhasil dihapus');
            updateUI();
        } catch (e) {
            showToast('Error', 'Gagal menghapus data', true);
        }
        showLoading(false);
    });
}

// === BAYAR HUTANG ===
window.openModalBayar = (id) => {
    const item = state.hutang.find(h => h.id === id);
    if (!item) return;

    document.getElementById('mb-id').value = item.id;
    document.getElementById('mb-sisa').value = item.sisaHutang;
    document.getElementById('mb-nominal').value = item.sisaHutang; // Default isi full
    document.getElementById('modal-bayar-info').textContent = `Atas nama: ${item.nama} (Sisa: Rp ${formatRibuan(item.sisaHutang)})`;

    document.getElementById('modal-bayar').classList.remove('hidden');
    document.body.classList.add('modal-open');
}

window.closeModalBayar = () => {
    document.getElementById('modal-bayar').classList.add('hidden');
    document.body.classList.remove('modal-open');
}

window.submitBayarHutang = async(e) => {
    e.preventDefault();

    const id = document.getElementById('mb-id').value;
    const payAmount = parseFloat(document.getElementById('mb-nominal').value);
    const sisa = parseFloat(document.getElementById('mb-sisa').value);

    if (payAmount > sisa) {
        showToast('Peringatan', "Nominal pembayaran melebihi sisa hutang!", true);
        return;
    }

    const payload = {
        id: id,
        payAmount: payAmount,
        metode: document.getElementById('mb-metode').value,
        tanggal: document.getElementById('mb-tanggal').value,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    showLoading(true);
    closeModalBayar();

    try {
        // optimistic
        const idx = state.hutang.findIndex(h => h.id === id);
        if (idx > -1) {
            let newSisa = state.hutang[idx].sisaHutang - payAmount;
            state.hutang[idx].sisaHutang = newSisa;
            if (newSisa <= 0) state.hutang[idx].status = "Lunas";

            // Also optimistic add to keuangan
            state.keuangan.unshift({
                id: 'temp-k-' + Date.now(),
                jenis: 'Pemasukan',
                nominal: payAmount,
                metode: payload.metode,
                kategori: 'Pembayaran Hutang: ' + state.hutang[idx].nama,
                keterangan: 'Pembayaran hutang otomatis',
                tanggal: payload.tanggal,
                waktu: payload.waktu
            });
        }

        await api.payHutang(payload);
        // Refresh data fully from server to ensure sync, or just rely on optimistic
        // It's safer to re-fetch if possible, but let's just update UI
        updateUI();
        showToast('Berhasil', 'Pembayaran berhasil dicatat');
    } catch (err) {
        showToast('Error', 'Gagal memproses pembayaran', true);
    }
    showLoading(false);
}

function renderHistoriHutang() {
    const list = document.getElementById('list-hutang');
    list.innerHTML = '';

    const filterWaktu = document.getElementById('filter-h-waktu').value;
    const filterJenis = document.getElementById('filter-h-jenis').value;
    const search = document.getElementById('search-hutang').value.toLowerCase();

    let filtered = [...state.hutang];

    // Search
    if (search) {
        filtered = filtered.filter(h =>
            (h.nama || '').toLowerCase().includes(search) ||
            (h.keterangan || '').toLowerCase().includes(search)
        );
    }

    // Filter Jenis (Status)
    if (filterJenis !== 'semua') {
        filtered = filtered.filter(h => h.status === filterJenis);
    }

    // Sort Waktu
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    if (filterWaktu === 'terlama') {
        filtered.reverse();
    }

    if (filtered.length === 0) {
        list.innerHTML = `<div class="text-center text-slate-400 py-10">Tidak ada data ditemukan.</div>`;
        return;
    }

    filtered.forEach(h => {
        const isLunas = h.status === 'Lunas';
        const shadowColor = isLunas ? 'emerald' : 'blue';
        const borderColor = isLunas ? 'border-l-emerald-500' : 'border-l-blue-500';
        const displayTanggal = h.tanggal ? h.tanggal.split('T')[0] : '';

        const html = `
            <div class="flex items-center w-full">
                <div class="w-full bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-${shadowColor}-500/50 border-l-4 ${borderColor} flex flex-col md:flex-row justify-between gap-3 shadow-sm hover:shadow-lg hover:shadow-${shadowColor}-500/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    ${isLunas ? '<div class="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-bl-lg font-bold">LUNAS</div>' : ''}
                    
                    <div class="flex items-center gap-3 md:gap-4">
                        <input type="checkbox" value="${h.id}" class="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 cursor-pointer shrink-0" onchange="toggleSelectHutang('${h.id}')" ${selectedHutangIds.has(h.id) ? 'checked' : ''}>
                        <div class="w-12 h-12 rounded-full flex items-center justify-center ${isLunas ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30' : 'bg-blue-100 text-blue-500 dark:bg-blue-900/30'}">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-800 dark:text-white text-lg">${h.nama}</h5>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${displayTanggal} • ${h.keterangan}</p>
                            <div class="mt-1 text-sm">
                                <span class="text-slate-500 dark:text-slate-400">Hutang Awal: </span>
                                <span class="font-semibold text-slate-700 dark:text-slate-300">Rp ${formatRibuan(h.hutangAwal)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-start md:items-end justify-center gap-3">
                        <div class="text-left md:text-right w-full bg-white/50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                            <span class="text-xs text-slate-500 dark:text-slate-400 block">Sisa Hutang:</span>
                            <span class="font-bold text-lg ${isLunas ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-500 dark:text-blue-400'}">
                                Rp ${formatRibuan(h.sisaHutang)}
                            </span>
                        </div>
                        
                        <div class="flex gap-2 w-full md:w-auto">
                            ${!isLunas ? `<button onclick="openModalBayar('${h.id}')" class="flex-1 md:flex-none text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"><i class="fa-solid fa-money-bill-wave mr-1"></i> Bayar</button>` : ''}
                            <button onclick="editHutang('${h.id}')" class="flex-1 md:flex-none text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors font-medium dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"><i class="fa-solid fa-pen"></i></button>
                            <button onclick="deleteHutang('${h.id}')" class="flex-1 md:flex-none text-xs bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-1.5 rounded-lg transition-colors font-medium dark:bg-rose-900/30 dark:hover:bg-rose-900/50"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    });
}

// ==== DOWNLOAD PDF ====
function checkDateRange(startStr, endStr) {
    if(!startStr || !endStr) return { valid: false, msg: "Pilih tanggal mulai dan selesai" };
    const start = new Date(startStr);
    const end = new Date(endStr);
    if(end < start) return { valid: false, msg: "Tanggal selesai harus setelah tanggal mulai" };
    
    // Max 1 month (31 days)
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if(diffDays > 31) return { valid: false, msg: "Rentang waktu maksimal 1 bulan" };
    
    return { valid: true, start, end };
}

function generatePDF(options) {
    const { title, startStr, endStr, head, body, summary, charts } = options;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });
    
    let currentY = 40; // Start below the top banner

    // B. Bagian Waktu/Tanggal
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`Rentang Waktu: ${startStr} s/d ${endStr}`, 14, currentY);
    doc.text(`Dicetak pada: ${dateStr}, ${timeStr}`, pageWidth - 14, currentY, { align: 'right' });
    currentY += 10;
    
    // C. Bagian Tabel - Summary Info
    if (summary) {
        doc.setFont("helvetica", "bold");
        doc.text(`Saldo Saat Ini: ${summary.saldo}`, 14, currentY);
        doc.text(`Pengeluaran: ${summary.pengeluaran}`, pageWidth / 2, currentY, { align: 'center' });
        doc.text(`Pemasukan: ${summary.pemasukan}`, pageWidth - 14, currentY, { align: 'right' });
        currentY += 6;
    }
    
    doc.autoTable({
        startY: currentY,
        head: [head],
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], halign: 'center' },
        styles: { fontSize: 8, halign: 'left' },
        columnStyles: { 0: { cellWidth: 25 } },
        didDrawPage: function (data) {
            currentY = data.cursor.y;
        }
    });
    
    currentY += 15;

    // D. Bagian Kesimpulan Grafik (Dihapus)
    // if (charts && charts.length > 0) {
    //     ...
    // }
    
    // Draw borders and footers on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // 1. Thick Top Banner (Header)
        doc.setFillColor(37, 99, 235); // Blue-600
        doc.rect(0, 0, pageWidth, 30, 'F');
        
        // Text inside Top Banner
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("FinTrack App", 14, 19);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`${title}   |   Halaman ${i} dari ${pageCount}`, pageWidth - 14, 19, { align: 'right' });
        
        // 2. Thick Left and Right Borders
        doc.rect(0, 30, 6, pageHeight - 45, 'F');
        doc.rect(pageWidth - 6, 30, 6, pageHeight - 45, 'F');
        
        // 3. Thick Bottom Banner (Footer)
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
        
        // Text inside Bottom Banner
        doc.setFontSize(9);
        doc.text("Aplikasi Pengelola Keuangan dan Hutang - Catat arus kas dengan praktis", pageWidth / 2, pageHeight - 6, { align: 'center' });
    }
    
    doc.save(`${title.replace(/ /g, '_')}_${startStr}_sd_${endStr}.pdf`);
}

window.downloadKeuangan = () => {
    const startStr = document.getElementById('dl-k-start').value;
    const endStr = document.getElementById('dl-k-end').value;
    const check = checkDateRange(startStr, endStr);
    
    if(!check.valid) {
        showToast('Peringatan', check.msg, true);
        return;
    }

    const filtered = state.keuangan.filter(k => {
        const d = new Date(k.tanggal);
        return d >= check.start && d <= check.end;
    });

    if(filtered.length === 0) {
        showToast('Peringatan', "Tidak ada data pada rentang tanggal tersebut.", true);
        return;
    }

    let tMasuk = 0, tKeluar = 0;
    filtered.forEach(k => {
        if(k.jenis === 'Pemasukan') tMasuk += parseFloat(k.nominal);
        else tKeluar += parseFloat(k.nominal);
    });

    const summary = {
        saldo: 'Rp ' + formatRibuan(tMasuk - tKeluar),
        pemasukan: 'Rp ' + formatRibuan(tMasuk),
        pengeluaran: 'Rp ' + formatRibuan(tKeluar)
    };

    const head = ["ID", "Tanggal", "Waktu", "Jenis", "Kategori", "Metode", "Nominal"];
    const body = filtered.map(k => [
        k.id, k.tanggal, k.waktu, k.jenis, k.kategori, k.metode, 'Rp ' + formatRibuan(k.nominal)
    ]);

    let charts = [];
    const cp = document.getElementById('chartPemasukan');
    const ck = document.getElementById('chartPengeluaran');
    if(cp) charts.push(cp.toDataURL('image/png', 1.0));
    else charts.push(null);
    if(ck) charts.push(ck.toDataURL('image/png', 1.0));
    else charts.push(null);

    generatePDF({
        title: "Laporan Keuangan Bulanan",
        startStr, endStr, head, body, summary, charts
    });
}

window.downloadHutang = () => {
    const startStr = document.getElementById('dl-h-start').value;
    const endStr = document.getElementById('dl-h-end').value;
    const check = checkDateRange(startStr, endStr);
    
    if(!check.valid) {
        showToast('Peringatan', check.msg, true);
        return;
    }

    const filtered = state.hutang.filter(h => {
        const d = new Date(h.tanggal);
        return d >= check.start && d <= check.end;
    });

    if(filtered.length === 0) {
        showToast('Peringatan', "Tidak ada data pada rentang tanggal tersebut.", true);
        return;
    }

    const head = ["ID", "Tanggal", "Nama", "Keterangan", "Metode", "Hutang Awal", "Sisa", "Status"];
    const body = filtered.map(h => [
        h.id, h.tanggal, h.nama, h.keterangan, h.metode, 'Rp ' + formatRibuan(h.hutangAwal), 'Rp ' + formatRibuan(h.sisaHutang), h.status
    ]);

    generatePDF({
        title: "Laporan Riwayat Hutang",
        startStr, endStr, head, body
    });
}

window.toggleSelectHutang = (id) => {
    if (selectedHutangIds.has(id)) selectedHutangIds.delete(id);
    else selectedHutangIds.add(id);
    updateHutangSelectionUI();
};

window.toggleSelectAllHutang = () => {
    const isChecked = document.getElementById('selectAllHutang').checked;
    const checkboxes = document.getElementById('list-hutang').querySelectorAll('input[type="checkbox"]');
    selectedHutangIds.clear();
    if (isChecked) {
        checkboxes.forEach(cb => { cb.checked = true; selectedHutangIds.add(cb.value); });
    } else {
        checkboxes.forEach(cb => cb.checked = false);
    }
    updateHutangSelectionUI();
};

function updateHutangSelectionUI() {
    const btn = document.getElementById('btnDeleteSelectedHutang');
    const count = document.getElementById('countSelectedHutang');
    const checkboxes = document.getElementById('list-hutang').querySelectorAll('input[type="checkbox"]');
    const listCount = checkboxes.length;
    const selectAllCb = document.getElementById('selectAllHutang');
    
    if (selectedHutangIds.size > 0) {
        btn.classList.remove('hidden');
        count.innerText = selectedHutangIds.size;
    } else {
        btn.classList.add('hidden');
    }

    if (listCount > 0 && selectedHutangIds.size === listCount) {
        selectAllCb.checked = true;
    } else {
        selectAllCb.checked = false;
    }
}

window.deleteSelectedHutang = () => {
    if (selectedHutangIds.size === 0) return;
    showConfirm(`Yakin ingin menghapus ${selectedHutangIds.size} data hutang terpilih?`, async() => {
        showLoading(true);
        try {
            const ids = Array.from(selectedHutangIds);
            state.hutang = state.hutang.filter(h => !selectedHutangIds.has(h.id));
            selectedHutangIds.clear();
            updateHutangSelectionUI();
            updateUI();
            await api.deleteMultipleHutang(ids);
            showToast('Berhasil', `${ids.length} data berhasil dihapus`);
        } catch (error) {
            showToast('Error', 'Gagal menghapus data massal', true);
            await loadData();
        }
        showLoading(false);
    });
};