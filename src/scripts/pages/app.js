import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate,
} from '../templates';
import { setupSkipToContent } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    // User not log in
    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (confirm('Apakah Anda yakin ingin keluar?')) {
        getLogout();

        // Redirect
        location.hash = '/login';
      }
    });
  }

 async renderPage() {
    // Dapatkan pola rute dari hash URL
    const url = getActiveRoute(); // Contoh: '/' atau '/reports/123' -> jadi '/reports/:id'

    // Cari handler rute di objek routes
    const route = routes[url]; // Contoh: routes['/'] atau routes['/reports/:id']

    // <<< Tambahkan Pengecekan Ini >>>
    // Periksa apakah rute ditemukan dan handler-nya adalah sebuah fungsi
    if (!route || typeof route !== 'function') {
        console.error(`Route tidak ditemukan atau handler bukan fungsi untuk URL: ${url}`);
        // Tangani rute tidak ditemukan:
        // Opsi Sederhana: Redirect ke halaman Home
        location.hash = '/'; // Mengubah hash akan memicu renderPage() lagi untuk rute Home
        return; // Hentikan proses rendering untuk rute yang salah

        // Opsi Lain: Render halaman 404 Not Found (jika Anda memilikinya)
        // const notFoundPage = new NotFoundPage(); // Asumsikan ada kelas NotFoundPage
        // this.#content.innerHTML = await notFoundPage.render();
        // await notFoundPage.afterRender();
        // return;
    }
    // <<< Akhir Pengecekan >>>


    // Jika rute ditemukan dan valid, dapatkan instance page/view dengan memanggil handler rute
    const page = route(); // Baris ini sekarang hanya dipanggil jika 'route' adalah fungsi

    // Lanjutkan proses rendering page seperti sebelumnya
    if (!document.startViewTransition) {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
      return;
    }

    // ... sisa kode View Transition ...
    const transition = document.startViewTransition(async () => {
    this.#content.innerHTML = await page.render();
    await page.afterRender();
    });
    transition.updateCallbackDone.then(() => {
    scrollTo({ top: 0, behavior: 'instant' });
    this.#setupNavigationList();
    });
  }
}
