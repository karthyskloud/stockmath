(() => {
  const calculatorLinks = [
    { href: "/", label: "Average" },
    { href: "/profit-loss-calculator/", label: "Profit / Loss" },
    { href: "/position-size-calculator/", label: "Position Size" },
    { href: "/stock-split-calculator/", label: "Stock Split" },
    { href: "/trading-charges-calculator/", label: "Trading Charges" },
    { href: "/brokerage-calculator/", label: "Brokerage" },
    { href: "/nifty50-calculator/", label: "NIFTY 50" }
  ];

  const normalizePath = (path) => path.replace(/\/index\.html$/, "").replace(/\/$/, "") || "/";
  const currentPath = normalizePath(window.location.pathname);
  const header = document.querySelector("header");
  if (!header) return;

  const nav = document.createElement("nav");
  nav.className = "site-nav";
  nav.setAttribute("aria-label", "Calculators");

  const links = document.createElement("div");
  links.className = "site-nav__links";

  for (const item of calculatorLinks) {
    const link = document.createElement("a");
    link.className = "site-nav__link";
    link.href = item.href;
    link.textContent = item.label;
    if (normalizePath(item.href) === currentPath) {
      link.setAttribute("aria-current", "page");
    }
    links.appendChild(link);
  }

  nav.appendChild(links);
  header.insertAdjacentElement("afterend", nav);

  const style = document.createElement("style");
  style.textContent = `
    .site-nav { background:#111; border-top:1px solid #303030; }
    .site-nav__links { display:flex; justify-content:center; gap:4px; max-width:1100px; margin:0 auto; padding:0 16px; overflow-x:auto; scrollbar-width:thin; }
    .site-nav__link { flex:none; padding:12px 10px; border-bottom:2px solid transparent; color:#e5e7eb; font-size:14px; text-decoration:none; white-space:nowrap; }
    .site-nav__link:hover { color:#fff; border-bottom-color:#7db4ff; }
    .site-nav__link[aria-current="page"] { color:#fff; border-bottom-color:#58a6ff; font-weight:700; }
    .site-nav__link:focus-visible { outline:2px solid #fff; outline-offset:-3px; }
    .input-label { display:block; margin:0 0 5px; color:#424b55; font-size:14px; font-weight:600; }
    input { box-sizing:border-box; }
    .result:empty { display:none; }
    @media (max-width:600px) { .site-nav__links { justify-content:flex-start; } }
  `;
  document.head.appendChild(style);
})();
