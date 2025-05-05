import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate, // Pertimbangkan ganti nama file template ini menjadi generateStoryItemTemplate
  generateReportsListEmptyTemplate, // Pertimbangkan ganti nama file template ini menjadi generateStoriesListEmptyTemplate
  generateReportsListErrorTemplate, // Pertimbangkan ganti nama file template ini menjadi generateStoriesListErrorTemplate
} from '../../templates';
import HomePresenter from './home-presenter';
import * as CityCareAPI from '../../data/api'; // Pastikan api.js sudah menggunakan endpoint stories

export default class HomePage {
  #presenter = null;

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
          <div id="reports-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: CityCareAPI, // Pastikan ini merujuk ke objek yang memiliki fungsi getAllStories
    });

    await this.#presenter.initialGalleryAndMap();
  }

  // >>> METODE POPULATEREPORTSLIST YANG DIPERBAIKI <<<
  populateReportsList(stories) { // Parameter DITERIMA bernama 'stories'
    // Opsional: Cek apakah 'stories' adalah array (disarankan)
    if (!Array.isArray(stories)) {
      console.error('populateReportsList expected an array, but received:', stories);
      this.populateReportsListError('Invalid data format received.');
      return;
    }

    // >>> Perbaikan: Gunakan 'stories' di sini
    if (stories.length <= 0) {
      this.populateReportsListEmpty(); // Pertimbangkan ganti panggilannya jika Anda mengganti nama elemen
      return;
    }

    // >>> Perbaikan: Gunakan 'stories' untuk reduce, dan 'story' untuk item tunggal
    const html = stories.reduce((accumulator, story) => {
      // >>> Sesuaikan cara mengakses properti berdasarkan struktur Dicoding Story API
      // API mengembalikan nama pengarang di properti 'name' langsung pada objek cerita
      return accumulator.concat(
        // generateReportItemTemplate // Pertimbangkan ganti panggilannya menjadi generateStoryItemTemplate
        generateReportItemTemplate({
          ...story, // Menggunakan 'story'
          reporterName: story.name, // Akses nama pengarang dari story.name
          // Sesuaikan properti lain jika generateReportItemTemplate mengharapkan struktur data yang berbeda
        }),
      );
    }, '');

    // >>> Sesuaikan ID elemen jika diubah di render()
    document.getElementById('reports-list').innerHTML = `
      <div class="reports-list">${html}</div> 
    `;
  }

  // >>> Metode lain yang tidak berubah <<<
  populateReportsListEmpty() {
     // >>> Sesuaikan ID elemen dan nama template jika diubah
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateReportsListError(message) {
     // >>> Sesuaikan ID elemen dan nama template jika diubah
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  async initialMap() {
    // TODO: map initialization
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showLoading() {
    // >>> Sesuaikan ID elemen jika diubah
    document.getElementById('reports-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideLoading() {
    // >>> Sesuaikan ID elemen jika diubah
    document.getElementById('reports-list-loading-container').innerHTML = '';
  }
}