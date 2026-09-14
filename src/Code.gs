/**
 * Code.gs — entry point Web App (doGet) + fungsi yang dipanggil dari klien
 * lewat google.script.run.
 *
 * CATATAN PENTING soal URL:
 * Apps Script Web App hanya punya SATU url (.../exec). Tidak bisa membuat
 * path asli seperti "/tagihan" seperti versi aslinya (itu keterbatasan
 * platform, bukan pilihan desain) — sebagai gantinya dipakai query string:
 *   .../exec            -> Dashboard
 *   .../exec?page=tagihan
 *   .../exec?page=mutasi
 *   .../exec?page=invoice
 *   .../exec?page=penggajian
 */

var PAGES_ = {
  dashboard: 'Page_Dashboard',
  tagihan: 'Page_Tagihan',
  mutasi: 'Page_Mutasi',
  invoice: 'Page_Invoice',
  penggajian: 'Page_Penggajian',
};

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || 'dashboard';
  var templateName = PAGES_[page] || PAGES_.dashboard;
  var tpl = HtmlService.createTemplateFromFile(templateName);
  tpl.activePage = PAGES_[page] ? page : 'dashboard';
  tpl.scriptUrl = ScriptApp.getService().getUrl();
  return tpl.evaluate()
    .setTitle('Dashboard Piutang Client')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Dipakai oleh <?!= include('Nama', {data}) ?> di template HTML.
 * `data` (opsional) di-inject sebagai variabel template ke file yang di-include,
 * supaya mis. Sidebar.html tahu halaman mana yang sedang aktif.
 */
function include(filename, data) {
  var t = HtmlService.createTemplateFromFile(filename);
  if (data) {
    for (var k in data) if (data.hasOwnProperty(k)) t[k] = data[k];
  }
  return t.evaluate().getContent();
}

function scriptUrl_() {
  return ScriptApp.getService().getUrl();
}

/* ============================ API — dipanggil dari klien ============================ */
/* Semua nama fungsi di bawah ini dipanggil dari ClientScript.html via
 * google.script.run.withSuccessHandler(...).apiXxx(filters)                            */

function apiGetDashboard(filters) {
  var force = !!(filters && filters.forceRefresh);
  var all = loadAll_(force);
  return getDashboardData_(all);
}

function apiGetMutasi(filters) {
  filters = filters || {};
  var all = loadAll_(!!filters.forceRefresh);
  return getMutasiData_(all, filters);
}

function apiGetTagihan(filters) {
  filters = filters || {};
  var all = loadAll_(!!filters.forceRefresh);
  return getTagihanData_(all, filters);
}

function apiGetInvoice(filters) {
  filters = filters || {};
  var all = loadAll_(!!filters.forceRefresh);
  return getInvoiceData_(all, filters);
}

function apiGetPenggajian(filters) {
  filters = filters || {};
  var force = !!filters.forceRefresh;
  var all = loadAll_(force);
  var rekap = loadRekapPenggajian_(force);
  var payroll = loadPayrollSchedule_(force);
  return getPenggajianData_(all, rekap, payroll, filters);
}

/**
 * Diagnostik SEMENTARA: baca LANGSUNG dari Spreadsheet (lewati cache DAN
 * lewati semua logika parsing di DataLayer.gs), supaya kita bisa lihat
 * PERSIS apa yang benar-benar ada di sheet — termasuk TIPE data tiap sel
 * (Date asli vs teks), yang tidak kelihatan dari tampilan biasa.
 */
function apiDebugPayrollRaw() {
  function describeCell_(c) {
    if (c instanceof Date) return 'DATE(' + c.toISOString() + ')';
    if (typeof c === 'number') return 'NUMBER(' + c + ')';
    if (c === '' || c === null || c === undefined) return '<kosong>';
    return 'TEXT("' + String(c) + '")';
  }
  function previewSheet_(ss, name, maxRow, maxCol) {
    var sh = findSheetCI_(ss, name);
    if (!sh) return { found: false, realName: null, preview: [] };
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    var r = Math.min(lastRow, maxRow), c = Math.min(lastCol, maxCol);
    var preview = [];
    if (r >= 1 && c >= 1) {
      var vals = sh.getRange(1, 1, r, c).getValues();
      preview = vals.map(function (row) { return row.map(describeCell_).join('  |  '); });
    }
    return { found: true, realName: sh.getName(), lastRow: lastRow, lastCol: lastCol, preview: preview };
  }

  var ss = SpreadsheetApp.openById(CONFIG.PAYROLL_ID);
  var todayMonthName = CONFIG.MONTHS[todayJakarta_().getMonth()];
  return {
    tabDiperiksa: todayMonthName,
    tabBulanIni: previewSheet_(ss, todayMonthName, 12, 7),
    tabRekap: previewSheet_(ss, CONFIG.SHEET_REKAP, 5, 6),
  };
}

/* ================================ EXPORT CSV & PDF =================================== */
/* Lihat Export.gs untuk implementasi detail. */

function apiExportCsv(pageName, filters) {
  return buildCsvForPage_(pageName, filters || {});
}

function apiExportPdf(pageName, filters) {
  return buildPdfForPage_(pageName, filters || {});
}
