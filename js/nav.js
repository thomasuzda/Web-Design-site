document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var dropdown = document.querySelector(".nav-dropdown");
  if (toggle && dropdown) {
    var closeMenu = function () {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    var openMenu = function () {
      dropdown.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    };
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dropdown.classList.contains("open")) closeMenu(); else openMenu();
    });
    dropdown.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  var header = document.querySelector(".site-header");
  if (header) {
    var setScrolled = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }
});
