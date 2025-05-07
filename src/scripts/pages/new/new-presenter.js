import NewPage from './new-page'; // Impor NewPage jika diperlukan di sini (tergantung kebutuhan presenter)
import * as CityCareAPI from '../../data/api'; // Pastikan CityCareAPI diimpor

export default class NewPresenter {
  #view;
  #model; // Model ini sebenarnya adalah objek CityCareAPI yang di-pass

  constructor({ view, model }) {
    this.#view = view; // View adalah instance dari NewPage
    this.#model = model; // Model adalah objek CityCareAPI
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      // Presenter menginstruksikan View untuk menginisialisasi peta
      await this.#view.initialMap();
    } catch (error) {
      console.error('showNewFormMap: error:', error);
      // Anda mungkin ingin menambahkan feedback ke user jika peta gagal dimuat
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewReport({ title, damageLevel, description, evidenceImages, latitude, longitude }) {
    this.#view.showSubmitLoadingButton();
    try {
      // --- START: Transformasi data dan pemanggilan API yang benar ---

      // Mengambil description dari form
      const apiDescription = description;

      // Mengambil photo pertama dari array evidenceImages (sesuai signature addNewStory yang butuh 1 photo)
      // Anda mungkin perlu logik tambahan jika ingin multiple photo atau validasi jika array kosong
      // Pastikan evidenceImages adalah array of Blob atau File
      const apiPhoto = (evidenceImages && evidenceImages.length > 0) ? evidenceImages[0] : null; // Asumsi mengambil foto pertama

      // Mengambil latitude dan longitude, pastikan formatnya number jika API membutuhkannya
      const apiLat = latitude ? parseFloat(latitude) : undefined; // Gunakan undefined jika kosong/tidak valid
      const apiLon = longitude ? parseFloat(longitude) : undefined; // Gunakan undefined jika kosong/tidak valid

      // --- Validasi Sederhana (sesuai kebutuhan API Story) ---
      if (!apiDescription) {
          this.#view.storeFailed("Keterangan (description) tidak boleh kosong.");
          return; // Hentikan proses jika validasi gagal
      }
      if (!apiPhoto) {
          this.#view.storeFailed("Mohon sertakan setidaknya satu foto dokumentasi.");
          return; // Hentikan proses jika validasi gagal
      }
      // Anda bisa tambahkan validasi untuk lat/lon jika wajib

      // Memanggil fungsi API yang benar dari model (CityCareAPI)
      const response = await this.#model.addNewStory({ // <-- Perubahan di sini
        description: apiDescription,
        photo: apiPhoto,
        lat: apiLat, // Menggunakan lat
        lon: apiLon, // Menggunakan lon
      });

      // --- END: Transformasi data dan pemanggilan API yang benar ---


      // Cek response API (sesuai format response dari api.js)
      if (!response.ok) {
        console.error('postNewReport: API response error:', response); // Log pesan error dari API
        this.#view.storeFailed(response.message || 'Gagal membuat laporan. Silakan coba lagi.'); // Tampilkan pesan error dari API
        return; // Hentikan jika API mengembalikan error
      }

      // Jika sukses
      console.log('postNewReport: API response success:', response); // Log response sukses
      this.#view.storeSuccessfully(response.message || 'Laporan berhasil dibuat!', response.data); // Tampilkan pesan sukses

    } catch (error) {
      console.error('postNewReport: try-catch error:', error); // Log error teknis
      this.#view.storeFailed(error.message || 'Terjadi kesalahan saat memproses laporan.'); // Tampilkan pesan error umum
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Metode lain jika ada
}