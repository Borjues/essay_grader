const uploadBtn = document.querySelector(".upload-btn");
const uploadModal = document.getElementById("uploadModal");
const closeModal = document.getElementById("closeModal");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const mobileNavClose = document.querySelector(".mobile-nav-close");

// Open Modal
uploadBtn.addEventListener("click", function () {
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

// Mobile Menu Toggle if exists
if (mobileMenuToggle && mobileNav && mobileNavClose) {
    mobileMenuToggle.addEventListener("click", function () {
        mobileNav.classList.add("active");
    });

    mobileNavClose.addEventListener("click", function () {
        mobileNav.classList.remove("active");
    });

    mobileNav.addEventListener("click", function (event) {
        if (event.target === mobileNav) {
            mobileNav.classList.remove("active");
        }
    });
}

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
