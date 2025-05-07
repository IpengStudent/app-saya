export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  /*
  // <<< Metode async showReportsListMap() Dihapus >>>
  // Metode ini tidak relevan lagi karena initialMap di View sudah dihapus
  // dan inisialisasi peta ditangani oleh MapHelper di afterRender View.
  async showReportsListMap() {
    this.#view.showMapLoading(); // Mungkin logic loading peta saat inisialisasi
    try {
      await this.#view.initialMap(); // <<< BARIS INI PENYEBAB ERROR >>>
    } catch (error) {
      console.error('showReportsListMap: error:', error);
      this.#view.showMapError(error.message || 'Failed to initialize map.');
    } finally {
      this.#view.hideMapLoading();
    }
  }
  */

  async initialGalleryAndMap() {
    // Tampilkan loading untuk daftar dan/atau peta saat ambil data
    this.#view.showLoading(); // Loading untuk daftar laporan
    this.#view.showMapLoading(); // Loading untuk area peta (saat fetch data)

    try {
      // <<< BARIS PANGGILAN showReportsListMap() Dihapus >>>
      // await this.showReportsListMap(); // Baris ini memanggil metode yang sudah dihapus/tidak relevan

      // Ambil data dari Model
      const response = await this.#model.getAllStories();

      if (!response.ok) {
        console.error('initialGalleryAndMap: response error:', response);
        this.#view.populateReportsListError(response.message || 'Failed to fetch stories.');
        // Sembunyikan loading peta jika fetch gagal sebelum menampilkan marker
        this.#view.hideMapLoading();
        return;
      }

      console.log('initialGalleryAndMap: stories fetched successfully:', response);

      // Perintahkan View untuk menampilkan daftar laporan
      this.#view.populateReportsList(response.listStory);

        // Perintahkan View untuk menampilkan marker di peta menggunakan data stories
        if (response.listStory && response.listStory.length > 0) {
            this.#view.displayStoriesOnMap(response.listStory);
        } else {
            // jika tidak ada stories, kosongkan marker lama jika ada
             if (this.#view.clearMarkers) {
                 this.#view.clearMarkers();
            }
        }

    } catch (error) {
      // Tangani error tak terduga selama proses fetch
      console.error('initialGalleryAndMap: unexpected error:', error);
      this.#view.populateReportsListError(error.message || 'An unexpected error occurred while fetching stories.');
      // Sembunyikan loading peta jika fetch gagal karena error tak terduga
      this.#view.hideMapLoading();
    } finally {
    // Sembunyikan semua indikator loading setelah proses (fetch sukses/gagal)
      this.#view.hideLoading(); // Loading daftar laporan
       this.#view.hideMapLoading(); // Loading area peta
    }
  }
}