/* Scroll-reveal: fades/slides/blurs elements in as they enter the viewport.
   No markup changes needed per-page — this targets a fixed set of selectors
   (hero copy, section headers, cards) and adds the ".reveal" class itself,
   then flips ".reveal-in" via IntersectionObserver. Elements grouped by
   parent get a staggered delay for a cascading effect. */

document.addEventListener("DOMContentLoaded", function () {
  var SELECTOR = [
    ".hero .eyebrow",
    ".hero h1",
    ".hero p.lead",
    ".hero .btn-row",
    ".section-head",
    ".capability-card",
    ".card",
    ".price-card",
    ".two-col > *",
    ".contact-grid > *",
    ".car-copy",
    ".car-viewer"
  ].join(", ");

  var els = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
  if (!els.length) return;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Group by parent so siblings (e.g. cards in a grid) cascade in with a
  // short stagger instead of popping in all at once.
  var groups = [];
  els.forEach(function (el) {
    el.classList.add("reveal");
    var group = null;
    for (var i = 0; i < groups.length; i++) {
      if (groups[i].parent === el.parentElement) {
        group = groups[i];
        break;
      }
    }
    if (!group) {
      group = { parent: el.parentElement, items: [] };
      groups.push(group);
    }
    group.items.push(el);
  });
  groups.forEach(function (group) {
    group.items.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 70, 420) + "ms";
    });
  });

  if (prefersReduced || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("reveal-in"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -15% 0px" }
  );

  els.forEach(function (el) { observer.observe(el); });
});
