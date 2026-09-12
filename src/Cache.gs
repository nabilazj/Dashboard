/**
 * Cache.gs — lapisan cache sementara (CacheService) supaya membuka halaman
 * ke-2, ke-3, dst jauh lebih cepat.
 *
 * MASALAH: setiap halaman dibuka = 1 Apps Script execution baru yang, tanpa
 * cache, HARUS baca ulang semua sheet (TAGIHAN ~3000 baris, INVOICE ~2000,
 * MUTASI ~2800, dst) lewat SpreadsheetApp — ini bagian paling lambat dari
 * seluruh request (biasanya 1–3 detik).
 *
 * SOLUSI: data MENTAH tiap sheet (bukan hasil olahan KPI — supaya
 * perhitungan tanggal/umur tetap dihitung fresh tiap request, lihat
 * DataLayer.gs) disimpan sementara di CacheService. Selama masih dalam
 * jendela waktu cache (CONFIG.CACHE_SECONDS, default 120 detik — sedikit
 * lebih lama dari interval polling 60 detik di frontend), pembacaan sheet
 * dilewati dan data diambil dari cache (jauh lebih cepat, cache dibaca
 * dalam hitungan puluhan-ratusan ms).
 *
 * CacheService membatasi 1 entry maksimal 100KB, sementara data TAGIHAN/
 * INVOICE/MUTASI mentah bisa >300KB — makanya di-<b>pecah jadi beberapa
 * potongan (chunk)</b> lalu digabung lagi saat dibaca.
 *
 * Kalau cache gagal ditulis/dibaca karena sebab apapun (kuota, dsb), kode
 * di sini SELALU jatuh kembali ke pembacaan Sheet langsung — cache murni
 * optimasi kecepatan, bukan sumber data yang bisa membuat aplikasi gagal
 * total kalau bermasalah.
 */

var CACHE_CHUNK_SIZE_ = 90000; // batas aman per potongan (limit asli 100KB/entry)
var CACHE_VERSION_ = 'v1';     // naikkan ini kalau format cache berubah, supaya cache lama otomatis diabaikan

function cacheKey_(parts) {
  return CACHE_VERSION_ + '|' + parts.join('|');
}

/** Simpan objek apapun (akan di-JSON.stringify) ke cache, dipecah jadi beberapa key kalau perlu. */
function cachePutJson_(key, value, ttlSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var str = JSON.stringify(value);
    var chunks = [];
    for (var i = 0; i < str.length; i += CACHE_CHUNK_SIZE_) chunks.push(str.slice(i, i + CACHE_CHUNK_SIZE_));

    var payload = {};
    payload[key + ':n'] = String(chunks.length);
    chunks.forEach(function (c, idx) { payload[key + ':' + idx] = c; });
    cache.putAll(payload, ttlSeconds);
  } catch (e) {
    // Diamkan — cache hanya optimasi, kegagalan di sini tidak boleh menggagalkan request.
  }
}

/** Ambil balik objek dari cache. Null kalau tidak ada / kadaluarsa / rusak sebagian. */
function cacheGetJson_(key) {
  try {
    var cache = CacheService.getScriptCache();
    var nStr = cache.get(key + ':n');
    if (!nStr) return null;
    var n = parseInt(nStr, 10);
    if (!n || n < 1) return null;

    var keys = [];
    for (var i = 0; i < n; i++) keys.push(key + ':' + i);
    var got = cache.getAll(keys);

    var parts = [];
    for (var j = 0; j < n; j++) {
      var part = got[key + ':' + j];
      if (part === undefined || part === null) return null; // ada potongan hilang -> anggap cache miss
      parts.push(part);
    }
    return JSON.parse(parts.join(''));
  } catch (e) {
    return null;
  }
}

/**
 * Baca 1 sheet lewat cache. `loaderFn` adalah fungsi yang benar-benar
 * membaca Sheet (dipanggil hanya saat cache miss atau forceRefresh true).
 */
function withSheetCache_(cacheKeyParts, forceRefresh, loaderFn) {
  var key = cacheKey_(cacheKeyParts);
  if (!forceRefresh) {
    var cached = cacheGetJson_(key);
    if (cached !== null) return cached;
  }
  var fresh = loaderFn();
  cachePutJson_(key, fresh, CONFIG.CACHE_SECONDS);
  return fresh;
}
