// ===== Nav: scroll state + mobile toggle =====
const nav = document.getElementById("nav");
if (nav && nav.classList.contains("nav--solid") === false) {
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 60);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("is-open"));
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") navLinks.classList.remove("is-open");
  });
}

// ===== Hero carousel =====
const slides = Array.from(document.querySelectorAll(".hero__slide"));
const dotsWrap = document.getElementById("heroDots");
if (slides.length && dotsWrap) {
  let current = 0;
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    if (i === 0) dot.classList.add("is-active");
    dot.setAttribute("aria-label", "Go to slide " + (i + 1));
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);
  const goTo = (i) => {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
  };
  let timer = setInterval(() => goTo(current + 1), 5500);
  dotsWrap.addEventListener("click", () => {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5500);
  });
}

// ===== Accordions (FAQ, package detail, embellishments) =====
document.querySelectorAll("[data-accordion]").forEach((list) => {
  list.querySelectorAll(".acc__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const open = item.classList.contains("is-open");
      list.querySelectorAll(".acc__item").forEach((i) => {
        i.classList.remove("is-open");
        i.querySelector(".acc__a").style.maxHeight = null;
      });
      if (!open) {
        item.classList.add("is-open");
        const a = item.querySelector(".acc__a");
        a.style.maxHeight = a.scrollHeight + 40 + "px";
      }
    });
  });
});

// ===== Gallery lightbox (per-couple pages) =====
const pgallery = document.getElementById("pgallery");
const lb = document.getElementById("lightbox");
if (pgallery && lb) {
  const photos = Array.from(pgallery.querySelectorAll("img")).map((img) => img.dataset.full || img.src);
  const lbMain = document.getElementById("lbMain");
  const lbCount = document.getElementById("lbCount");
  let idx = 0;

  const show = (i) => {
    idx = (i + photos.length) % photos.length;
    lbMain.style.opacity = "0";
    const im = new Image();
    im.onload = () => { lbMain.src = im.src; lbMain.style.opacity = "1"; };
    im.src = photos[idx];
    lbCount.textContent = `${idx + 1} / ${photos.length}`;
  };
  const open = (i) => { show(i); lb.classList.add("is-open"); document.body.style.overflow = "hidden"; };
  const close = () => { lb.classList.remove("is-open"); document.body.style.overflow = ""; };

  pgallery.querySelectorAll("button.pgallery__item").forEach((b, i) =>
    b.addEventListener("click", () => open(i))
  );
  document.getElementById("lbClose").addEventListener("click", close);
  document.getElementById("lbPrev").addEventListener("click", () => show(idx - 1));
  document.getElementById("lbNext").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
}

// ===== Reveal on scroll =====
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    });
  },
  { threshold: 0.12 }
);
document
  .querySelectorAll(".section__head, .about__media, .about__body, .pkg, .addons, .awards img, .intro__text, .card, .pgallery__item, .postcard")
  .forEach((el) => { el.classList.add("reveal"); io.observe(el); });

// ===== Year =====
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Inquiry form =====
const inquiryForm = document.getElementById("inquiryForm");
if (inquiryForm) {
  const tField = document.getElementById("_formT");
  if (tField) tField.value = Date.now().toString();

  inquiryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("formSubmit");
    const errEl = document.getElementById("formError");
    const successEl = document.getElementById("formSuccess");
    const data = Object.fromEntries(new FormData(inquiryForm));
    btn.disabled = true;
    btn.textContent = "Sending…";
    errEl.hidden = true;
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      inquiryForm.hidden = true;
      successEl.hidden = false;
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = "Send Inquiry";
    }
  });
}

// ===== Private event offer (/offer/<slug>/) =====
const offerEl = document.getElementById("offer");
if (offerEl) {
  const deadline = new Date(offerEl.dataset.expires).getTime();
  const units = offerEl.querySelectorAll("[data-unit]");
  const pad = (n) => String(n).padStart(2, "0");

  const closeOffer = () => {
    document.getElementById("offerOpen").hidden = true;
    document.getElementById("offerClosed").hidden = false;
    document.getElementById("offerClock").hidden = true;
  };

  const tick = () => {
    const left = deadline - Date.now();
    if (left <= 0) { closeOffer(); return false; }
    const vals = {
      d: Math.floor(left / 86400000),
      h: Math.floor(left / 3600000) % 24,
      m: Math.floor(left / 60000) % 60,
      s: Math.floor(left / 1000) % 60,
    };
    units.forEach((u) => { u.textContent = pad(vals[u.dataset.unit]); });
    return true;
  };
  if (tick()) {
    const timer = setInterval(() => { if (!tick()) clearInterval(timer); }, 1000);
  }

  const offerForm = document.getElementById("offerForm");
  document.getElementById("_offerT").value = Date.now().toString();

  offerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("offerSubmit");
    const errEl = document.getElementById("offerError");
    const data = Object.fromEntries(new FormData(offerForm));
    // Carry the QR's UTM tags through so the lead email shows where it came from
    const params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign"].forEach((k) => {
      if (params.get(k)) data[k] = params.get(k);
    });
    btn.disabled = true;
    btn.textContent = "One moment…";
    errEl.hidden = true;
    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.status === 410) { closeOffer(); return; }
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      offerForm.hidden = true;
      document.getElementById("offerCode").textContent = json.code || "Check your inbox";
      document.getElementById("offerReveal").hidden = false;
    } catch (err) {
      errEl.textContent = err.message;
      errEl.hidden = false;
      btn.disabled = false;
      btn.textContent = "Reveal My Code";
    }
  });
}
