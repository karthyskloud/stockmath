(() => {
  const normalizePath = (path) => path.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  const currentPath = normalizePath(window.location.pathname);
  const header = document.querySelector("header");
  if (!header) return;

  const brand = header.querySelector("h2");
  if (brand && !brand.querySelector("a")) {
    const homeLink = document.createElement("a");
    homeLink.className = "site-nav__brand";
    homeLink.href = "/";
    homeLink.setAttribute("aria-label", "StockMath home");
    homeLink.textContent = brand.textContent;
    brand.replaceChildren(homeLink);
  }

  if (currentPath === "/") return;

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Page navigation");

  const link = document.createElement("a");
  link.className = "site-nav__link";
  link.href = "/";
  link.textContent = "← All calculators";
  nav.appendChild(link);
  header.insertAdjacentElement("afterend", nav);

  const style = document.createElement("style");
  style.textContent = `
    .site-nav__brand { color:inherit; text-decoration:none; }
    .site-nav__brand:focus-visible { outline:2px solid #fff; outline-offset:4px; }
    .site-nav { background:#111; border-top:1px solid #303030; }
    .site-nav__link { display:inline-block; padding:11px 24px; color:#e5e7eb; font-size:14px; text-decoration:none; }
    .site-nav__link:hover { color:#fff; text-decoration:underline; }
    .site-nav__link:focus-visible { outline:2px solid #fff; outline-offset:-3px; }
    .input-label { display:block; margin:0 0 5px; color:#424b55; font-size:14px; font-weight:600; }
    input { box-sizing:border-box; }
    .result:empty { display:none; }
  `;
  document.head.appendChild(style);
})();
