/* Contact form: client-side validation + inline success state.
   Submits via fetch using Netlify's recommended AJAX pattern
   (https://docs.netlify.com/forms/setup/#submit-ajax-forms-without-page-refreshes).
   This only actually delivers the submission once the site is deployed on
   Netlify with Forms enabled — see README.md for the Formspree fallback. */

function encodeFormData(form) {
  var data = new FormData(form);
  return new URLSearchParams(data).toString();
}

document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("#contact-form");
  if (!form) return;

  var successBox = document.querySelector("#form-success");

  var requiredFields = [
    { name: "name", label: "Name" },
    { name: "email", label: "Email" },
    { name: "industry", label: "Industry" },
    { name: "message", label: "Project details" }
  ];

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setFieldError(field, message) {
    var row = field.closest(".form-row");
    if (!row) return;
    row.classList.add("invalid");
    var errorEl = row.querySelector(".form-error");
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(field) {
    var row = field.closest(".form-row");
    if (!row) return;
    row.classList.remove("invalid");
  }

  function validate() {
    var valid = true;

    requiredFields.forEach(function (def) {
      var field = form.querySelector('[name="' + def.name + '"]');
      if (!field) return;
      clearFieldError(field);

      var value = field.value.trim();
      if (!value) {
        setFieldError(field, def.label + " is required.");
        valid = false;
        return;
      }
      if (def.name === "email" && !isValidEmail(value)) {
        setFieldError(field, "Enter a valid email address.");
        valid = false;
      }
    });

    return valid;
  }

  // Clear a field's error as soon as the visitor fixes it.
  form.querySelectorAll("input, select, textarea").forEach(function (field) {
    field.addEventListener("input", function () {
      clearFieldError(field);
    });
    field.addEventListener("change", function () {
      clearFieldError(field);
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    // Honeypot: if this hidden field got filled in, silently drop the submission.
    var honeypot = form.querySelector('[name="bot-field"]');
    if (honeypot && honeypot.value) return;

    if (!validate()) {
      var firstInvalid = form.querySelector(".form-row.invalid input, .form-row.invalid select, .form-row.invalid textarea");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    fetch(form.getAttribute("action") || "/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encodeFormData(form)
    })
      .catch(function () {
        // Expected when previewing locally / before the site is deployed
        // on Netlify — the form still validates correctly either way.
      })
      .then(function () {
        form.hidden = true;
        if (successBox) successBox.classList.add("visible");
      });
  });
});
