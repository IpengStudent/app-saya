export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model; // Pastikan model ini adalah instance yang memiliki akses ke fungsi-fungsi API yang diperbarui (dari api.js)
  }

  async showReportsListMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showReportsListMap: error:', error);
      // Pertimbangkan menambahkan penanganan error di view jika initialMap gagal
      this.#view.showMapError(error.message || 'Failed to initialize map.');
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async initialGalleryAndMap() {
    this.#view.showLoading();
    try {
      // Asumsi showReportsListMap perlu dipanggil terlebih dahulu
      // Jika initialMap diperlukan sebelum fetch data, panggil ini.
      // Jika tidak, Anda bisa menghapusnya.
      await this.showReportsListMap();

      // >>> Perbaikan Utama: Ganti panggilan fungsi dari getAllReports menjadi getAllStories
      const response = await this.#model.getAllStories(); // Panggil fungsi getAllStories dari model

      // Periksa apakah respons dari API sukses (ok: true)
      if (!response.ok) {
        console.error('initialGalleryAndMap: response error:', response);
        // >>> Sesuaikan penanganan error. Dicoding Story API mengembalikan 'message' untuk error.
        this.#view.populateReportsListError(response.message || 'Failed to fetch stories.');
        return; // Keluar dari fungsi jika terjadi error
      }

      // >>> Sesuaikan penanganan data sukses. Dicoding Story API mengembalikan daftar cerita di 'listStory'.
      console.log('initialGalleryAndMap: stories fetched successfully:', response);
      // Asumsikan populateReportsList di view Anda menerima array of story objects
      this.#view.populateReportsList(response.listStory);

    } catch (error) {
      // Tangani error tak terduga selama proses fetch atau di luar respons API
      console.error('initialGalleryAndMap: unexpected error:', error);
      this.#view.populateReportsListError(error.message || 'An unexpected error occurred while fetching stories.');
    } finally {
      this.#view.hideLoading();
    }
  }
}