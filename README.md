# Webcraft

A static, no-build-step marketing site for a web/software agency serving
automotive businesses first, and construction businesses second. Plain
HTML/CSS/JS — same approach as the `u-r-nursery` site in this repo.

## Preview locally

No build step needed. Either:

- Open `index.html` directly in a browser, or
- Run a local server from this folder for cleaner relative-path behavior:

```bash
npx live-server .
```

## Personalization checklist

Before this goes live, replace the placeholders below (they're marked
throughout the HTML files as well):

- [x] **Business name** — `Webcraft` everywhere (nav brand, page titles,
      footer, meta descriptions).
- [ ] **Logo/icon** — `images/logo.png` (full lockup, used as a faint hero
      watermark) and `images/logo-icon.png` (icon-only, used in the nav and
      footer). Swap for your final logo files (keep the same filenames to
      avoid editing every page, or update the `<img src="...">` references
      in each `.html` file).
- [ ] **Phone number** — `(555) 123-4567` / `tel:5551234567` appears in the
      header, footer, and contact page.
- [ ] **Email** — `hello@webcraft.example` appears in the footer and
      contact page.
- [ ] **Service area** — placeholder text on `contact.html`.
- [ ] **Founder/company story** — placeholder paragraph on `about.html`,
      clearly bracketed with `[...]`.
- [ ] **Pricing** — the three tiers on `services.html` (`$1,500`, `$3,500`,
      `$750/mo`) are placeholder numbers. Replace with your real rates.
- [ ] **Photo placeholders** — the gradient blocks with a person icon (e.g.
      on `about.html`) are stand-ins for real photos.
- [ ] **Portfolio** — `work.html` and `index.html` link out to the
      `u-r-nursery` project as a real example. As you complete client work,
      add more project cards using the same `.card` pattern.
- [ ] **Colors** — the warm copper-on-charcoal theme lives entirely in CSS
      custom properties at the top of `css/style.css` (`:root { ... }`).
      Change those variables to re-theme the whole site at once.

## Deploying, and making the contact form actually work

The contact form (`contact.html`) is pre-wired for **Netlify Forms** —
zero backend required:

1. Push this folder to a Git repo (or drag-and-drop the folder) and deploy
   it on [Netlify](https://www.netlify.com/).
2. Netlify automatically detects the form because of the `data-netlify="true"`
   attribute and the hidden `form-name` input — no extra config needed.
3. Submissions show up in **Site settings → Forms** in the Netlify
   dashboard, and you can turn on email notifications there.

**If you host somewhere other than Netlify** (Vercel, GitHub Pages, your own
server, etc.), Netlify Forms won't work. Easiest fix: switch to
[Formspree](https://formspree.io/):

1. Create a free Formspree account and get your form endpoint
   (`https://formspree.io/f/xxxxxxx`).
2. In `contact.html`, change the `<form>` tag's `action` to that endpoint
   and remove `data-netlify="true"` and `netlify-honeypot="bot-field"`.
3. In `js/form.js`, the `fetch(...)` call already posts to
   `form.getAttribute("action")`, so no JS changes are needed — just make
   sure the form's `action` attribute is set to the Formspree URL.

The honeypot field (`bot-field`) works with either service as basic spam
protection — leave it in place either way.

## Structure

```
webcraft/
  index.html       Homepage
  services.html     Services + pricing
  work.html         Approach + live example project
  about.html        Story, values, who we serve
  contact.html      Contact form
  css/style.css     Shared theme (all colors as CSS variables)
  js/nav.js         Mobile nav toggle
  js/form.js        Contact form validation + submission
  images/           Drop real photos here
```
