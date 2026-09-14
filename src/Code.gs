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
 *   .../exec?page=laporan-harian
 */

var PAGES_ = {
  dashboard: 'Page_Dashboard',
  tagihan: 'Page_Tagihan',
  mutasi: 'Page_Mutasi',
  invoice: 'Page_Invoice',
  penggajian: 'Page_Penggajian',
  'laporan-harian': 'Page_LaporanHarian',
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

function apiGetLaporanHarian(filters) {
  filters = filters || {};
  var rows = loadLaporanHarian_(!!filters.forceRefresh);
  return getLaporanHarianData_(rows, filters);
}

/* ================================ EXPORT CSV & PDF =================================== */
/* Lihat Export.gs untuk implementasi detail. */

function apiExportCsv(pageName, filters) {
  return buildCsvForPage_(pageName, filters || {});
}

function apiExportPdf(pageName, filters) {
  return buildPdfForPage_(pageName, filters || {});
}
