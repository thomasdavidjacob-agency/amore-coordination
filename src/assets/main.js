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

// ===== FAQ accordion =====
const faqList = document.getElementById("faqList");
if (faqList) {
  faqList.querySelectorAll(".faq__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const open = item.classList.contains("is-open");
      faqList.querySelectorAll(".faq__item").forEach((i) => {
        i.classList.remove("is-open");
        i.querySelector(".faq__a").style.maxHeight = null;
      });
      if (!open) {
        item.classList.add("is-open");
        const a = item.querySelector(".faq__a");
        a.style.maxHeight = a.scrollHeight + 40 + "px";
      }
    });
  });
}

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
