/**
 * Warmup.gs — "pemanasan" cache otomatis di latar belakang, supaya
 * pengguna (nyaris) TIDAK PERNAH mengalami loading lambat gara-gara cache
 * kosong (lihat Cache.gs untuk mekanisme cache-nya).
 *
 * MASALAH: tanpa ini, cache HANYA terisi begitu ada orang benar-benar
 * membuka dashboard — jadi orang PERTAMA yang buka setelah cache kosong
 * (pertama kali hari itu, atau setelah idle > CONFIG.CACHE_SECONDS) selalu
 * kena versi paling lambat: baca semua sheet langsung dari Spreadsheet.
 * Untuk halaman Penggajian ini paling terasa karena sheetnya paling
 * banyak (REKAP + tiap tab bulan yang ada, bisa sampai 10 tab).
 *
 * SOLUSI: fungsi warmupCache_() di bawah memanggil ulang semua fungsi
 * pemuat data dengan forceRefresh=true (jadi SELALU baca ulang dari
 * Spreadsheet & menulis hasilnya ke cache) — dijalankan otomatis tiap
 * CONFIG.CACHE_WARMUP_MINUTES menit oleh trigger terjadwal, TANPA perlu
 * ada orang yang membuka dashboard sama sekali. Efeknya: begitu ada orang
 * benar-benar buka dashboard, cache HAMPIR SELALU sudah terisi & masih
 * segar (lihat penjelasan CACHE_SECONDS vs CACHE_WARMUP_MINUTES di
 * Config.gs) → loading jadi cepat (hitungan cache-hit, bukan cache-miss)
 * bahkan untuk pembukaan PERTAMA hari itu.
 *
 * CARA MENGAKTIFKAN (WAJIB dilakukan manual 1x oleh pemilik project,
 * lihat README bagian "Mempercepat Loading Pertama Kali"):
 *   1. Buka project ini di editor Apps Script (script.google.com).
 *   2. Di dropdown fungsi (atas, sebelah tombol Jalankan/▶), pilih
 *      "installWarmupTrigger".
 *   3. Klik ▶ Jalankan. Google akan minta izin akses (Authorize) —
 *      setujui, ini hanya perlu dilakukan sekali.
 *   4. Selesai — trigger akan otomatis berjalan tiap
 *      CONFIG.CACHE_WARMUP_MINUTES menit, TERUS-MENERUS di latar
 *      belakang, walau tidak ada yang membuka editor sama sekali.
 * Untuk MEMATIKAN lagi (mis. kalau kuota jadi masalah), jalankan fungsi
 * "removeWarmupTrigger" dengan cara yang sama.
 */

/** Dipanggil OTOMATIS oleh trigger terjadwal — bukan untuk dipanggil manual dari web app. */
function warmupCache_() {
  try {
    loadAll_(true);
    loadRekapPenggajian_(true);
    loadPayrollSchedule_(true);
  } catch (e) {
    // Diamkan — kalau 1x pemanasan gagal (mis. Spreadsheet API lagi
    // bermasalah sesaat), biarkan saja, percobaan berikutnya jalan seperti
    // biasa CONFIG.CACHE_WARMUP_MINUTES menit lagi. Jangan sampai trigger
    // yang gagal 1x malah menghentikan jadwal berikutnya.
    console.error('warmupCache_ gagal: ' + e.message);
  }
}

/**
 * Jalankan fungsi ini SEKALI SAJA secara manual dari editor Apps Script
 * (lihat instruksi di komentar atas file ini) untuk mengaktifkan
 * pemanasan cache otomatis. Aman dijalankan berkali-kali — trigger lama
 * bernama sama selalu dibuang dulu supaya tidak dobel.
 */
function installWarmupTrigger() {
  removeWarmupTrigger();
  ScriptApp.newTrigger('warmupCache_')
    .timeBased()
    .everyMinutes(CONFIG.CACHE_WARMUP_MINUTES)
    .create();
  // Langsung panggil 1x juga sekarang, supaya cache sudah hangat sejak
  // detik ini juga — tidak perlu menunggu jadwal pertama.
  warmupCache_();
  return 'OK — trigger pemanasan cache aktif, jalan tiap ' + CONFIG.CACHE_WARMUP_MINUTES + ' menit.';
}

/** Matikan trigger pemanasan cache (kalau suatu saat perlu dihentikan). */
function removeWarmupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'warmupCache_') {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  return 'Trigger dihapus: ' + removed;
}
