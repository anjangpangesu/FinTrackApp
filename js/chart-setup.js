let chartPemasukanInstance = null;
let chartPengeluaranInstance = null;

function initCharts() {
    const ctxPemasukan = document.getElementById('chartPemasukan').getContext('2d');
    const ctxPengeluaran = document.getElementById('chartPengeluaran').getContext('2d');

    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#64748b';

    chartPemasukanInstance = new Chart(ctxPemasukan, {
        type: 'line',
        data: {
            labels: [], // Will be filled dynamically
            datasets: [{
                label: 'Pemasukan',
                data: [],
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 2,
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
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + formatRibuan(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 }
                },
                y: {
                    grid: { borderDash: [5, 5] },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + 'M';
                            if (value >= 1000) return (value / 1000) + 'K';
                            return value;
                        }
                    }
                }
            }
        }
    });

    chartPengeluaranInstance = new Chart(ctxPengeluaran, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pengeluaran',
                data: [],
                borderColor: '#f43f5e', // rose-500
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f43f5e',
                pointBorderWidth: 2,
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
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return 'Rp ' + formatRibuan(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 }
                },
                y: {
                    grid: { borderDash: [5, 5] },
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000) + 'M';
                            if (value >= 1000) return (value / 1000) + 'K';
                            return value;
                        }
                    }
                }
            }
        }
    });
}

function updateCharts(keuanganData) {
    if (!chartPemasukanInstance || !chartPengeluaranInstance) return;

    // Filter current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group by date
    const pemasukanMap = {};
    const pengeluaranMap = {};

    // Initialize all days in current month to 0
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        pemasukanMap[i] = 0;
        pengeluaranMap[i] = 0;
    }

    keuanganData.forEach(item => {
        if (!item.tanggal) return;
        const d = new Date(item.tanggal);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const day = d.getDate();
            const nom = parseFloat(item.nominal) || 0;
            if (item.jenis === 'Pemasukan') {
                pemasukanMap[day] += nom;
            } else if (item.jenis === 'Pengeluaran') {
                pengeluaranMap[day] += nom;
            }
        }
    });

    const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const dataPemasukan = labels.map(day => pemasukanMap[day]);
    const dataPengeluaran = labels.map(day => pengeluaranMap[day]);

    chartPemasukanInstance.data.labels = labels;
    chartPemasukanInstance.data.datasets[0].data = dataPemasukan;
    chartPemasukanInstance.update();

    chartPengeluaranInstance.data.labels = labels;
    chartPengeluaranInstance.data.datasets[0].data = dataPengeluaran;
    chartPengeluaranInstance.update();
}