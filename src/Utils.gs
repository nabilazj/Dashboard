/**
 * Utils.gs — helper murni (tidak menyentuh Spreadsheet), dipakai lintas file.
 */

/** Ubah apapun (number, string format ID "1.234,56", kosong) jadi number aman. */
function toNumber_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  var s = String(v).trim();
  if (!s) return 0;
  // format Indonesia: "1.234.567,89" -> hapus titik ribuan, koma jadi desimal
  if (/,\d{1,2}$/.test(s) || /\.\d{3}(\.|,|$)/.test(s)) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  }
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/** Ubah cell tanggal (Date object dari Sheets, serial Excel, atau string) jadi Date (jam 00:00). */
function toDate_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return stripTime_(v);
  if (typeof v === 'number') {
    if (v === 0) return null;
    // serial Excel (basis 30 Des 1899)
    var ms = Math.round((v - 25569) * 86400 * 1000);
    return stripTime_(new Date(ms));
  }
  var s = String(v).trim();
  if (!s || s === '-' || s === '0') return null;
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return stripTime_(new Date(+m[3], +m[2] - 1, +m[1]));
  var d = new Date(s);
  if (!isNaN(d.getTime())) return stripTime_(d);
  return null;
}

function stripTime_(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function todayJakarta_() {
  var tz = 'Asia/Jakarta';
  var s = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var parts = s.split('-');
  return new Date(+parts[0], +parts[1] - 1, +parts[2]);
}

/** Selisih hari bulat (a - b), a & b harus Date jam 00:00. */
function daysBetween_(a, b) {
  if (!a || !b) return null;
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function formatRupiah_(n) {
  n = Math.round(Number(n) || 0);
  var neg = n < 0;
  n = Math.abs(n);
  var s = String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '-Rp ' : 'Rp ') + s;
}

function formatAngka_(n) {
  n = Math.round(Number(n) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatTanggal_(d) {
  if (!d) return '-';
  return Utilities.formatDate(d, 'Asia/Jakarta', 'dd MMM yyyy');
}

function monthIndexOf_(namaBulan) {
  if (!namaBulan) return -1;
  return CONFIG.MONTHS.indexOf(String(namaBulan).toUpperCase());
}

/**
 * Normalisasi nama client untuk keperluan pencocokan lintas sheet
 * (dipakai utk agregasi "client tagihan terlama").
 * Direplikasi persis dari logika frontend asli (lihat docs/SPEC.md §2.3).
 */
function normalizeClientName_(s) {
  return String(s || '')
    .toUpperCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(PERSERODA|RAPELAN|REWARD|GAJI|LBR|PAM|KB|OB|PC|THR)\b/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function safeUpper_(s) {
  return String(s || '').trim().toUpperCase();
}

/** Ambil nilai numerik dari objek row berdasarkan salah satu dari beberapa kemungkinan nama kolom. */
function pick_(row, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (row[keys[i]] !== undefined) return row[keys[i]];
  }
  return undefined;
}

function clamp_(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function sum_(arr, fn) {
  var t = 0;
  for (var i = 0; i < arr.length; i++) t += (fn ? fn(arr[i]) : arr[i]) || 0;
  return t;
}

function groupBy_(arr, keyFn) {
  var map = {};
  arr.forEach(function (item) {
    var k = keyFn(item);
    if (!map[k]) map[k] = [];
    map[k].push(item);
  });
  return map;
}

/** Escape nilai untuk baris CSV (RFC4180 minimal). */
function csvCell_(v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  if (/[",\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv_(headerArr, rowsArr) {
  var lines = [headerArr.map(csvCell_).join(',')];
  rowsArr.forEach(function (r) { lines.push(r.map(csvCell_).join(',')); });
  return lines.join('\r\n');
}
