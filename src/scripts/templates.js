import { showFormattedDate } from './utils';

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

// Pertimbangkan mengganti nama fungsi-fungsi navigasi dan template lainnya dari 'report' menjadi 'story'
export function generateMainNavigationListTemplate() {
  return `
    <li><a id="report-list-button" class="report-list-button" href="#/">Daftar Laporan</a></li> 
    <li><a id="bookmark-button" class="bookmark-button" href="#/bookmark">Laporan Tersimpan</a></li> 
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Register</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="new-report-button" class="btn new-report-button" href="#/new">Buat Laporan <i class="fas fa-plus"></i></a></li> 
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;
}

// Pertimbangkan mengganti nama fungsi dan teks
export function generateReportsListEmptyTemplate() {
  return `
    <div id="reports-list-empty" class="reports-list__empty">
      <h2>Tidak ada laporan yang tersedia</h2> 
      <p>Saat ini, tidak ada laporan kerusakan fasilitas umum yang dapat ditampilkan.</p> 
    </div>
  `;
}

// Pertimbangkan mengganti nama fungsi dan teks
export function generateReportsListErrorTemplate(message) {
  return `
    <div id="reports-list-error" class="reports-list__error">
      <h2>Terjadi kesalahan pengambilan daftar laporan</h2> 
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

// Pertimbangkan mengganti nama fungsi dan teks
export function generateReportDetailErrorTemplate(message) {
  return `
    <div id="reports-detail-error" class="reports-detail__error">
      <h2>Terjadi kesalahan pengambilan detail laporan</h2> 
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

// Pertimbangkan mengganti nama fungsi dan teks
export function generateCommentsListEmptyTemplate() {
  return `
    <div id="report-detail-comments-list-empty" class="report-detail__comments-list__empty">
      <h2>Tidak ada komentar yang tersedia</h2> 
      <p>Saat ini, tidak ada komentar yang dapat ditampilkan.</p> 
    </div>
  `;
}

// Pertimbangkan mengganti nama fungsi dan teks
export function generateCommentsListErrorTemplate(message) {
  return `
    <div id="report-detail-comments-list-error" class="report-detail__comments-list__error">
      <h2>Terjadi kesalahan pengambilan daftar komentar</h2> 
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p> 
    </div>
  `;
}

// >>> METODE GENERATEREPORTITEMTEMPLATE YANG DIPERBAIKI <<<
export function generateReportItemTemplate({
  id,
  name, // Nama pengarang ada di properti 'name' di Dicoding Story API
  description,
  photoUrl, // <<< Perbaikan: Terima photoUrl, bukan evidenceImages
  createdAt,
  lat, // <<< Perbaikan: Terima lat dan lon secara terpisah
  lon,
}) {
  return `
    <div tabindex="0" class="report-item" data-reportid="${id}"> 
      <img class="report-item__image" src="${photoUrl}" alt="${name}"> 
      <div class="report-item__body"> 
        <div class="report-item__main"> 
          <h2 id="report-title" class="report-item__title">${description.substring(0, 50)}...</h2> 
          <div class="report-item__more-info"> 
            <div class="report-item__createdat"> 
              <i class="fas fa-calendar-alt"></i> ${showFormattedDate(createdAt, 'id-ID')}
            </div>
            ${(lat !== undefined && lon !== undefined) ? `
            <div class="report-item__location"> 
               <i class="fas fa-map"></i> Latitude: ${lat}, Longitude: ${lon} 
            </div>
            ` : ''}
          </div>
        </div>
        <div id="report-description" class="report-item__description"> 
          ${description}
        </div>
        <div class="report-item__more-info"> 
          <div class="report-item__author"> 
            Dibuat oleh: ${name} 
          </div>
        </div>
        <a class="btn report-item__read-more" href="#/stories/${id}"> 
          Selengkapnya <i class="fas fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
}

// ... Sisa fungsi template lainnya (damage level, comment item, detail template, dll.)
// Anda perlu meninjau semua fungsi template yang berhubungan dengan 'report'
// untuk menyesuaikannya dengan struktur data 'story' dari Dicoding Story API.

export function generateDamageLevelMinorTemplate() {
  return `
    <span class="report-detail__damage-level__minor" data-damage-level="minor">Kerusakan Rendah</span> 
  `;
}

// ... generateDamageLevelModerateTemplate, generateDamageLevelSevereTemplate ...

export function generateDamageLevelBadge(damageLevel) {
   // Dicoding Story API tidak memiliki damageLevel. Fungsi ini mungkin tidak diperlukan untuk stories.
   // Jika Anda tetap ingin menampilkannya, Anda perlu menambahkan properti damageLevel
   // secara manual ke objek story di home-page.js sebelum meneruskannya ke template,
   // jika damage level adalah konsep yang ingin Anda tambahkan di sisi klien.
   // Jika tidak, hapus fungsi badge damage level ini dan penggunaannya.
  if (damageLevel === 'minor') {
    return generateDamageLevelMinorTemplate();
  }

  if (damageLevel === 'moderate') {
    return generateDamageLevelModerateTemplate();
  }

  if (damageLevel === 'severe') {
    return generateDamageLevelSevereTemplate();
  }

  return '';
}


export function generateReportDetailImageTemplate(imageUrl = null, alt = '') {
  // Fungsi ini sepertinya dirancang untuk menampilkan satu gambar.
  // Jika Anda menggunakannya di detail story, Anda bisa meneruskan photoUrl ke sini.
  if (!imageUrl) {
    return `
      <img class="report-detail__image" src="images/placeholder-image.jpg" alt="Placeholder Image"> 
    `;
  }

  return `
    <img class="report-detail__image" src="${imageUrl}" alt="${alt}"> 
  `;
}

// Dicoding Story API tidak memiliki komentar untuk stories. Fungsi ini mungkin tidak diperlukan.
export function generateReportCommentItemTemplate({ photoUrlCommenter, nameCommenter, body }) {
   return `
     <article tabindex="0" class="report-detail__comment-item"> 
       <img
         class="report-detail__comment-item__photo" 
         src="${photoUrlCommenter}"
         alt="Commenter name: ${nameCommenter}"
       >
       <div class="report-detail__comment-item__body"> 
         <div class="report-detail__comment-item__body__more-info"> 
           <div class="report-detail__comment-item__body__author">${nameCommenter}</div> 
         </div>
         <div class="report-detail__comment-item__body__text">${body}</div> 
       </div>
     </article>
   `;
}


// Anda perlu meninjau ulang fungsi generateReportDetailTemplate
// untuk menyesuaikannya sepenuhnya dengan struktur data detail story dari Dicoding Story API.
// Ini akan menjadi penyesuaian yang cukup besar.
export function generateReportDetailTemplate({
  // Sesuaikan parameter dengan properti dari objek detail story Dicoding API
  id, // Tambahkan id jika digunakan di template detail
  name, // Nama pengarang
  description,
  photoUrl, // URL gambar tunggal
  createdAt,
  lat, // Latitude
  lon, // Longitude
  // Properti seperti damageLevel dan evidenceImages (array) tidak ada di story
}) {
   const createdAtFormatted = showFormattedDate(createdAt, 'id-ID');
   // const damageLevelBadge = generateDamageLevelBadge(damageLevel); // Hapus jika tidak ada damage level
   // const imagesHtml = evidenceImages.reduce(...); // Hapus jika hanya ada satu gambar

   // Gunakan generateReportDetailImageTemplate untuk photoUrl tunggal
   const singleImageHtml = generateReportDetailImageTemplate(photoUrl, description); // alt teks bisa dari deskripsi

   return `
     <div class="report-detail__header"> 
       <h1 id="title" class="report-detail__title">${description.substring(0, 100)}...</h1> // Dicoding Story API tidak punya 'title', gunakan deskripsi
       // ... sesuaikan properti lain seperti lokasi, pengarang, dll.
     </div>
     // ... sisa template detail ...
     `;
}


export function generateSubscribeButtonTemplate() {
  return `
    <button id="subscribe-button" class="btn subscribe-button">
      Subscribe <i class="fas fa-bell"></i>
    </button>
  `;
}

export function generateUnsubscribeButtonTemplate() {
  return `
    <button id="unsubscribe-button" class="btn unsubscribe-button">
      Unsubscribe <i class="fas fa-bell-slash"></i>
    </button>
  `;
}

// Pertimbangkan ganti nama fungsi dan teks jika fungsionalitas bookmark disesuaikan untuk stories
export function generateSaveReportButtonTemplate() {
  return `
    <button id="report-detail-save" class="btn btn-transparent">
      Simpan laporan <i class="far fa-bookmark"></i> 
    </button>
  `;
}

// Pertimbangkan ganti nama fungsi dan teks jika fungsionalitas bookmark disesuaikan untuk stories
export function generateRemoveReportButtonTemplate() {
  return `
    <button id="report-detail-remove" class="btn btn-transparent">
      Buang laporan <i class="fas fa-bookmark"></i> 
    </button>
  `;
}