export default class LoginPresenter {
  #view;
  #model;
  #authModel;

  constructor({ view, model, authModel }) {
    this.#view = view;
    this.#model = model; // Ini seharusnya adalah instance yang memiliki fungsi getLogin dari api.js
    this.#authModel = authModel; // Ini seharusnya adalah instance yang memiliki fungsi putAccessToken
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      // Panggil fungsi getLogin dari model (yang terhubung ke api.js)
      const response = await this.#model.getLogin({ email, password });

      // Periksa apakah respons dari API sukses (ok: true)
      if (!response.ok) {
        console.error('getLogin: response error:', response);
        // Gunakan pesan error dari respons API untuk ditampilkan ke pengguna
        this.#view.loginFailed(response.message || 'Login failed.');
        return; // Keluar dari fungsi jika login gagal
      }

      // >>> Perbaikan di sini: Akses token dari response.loginResult.token
      this.#authModel.putAccessToken(response.loginResult.token);

      // >>> Sesuaikan argumen untuk loginSuccessfully jika view memerlukannya
      // Contoh: Meneruskan seluruh objek loginResult atau hanya nama/userId
      console.log('Login successful:', response);
      this.#view.loginSuccessfully(response.message, response.loginResult); // Anda bisa menyesuaikan argumen ini

    } catch (error) {
      // Tangani error tak terduga selama proses login (misalnya masalah jaringan, error parsing JSON, dll.)
      console.error('getLogin: unexpected error:', error);
      // Tampilkan pesan error generik untuk error tak terduga
      this.#view.loginFailed(error.message || 'An unexpected error occurred during login.');
    } finally {
      // Pastikan loading button disembunyikan terlepas dari hasil
      this.#view.hideSubmitLoadingButton();
    }
  }

  // Metode presenter lain...
}