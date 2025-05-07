// --- src/utils/map-helper.js ---

// Import library Leaflet
// Jika instal via npm/yarn, aktifkan baris ini:
import L from 'leaflet';

// Opsional: Jika ingin impor CSS Leaflet via JS (butuh bundler config), aktifkan ini:
// import 'leaflet/dist/leaflet.css';

// Jika tidak impor CSS via JS, pastikan link CSS Leaflet ada di <head> index.html


// --- Fungsi Helper untuk Konten Popup Marker ---

/**
 * Buat konten HTML untuk popup marker dari data story.
 * @param {object} story - Objek story dari API.
 * @returns {string} HTML untuk popup.
 */
function generateStoryPopupContent(story) {
  // Buat HTML popup sederhana dari data story (sesuaikan jika perlu)
  const textContent = story.description ? story.description.substring(0, 50) + '...' : 'No description available';
  return `
    <div style="max-width: 200px;">
     
      <h4 style="margin: 0 0 5px 0; font-size: 1em;">${story.description.substring(0, 50)}...</h4>
      <p style="margin: 0 0 5px 0; font-size: 0.9em;">Oleh: ${story.name}</p>
      
   
    </div>
  `;
}


// --- Kelas MapHelper ---

/**
 * Helper untuk mengelola peta Leaflet (inisialisasi & marker).
 * Dibuat instance-nya di View (home-page.js).
 */
export default class MapHelper {
  #map; // Instance objek peta Leaflet
  #markers = []; // Daftar marker yang ada di peta

  constructor() {
    // Kosong, inisialisasi utama di initMap()
  }

  /**
   * Inisialisasi peta pada elemen HTML dengan ID tertentu.
   * Dipanggil setelah elemen peta ada di DOM (misal di afterRender() View).
   * @param {string} mapContainerId - ID elemen div peta ('map').
   * @param {object} options - Opsi Leaflet untuk peta (opsional).
   * @returns {object|null} Instance peta atau null jika elemen tidak ada.
   */
  initMap(mapContainerId, options = {}) {
    const mapElement = document.getElementById(mapContainerId);
    if (!mapElement) {
      console.error(`Elemen peta "${mapContainerId}" tidak ditemukan.`);
      return null; // Gagal inisialisasi
    }

    mapElement.innerHTML = ''; // Bersihkan elemen peta

    // --- Inisialisasi Peta ---
    this.#map = L.map(mapElement, {
      center: [-2.5489, 118.0149], // Pusat peta awal (Indonesia)
      zoom: 5, // Level zoom awal
      ...options, // Timpa opsi default jika ada
    });

    // --- Tambahkan Layer Peta (Tile Layer) ---
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map); // Tambahkan layer ke peta

    console.log('Peta berhasil diinisialisasi:', this.#map);
    return this.#map;
  }

  /**
   * Tambahkan marker ke peta dari daftar objek stories.
   * Dipanggil Presenter setelah dapat data stories.
   * @param {Array<object>} stories - Array stories (tiap objek punya lat, lon).
   */
  addMarkers(stories) {
    this.clearMarkers(); // Hapus marker lama (opsional)

    if (!Array.isArray(stories)) {
      console.error('addMarkers butuh input array.');
      return;
    }

    // Loop setiap story
    stories.forEach(story => {
      // Cek koordinat valid
      if (story.lat !== null && story.lon !== null && !isNaN(story.lat) && !isNaN(story.lon)) {

        // --- Buat Marker ---
        const marker = L.marker([story.lat, story.lon]);

        // --- Buat & Ikat Popup ---
        const popupContent = generateStoryPopupContent(story);
        marker.bindPopup(popupContent); // Popup muncul saat marker diklik

        // --- Tambahkan Marker ke Peta ---
        marker.addTo(this.#map);

        this.#markers.push(marker); // Simpan referensi marker
      } else {
        console.warn('Story tanpa koordinat valid:', story);
      }
    });

    // Opsional: Atur tampilan peta agar semua marker terlihat
    if (this.#markers.length > 0) {
        const group = new L.featureGroup(this.#markers); // Grup marker
        this.#map.fitBounds(group.getBounds(), { padding: [50, 50] }); // Atur zoom & pusat peta
    }

    console.log(`Menambahkan ${this.#markers.length} marker.`);
  }

  /**
   * Hapus semua marker dari peta.
   */
  clearMarkers() {
    this.#markers.forEach(marker => marker.remove()); // Hapus dari peta
    this.#markers = []; // Kosongkan daftar marker
    console.log('Semua marker dihapus.');
  }

  /**
   * Atur pusat & zoom peta.
   * @param {number} lat - Latitude.
   * @param {number} lon - Longitude.
   * @param {number} [zoom] - Level zoom (opsional).
   */
  centerMap(lat, lon, zoom = this.#map?.getZoom()) {
      if (this.#map) {
          this.#map.setView([lat, lon], zoom);
      } else {
          console.warn('Peta belum diinisialisasi.');
      }
  }

  // Metode lain jika perlu
}