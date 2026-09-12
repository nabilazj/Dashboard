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
  var all = loadAll_();
  return getDashboardData_(all);
}

function apiGetMutasi(filters) {
  var all = loadAll_();
  return getMutasiData_(all, filters || {});
}

function apiGetTagihan(filters) {
  var all = loadAll_();
  return getTagihanData_(all, filters || {});
}

function apiGetInvoice(filters) {
  var all = loadAll_();
  return getInvoiceData_(all, filters || {});
}

function apiGetPenggajian(filters) {
  var all = loadAll_();
  var rekap = loadRekapPenggajian_();
  var payroll = loadPayrollSchedule_();
  return getPenggajianData_(all, rekap, payroll, filters || {});
}

/* ================================ EXPORT CSV & PDF =================================== */
/* Lihat Export.gs untuk implementasi detail. */

function apiExportCsv(pageName, filters) {
  return buildCsvForPage_(pageName, filters || {});
}

function apiExportPdf(pageName, filters) {
  return buildPdfForPage_(pageName, filters || {});
}
