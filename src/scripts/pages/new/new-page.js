import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as CityCareAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';

// Import Leaflet library dan CSS-nya
// Anda perlu memastikan 'leaflet/dist/leaflet.css' diimpor di file CSS utama atau di sini jika bundler Anda mendukungnya.
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Konfigurasi Default Icon Leaflet (penting agar marker muncul) ---
// Ini seringkali diperlukan saat menggunakan Leaflet dengan bundler seperti Webpack
// Jika marker Anda tidak muncul, coba tambahkan kode ini:
// Pastikan path ke gambar icon benar sesuai struktur proyek Anda di node_modules
try {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
        iconUrl: require('leaflet/dist/images/marker-icon.png'),
        shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });
} catch (e) {
    console.error("Error configuring Leaflet default icon:", e);
    console.warn("Leaflet markers might not appear. Check Leaflet installation and icon paths.");
}
// --- Akhir Konfigurasi Default Icon Leaflet ---


export default class NewPage {
  #presenter;
  #form;
  #isCameraOpen = false;
  #takenDocumentations = [];

  // Properti baru untuk peta dan kamera
  #map;
  #marker; // Marker untuk menandai lokasi di peta (opsional)
  #latitudeInput; // Referensi ke elemen input latitude
  #longitudeInput; // Referensi ke elemen input longitude
  #videoElement; // Elemen untuk menampilkan stream kamera
  #canvasElement; // Elemen untuk menggambar frame kamera
  #cameraStream; // Untuk menyimpan referensi stream kamera agar bisa dihentikan

  async render() {
    return `
      <section>
        <div class="new-report__header">
          <div class="container">
            <h1 class="new-report__header__title">Buat Laporan Baru</h1>
            <p class="new-report__header__description">
              Silakan lengkapi formulir di bawah untuk membuat laporan baru.<br>
              Pastikan laporan yang dibuat adalah valid.
            </p>
          </div>
        </div>
      </section>
 
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="title-input" class="new-form__title__title">Judul Laporan</label>

              <div class="new-form__title__container">
                <input
                  id="title-input"
                  name="title"
                  placeholder="Masukkan judul laporan"
                  aria-describedby="title-input-more-info"
                >
            </div>
              <div id="title-input-more-info">Pastikan judul laporan dibuat dengan jelas dan deskriptif dalam 1 kalimat.</div>
            </div>
            <div class="form-control">
              <div class="new-form__damage-level__title">Tingkat Kerusakan</div>

              <div class="new-form__damage-level__container">
                <div class="new-form__damage-level__minor__container">
                  <input id="damage-level-minor-input" type="radio" name="damageLevel" value="minor">
                  <label for="damage-level-minor-input">
                    Rendah <span title="Contoh: Lubang kecil di jalan, kerusakan ringan pada tanda lalu lintas, dll."><i class="far fa-question-circle"></i></span>
                  </label>
                </div>
                <div class="new-form__damage-level__moderate__container">
                  <input id="damage-level-moderate-input" type="radio" name="damageLevel" value="moderate">
                  <label for="damage-level-moderate-input">
                    Sedang <span title="Contoh: Jalan retak besar, trotoar amblas, lampu jalan mati, dll."><i class="far fa-question-circle"></i></span>
                  </label>
                </div>
                <div class="new-form__damage-level__severe__container">
                  <input id="damage-level-severe-input" type="radio" name="damageLevel" value="severe">
                  <label for="damage-level-severe-input">
                    Berat <span title="Contoh: Jembatan ambruk, tiang listrik roboh, longsor yang menutup jalan, dll."><i class="far fa-question-circle"></i></span>
                  </label>
                </div>
              </div>
            </div>
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Keterangan</label>

              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Masukkan keterangan lengkap laporan. Anda dapat menjelaskan apa kejadiannya, dimana, kapan, dll."
                ></textarea>
              </div>
            </div>
            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>

              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">Ambil Gambar</button>
                  <input
                    id="documentations-input"
                    class="new-form__documentations__input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    aria-multiline="true"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                                        <video id="camera-video" autoplay playsinline style="width: 100%; height: auto; display: none;"></video>
                    <canvas id="camera-canvas" style="display: none;"></canvas>
                    <button id="take-photo-button" class="btn" type="button" style="display: none; margin-top: 10px;">Ambil Foto</button>
                  <p id="camera-placeholder">Fitur ambil gambar dengan kamera akan segera hadir!</p>                 </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Lokasi</div>

              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" name="latitude" value="-6.175389">
                  <input type="number" name="longitude" value="106.827139">
                </div>
              </div>
            </div>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Buat Laporan</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>

         `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: CityCareAPI,
    });
    this.#takenDocumentations = [];

    // Ambil referensi form, input lat/lon, dan elemen kamera/canvas/tombol setelah render
    // Pastikan elemen form ada sebelum mencoba mengambil elemen di dalamnya
    const formElement = document.getElementById('new-form');
    if (!formElement) {
        console.error('Form element with id "new-form" not found after render!');
        // Tampilkan pesan error atau handle appropriately
        return; // Hentikan jika form tidak ditemukan
    }
    this.#form = formElement; // Simpan referensi form


    this.#latitudeInput = this.#form.elements.namedItem('latitude');
    this.#longitudeInput = this.#form.elements.namedItem('longitude');
    this.#videoElement = document.getElementById('camera-video');
    this.#canvasElement = document.getElementById('camera-canvas');
    const takePhotoButton = document.getElementById('take-photo-button');
    const cameraPlaceholder = document.getElementById('camera-placeholder');


    // Tambahkan cek keamanan untuk elemen-elemen kunci
    if (!this.#latitudeInput || !this.#longitudeInput || !this.#videoElement || !this.#canvasElement || !takePhotoButton || !cameraPlaceholder) {
        console.error("One or more required elements (lat/lon input, video, canvas, photo button, camera placeholder) not found after render!");
        // Nonaktifkan fungsionalitas terkait jika elemen tidak lengkap
        const openCameraButton = document.getElementById('open-documentations-camera-button');
        if(openCameraButton) openCameraButton.style.display = 'none';
        const submitButton = this.#form.querySelector('button[type="submit"]');
         if(submitButton) submitButton.disabled = true;
         alert("Terjadi kesalahan memuat formulir. Beberapa elemen penting tidak ditemukan.");
        // Anda bisa berhenti di sini atau mencoba melanjutkan dengan fungsionalitas yang berfungsi
        // return; // Opsi: hentikan eksekusi afterRender jika elemen penting hilang
    }


    this.#presenter.showNewFormMap(); // Presenter menginstruksikan View untuk menginisialisasi peta
    this.#setupForm(); // Setup event listener form dan input file

    // Setup listener tombol ambil foto dari kamera
    if (takePhotoButton) { // Cek keamanan
        takePhotoButton.addEventListener('click', () => {
            this.#takePicture();
        });
    }


    // Modifikasi event listener "Buka Kamera"
    const openCameraButton = document.getElementById('open-documentations-camera-button');
    const cameraContainer = document.getElementById('camera-container');

    if (openCameraButton && cameraContainer && this.#videoElement && takePhotoButton && cameraPlaceholder) { // Cek keamanan semua elemen terkait kamera
        openCameraButton.addEventListener('click', async (event) => {
            cameraContainer.classList.toggle('open'); // Toggle class CSS untuk styling

            this.#isCameraOpen = cameraContainer.classList.contains('open');
            if (this.#isCameraOpen) {
                event.currentTarget.textContent = 'Tutup Kamera';
                cameraPlaceholder.style.display = 'none'; // Sembunyikan placeholder
                this.#videoElement.style.display = 'block'; // Tampilkan video
                takePhotoButton.style.display = 'block'; // Tampilkan tombol ambil foto
                await this.#setupCamera(); // Panggil setup kamera saat membuka
            } else {
                event.currentTarget.textContent = 'Buka Kamera';
                cameraPlaceholder.style.display = 'block'; // Tampilkan placeholder
                this.#videoElement.style.display = 'none'; // Sembunyikan video
                takePhotoButton.style.display = 'none'; // Sembunyikan tombol ambil foto
                this.#stopCameraStream(); // Hentikan stream saat menutup
            }
        });
    } else {
        console.warn('One or more camera elements (button, container, video, photo button, placeholder) not found. Camera feature might not work.');
        // Sembunyikan tombol kamera jika elemen tidak lengkap
        if (openCameraButton) openCameraButton.style.display = 'none';
        if (cameraContainer) cameraContainer.innerHTML = '<p>Elemen kamera tidak lengkap atau tidak ditemukan. Fitur kamera dinonaktifkan.</p>';
    }


    // Invalidate size peta setelah render selesai dan elemen dipastikan visible
    // Ini penting jika kontainer peta awalnya tersembunyi atau ukurannya berubah setelah CSS/DOM siap
    // Menggunakan setTimeout dengan delay 0 atau kecil sering membantu
    // Hanya panggil jika peta berhasil diinisialisasi di initialMap
    if (this.#map) {
        setTimeout(() => {
           if (this.#map) { // Periksa lagi kalau peta masih ada
               this.#map.invalidateSize();
               console.log('Map invalidateSize called after delay.');
               // Opsi: set view lagi setelah invalidateSize jika lokasi reset tidak diinginkan
               // const currentLat = parseFloat(this.#latitudeInput.value) || -6.175399;
               // const currentLon = parseFloat(this.#longitudeInput.value) || 106.827139;
               // this.#map.setView([currentLat, currentLon], 13);
           }
        }, 200); // Delay 200ms sebagai contoh
    }
  }

  // --- Perbaikan pada Metode #setupForm() ---
  #setupForm() {
    // Pastikan form element sudah ada. #form seharusnya sudah di-assign di afterRender.
    if (!this.#form) {
        console.error('#setupForm called but this.#form is not assigned!');
        return;
    }


    // --- Menambahkan Event Listener Submit dengan Debugging dan Validasi ---
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault(); // Mencegah refresh halaman default

      // --- DEBUGGING & VALIDASI AWAL: Pastikan elemen form yang dibutuhkan ada ---
      console.log('Submit event triggered. Checking required form elements...');

      // Mengambil referensi setiap elemen input yang dibutuhkan
      // Menggunakan this.#form untuk memastikan elemen ada di dalam form yang benar
      const titleElement = this.#form.elements.namedItem('title');
      const damageLevelElement = this.#form.elements.namedItem('damageLevel');
      const descriptionElement = this.#form.elements.namedItem('description');
      const latitudeElement = this.#form.elements.namedItem('latitude'); // Ambil elemen latitude
      const longitudeElement = this.#form.elements.namedItem('longitude'); // Ambil elemen longitude


      // Log referensi elemen untuk debugging. Periksa console saat error terjadi.
      console.log('Form elements references:');
      console.log("Element 'title':", titleElement);
      console.log("Element 'damageLevel':", damageLevelElement);
      console.log("Element 'description':", descriptionElement);
      console.log("Element 'latitude':", latitudeElement);
      console.log("Element 'longitude':", longitudeElement);
      // Note: #latitudeInput dan #longitudeInput adalah properti kelas,
      // referensi lokal (latitudeElement, longitudeElement) lebih direct untuk cek di sini.


      // Cek apakah ada elemen yang bernilai null atau undefined
      let missingElements = [];
      if (!titleElement) missingElements.push("'title'");
      if (!damageLevelElement) missingElements.push("'damageLevel'");
      if (!descriptionElement) missingElements.push("'description'");
      if (!latitudeElement) missingElements.push("'latitude'");
      if (!longitudeElement) missingElements.push("'longitude'");

      // Jika ada elemen yang hilang, log error dan beri feedback ke user, lalu hentikan proses
      if (missingElements.length > 0) {
           const errorMessage = `Missing required form elements: ${missingElements.join(', ')}. Cannot submit.`;
           console.error(errorMessage);
           alert(`Error: Beberapa bagian formulir tidak ditemukan (${missingElements.join(', ')}). Mohon hubungi dukungan teknis atau refresh halaman.`);
           this.hideSubmitLoadingButton(); // Pastikan tombol submit tidak dalam keadaan loading
           return; // Hentikan eksekusi fungsi submit di sini
      }
      // --- END DEBUGGING & VALIDASI AWAL ---

      // Jika semua elemen ditemukan (sudah dipastikan tidak null), baru ambil nilainya
      const data = {
        title: titleElement.value, // Gunakan referensi elemen yang sudah dicek
        damageLevel: damageLevelElement.value, // Gunakan referensi elemen yang sudah dicek
        description: descriptionElement.value, // Gunakan referensi elemen yang sudah dicek
        evidenceImages: this.#takenDocumentations.map((picture) => picture.blob), // Mengambil foto dari array #takenDocumentations
        latitude: latitudeElement.value, // Gunakan referensi elemen latitude yang sudah dicek
        longitude: longitudeElement.value, // Gunakan referensi elemen longitude yang sudah dicek
      };

      console.log('Collected data for submission:', data); // Log data yang berhasil dikumpulkan

      // Panggil presenter untuk memproses data (presenter yang akan memanggil API)
      await this.#presenter.postNewReport(data);
    });
    // --- Akhir Perubahan Besar pada listener submit ---


    // Event listener untuk input file (Ambil Gambar) - Kode ini tetap sama seperti di versi sebelumnya
    const documentationsInput = document.getElementById('documentations-input');
    if (documentationsInput) { // Tambahkan cek keamanan
        documentationsInput.addEventListener('change', async (event) => {
            this.#stopCameraStream(); // Hentikan stream kamera jika sedang aktif
            // Reset state kamera UI jika perlu (ini bisa dipindahkan ke method terpisah)
            const cameraContainer = document.getElementById('camera-container');
            const openCameraButton = document.getElementById('open-documentations-camera-button');
            const takePhotoButton = document.getElementById('take-photo-button');
            const cameraPlaceholder = document.getElementById('camera-placeholder');

            if (cameraContainer) cameraContainer.classList.remove('open');
            this.#isCameraOpen = false;
             if (openCameraButton) openCameraButton.textContent = 'Buka Kamera';
             if (cameraPlaceholder) cameraPlaceholder.style.display = 'block';
             if (this.#videoElement) this.#videoElement.style.display = 'none';
             if (takePhotoButton) takePhotoButton.style.display = 'none';


            const files = event.target.files;
            if (files.length > 0) {
                const insertingPicturesPromises = Object.values(files).map(async (file) => {
                    return await this.#addTakenPicture(file);
                });
                await Promise.all(insertingPicturesPromises);

                await this.#populateTakenPictures();
            }
        });
    } else {
         console.warn('Documentations input element not found.');
    }


    // Trigger klik input file saat tombol "Ambil Gambar" diklik - Kode ini tetap sama
    const documentationsInputButton = document.getElementById('documentations-input-button');
    if (documentationsInputButton && documentationsInput) { // Tambahkan cek keamanan
        documentationsInputButton.addEventListener('click', () => {
          documentationsInput.click(); // Trigger klik pada input file
        });
    } else {
        console.warn('Documentations input button or input not found.');
    }

    // Event listener "Buka Kamera" ada di afterRender, tidak perlu di sini.
  }

  // --- Implementasi Peta (Leaflet) ---
  async initialMap() {
    console.log('Initializing map...');

    // Pastikan elemen peta sudah ada di DOM
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found in initialMap. Cannot initialize map.');
        return; // Hentikan jika elemen peta tidak ada
    }

    // Hentikan peta sebelumnya jika sudah ada (Penting untuk Single Page App)
    // Ini mencegah multiple map instances pada elemen yang sama jika afterRender dipanggil ulang
    if (this.#map) {
        this.#map.remove();
        this.#map = null; // Set null setelah dihapus
        console.log('Previous map instance removed.');
    }

    // Gunakan nilai awal dari input lat/lon jika ada dan valid, atau gunakan nilai default
    // Pastikan #latitudeInput dan #longitudeInput sudah di-assign di afterRender
    const initialLat = (this.#latitudeInput && !isNaN(parseFloat(this.#latitudeInput.value))) ? parseFloat(this.#latitudeInput.value) : -6.175399; // Default Monas
    const initialLon = (this.#longitudeInput && !isNaN(parseFloat(this.#longitudeInput.value))) ? parseFloat(this.#longitudeInput.value) : 106.827139; // Default Monas


    // Inisialisasi peta Leaflet
    this.#map = L.map(mapElement).setView([initialLat, initialLon], 13); // Ganti zoom level jika perlu

    // Tambahkan tile layer (misalnya OpenStreetMap)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);

    // Tambahkan marker di lokasi awal
    // Periksa apakah marker default perlu ditambahkan based on initial values
    this.#marker = L.marker([initialLat, initialLon]).addTo(this.#map);


    // Tambahkan event listener untuk klik pada peta
    this.#map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        // Pastikan input elements ada sebelum update valuenya
        if (this.#latitudeInput && this.#longitudeInput) {
            // Update nilai input latitude dan longitude di form
            this.#latitudeInput.value = lat.toFixed(6); // Format sesuai kebutuhan, e.g., 6 desimal
            this.#longitudeInput.value = lng.toFixed(6); // Format sesuai kebutuhan

            // Update posisi marker (jika menggunakan marker)
            if (this.#marker) {
                this.#marker.setLatLng([lat, lng]);
            } else {
                 // Jika marker belum ada, buat baru
                this.#marker = L.marker([lat, lng]).addTo(this.#map);
            }

            console.log(`Lokasi dipilih: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);
        } else {
             console.error('Latitude/Longitude input elements not found when map clicked.');
        }
    });

    // Invalidate size jika kontainer awalnya tersembunyi atau ukurannya berubah setelah render
    // Ini memastikan peta ditampilkan dengan benar. Mungkin perlu di-adjust delay-nya.
    // Terutama penting jika elemen peta berada di dalam tab atau kontainer yang awalnya hidden.
    setTimeout(() => {
       if (this.#map) { // Periksa lagi kalau peta masih ada
           this.#map.invalidateSize();
           console.log('Map invalidateSize called after delay.');
       }
    }, 200); // Delay 200ms sebagai contoh


    console.log('Map initialized successfully.');
  }

  // --- Implementasi Kamera ---
  async #setupCamera() {
    console.log('Setting up camera...');

    // Periksa apakah browser mendukung media devices API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera API not supported by your browser.');
        alert('Fitur kamera tidak didukung di browser Anda.');
        // Sembunyikan UI kamera jika tidak didukung
        const openCameraButton = document.getElementById('open-documentations-camera-button');
        const cameraContainer = document.getElementById('camera-container');
        if (openCameraButton) openCameraButton.style.display = 'none';
        if (cameraContainer) cameraContainer.innerHTML = '<p>Browser Anda tidak mendukung akses kamera.</p>';
        return; // Hentikan proses setup kamera
    }

    // Pastikan elemen video dan canvas tersedia (sudah di-assign di afterRender)
    if (!this.#videoElement || !this.#canvasElement) {
         console.error('Video or canvas elements not found for camera setup.');
         alert('Terjadi kesalahan setup elemen kamera.');
         return; // Hentikan proses
    }


    try {
        // Jika sudah ada stream kamera aktif, hentikan dulu
        this.#stopCameraStream();

        // Minta akses ke stream video (kamera)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                 facingMode: 'environment' // Coba gunakan kamera belakang jika ada
                 // Atau biarkan default 'user' untuk kamera depan
            }
            // audio: false // Tidak butuh audio
        });
        this.#cameraStream = stream; // Simpan referensi stream

        // Sambungkan stream ke elemen video
        this.#videoElement.srcObject = stream;

        // Tunggu video metadata dimuat sebelum play
        await new Promise((resolve, reject) => { // Tambahkan reject untuk handle error
            this.#videoElement.onloadedmetadata = () => {
                resolve();
            };
            this.#videoElement.onerror = (error) => { // Handle error saat memuat metadata
                 console.error('Error loading video metadata:', error);
                 reject(new Error('Error loading video metadata'));
            };
             // Tambahkan timeout jika metadata tidak kunjung load
             setTimeout(() => reject(new Error('Timeout loading video metadata')), 5000); // 5 detik timeout
        });

        await this.#videoElement.play(); // Putar video

        console.log('Camera stream started successfully.');

    } catch (error) {
        console.error('Error accessing camera:', error);
        let errorMessage = 'Gagal mengakses kamera.';
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = 'Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
             errorMessage = 'Tidak ada kamera yang ditemukan di perangkat Anda.';
        } else if (error.name === 'NotReadableError') {
             errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
        } else {
             errorMessage = `Error kamera: ${error.message}`;
        }
        alert(errorMessage);

        // Sembunyikan UI kamera dan tampilkan pesan error jika gagal
        const openCameraButton = document.getElementById('open-documentations-camera-button');
        const cameraContainer = document.getElementById('camera-container');
        const takePhotoButton = document.getElementById('take-photo-button');
        const cameraPlaceholder = document.getElementById('camera-placeholder');

        // Reset state UI kamera
        if (cameraContainer) cameraContainer.classList.remove('open');
        this.#isCameraOpen = false;
        if (openCameraButton) openCameraButton.textContent = 'Buka Kamera';
        if (cameraPlaceholder) {
             cameraPlaceholder.style.display = 'block';
             cameraPlaceholder.textContent = errorMessage; // Tampilkan pesan error di placeholder
        }
        if (this.#videoElement) this.#videoElement.style.display = 'none';
        if (takePhotoButton) takePhotoButton.style.display = 'none';
    }
  }

    // Metode untuk menghentikan stream kamera
    #stopCameraStream() {
        console.log('Attempting to stop camera stream...');
        if (this.#cameraStream) {
            this.#cameraStream.getTracks().forEach(track => {
                 if (track.readyState === 'live') { // Hentikan hanya jika track aktif
                      track.stop();
                     console.log('Camera track stopped.');
                 }
            });
            this.#cameraStream = null; // Hapus referensi stream
            console.log('Camera stream reference cleared.');

            // Opsional: Hentikan pemutaran video dan kosongkan srcObject
            if (this.#videoElement) {
                 this.#videoElement.pause();
                 this.#videoElement.srcObject = null; // Penting untuk melepaskan stream dari video element
                 console.log('Video element srcObject cleared.');
            }
        } else {
             console.log('No active camera stream to stop.');
        }
    }

    // Metode untuk mengambil foto dari stream kamera
    #takePicture() {
        console.log('Attempting to take picture...');
        // Cek keamanan: pastikan elemen dan stream siap
        if (!this.#videoElement || !this.#canvasElement || !this.#videoElement.srcObject || this.#videoElement.readyState !== this.#videoElement.HAVE_ENOUGH_DATA) {
            console.error('Video element not ready or camera stream not active for taking picture.');
            alert('Kamera belum siap atau tidak aktif.');
            return;
        }

        // Set ukuran canvas sesuai ukuran video
        this.#canvasElement.width = this.#videoElement.videoWidth;
        this.#canvasElement.height = this.#videoElement.videoHeight;

        // Gambar frame video saat ini ke canvas
        const context = this.#canvasElement.getContext('2d');
        context.drawImage(this.#videoElement, 0, 0, this.#videoElement.videoWidth, this.#videoElement.videoHeight);
        console.log(`Drew frame onto canvas (${this.#canvasElement.width}x${this.#canvasElement.height}).`);


        // Konversi isi canvas ke Blob
        // Kualitas 1.0 (terbaik), format image/png
        this.#canvasElement.toBlob(async (blob) => {
            if (blob) {
                console.log('Canvas converted to Blob (size:', blob.size, 'type:', blob.type, ').');
                // Tambahkan Blob ke array dokumentasi
                // Metode #addTakenPicture sudah menangani objek Blob
                await this.#addTakenPicture(blob);
                // Update tampilan daftar foto
                await this.#populateTakenPictures();
                console.log('Picture successfully added to documentation.');

                // Opsional: Beri feedback visual ke user (misal, flash effect di UI)

            } else {
                console.error('Failed to convert canvas to blob.');
                alert('Gagal mengambil foto.');
            }
        }, 'image/png', 1.0); // Format gambar dan kualitas

    }


  // Metode yang sudah ada (sedikit perbaikan pada pengecekan tipe input)
  async #addTakenPicture(image) {
    console.log('Adding taken picture...', image);
    let blob = image;

    // Jika input BUKAN instance Blob atau File, coba konversi (misal dari base64 string)
    // File adalah turunan dari Blob, jadi cukup cek Blob
    if (!(image instanceof Blob)) {
        console.warn('Input to #addTakenPicture is not a Blob, attempting conversion (assuming Base64 string).');
        // Asumsi input adalah string base64 jika bukan Blob
        try {
            blob = await convertBase64ToBlob(image, 'image/png');
            if (!blob) throw new Error('Conversion to Blob failed.');
             console.log('Conversion from non-Blob successful.');
        } catch (error) {
            console.error('Failed to convert image to Blob:', error);
            alert('Gagal memproses gambar.');
            return; // Hentikan jika konversi gagal
        }
    } else {
        console.log('Input is already a Blob/File.');
    }


    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob, // Blob atau File object
      // Simpan juga object URL jika ingin merevokenya nanti secara spesifik
      objectUrl: URL.createObjectURL(blob),
    };
    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
    console.log('Documentation added:', newDocumentation.id, 'Total:', this.#takenDocumentations.length);
  }

  // Metode yang sudah ada (dengan perbaikan DOM access dan event delegation + revoke URL)
  async #populateTakenPictures() {
    console.log('Populating taken pictures list. Count:', this.#takenDocumentations.length);
    const documentationListElement = document.getElementById('documentations-taken-list');
    if (!documentationListElement) {
        console.error('Documentation list element not found in populateTakenPictures.');
        return;
    }

    // --- Gunakan Event Delegation untuk Tombol Hapus ---
    // Hapus listener delegation sebelumnya jika ada (opsional, tergantung implementasi)
    // Ini lebih aman jika populateTakenPictures dipanggil berkali-kali
    // Cara paling pasti adalah menyimpan referensi listener atau menggunakannya di afterRender sekali
    // documentationListElement.removeEventListener('click', this.#boundDeletePictureHandler); // Jika Anda menyimpan referensi
    // this.#boundDeletePictureHandler = this.#handleDeletePictureClick.bind(this); // Buat handler terikat di constructor/afterRender
    // documentationListElement.addEventListener('click', this.#boundDeletePictureHandler); // Tambahkan handler

    // Untuk saat ini, kita bisa mengandalkan innerHTML = '' yang akan menghapus listener lama
    // Tapi Event Delegation itu sendiri yang merupakan pola yang baik, jadi listener ditambahkan
    // SETELAH innerHTML di-set.

    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      // Gunakan objectUrl yang disimpan
      const imageUrl = picture.objectUrl;
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item" data-pictureid="${picture.id}">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
                          <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}" style="max-width: 100px; max-height: 100px; object-fit: cover;">
              <span class="delete-icon">&times;</span>           </button>
        </li>
      `);
    }, '');

    // Isi ulang HTML daftar foto
    documentationListElement.innerHTML = html;

    // --- Gunakan Event Delegation untuk Tombol Hapus ---
    // Tambahkan listener pada parent
    // Hindari menambahkan listener berkali-kali jika populatePictures dipanggil sering.
    // Jika memungkinkan, tambahkan listener delegation ini sekali saja di afterRender.
    // Jika tidak bisa (karena elemen parent mungkin tidak ada di afterRender awal),
    // pastikan logika ini tidak membuat listener duplikat.
    // Untuk contoh ini, saya asumsikan ini dipanggil setelah DOM ada.
    // Untuk robustness, Anda bisa tambahkan flag atau cek listener sudah ada.

    // Contoh sederhana: Tambahkan listener delegation setiap kali, ini mungkin in-efficient tapi berfungsi
    // Jika Anda memanggil populateTakenPictures() berkali-kali, Anda bisa menambahkan event listener
    // ini di afterRender dan menggunakan event delegation secara persisten.
    // Kode ini (listener di dalam populate) akan menghapus listener lama saat innerHTML di-set
    // dan menambahkan yang baru.

    documentationListElement.addEventListener('click', (event) => {
        // Cek apakah target klik adalah tombol hapus atau anaknya
        const deleteButton = event.target.closest('button[data-deletepictureid]');
        if (deleteButton) {
            const pictureId = deleteButton.dataset.deletepictureid;
            console.log('Delete button clicked for picture ID:', pictureId);

            // Temukan objek gambar di array #takenDocumentations sebelum dihapus
            const pictureToDelete = this.#takenDocumentations.find(p => p.id == pictureId);
            const objectUrlToRevoke = pictureToDelete ? pictureToDelete.objectUrl : null;

            const deleted = this.#removePicture(pictureId);
            if (deleted) {
                 console.log(`Picture with id ${pictureId} was deleted from array.`);
                 // Update tampilan daftar foto
                 this.#populateTakenPictures(); // Memanggil ini akan me-render ulang list

                 // Penting: Revoke URL objek Blob untuk membebaskan memori
                 if (objectUrlToRevoke) {
                    URL.revokeObjectURL(objectUrlToRevoke);
                    console.log('Revoked object URL:', objectUrlToRevoke);
                 }
            } else {
                 console.log(`Picture with id ${pictureId} was not found`);
            }
        }
    });
  }

  // Metode yang sudah ada
  #removePicture(id) {
    const initialLength = this.#takenDocumentations.length;
    // Filter array, pertahankan yang ID-nya TIDAK sesuai
    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => {
      return picture.id != id; // Gunakan == atau === sesuai tipe ID
    });
    // Mengembalikan true jika ada yang dihapus (panjang array berkurang)
    return this.#takenDocumentations.length < initialLength;
  }

  // Metode yang sudah ada (dengan pembersihan stream kamera)
  storeSuccessfully(message, data) {
    console.log('Store successful:', message, data);
    alert(message); // Tampilkan pesan sukses

    // Hentikan stream kamera jika aktif sebelum membersihkan form/redirect
    this.#stopCameraStream();

    this.clearForm(); // Membersihkan form dan state

    console.log('Redirecting to home page...');
    // Redirect page ke halaman utama (sesuai rute '/')
    location.href = '/';
  }

  // Metode yang sudah ada
  storeFailed(message) {
    console.error('Store failed:', message);
    alert(message); // Tampilkan pesan error
    // Anda mungkin tidak ingin menghentikan stream kamera atau membersihkan form saat gagal,
    // agar user bisa memperbaiki input.
    // this.#stopCameraStream(); // Opsi: Hentikan stream juga saat gagal
  }

  // Metode yang sudah ada (dengan perbaikan pembersihan dan revoke URL)
  clearForm() {
    console.log('Clearing form and resetting state...');
    // Pastikan form dan elemen lainnya sudah ada sebelum diakses
    if (this.#form) {
      this.#form.reset(); // Reset input form standar

        // Bersihkan daftar foto yang diambil/diunggah dan revoke object URL
        this.#takenDocumentations.forEach(picture => {
           if (picture.objectUrl) {
                URL.revokeObjectURL(picture.objectUrl);
                console.log('Revoked object URL during clearForm:', picture.objectUrl);
           }
        });
        this.#takenDocumentations = []; // Kosongkan array
        this.#populateTakenPictures(); // Update tampilan daftar foto menjadi kosong


        // Reset input file secara manual agar event 'change' ter-trigger jika file yang sama dipilih lagi
        const documentationInput = document.getElementById('documentations-input');
        if (documentationInput) {
            documentationInput.value = null;
        }
    }

    // Reset input lat/lon ke nilai default atau kosongkan
     if (this.#latitudeInput) this.#latitudeInput.value = '-6.175389'; // Atau '';
     if (this.#longitudeInput) this.#longitudeInput.value = '106.827139'; // Atau '';

     // Hentikan stream kamera jika aktif dan reset UI kamera
     this.#stopCameraStream(); // Hentikan stream
     const cameraContainer = document.getElementById('camera-container');
     const openCameraButton = document.getElementById('open-documentations-camera-button');
     const takePhotoButton = document.getElementById('take-photo-button');
     const cameraPlaceholder = document.getElementById('camera-placeholder');

     if (cameraContainer) cameraContainer.classList.remove('open'); // Tutup kontainer kamera
     this.#isCameraOpen = false; // Reset state kamera
     if (openCameraButton) openCameraButton.textContent = 'Buka Kamera';
     if (cameraPlaceholder) {
          cameraPlaceholder.style.display = 'block'; // Tampilkan placeholder awal
          cameraPlaceholder.textContent = 'Fitur ambil gambar dengan kamera akan segera hadir!'; // Reset teks
     }
     if (this.#videoElement) this.#videoElement.style.display = 'none'; // Sembunyikan video
     if (takePhotoButton) takePhotoButton.style.display = 'none'; // Sembunyikan tombol ambil foto


     // Reset peta ke lokasi awal jika ada
     // Pastikan peta (#map) sudah diinisialisasi
     if (this.#map) {
         const defaultLat = -6.175389;
         const defaultLon = 106.827139;
         this.#map.setView([defaultLat, defaultLon], 13); // Set view ke lokasi default
         if (this.#marker) {
             this.#marker.setLatLng([defaultLat, defaultLon]); // Pindahkan marker ke lokasi default
         }
         // Opsi: remove marker jika ingin hilang saat form di-clear
         // if (this.#marker) { this.#map.removeLayer(this.#marker); this.#marker = null; }
     }
     console.log('Form cleared and state reset.');
  }

  // Metode yang sudah ada (dengan perbaikan DOM access)
  showMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
        mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    } else {
        console.warn('Map loading container not found.');
    }
  }

  // Metode yang sudah ada (dengan perbaikan DOM access)
  hideMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
        mapLoadingContainer.innerHTML = '';
    } else {
        console.warn('Map loading container not found.');
    }
  }

  // Metode yang sudah ada (dengan perbaikan DOM access)
  showSubmitLoadingButton() {
    const submitButtonContainer = document.getElementById('submit-button-container');
    if (submitButtonContainer) {
    submitButtonContainer.innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Loading...
      </button>
    `; // Mengganti teks menjadi Loading... lebih informatif
    } else {
        console.warn('Submit button container not found.');
    }
  }

  // Metode yang sudah ada (dengan perbaikan DOM access)
  hideSubmitLoadingButton() {
    const submitButtonContainer = document.getElementById('submit-button-container');
    if (submitButtonContainer) {
    submitButtonContainer.innerHTML = `
      <button class="btn" type="submit">Buat Laporan</button>
    `;
    } else {
        console.warn('Submit button container not found.');
    }
  }

    // --- Penting: Metode cleanup saat komponen tidak lagi di DOM ---
    // Jika framework SPA Anda memiliki lifecycle hook seperti 'beforeDestroy' atau 'disconnectedCallback',
    // implementasikan di sana untuk memanggil this.#stopCameraStream() dan this.#map.remove().
    // Ini sangat penting untuk mencegah memory leaks dan resource blocking.
    // Contoh (jika menggunakan Custom Elements atau serupa):
    // disconnectedCallback() {
    //    console.log('NewPage disconnected from DOM, cleaning up resources.');
    //    this.#stopCameraStream();
    //    if (this.#map) {
    //        this.#map.remove();
    //        this.#map = null;
    //    }
    //    // Revoke Object URLs untuk foto yang tersisa jika belum dihapus
    //    this.#takenDocumentations.forEach(picture => {
    //       if (picture.objectUrl) {
    //            URL.revokeObjectURL(picture.objectUrl);
    //            console.log('Revoked object URL during disconnect:', picture.objectUrl);
    //       }
    //    });
    //    this.#takenDocumentations = []; // Kosongkan array
    //    console.log('All object URLs revoked and documentation array cleared.');
    // }
    // Jika tidak ada hook seperti itu, pastikan logika cleanup terpanggil saat user meninggalkan halaman
    // (misalnya, dalam handler perubahan rute global di luar komponen ini).
    // Kode ini sudah mencakup cleanup stream dan form/foto saat menutup kamera, submit sukses,
    // clear form, dan klik batal. Ini cukup baik, tapi 'disconnectedCallback' adalah cara paling pasti
    // untuk membersihkan resource saat komponen dihapus dari DOM.
}