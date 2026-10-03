// =========================================================
// LANTING KATA BERLAYAR
// Menggunakan sumber kosakata Kamus LANTING KATA yang sama
// =========================================================


// =========================================================
// WEB APP LANTING KATA
// =========================================================

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbwJaZhoaDdKjlyyQOhyICRY7APeQrLvJesOxTel-qQy6xTIuvBqQZ0Y5dX7HEAZu695/exec";


// =========================================================
// SUMBER DATA KAMUS
// =========================================================

const urlSheet =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

let dataKata = [];
let selectedCategory = "";
let targetWords = [];
let basket = [];
let score = 0;

let isMoving = false;

const TARGET = 3;

const categoryConfig = [
  ["Makanan", "🍜"],
  ["Hewan", "🐟"],
  ["Benda", "🧸"],
  ["Tumbuhan", "🌱"],
  ["Tempat", "📍"],
  ["Kata Kerja", "🏃"],
  ["Kata Sifat", "😊"],
  ["Warna", "🎨"],
  ["Angka/Bilangan", "🔢"],
  ["Waktu", "⏰"]
];

const $ = id => document.getElementById(id);

const normalize = value =>
  String(value || "").toLowerCase().trim();


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// PEMBACA CSV
// =========================================================

function parseCSV(csv) {

  const rows = [];

  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i++) {

    const ch = csv[i];
    const next = csv[i + 1];

    // Tanda kutip ganda di dalam data
    if (ch === '"' && quoted && next === '"') {

      value += '"';
      i++;

    }

    // Membuka / menutup kutip
    else if (ch === '"') {

      quoted = !quoted;

    }

    // Koma pemisah kolom
    else if (ch === "," && !quoted) {

      row.push(value.trim());
      value = "";

    }

    // Akhir baris
    else if (
      (ch === "\n" || ch === "\r") &&
      !quoted
    ) {

      if (ch === "\r" && next === "\n") {
        i++;
      }

      row.push(value.trim());
      value = "";

      if (row.some(v => v !== "")) {
        rows.push(row);
      }

      row = [];

    }

    else {

      value += ch;

    }
  }

  // Data terakhir
  row.push(value.trim());

  if (row.some(v => v !== "")) {
    rows.push(row);
  }

  return rows;
}


// =========================================================
// MEMUAT DATA KAMUS
// =========================================================

async function loadWords() {

  try {

    const response = await fetch(urlSheet);

    if (!response.ok) {
      throw new Error("Data tidak dapat diambil.");
    }

    const csv = await response.text();

    const rows = parseCSV(csv);

    /*
      Struktur data Kamus:

      0 = No
      1 = Banjar
      2 = Indonesia
      3 = Kategori
      4 = Contoh
      5 = Gambar
      6 = Audio
    */

    dataKata = rows
      .slice(1)
      .map(c => ({

        no: c[0] || "",
        banjar: c[1] || "",
        indonesia: c[2] || "",
        kategori: c[3] || "",
        contoh: c[4] || "",
        gambar: c[5] || "",
        audio: c[6] || ""

      }))
      .filter(k =>
        k.banjar &&
        k.kategori
      );

    renderCategories();

    $("loadingText").textContent =
      dataKata.length
        ? "Kosakata siap digunakan. Pilih kategori misi!"
        : "Belum ada data kosakata.";

  }

  catch (error) {

    console.error(error);

    $("loadingText").textContent =
      "⚠️ Kosakata belum dapat dimuat. Periksa koneksi atau Google Sheets.";

  }

}


// =========================================================
// MENAMPILKAN KATEGORI
// =========================================================

function renderCategories() {

  const available = new Set(
    dataKata.map(k =>
      normalize(k.kategori)
    )
  );

  $("categoryChoices").innerHTML =
    categoryConfig
      .map(([name, icon]) => {

        const disabled =
          !available.has(
            normalize(name)
          );

        return `
          <button
            type="button"
            class="category-card ${disabled ? "disabled" : ""}"
            data-category="${escapeHTML(name)}"
            ${disabled ? "disabled" : ""}
          >
            <span class="category-icon">
              ${icon}
            </span>

            ${escapeHTML(name)}

          </button>
        `;

      })
      .join("");

  document
    .querySelectorAll(
      ".category-card:not(.disabled)"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          selectCategory(
            button.dataset.category
          )
      );

    });

}


// =========================================================
// MEMILIH KATEGORI
// =========================================================

function selectCategory(category) {

  selectedCategory = category;

  document
    .querySelectorAll(".category-card")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === category
      );

    });

  $("startButton").disabled = false;

}


// =========================================================
// ACAK DATA
// =========================================================

function shuffle(array) {

  return [...array].sort(
    () => Math.random() - 0.5
  );

}


// =========================================================
// MEMULAI PERMAINAN
// =========================================================

function startGame() {

  const pool =
    dataKata.filter(
      k =>
        normalize(k.kategori) ===
        normalize(selectedCategory)
    );

  // Minimal 3 kata
  if (pool.length < TARGET) {

    alert(
      "Kategori ini belum memiliki minimal 3 kosakata untuk dimainkan."
    );

    return;

  }

  basket = [];
  score = 0;
  isMoving = false;

  // Memilih 3 kata target
  targetWords =
    shuffle(pool).slice(
      0,
      TARGET
    );

  $("score").textContent = score;

  $("progress").textContent =
    `0 / ${TARGET}`;

  $("basket").innerHTML = "";

  $("feedback").className =
    "feedback info";

  $("feedback").textContent =
    "Pilih barang dari perahu pedagang yang sesuai dengan misi.";

  $("missionTitle").textContent =
    `Cari ${TARGET} kosakata`;

  $("missionText").textContent =
    `Carilah ${TARGET} kosakata dari kategori ${selectedCategory}.`;

  $("startSection").classList.add(
    "hidden"
  );

  $("resultSection").classList.add(
    "hidden"
  );

  $("gameSection").classList.remove(
    "hidden"
  );

  // Kembalikan posisi jukung ke awal
  resetPlayerBoat();

  renderMarket();

  window.scrollTo({

    top:
      $("gameSection").offsetTop - 20,

    behavior: "smooth"

  });

}


// =========================================================
// MEMBUAT PILIHAN BARANG
// =========================================================

function makeChoices() {

  // Kata yang bukan kategori misi
  const wrong =
    dataKata.filter(
      k =>
        normalize(k.kategori) !==
        normalize(selectedCategory)
    );

  /*
    3 jawaban benar
    +
    maksimal 3 pengecoh
  */

  return shuffle([

    ...targetWords,

    ...shuffle(wrong).slice(
      0,
      Math.min(
        3,
        wrong.length
      )
    )

  ]).slice(0, 6);

}


// =========================================================
// MENAMPILKAN PASAR TERAPUNG
// =========================================================

function renderMarket() {

  const choices = makeChoices();

  /*
    Posisi dibuat lebih renggang.

    3 kolom:
    kiri   = 8%
    tengah = 40%
    kanan  = 72%

    Baris:
    atas    = 145px
    bawah   = 285px
  */

  const positions = [
    { left: 8, top: 145 },
    { left: 40, top: 145 },
    { left: 72, top: 145 },

    { left: 8, top: 285 },
    { left: 40, top: 285 },
    { left: 72, top: 285 }
  ];

  $("marketArea").innerHTML =
    choices
      .map((k, index) => {

        const position =
          positions[index] ||
          positions[positions.length - 1];

        return `
          <button
            class="market-boat"
            type="button"
            data-no="${escapeHTML(k.no)}"
            style="
              left:${position.left}%;
              top:${position.top}px;
            "
          >

            <div class="vendor">
              🧑‍🌾
            </div>

            <div class="goods">
              ${emojiFor(k)}
            </div>

            <div class="boat-name">
              ${escapeHTML(k.banjar)}
            </div>

          </button>
        `;

      })
      .join("");

  document
    .querySelectorAll(".market-boat")
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          chooseWord(
            button.dataset.no,
            button
          )
      );

    });

}


// =========================================================
// EMOJI BERDASARKAN KATEGORI
// =========================================================

function emojiFor(k) {

  const category =
    normalize(k.kategori);

  if (category === "makanan")
    return "🍜";

  if (category === "hewan")
    return "🐟";

  if (category === "tumbuhan")
    return "🌱";

  if (category === "benda")
    return "🧺";

  if (category === "tempat")
    return "📍";

  if (category === "warna")
    return "🎨";

  if (category === "angka/bilangan")
    return "🔢";

  if (category === "waktu")
    return "⏰";

  if (category === "kata kerja")
    return "🏃";

  if (category === "kata sifat")
    return "😊";

  return "📖";

}


// =========================================================
// RESET POSISI JUKUNG
// =========================================================

function resetPlayerBoat() {

  const boat = $("playerBoat");
  const label = document.querySelector(".boat-label");

  if (!boat) return;

  boat.style.left = "45%";
  boat.style.top = "";
  boat.style.bottom = "48px";
  boat.style.transform = "";

  if (label) {

    label.style.left = "calc(45% - 4px)";
    label.style.top = "";
    label.style.bottom = "28px";
    label.style.transform = "";

  }

}


// =========================================================
// GERAKKAN JUKUNG KE PERAHU YANG DIPILIH
// =========================================================

function sailToBoat(targetButton) {

  return new Promise(resolve => {

    const playerBoat = $("playerBoat");
    const boatLabel = document.querySelector(".boat-label");
    const riverScene = document.querySelector(".river-scene");

    if (
      !playerBoat ||
      !targetButton ||
      !riverScene
    ) {

      resolve();
      return;

    }

    const sceneRect =
      riverScene.getBoundingClientRect();

    const targetRect =
      targetButton.getBoundingClientRect();

    /*
      Hitung titik tengah perahu pedagang
      relatif terhadap river-scene.
    */

    const targetX =
      targetRect.left -
      sceneRect.left +
      targetRect.width / 2;

    const targetY =
      targetRect.top -
      sceneRect.top +
      targetRect.height / 2;

    /*
      Sedikit beri jarak supaya jukung
      tidak menutupi perahu pedagang.
    */

    const boatX =
      Math.max(
        70,
        Math.min(
          sceneRect.width - 70,
          targetX
        )
      );

    const boatY =
      Math.max(
        120,
        Math.min(
          sceneRect.height - 65,
          targetY + 65
        )
      );

    isMoving = true;

    // Nonaktifkan semua pilihan selama jukung bergerak
    document
      .querySelectorAll(".market-boat")
      .forEach(button => {
        button.disabled = true;
      });

    playerBoat.style.left =
      `${boatX}px`;

    playerBoat.style.top =
      `${boatY}px`;

    playerBoat.style.bottom =
      "auto";

    playerBoat.style.transform =
      "translate(-50%, -50%)";

    if (boatLabel) {

      boatLabel.style.left =
        `${boatX}px`;

      boatLabel.style.top =
        `${boatY + 43}px`;

      boatLabel.style.bottom =
        "auto";

      boatLabel.style.transform =
        "translateX(-50%)";

    }

    /*
      Tunggu animasi selesai.
      CSS transition akan membuat gerakannya halus.
    */

    setTimeout(() => {

      isMoving = false;

      // Aktifkan kembali pilihan yang belum dikumpulkan
      document
        .querySelectorAll(".market-boat")
        .forEach(button => {

          const no =
            button.dataset.no;

          const alreadyTaken =
            basket.some(
              k =>
                String(k.no) ===
                String(no)
            );

          if (!alreadyTaken) {
            button.disabled = false;
          }

        });

      resolve();

    }, 850);

  });

}


// =========================================================
// MEMILIH BARANG
// =========================================================

async function chooseWord(no, button) {

  if (isMoving) return;

  const word =
    dataKata.find(
      k =>
        String(k.no) ===
        String(no)
    );

  if (!word) return;

  // Jangan pilih barang yang sudah dikumpulkan
  if (
    basket.some(
      k =>
        String(k.no) ===
        String(no)
    )
  ) {

    return;

  }

  /*
    JUKUNG BERLAYAR TERLEBIH DAHULU
    menuju perahu yang dipilih.
  */

  await sailToBoat(button);

  const correct =
    normalize(word.kategori) ===
    normalize(selectedCategory);


  // =======================================================
  // JAWABAN BENAR
  // =======================================================

  if (correct) {

    basket.push(word);

    score += 10;

    $("score").textContent =
      score;

    $("progress").textContent =
      `${basket.length} / ${TARGET}`;

    $("basket").insertAdjacentHTML(

      "beforeend",

      `
        <span class="basket-item">
          ${escapeHTML(word.banjar)}
        </span>
      `

    );

    $("feedback").className =
      "feedback success";

    $("feedback").innerHTML =

      `✅ <strong>${escapeHTML(word.banjar)}</strong> ` +

      `termasuk kategori ` +

      `<strong>${escapeHTML(word.kategori)}</strong>! ` +

      `Artinya: ` +

      `<strong>${escapeHTML(word.indonesia)}</strong>.`;

    if (button) {

      button.disabled = true;

      button.style.opacity = ".45";

      button.style.transform =
        "scale(.9)";

    }

    // Semua target selesai
    if (
      basket.length === TARGET
    ) {

      setTimeout(
        endGame,
        900
      );

    }

  }


  // =======================================================
  // JAWABAN SALAH
  // =======================================================

  else {

    score =
      Math.max(
        0,
        score - 5
      );

    $("score").textContent =
      score;

    $("feedback").className =
      "feedback error";

    $("feedback").innerHTML =

      `💦 Belum tepat. ` +

      `<strong>${escapeHTML(word.banjar)}</strong> ` +

      `termasuk kategori ` +

      `<strong>${escapeHTML(word.kategori)}</strong>, ` +

      `bukan ${escapeHTML(selectedCategory)}.`;

  }

}


// =========================================================
// SIMPAN SKOR KE GOOGLE SHEETS
// =========================================================

async function simpanSkor() {

  /*
    Login baru menyimpan:
      lantingNama

    Game lama menggunakan:
      lantingKataNamaPemain

    Jadi kita dukung keduanya agar Game 7
    tetap kompatibel.
  */

  const nama =
    localStorage.getItem("lantingNama") ||
    localStorage.getItem("lantingKataNamaPemain") ||
    "";

  if (!nama) {

    console.warn(
      "Nama pemain tidak ditemukan."
    );

    return null;

  }

  try {

    const params =
      new URLSearchParams();

    params.append(
      "action",
      "simpanSkor"
    );

    params.append(
      "nama",
      nama
    );

    params.append(
      "skor",
      score
    );

    params.append(
      "game",
      "7"
    );

    const response =
      await fetch(
        `${WEB_APP_URL}?${params.toString()}`
      );

    if (!response.ok) {

      throw new Error(
        "Server tidak dapat diakses."
      );

    }

    const data =
      await response.json();

    console.log(
      "Skor Game 07 berhasil disimpan:",
      data
    );

    return data;

  }

  catch (error) {

    console.error(
      "Gagal menyimpan skor Game 07:",
      error
    );

    return null;

  }

}


// =========================================================
// SELESAI
// =========================================================

async function endGame() {

  $("gameSection").classList.add(
    "hidden"
  );

  $("resultSection").classList.remove(
    "hidden"
  );

  $("finalScore").textContent =
    score;

  $("resultText").textContent =

    `Hebat! Kamu berhasil mengumpulkan ` +

    `${TARGET} kosakata kategori ` +

    `${selectedCategory} dari pasar terapung.`;

  window.scrollTo({

    top:
      $("resultSection").offsetTop - 20,

    behavior: "smooth"

  });

  /*
    Simpan skor setelah permainan selesai.
    Proses berjalan otomatis tanpa meminta
    nama lagi kepada pemain.
  */

  await simpanSkor();

}


// =========================================================
// MAIN LAGI
// =========================================================

function resetGame() {

  $("resultSection").classList.add(
    "hidden"
  );

  $("gameSection").classList.add(
    "hidden"
  );

  $("startSection").classList.remove(
    "hidden"
  );

  $("startButton").disabled =
    !selectedCategory;

  resetPlayerBoat();

  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}


// =========================================================
// EVENT
// =========================================================

$("startButton").addEventListener(
  "click",
  startGame
);

$("playAgainButton").addEventListener(
  "click",
  resetGame
);


// =========================================================
// JALANKAN DATA KAMUS
// =========================================================

loadWords();