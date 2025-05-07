import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import * as CityCareAPI from '../../data/api';
import MapHelper from '../../utils/map-helper';// Import MapHelper - Komentar ganda dihapus

export default class HomePage {
  #presenter = null;
  #mapHelper = null; // Properti untuk instance MapHelper

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div> 
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Laporan Kerusakan</h1>
        <div class="reports-list__container">
          <div id="reports-list"></div> {/* ID 'reports-list' penting */}
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Jika class ini extend dari class lain, panggil afterRender parent jika perlu
    // await super.afterRender();

    // Pastikan elemen DOM sudah ada sebelum menginisialisasi peta dan presenter
    // Karena render() adalah async, elemen 'map' dan 'reports-list' seharusnya sudah ada di sini

    this.#presenter = new HomePresenter({
      view: this, // View (instance HomePage) diberikan ke Presenter
      model: CityCareAPI, // Model diberikan ke Presenter
    });

    // <<< Perbaikan Utama: Inisialisasi MapHelper dan Peta oleh View >>>
    // View membuat instance MapHelper dan memerintahkannya untuk menginisialisasi peta
    this.#mapHelper = new MapHelper();
    this.#mapHelper.initMap('map', { /* Opsional: tambahkan opsi peta Leaflet di sini */ });

    // Memulai proses ambil data dan tampilkan (Presenter yang melakukan)
    // Presenter akan ambil data, lalu memanggil metode di View untuk tampilkan di daftar DAN peta
    await this.#presenter.initialGalleryAndMap();

    // Anda bisa menambahkan logic lain setelah semua proses render/afterRender selesai
    // Misalnya, menambahkan event listener ke elemen di halaman yang TIDAK terkait langsung marker peta
  }

  /*
  // <<< Metode async initialMap() lama Dihapus atau Dikomentari >>>
  // Logic inisialisasi peta sudah ditangani oleh this.#mapHelper.initMap() di afterRender()
  async initialMap() {
    // TODO: map initialization - Logic ini sudah dipindahkan ke MapHelper.initMap()
  }
  */

  // >>> Metode View untuk Memperbarui UI (Daftar Laporan) <<<

  populateReportsList(stories) {
    if (!Array.isArray(stories)) {
      console.error('populateReportsList expected an array, but received:', stories);
      this.populateReportsListError('Invalid data format received.');
      return;
    }

    if (stories.length <= 0) {
      this.populateReportsListEmpty();
      return;
    }

    const html = stories.reduce((accumulator, story) => {
      return accumulator.concat(
        generateReportItemTemplate({
          ...story,
          reporterName: story.name,
        }),
      );
    }, '');

    document.getElementById('reports-list').innerHTML = `
      <div class="reports-list">${html}</div>
    `;
  }

  // <<< Metode View Baru untuk Menampilkan Marker di Peta >>>
  /**
   * Metode ini dipanggil oleh Presenter (HomePresenter)
   * untuk memberitahu View (HomePage) agar menampilkan marker di peta.
   * View mendelegasikan tugas penambahan marker ke MapHelper.
   * @param {Array<object>} stories - Daftar story dengan data lokasi (lat & lon).
   */
  displayStoriesOnMap(stories) {
    if (this.#mapHelper) {
      this.#mapHelper.addMarkers(stories); // View memerintahkan MapHelper untuk menambahkan marker
    } else {
      console.error('MapHelper is not initialized.'); // Seharusnya tidak terjadi jika afterRender berhasil
    }
  }

  // --- Metode View untuk Status Loading/Error (Peta) ---
  // Metode-metode ini tetap di View karena memanipulasi elemen loading/error spesifik di DOM HomePage

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  // Metode untuk menampilkan pesan error khusus di area peta jika inisialisasi MapHelper gagal (opsional)
  showMapError(message) {
      const mapErrorContainer = document.getElementById('map-loading-container'); // Atau ID lain di area peta
      if(mapErrorContainer) {
           mapErrorContainer.innerHTML = `<div class="map-error">${message}</div>`; // Sesuaikan markup & class CSS
      }
  }

  // --- Metode View untuk Status Loading/Error (Daftar Laporan) ---
  // Metode-metode ini tetap di View karena memanipulasi elemen loading/error spesifik di DOM HomePage

  showLoading() {
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }

  // Metode-metode lain seperti populateReportsListEmpty dan populateReportsListError tetap sama

  populateReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateReportsListError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }
}