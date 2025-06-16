// Set default date to today
document.getElementById('tanggalPermintaan').valueAsDate = new Date();

// Form submission handler
document.getElementById('ambulanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const loading = document.getElementById('loading');
    const form = this;
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.style.display = 'none';
    loading.style.display = 'flex';
    
    const formData = new FormData(form);

    try {
        // DIUBAH: Menggunakan fetch untuk mengirim form dan menangkap response
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });

        // Cek jika response tidak OK (misal: error server)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Cek jika script Google mengembalikan status 'success'
        if (result.status === 'success' && result.pdfUrl) {
            // Tampilkan notifikasi sukses
            showNotification();
            
            // Simpan data ke riwayat (opsional, jika Anda ingin tetap ada)
            const requestData = {};
            formData.forEach((value, key) => {
                requestData[key] = value;
            });
            updateHistory(requestData);

            // BARU: Membuat pesan dan link WhatsApp
            const namaPemohon = formData.get('nama');
            const nomorSurat = result.nomorSurat; // Ambil nomor surat dari response
            const linkSuratPDF = result.pdfUrl;   // Ambil link PDF dari response

            // Template pesan WhatsApp
            let pesanWA = `*HALLO RAESN*\n\n`;
            pesanWA += `Assalamualaikum Wr. Wb.\n\n`;
            pesanWA += `RAESN telah menerima permintaan untuk layanan Ambulance Rumah Aspirasi.\n\n`;
            pesanWA += `Berikut adalah detail permintaan:\n\n`;
            pesanWA += `*Nama Pemohon:* ${namaPemohon}\n`;
            pesanWA += `*Tanggal Permintaan:* ${formData.get('tanggalPermintaan')}\n\n`;
            pesanWA += `Berikut adalah Surat Jalan Ambulance yang telah dibuat:\n\n`;
            pesanWA += `*Nomor Surat:* ${nomorSurat}\n`;
            pesanWA += `*Link PDF:* ${linkSuratPDF}\n\n`;
            pesanWA += `RAESN dapat melihat dan mengunduh PDF melalui tautan di atas.\n\n`;
            pesanWA += `Terima kasih.\n*Tim Ambulance Rumah Aspirasi*`;
            
            // Encode pesan untuk URL dan buka di tab baru
            const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(pesanWA)}`;
            window.open(waLink, '_blank');

            // Reset form setelah semua berhasil
            resetForm();

        } else {
            // Jika status dari script adalah 'error'
            throw new Error(result.message || 'Terjadi kesalahan pada server.');
        }

    } catch (error) {
        // Menangkap error fetch atau error dari script
        console.error('Submission Error:', error);
        alert('Gagal membuat surat jalan. Silakan coba lagi.\n\nDetail Error: ' + error.message);
    } finally {
        // Selalu reset tampilan tombol, baik sukses maupun gagal
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        loading.style.display = 'none';
    }
});


function showNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'block';
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function resetForm() {
    const form = document.getElementById('ambulanceForm');
    form.reset();
    document.getElementById('tanggalPermintaan').valueAsDate = new Date();
    document.getElementById('nama').focus();
}

// Riwayat permintaan (sedikit dimodifikasi untuk menerima data)
let requestHistory = [];
function updateHistory(requestData) {
    if (!requestData) return;
    
    requestData.timestamp = new Date().toISOString();
    requestHistory.unshift(requestData);
    
    const container = document.getElementById('historyContainer');
    
    if (requestHistory.length === 0) {
        container.innerHTML = '<div class="empty-history">Belum ada permintaan yang dikirim hari ini</div>';
        return;
    }
    
    const historyHTML = requestHistory.map((request) => {
        const date = new Date(request.timestamp);
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });
        
        return `
            <div class="history-item">
                <h4>${request.nama}</h4>
                <p><strong>Waktu Kirim:</strong> ${timeStr}</p>
                <p><strong>Tujuan:</strong> ${request.alamatTujuan}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = historyHTML;
}

// Phone number formatting
document.getElementById('telepon').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0 && !value.startsWith('0')) {
        value = '0' + value;
    }
    e.target.value = value;
});
