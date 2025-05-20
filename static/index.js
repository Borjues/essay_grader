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
document.querySelector(".upload-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    isLoading = true;
    if (loading) {
        loading.classList.add("active");
    }
    if (uploadBtnForm) {
        uploadBtnForm.classList.remove("active");
    }
    formSubmitBtn.setAttribute("disabled", "true");

    const response = await fetch("/grade", {
        method: "POST",
        body: formData,
    });

    if (response.ok) {
        const results = await response.json();
        updateDashboardTable(results);
        isLoading = false;
        if (loading) {
            loading.classList.remove("active");
        }
        if (uploadBtnForm) {
            uploadBtnForm.classList.add("active");
        }
        formSubmitBtn.removeAttribute("disabled");
        uploadModal.classList.remove("active");
        form.reset();
    } else {
        alert("Gagal upload!");
    }
});

async function loadDashboardData() {
    const response = await fetch("/api/results");
    if (response.ok) {
        const results = await response.json();
        updateDashboardTable(results, true);
    }
}

function updateDashboardTable(results, replace = false) {
    const tbody = document.querySelector(".main-content table tbody");
    let status = "";
    let statusColor = "";
    if (replace) tbody.innerHTML = ""; // kosongkan jika replace
    results.forEach((item, idx) => {
        switch (item.nilai) {
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
            <td>${item.nama_murid}</td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>${new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
            })}</td>
            <td>${item.nilai} (${item.similarity})</td>
            <td><span class="status-pill ${statusColor}">${status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

window.addEventListener("DOMContentLoaded", loadDashboardData);
