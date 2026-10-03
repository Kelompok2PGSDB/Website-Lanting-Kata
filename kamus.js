// ========================================
// LANTING KATA - KAMUS
// ========================================

// ========================================
// LINK GOOGLE SHEET
// ========================================

const urlSheet =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQYJ3ve7IUTIBC6hy24is1rTu309JDuksk97G-lC4RpQ2R4cHHigvwje29XgnnZVINMAGYWq29yvmPM/pub?output=csv";

let dataKata = [];


// ========================================
// KEMBALI KE DASHBOARD
// ========================================

function kembaliDashboard() {
    window.location.href = "dashboard.html";
}


// ========================================
// MENGAMBIL DATA GOOGLE SHEET
// ========================================

async function ambilData() {

    try {

        const response = await fetch(urlSheet);

        if (!response.ok) {
            throw new Error("Data tidak dapat diambil.");
        }

        const csv = await response.text();

        dataKata = bacaCSV(csv);

        console.log(
            "Data Kamus berhasil diambil:",
            dataKata
        );

    } catch (error) {

        console.error(
            "Terjadi kesalahan:",
            error
        );

        const hasil =
            document.getElementById("hasilKamus");

        if (hasil) {

            hasil.innerHTML = `
                <div class="pesan">
                    ⚠️ Data kosakata belum dapat dimuat.
                </div>
            `;

        }

    }

}


// ========================================
// MEMBACA CSV
// ========================================

function bacaCSV(csv) {

    const baris =
        csv.trim().split(/\r?\n/);


    function pecahCSV(baris) {

        const hasil = [];

        let nilai = "";

        let dalamKutipan = false;


        for (
            let i = 0;
            i < baris.length;
            i++
        ) {

            const karakter = baris[i];


            if (karakter === '"') {

                if (
                    dalamKutipan &&
                    baris[i + 1] === '"'
                ) {

                    nilai += '"';

                    i++;

                } else {

                    dalamKutipan =
                        !dalamKutipan;

                }


            } else if (
                karakter === "," &&
                !dalamKutipan
            ) {

                hasil.push(
                    nilai.trim()
                );

                nilai = "";


            } else {

                nilai += karakter;

            }

        }


        hasil.push(
            nilai.trim()
        );


        return hasil;

    }


    // Lewati baris pertama
    // karena merupakan header

    return baris.slice(1).map(
        barisData => {

            const kolom =
                pecahCSV(barisData);


            return {

                no:
                    kolom[0] || "",

                banjar:
                    kolom[1] || "",

                indonesia:
                    kolom[2] || "",

                kategori:
                    kolom[3] || "",

                contoh:
                    kolom[4] || "",

                gambar:
                    kolom[5] || "",

                audio:
                    kolom[6] || ""

            };

        }
    );

}


// ========================================
// MENGUBAH LINK GAMBAR GOOGLE DRIVE
// ========================================

function ubahLinkGambar(link) {

    if (!link) {
        return "";
    }


    const cocok = link.match(
        /\/file\/d\/([^/]+)/
    );


    if (
        cocok &&
        cocok[1]
    ) {

        const idFile =
            cocok[1];


        return (
            "https://drive.google.com/thumbnail?id="
            + idFile
            + "&sz=w800"
        );

    }


    return link;

}


// ========================================
// MENGUBAH LINK AUDIO
// ========================================

function ubahLinkAudio(link) {

    if (!link) {
        return "";
    }


    // Jika link sudah berupa
    // GitHub Pages audio LANTING KATA,
    // langsung gunakan link tersebut.

    if (
        link.includes(
            "najahapp46-stack.github.io"
        )
    ) {

        return link;

    }


    // Jika masih berupa Google Drive,
    // kita ubah menjadi link preview.

    const cocok = link.match(
        /\/file\/d\/([^/]+)/
    );


    if (
        cocok &&
        cocok[1]
    ) {

        const idFile =
            cocok[1];


        return (
            "https://drive.google.com/file/d/"
            + idFile
            + "/preview"
        );

    }


    return link;

}


// ========================================
// PILIH KATEGORI
// ========================================

function pilihKategori(
    namaKategori
) {

    console.log(
        "Kategori dipilih:",
        namaKategori
    );


    const hasil =
        document.getElementById(
            "hasilKamus"
        );


    // Sembunyikan kategori
    // setelah memilih

    document
        .querySelector(
            ".bagian-kategori"
        )
        .scrollIntoView({
            behavior: "smooth"
        });


    // ====================================
    // FILTER DATA BERDASARKAN KATEGORI
    // ====================================

    const ditemukan =
        dataKata.filter(kata =>

            kata.kategori
                .toLowerCase()
                .trim()
                ===
            namaKategori
                .toLowerCase()
                .trim()

        );


    console.log(
        "Kosakata kategori:",
        ditemukan
    );


    // ====================================
    // JIKA KOSAKATA TIDAK ADA
    // ====================================

    if (
        ditemukan.length === 0
    ) {

        hasil.innerHTML = `

            <div class="pesan">

                😔 Belum ada kosakata
                untuk kategori
                <strong>
                    ${namaKategori}
                </strong>.

            </div>

        `;

        hasil.scrollIntoView({
            behavior: "smooth"
        });

        return;

    }


    // ====================================
    // JUDUL HASIL
    // ====================================

    hasil.innerHTML = `

        <div class="judul-hasil-kamus">

            <h2>
                📖 ${namaKategori}
            </h2>

            <p>
                ${ditemukan.length}
                kosakata ditemukan
            </p>

        </div>


        <div class="daftar-kosakata">

            ${ditemukan.map(
                kata => buatKartuKata(kata)
            ).join("")}

        </div>

    `;


    hasil.scrollIntoView({
        behavior: "smooth"
    });

}


// ========================================
// MEMBUAT KARTU KOSAKATA
// ========================================

function buatKartuKata(kata) {

    const gambar =
        ubahLinkGambar(
            kata.gambar
        );


    const audio =
        ubahLinkAudio(
            kata.audio
        );


    return `

        <div class="kartu-kosakata">

            ${
                gambar
                ?
                `
                <img
                    src="${gambar}"
                    alt="${kata.banjar}"
                    class="gambar-kosakata"
                    onerror="
                        this.style.display='none'
                    "
                >
                `
                :
                ""
            }


            <div class="isi-kosakata">

                <h3>
                    ${kata.banjar}
                </h3>


                <p>

                    <strong>
                        Arti:
                    </strong>

                    ${kata.indonesia}

                </p>


                <p>

                    <strong>
                        Kategori:
                    </strong>

                    ${kata.kategori}

                </p>


                <p>

                    <strong>
                        Contoh Kalimat:
                    </strong>

                    ${kata.contoh}

                </p>


                ${
                    audio
                    ?
                    `
                    <div class="audio-kosakata">

                        <audio
                            controls
                            preload="none"
                        >

                            <source
                                src="${audio}"
                                type="audio/mpeg"
                            >

                            Browser kamu
                            tidak mendukung
                            pemutar audio.

                        </audio>

                    </div>
                    `
                    :
                    ""
                }

            </div>

        </div>

    `;

}


// ========================================
// JALANKAN SAAT HALAMAN DIBUKA
// ========================================

ambilData();