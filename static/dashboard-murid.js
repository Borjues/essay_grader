const uploadBtn = document.querySelector(".upload-btn");
const uploadBtnNav = document.querySelector(".upload-btn-navbar");
const uploadModal = document.getElementById("uploadModal");
const closeModal = document.getElementById("closeModal");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavClose = document.querySelector(".mobile-nav-close");
const loading = document.querySelector(".loading");
const uploadBtnForm = document.querySelector(".form-upload-btn");
const uploadForm = document.querySelector(".upload-form");
const formSubmitBtn = document.querySelector(".form-submit");

let isLoading = false;

// Open Modal
uploadBtn.addEventListener("click", function () {
    uploadModal.classList.add("active");
});

uploadBtnNav.addEventListener("click", function () {
    uploadModal.classList.add("active");
});

// Close Modal
closeModal.addEventListener("click", function () {
    uploadModal.classList.remove("active");
});

// Close Modal when clicking outside
uploadModal.addEventListener("click", function (event) {
    if (event.target === uploadModal) {
        uploadModal.classList.remove("active");
    }
});

// Dropdown Menu
const toggle = document.getElementById("dropdownToggle");
const menu = document.getElementById("dropdownContent");

toggle.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent closing immediately
    menu.classList.toggle("show");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove("show");
    }
});

// Upload Function
// document.querySelector(".upload-form").addEventListener("submit", async function (e) {
//     e.preventDefault();
//     const form = e.target;
//     const formData = new FormData(form);

//     isLoading = true;
//     if (loading) {
//         loading.classList.add("active");
//     }
//     if (uploadBtnForm) {
//         uploadBtnForm.classList.remove("active");
//     }
//     formSubmitBtn.setAttribute("disabled", "true");

//     const response = await fetch("/grade", {
//         method: "POST",
//         body: formData,
//     });

//     if (response.ok) {
//         await loadDashboardData();
//         isLoading = false;
//         if (loading) {
//             loading.classList.remove("active");
//         }
//         if (uploadBtnForm) {
//             uploadBtnForm.classList.add("active");
//         }
//         formSubmitBtn.removeAttribute("disabled");
//         uploadModal.classList.remove("active");
//         form.reset();
//     } else {
//         alert("Gagal upload!");
//     }
// });

async function loadDashboardData() {
    const response = await fetch("/api/results");
    if (response.ok) {
        const results = await response.json();
        updateDashboardTable(results, true);
    } else {
        console.error("Failed to load results:", response.statusText);
        Swal.fire({
            title: "Error",
            text: "Failed to load results. Please try again later.",
            icon: "error",
        });
    }
}

function updateDashboardTable(results, replace = false) {
    const tbody = document.querySelector(".main-content table tbody");
    let status = "";
    let statusColor = "";
    if (replace) tbody.innerHTML = ""; // kosongkan jika replace
    results.forEach((item, idx) => {
        const nama = item.nama_murid || item.name || "-";
        const nilai = item.nilai || item.grade || "-";
        const similarity = item.similarity || "-";
        switch (nilai) {
            case "A":
                status = "Very Good";
                statusColor = "status-very-good";
                break;
            case "B":
                status = "Good";
                statusColor = "status-good";
                break;
            case "C":
                status = "Average";
                statusColor = "status-average";
                break;
            case "D":
                status = "Bad";
                statusColor = "status-bad";
                break;
            default:
                status = "Bad";
                statusColor = "status-bad";
        }
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${nama}</td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>${new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            })}</td>
            <td>${nilai} (${similarity})</td>
            <td><span class="status-pill ${statusColor}">${status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

window.addEventListener("DOMContentLoaded", loadDashboardData);

// Implementasi logout yang lebih baik
function handleLogout() {
    Swal.fire({
        title: "Are you sure?",
        text: "You are going to log out.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, log out",
    }).then((result) => {
        if (result.isConfirmed) {
            fetch("/logout")
                .then((response) => {
                    if (response.ok) {
                        window.location.href = "/";
                    } else {
                        Swal.fire({
                            title: "Error",
                            text: "Failed to log out. Please try again.",
                            icon: "error",
                        });
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    Swal.fire({
                        title: "Error",
                        text: "Failed to log out. Please try again.",
                        icon: "error",
                    });
                });
        }
    });
}

// Menambahkan event listener untuk tombol logout di sidebar dan dropdown
document.addEventListener("DOMContentLoaded", function () {
    const logoutButtons = document.querySelectorAll('a[href="/logout"]');
    logoutButtons.forEach((button) => {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            handleLogout();
        });
    });
});

// Fungsi untuk membuat card class baru
function createClassCard(className) {
    const classList = document.getElementById("class-list");
    const card = document.createElement("div");
    card.className = "class-card";
    card.innerHTML = `
        <div class="class-card-content">
            <h3 class="class-card-title">${className}</h3>
            <p class="class-card-desc">You have joined this class.</p>
        </div>
    `;
    classList.appendChild(card);
}

// Tangani submit form join class (modal)
document.querySelector(".upload-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const classCodeInput = document.getElementById("classCode");
    const kodeKelas = classCodeInput.value.trim();
    if (!kodeKelas) return;

    // Kirim kode kelas ke backend
    const response = await fetch("/api/join-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_kelas: kodeKelas }),
    });
    const data = await response.json();

    if (response.ok && data.success) {
        createClassCard(data.nama_kelas);
        classCodeInput.value = "";
        document.getElementById("uploadModal").classList.remove("active");
        Swal.fire({
            icon: "success",
            title: "Success",
            text: `You have joined class ${data.nama_kelas}`,
            timer: 2000,
            showConfirmButton: false,
        });
    } else {
        Swal.fire({
            icon: "error",
            title: "Failed to Join Class",
            text: data.error || "An error occurred.",
        });
    }
});

async function loadJoinedClasses() {
    const classList = document.getElementById("class-list");
    classList.innerHTML = ""; // Bersihkan dulu
    const response = await fetch("/api/joined-classes");
    if (response.ok) {
        const kelas = await response.json();
        kelas.forEach((kls) => {
            createClassCard(`${kls.nama_kelas}`);
        });
    } else {
        classList.innerHTML = "<div style='color:red'>Error loading joined classes. Please try again.</div>";
    }
}

// Panggil saat halaman selesai dimuat
window.addEventListener("DOMContentLoaded", loadJoinedClasses);
