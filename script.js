const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const navLinks = Array.from(document.querySelectorAll(".site-nav a"));
const navSections = navLinks
  .map((link) => link.getAttribute("href"))
  .filter((href) => href?.startsWith("#") && href.length > 1)
  .map((href) => document.querySelector(href))
  .filter(Boolean);
const partnerLogoConfig = {
  basePath: "assets/partners",
  filePrefix: "logo-",
  slots: 60,
  extensions: ["png"],
};
const partnerNameMap = new Map([
  [1, "瑞德智能"],
  [2, "JAKA"],
  [3, "中国科学技术大学"],
  [4, "奥比中光 ORBBEC"],
  [6, "宇树科技"],
  [7, "亚博智能"],
  [8, "云深处科技 DEEP Robotics"],
]);
const articleContentPath = "content/articles.json";

function setNavOpen(isOpen) {
  header?.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("nav-open", isOpen);
  toggle?.setAttribute("aria-expanded", String(isOpen));

  const icon = toggle?.querySelector("i");
  if (icon) {
    icon.setAttribute("data-lucide", isOpen ? "x" : "menu");
    window.lucide?.createIcons();
  }
}

function setActiveNav(id) {
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === `#${id}`;
    link.classList.toggle("is-active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateHeaderState() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function getRelativePrefix() {
  return window.location.pathname.includes("/admin/") ? "../" : "";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function resolveAssetPath(src = "", prefix = "") {
  if (!src) return "";
  if (/^(data:|https?:|blob:)/.test(src)) return src;
  return `${prefix}${src}`;
}

const optimizedAssetMap = {
  "assets/articles/image-1780469926846.png": "assets/articles/image-1780469926846.webp",
  "assets/articles/image-1780557846332.png": "assets/articles/image-1780557846332.webp",
  "assets/articles/image-1780557902225.png": "assets/articles/image-1780557902225.webp",
  "assets/capabilities/navigation.png": "assets/capabilities/navigation.webp",
};

function resolveOptimizedAssetPath(src = "", prefix = "") {
  return resolveAssetPath(optimizedAssetMap[src] || src, prefix);
}

function initRevealMotion() {
  document.body.classList.add("has-motion");

  const revealTargets = Array.from(
    document.querySelectorAll(
      [
        ".hero-copy .eyebrow",
        ".hero-copy h1",
        ".hero-copy p",
        ".hero-actions",
        ".hero-proof",
        ".hero-visual",
        ".section-heading",
        ".capability-card",
        ".solution-card",
        ".stack-map",
        ".timeline article",
        ".partner-marquee",
        ".about-image",
        ".about-copy .eyebrow",
        ".about-copy h2",
        ".about-copy p",
        ".about-tags",
        ".about-hero .eyebrow",
        ".about-hero h1",
        ".about-hero p",
        ".about-hero-actions",
        ".about-stat-grid > div",
        ".about-story > p",
        ".about-story article",
        ".history-list article",
        ".join-contact-panel",
        ".contact-inner > div:first-child",
        ".contact-card",
        ".origin-about-copy",
        ".origin-about-visual",
        ".origin-slogan .container",
        ".origin-section-title",
        ".origin-tech-card",
        ".module-section-title",
        ".module-product-card",
        ".module-capability-visual",
        ".module-capability-grid article",
        ".module-spec-layout",
        ".module-wide-figure",
        ".module-proof-badge",
        ".module-proof-grid article",
        ".module-scenario-layout",
        ".module-delivery-steps article",
        ".mm-chain-visual",
        ".mm-chain-step",
        ".mm-detail-media",
        ".mm-detail-copy",
        ".mm-input-subsystems-intro",
        ".mm-input-subsystems-flow",
        ".mm-input-evidence",
        ".mm-input-bridge",
        ".mm-vision-module",
        ".mm-process-panel",
        ".mm-reasoning-flow",
        ".mm-family-layout",
        ".mm-product-item",
        ".mm-engineering-heading",
        ".mm-engineering-grid article",
        ".mm-delivery-flow",
        ".mm-scenario-visual",
        ".mm-scenario-grid article",
        ".mm-contact-band",
        ".mm-map-heading",
        ".mm-path-toolbar",
        ".mm-flow-board",
        ".mm-node-detail",
        ".mm-section-heading",
        ".mm-proof-card",
        ".mm-form-card",
        ".mm-demo-band",
        ".mm-engineering-grid-new article",
        ".home-article-grid",
        ".home-article-actions",
        ".article-card",
      ].join(", "),
    ),
  );

  revealTargets.forEach((target, index) => {
    target.classList.add("reveal");
    target.style.setProperty("--reveal-delay", `${Math.min(index * 55, 420)}ms`);
  });

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

function initActiveSectionTracking() {
  if (!("IntersectionObserver" in window) || navSections.length === 0) {
    return;
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNav(visible.target.id);
      }
    },
    {
      threshold: [0.2, 0.4, 0.6],
      rootMargin: "-28% 0px -55% 0px",
    },
  );

  navSections.forEach((section) => sectionObserver.observe(section));
}

function initAboutTabs() {
  const tabLinks = Array.from(document.querySelectorAll(".about-tab-nav a"));
  const sections = tabLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (tabLinks.length === 0 || sections.length === 0) {
    return;
  }

  const setActiveTab = (id) => {
    const nextSection = sections.find((section) => section.id === id) || sections[0];
    const nextId = nextSection.id;

    tabLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${nextId}`;
      link.classList.toggle("is-active", isActive);
      link.toggleAttribute("aria-current", isActive);
    });

    sections.forEach((section) => {
      section.hidden = section.id !== nextId;
    });
  };

  tabLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const id = link.getAttribute("href").slice(1);
      setActiveTab(id);
      history.pushState(null, "", `#${id}`);
    });
  });

  const initialId = window.location.hash.replace("#", "") || sections[0].id;
  if (sections.some((section) => section.id === initialId)) {
    setActiveTab(initialId);
  } else {
    setActiveTab(sections[0].id);
  }

  window.addEventListener("hashchange", () => {
    const id = window.location.hash.replace("#", "");
    if (sections.some((section) => section.id === id)) {
      setActiveTab(id);
    }
  });
}

function initHeroParallax() {
  const hero = document.querySelector(".hero");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");

  if (!hero || reduceMotion.matches || coarsePointer.matches) {
    return;
  }

  let frameId = 0;

  const applyMotion = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      hero.style.setProperty("--hero-card-x", `${(x * 10).toFixed(2)}px`);
      hero.style.setProperty("--hero-card-y", `${(y * 8).toFixed(2)}px`);
      hero.style.setProperty("--hero-grid-x", `${(x * -14).toFixed(2)}px`);
      hero.style.setProperty("--hero-grid-y", `${(y * -10).toFixed(2)}px`);
      hero.style.setProperty("--hero-tilt-x", `${(x * 2.4).toFixed(2)}deg`);
      hero.style.setProperty("--hero-tilt-y", `${(y * -2).toFixed(2)}deg`);
    });
  };

  const resetMotion = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      hero.style.setProperty("--hero-card-x", "0px");
      hero.style.setProperty("--hero-card-y", "0px");
      hero.style.setProperty("--hero-grid-x", "0px");
      hero.style.setProperty("--hero-grid-y", "0px");
      hero.style.setProperty("--hero-tilt-x", "0deg");
      hero.style.setProperty("--hero-tilt-y", "0deg");
    });
  };

  hero.addEventListener("pointermove", applyMotion, { passive: true });
  hero.addEventListener("pointerleave", resetMotion);
}

function initHoverVideos() {
  const videoCards = Array.from(document.querySelectorAll("[data-hover-video]"));

  const updateVideoUi = (card, video, isPlaying) => {
    const toggleButton = card.querySelector("[data-video-toggle]");

    card.classList.toggle("is-playing", isPlaying);
    toggleButton?.setAttribute("aria-label", isPlaying ? "暂停落地产品视频" : "播放落地产品视频");

    const label = toggleButton?.querySelector("span");
    const icon = toggleButton?.querySelector("i");

    if (label) label.textContent = isPlaying ? "暂停视频" : "播放视频";
    if (icon) {
      icon.setAttribute("data-lucide", isPlaying ? "pause" : "play");
      window.lucide?.createIcons();
    }
  };

  const playCardVideo = async (card) => {
    const video = card?.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    try {
      await video.play();
      updateVideoUi(card, video, true);
    } catch {
      updateVideoUi(card, video, false);
    }
  };

  const pauseCardVideo = (card) => {
    const video = card?.querySelector("video");
    if (!video) return;
    video.pause();
    updateVideoUi(card, video, false);
  };

  if (document.body.dataset.hoverVideoDelegated !== "true") {
    document.body.dataset.hoverVideoDelegated = "true";

    document.addEventListener("mousemove", (event) => {
      const card = event.target.closest?.("[data-hover-video]");
      if (card) playCardVideo(card);
    });

    document.addEventListener("mouseout", (event) => {
      const card = event.target.closest?.("[data-hover-video]");
      if (!card || card.contains(event.relatedTarget)) return;
      pauseCardVideo(card);
    });
  }

  videoCards.forEach((card) => {
    if (card.dataset.hoverVideoReady === "true") return;

    const video = card.querySelector("video");
    const toggleButton = card.querySelector("[data-video-toggle]");

    if (!video) return;

    card.dataset.hoverVideoReady = "true";

    video.muted = true;
    video.playsInline = true;

    const setPlayingState = (isPlaying) => updateVideoUi(card, video, isPlaying);
    const playVideo = () => playCardVideo(card);
    const pauseVideo = () => pauseCardVideo(card);

    card.addEventListener("mouseenter", playVideo);
    card.addEventListener("mousemove", () => {
      if (video.paused) playVideo();
    });
    card.addEventListener("mouseleave", pauseVideo);
    card.addEventListener("pointerenter", playVideo);
    card.addEventListener("pointerleave", pauseVideo);
    card.addEventListener("focusin", playVideo);
    card.addEventListener("focusout", (event) => {
      if (!card.contains(event.relatedTarget)) pauseVideo();
    });

    card.addEventListener("click", () => {
      if (video.paused) {
        playVideo();
      } else {
        pauseVideo();
      }
    });

    toggleButton?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (video.paused) {
        playVideo();
      } else {
        pauseVideo();
      }
    });

    video.addEventListener("pause", () => setPlayingState(false));
    video.addEventListener("play", () => setPlayingState(true));
  });
}

function initJoinMailForm() {
  const form = document.querySelector(".join-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const recipient = form.dataset.mailTo || "pengzhang@eiinside.com";
    const subject = String(formData.get("subject") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!subject || !email || !message) {
      form.reportValidity();
      return;
    }

    const mailSubject = `【加入我们】${subject}`;
    const mailBody = [
      `联系邮箱：${email}`,
      phone ? `联系电话：${phone}` : "",
      "",
      "留言内容：",
      message,
    ].filter((line, index, lines) => line || lines[index - 1]).join("\n");

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
  });
}

async function loadArticleData() {
  try {
    const response = await fetch(`${getRelativePrefix()}${articleContentPath}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const articles = await response.json();
    return Array.isArray(articles) ? articles : [];
  } catch (error) {
    return [];
  }
}

function renderArticleBlocks(blocks = [], prefix = "") {
  return blocks.map((block) => {
    if (block.type === "html") return sanitizeArticleHtml(block.html || "", prefix);
    if (block.type === "heading") return `<h2>${escapeHtml(block.text)}</h2>`;
    if (block.type === "paragraph") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "quote") return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    if (block.type === "code") return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    if (block.type === "image") {
      return `
        <figure>
          <img src="${escapeHtml(resolveOptimizedAssetPath(block.src, prefix))}" alt="${escapeHtml(block.caption || "")}" loading="lazy" decoding="async">
          ${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}
        </figure>
      `;
    }
    if (block.type === "list") {
      return `<ul>${(block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
    }
    return "";
  }).join("");
}

function sanitizeArticleHtml(html = "", prefix = "") {
  const shell = document.createElement("div");
  shell.innerHTML = html;

  shell.querySelectorAll("script, style, iframe, object, embed").forEach((node) => node.remove());
  shell.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      if (attr.name.startsWith("on")) node.removeAttribute(attr.name);
      if (attr.name === "style") node.removeAttribute(attr.name);
    });

    if (node.tagName === "IMG") {
      const src = node.getAttribute("src") || "";
      if (/^(data:|https?:|blob:)/.test(src)) return;
      if (src.startsWith("../")) {
        node.setAttribute("src", src.replace(/^\.\.\//, prefix));
        return;
      }
      node.setAttribute("src", resolveAssetPath(src, prefix));
    }
  });

  return shell.innerHTML;
}

function formatDate(date) {
  if (!date) return "";
  return date.replaceAll("-", ".");
}

async function initArticleList() {
  const restList = document.querySelector("[data-article-list]");
  if (!restList) return;

  const featured = document.querySelector("[data-article-featured]");
  const latestSection = document.querySelector("[data-article-latest-section]");
  const latestList = document.querySelector("[data-article-latest]");
  const restSection = document.querySelector("[data-article-rest-section]");
  const pagination = document.querySelector("[data-article-pagination]");
  const empty = document.querySelector("[data-article-empty]");
  const categories = document.querySelector("[data-article-categories]");
  const prefix = getRelativePrefix();
  const pageSize = 20;
  let currentPage = 1;
  let activeCategory = "全部";

  const articles = (await loadArticleData())
    .filter((article) => article.status === "published")
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

  if (articles.length === 0) {
    empty.hidden = false;
    restList.innerHTML = "";
    return;
  }

  const allCategories = ["全部", ...new Set(articles.map((article) => article.category || "未分类"))];

  const articleCard = (article, className = "article-card") => `
    <a class="${className}" href="article.html?id=${encodeURIComponent(article.id)}">
      <img src="${escapeHtml(resolveOptimizedAssetPath(article.cover || "assets/articles/robot-common-technology.svg", prefix))}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async">
      <span>${escapeHtml(article.category || "未分类")} · ${formatDate(article.publishedAt)}</span>
      <h2>${escapeHtml(article.title)}</h2>
      <p>${escapeHtml(article.summary || "")}</p>
    </a>
  `;

  const articleRow = (article) => `
    <a class="article-row" href="article.html?id=${encodeURIComponent(article.id)}">
      <div>
        <span>${escapeHtml(article.category || "未分类")} · ${formatDate(article.publishedAt)}</span>
        <h3>${escapeHtml(article.title)}</h3>
        <p>${escapeHtml(article.summary || "")}</p>
      </div>
      <i data-lucide="arrow-right"></i>
    </a>
  `;

  const renderCategories = () => {
    categories.innerHTML = allCategories.map((category) => `
      <button class="${category === activeCategory ? "is-active" : ""}" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
    `).join("");
  };

  const renderPagination = (totalPages) => {
    if (!pagination || totalPages <= 1) {
      if (pagination) pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = `
      <button type="button" data-page-prev ${currentPage === 1 ? "disabled" : ""}>上一页</button>
      <span>${currentPage} / ${totalPages}</span>
      <button type="button" data-page-next ${currentPage === totalPages ? "disabled" : ""}>下一页</button>
    `;
  };

  const renderArticles = () => {
    const filtered = activeCategory === "全部"
      ? articles
      : articles.filter((article) => (article.category || "未分类") === activeCategory);

    empty.hidden = filtered.length > 0;

    const pinned = filtered.find((article) => article.pinned);
    const excludedIds = new Set();

    if (pinned) {
      excludedIds.add(pinned.id);
      featured.hidden = false;
      featured.innerHTML = `
        <a class="article-featured-card" href="article.html?id=${encodeURIComponent(pinned.id)}">
          <img src="${escapeHtml(resolveOptimizedAssetPath(pinned.cover || "assets/articles/robot-common-technology.svg", prefix))}" alt="${escapeHtml(pinned.title)}" loading="eager" decoding="async">
          <div>
            <span>${escapeHtml(pinned.category || "未分类")} · ${formatDate(pinned.publishedAt)}</span>
            <h2>${escapeHtml(pinned.title)}</h2>
            <p>${escapeHtml(pinned.summary || "")}</p>
          </div>
        </a>
      `;
    } else if (featured) {
      featured.hidden = true;
      featured.innerHTML = "";
    }

    const latestArticles = filtered
      .filter((article) => !excludedIds.has(article.id))
      .slice(0, 3);
    latestArticles.forEach((article) => excludedIds.add(article.id));

    if (latestArticles.length > 0) {
      latestSection.hidden = false;
      latestList.innerHTML = latestArticles.map((article) => articleCard(article)).join("");
    } else if (latestSection) {
      latestSection.hidden = true;
      latestList.innerHTML = "";
    }

    const restArticles = filtered.filter((article) => !excludedIds.has(article.id));
    const totalPages = Math.max(1, Math.ceil(restArticles.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const pageArticles = restArticles.slice(start, start + pageSize);

    if (pageArticles.length > 0) {
      restSection.hidden = false;
      restList.innerHTML = pageArticles.map(articleRow).join("");
    } else if (restSection) {
      restSection.hidden = true;
      restList.innerHTML = "";
    }

    renderPagination(totalPages);
    window.lucide?.createIcons();
  };

  categories.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    currentPage = 1;
    renderCategories();
    renderArticles();
  });

  pagination?.addEventListener("click", (event) => {
    if (event.target.closest("[data-page-prev]")) currentPage -= 1;
    if (event.target.closest("[data-page-next]")) currentPage += 1;
    renderArticles();
  });

  renderCategories();
  renderArticles();
}

async function initHomeArticles() {
  const list = document.querySelector("[data-home-articles]");
  if (!list) return;

  const prefix = getRelativePrefix();
  const articles = (await loadArticleData())
    .filter((article) => article.status === "published")
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));

  if (articles.length === 0) {
    list.innerHTML = `
      <div class="article-empty">暂无文章内容。</div>
    `;
    return;
  }

  const pinned = articles.find((article) => article.pinned);
  const latest = articles
    .filter((article) => article.id !== pinned?.id)
    .slice(0, 3);

  const featuredHtml = pinned ? `
    <a class="article-featured-card home-featured-card" href="article.html?id=${encodeURIComponent(pinned.id)}">
      <img src="${escapeHtml(resolveOptimizedAssetPath(pinned.cover || "assets/articles/robot-common-technology.svg", prefix))}" alt="${escapeHtml(pinned.title)}" loading="lazy" decoding="async">
      <div>
        <span>${escapeHtml(pinned.category || "未分类")} · ${formatDate(pinned.publishedAt)}</span>
        <h2>${escapeHtml(pinned.title)}</h2>
        <p>${escapeHtml(pinned.summary || "")}</p>
      </div>
    </a>
  ` : "";

  const latestHtml = latest.map((article) => `
    <a class="article-card home-article-card" href="article.html?id=${encodeURIComponent(article.id)}">
      <img src="${escapeHtml(resolveOptimizedAssetPath(article.cover || "assets/articles/robot-common-technology.svg", prefix))}" alt="${escapeHtml(article.title)}" loading="lazy" decoding="async">
      <span>${escapeHtml(article.category || "未分类")} · ${formatDate(article.publishedAt)}</span>
      <h2>${escapeHtml(article.title)}</h2>
      <p>${escapeHtml(article.summary || "")}</p>
    </a>
  `).join("");

  list.classList.toggle("has-featured", Boolean(pinned));
  list.innerHTML = `${featuredHtml}${latestHtml}`;
}

async function initArticleDetail() {
  const shell = document.querySelector("[data-article-detail]");
  if (!shell) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const prefix = getRelativePrefix();
  const articles = await loadArticleData();
  const publishedArticles = articles
    .filter((item) => item.status === "published")
    .sort((a, b) => String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")));
  const article = publishedArticles.find((item) => item.id === id) || publishedArticles[0];

  if (!article) {
    shell.innerHTML = `
      <header class="article-detail-head">
        <span>暂无文章</span>
        <h1>没有找到文章内容</h1>
        <p>暂无可展示的文章内容。</p>
      </header>
    `;
    return;
  }

  document.title = `${article.title} | EIINSIDE 具身因赛`;
  shell.innerHTML = `
    <header class="article-detail-head">
      <span>${escapeHtml(article.category || "未分类")}</span>
      <h1>${escapeHtml(article.title)}</h1>
      <p>${escapeHtml(article.summary || "")}</p>
      <small>${formatDate(article.publishedAt)} · ${escapeHtml(article.author || "具身因赛")}</small>
    </header>
    ${article.cover ? `<img class="article-cover" src="${escapeHtml(resolveOptimizedAssetPath(article.cover, prefix))}" alt="${escapeHtml(article.title)}" loading="eager" decoding="async">` : ""}
    <div class="article-content">${renderArticleBlocks(article.content || [], prefix)}</div>
  `;
}

function initPartnerLogoFallback() {
  document.querySelectorAll(".partner-logo img").forEach((image) => {
    const logo = image.closest(".partner-logo");
    if (!logo) return;

    const setFallback = () => logo.classList.add("is-fallback");

    if (image.complete && image.naturalWidth === 0) {
      setFallback();
      return;
    }

    image.addEventListener("error", setFallback, { once: true });
    image.addEventListener("load", () => logo.classList.remove("is-fallback"), { once: true });
  });
}

function probePartnerLogo(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(src);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

async function discoverLocalPartnerLogos() {
  const candidates = [];

  for (let slot = 1; slot <= partnerLogoConfig.slots; slot += 1) {
    const index = String(slot).padStart(2, "0");
    partnerLogoConfig.extensions.forEach((extension, extensionIndex) => {
      candidates.push({
        slot,
        extensionIndex,
        src: `${partnerLogoConfig.basePath}/${partnerLogoConfig.filePrefix}${index}.${extension}`,
      });
    });
  }

  const checks = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      loadedSrc: await probePartnerLogo(candidate.src),
    })),
  );

  return Array.from(
    checks
      .filter((candidate) => candidate.loadedSrc)
      .sort((a, b) => a.slot - b.slot || a.extensionIndex - b.extensionIndex)
      .reduce((map, candidate) => {
        if (!map.has(candidate.slot)) {
          map.set(candidate.slot, {
            src: candidate.loadedSrc,
            name: partnerNameMap.get(candidate.slot) || `合作伙伴 ${String(candidate.slot).padStart(2, "0")}`,
          });
        }
        return map;
      }, new Map())
      .values(),
  );
}

function renderPartnerLogos(partners) {
  const track = document.querySelector(".partner-track");
  if (!track || partners.length === 0) return;

  const group = [];
  while (group.length < Math.max(partners.length, 8)) {
    group.push(...partners);
  }

  track.innerHTML = "";
  [...group, ...group].forEach((partner, index) => {
    const logo = document.createElement("div");
    logo.className = "partner-logo";
    logo.style.setProperty("--partner-color", "#1677ff");

    if (index >= group.length) {
      logo.setAttribute("aria-hidden", "true");
    }

    const image = document.createElement("img");
    image.src = partner.src;
    image.alt = index < group.length ? partner.name : "";

    const label = document.createElement("span");
    label.textContent = partner.name;

    logo.append(image, label);
    track.append(logo);
  });
}

async function initPartnerLogos() {
  if (!document.querySelector(".partner-track")) {
    return;
  }

  const localPartners = await discoverLocalPartnerLogos();

  if (localPartners.length > 0) {
    renderPartnerLogos(localPartners);
  }

  initPartnerLogoFallback();
}

function initMultimodalCapabilityMap() {
  const board = document.querySelector("[data-mm-board]");
  if (!board) return;

  const nodeData = {
    microphone: {
      stage: "信源层 / 声学输入",
      title: "麦克风阵列",
      description: "通过阵列拾音、音频增强、回声消除和声源定位，在远场、噪声与多人环境中提取目标声音。",
      receives: "现场声音、回声与环境噪声",
      links: ["asr"],
    },
    camera: {
      stage: "信源层 / 视觉输入",
      title: "摄像头",
      description: "采集人脸、唇形、动作与环境画面，并与声源方向对齐，帮助系统确认当前交互对象。",
      receives: "人脸、唇形、动作与环境画面",
      links: ["llm"],
    },
    asr: {
      stage: "思考层 / 语音识别",
      title: "ASR 语音识别",
      description: "把连续语音流转换为文本，支持中文、方言和英文识别，为语义理解提供稳定输入。",
      receives: "增强后的目标音频",
      links: ["llm"],
    },
    llm: {
      stage: "思考层 / 理解与决策",
      title: "LLM 与多模态模型",
      description: "结合语言、视觉、对话记忆和业务信息完成意图理解、深度推理、能力调用与任务决策。",
      receives: "语音文本、视觉信息、业务上下文",
      links: ["tts", "digital-human", "robot"],
    },
    tts: {
      stage: "思考层 / 语音生成",
      title: "TTS 语音生成",
      description: "将回复内容转换为自然语音，可按产品角色选择音色、情感和语速。",
      receives: "模型生成的回复内容",
      links: ["digital-human", "speaker", "robot"],
    },
    "digital-human": {
      stage: "展现层 / 数字人",
      title: "数字人交互",
      description: "同步声音、口型、表情与动作，完成唤醒、实时问答和可视化服务表达。",
      receives: "回复内容、合成语音与动作指令",
      links: [],
    },
    speaker: {
      stage: "展现层 / 智能音箱",
      title: "智能音箱",
      description: "通过自然语音完成问答、状态播报、播放控制和设备控制确认。",
      receives: "合成语音与控制结果",
      links: [],
    },
    robot: {
      stage: "展现层 / 机器人",
      title: "机器人交互与执行",
      description: "将用户意图转化为导航、查询、设备联动和机器人动作，并通过语音反馈执行状态。",
      receives: "结构化任务、动作指令与合成语音",
      links: [],
    },
  };

  const pathData = {
    all: {
      nodes: Object.keys(nodeData),
      stage: "平台全貌",
      title: "感知、理解、生成与执行完整协同",
      description: "感知、理解、生成与执行模块按产品需求灵活组合，形成完整的人机交互能力。",
      upstream: "声音与视觉信号",
      current: "全链路协同",
      downstream: "数字人、智能音箱与机器人",
    },
    "digital-human": {
      nodes: ["microphone", "camera", "asr", "llm", "tts", "digital-human"],
      stage: "产品链路 / 数字人",
      title: "从视听感知到数字人实时表达",
      description: "声音和画面共同确认交互对象，模型理解需求并生成回复，数字人同步完成语音、口型和动作表达。",
      upstream: "麦克风阵列、摄像头",
      current: "ASR、LLM、TTS",
      downstream: "数字人",
    },
    speaker: {
      nodes: ["microphone", "asr", "llm", "tts", "speaker"],
      stage: "产品链路 / 智能音箱",
      title: "从远场语音到自然回复",
      description: "麦克风阵列获得稳定语音，识别和模型完成理解，最终通过语音合成给出自然反馈。",
      upstream: "麦克风阵列",
      current: "ASR、LLM、TTS",
      downstream: "智能音箱",
    },
    robot: {
      nodes: ["microphone", "camera", "asr", "llm", "tts", "robot"],
      stage: "产品链路 / 机器人",
      title: "从识别交互对象到任务执行",
      description: "视听信息帮助机器人确认用户，模型将自然语言转成任务和动作，并通过语音反馈执行状态。",
      upstream: "麦克风阵列、摄像头",
      current: "ASR、多模态理解、TTS",
      downstream: "机器人控制与执行",
    },
  };

  const nodes = new Map(
    Array.from(board.querySelectorAll("[data-mm-node]")).map((node) => [node.dataset.mmNode, node]),
  );
  const lineGroup = board.querySelector("[data-mm-lines]");
  const svg = board.querySelector(".mm-flow-lines");
  const pathButtons = Array.from(document.querySelectorAll("[data-mm-path]"));
  const pathTriggers = Array.from(document.querySelectorAll("[data-mm-path-trigger]"));
  const detail = document.querySelector("[data-mm-detail]");
  const detailFields = detail ? {
    stage: detail.querySelector("[data-mm-detail-stage]"),
    title: detail.querySelector("[data-mm-detail-title]"),
    description: detail.querySelector("[data-mm-detail-description]"),
    upstream: detail.querySelector("[data-mm-detail-upstream]"),
    current: detail.querySelector("[data-mm-detail-current]"),
    downstream: detail.querySelector("[data-mm-detail-downstream]"),
  } : null;

  let selectedPath = "all";
  let pinnedNode = null;
  let hoveredNode = null;

  const edges = Object.entries(nodeData).flatMap(([from, data]) =>
    data.links.map((to) => ({ from, to })),
  );
  const nodeStages = {
    microphone: "source",
    camera: "source",
    asr: "reasoning",
    llm: "reasoning",
    tts: "reasoning",
    "digital-human": "output",
    speaker: "output",
    robot: "output",
  };
  const layerConnections = [
    { from: "source", to: "reasoning" },
    { from: "reasoning", to: "output" },
  ];
  const layers = {
    source: board.querySelector(".mm-source-layer"),
    reasoning: board.querySelector(".mm-reasoning-layer"),
    output: board.querySelector(".mm-output-layer"),
  };

  const getUpstreamIds = (id) => edges.filter((edge) => edge.to === id).map((edge) => edge.from);
  const getNames = (ids) => ids.map((id) => nodeData[id]?.title).filter(Boolean).join("、");
  const featureGroups = [];

  function getFeatureDirection() {
    return "orbit";
  }

  function drawFeatureLines(group) {
    const svgElement = group.querySelector("[data-mm-feature-lines]");
    const chips = Array.from(group.querySelectorAll("em"));
    const lines = Array.from(svgElement?.querySelectorAll("line") || []);
    if (!svgElement || chips.length === 0 || lines.length !== chips.length) return;

    const width = group.offsetWidth;
    const height = group.offsetHeight;
    if (!width || !height) return;

    const groupRect = group.getBoundingClientRect();
    const node = group.closest(".mm-node-card");
    const nodeRect = node?.getBoundingClientRect();
    if (!nodeRect) return;

    const anchorX = nodeRect.left - groupRect.left + nodeRect.width / 2;
    const anchorY = nodeRect.top - groupRect.top + nodeRect.height / 2;
    const radiusX = Math.max(120, width / 2 - 74);
    const radiusY = Math.max(92, height / 2 - 32);

    chips.forEach((chip, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / chips.length;
      chip.style.left = `${anchorX + Math.cos(angle) * radiusX}px`;
      chip.style.top = `${anchorY + Math.sin(angle) * radiusY}px`;
    });

    svgElement.setAttribute("viewBox", `0 0 ${width} ${height}`);
    lines.forEach((line, index) => {
      const chipRect = chips[index].getBoundingClientRect();
      const endX = chipRect.left - groupRect.left + chipRect.width / 2;
      const endY = chipRect.top - groupRect.top + chipRect.height / 2;
      const vectorX = endX - anchorX;
      const vectorY = endY - anchorY;
      const halfWidth = Math.max(28, nodeRect.width / 2 - 5);
      const halfHeight = Math.max(28, nodeRect.height / 2 - 5);
      const edgeScale = 1 / Math.sqrt(
        (vectorX * vectorX) / (halfWidth * halfWidth)
        + (vectorY * vectorY) / (halfHeight * halfHeight),
      );
      const startX = anchorX + vectorX * edgeScale;
      const startY = anchorY + vectorY * edgeScale;
      const length = Math.hypot(endX - startX, endY - startY);
      line.setAttribute("x1", startX);
      line.setAttribute("y1", startY);
      line.setAttribute("x2", endX);
      line.setAttribute("y2", endY);
      line.style.setProperty("--mm-feature-line-length", `${length}px`);
      line.style.setProperty("--mm-feature-index", index);
      line.style.setProperty("--mm-feature-delay", `${index * 42}ms`);
      chips[index].style.setProperty("--mm-feature-index", index);
      chips[index].style.setProperty("--mm-feature-delay", `${index * 42}ms`);
    });
  }

  function setupFeatureGroups() {
    nodes.forEach((node) => {
      const group = node.querySelector(".mm-node-tags");
      if (!group || group.querySelector("[data-mm-feature-lines]")) return;

      const chips = Array.from(group.querySelectorAll("em"));
      if (chips.length === 0) return;

      group.dataset.mmFeatureDirection = getFeatureDirection(node);
      const featureSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      featureSvg.classList.add("mm-feature-lines");
      featureSvg.dataset.mmFeatureLines = "";
      featureSvg.setAttribute("aria-hidden", "true");

      chips.forEach(() => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        featureSvg.append(line);
      });

      group.prepend(featureSvg);
      featureGroups.push(group);
    });
  }

  function drawAllFeatureLines() {
    featureGroups.forEach(drawFeatureLines);
  }

  function drawLines() {
    if (!svg || !lineGroup) return;

    const boardRect = board.getBoundingClientRect();
    if (!boardRect.width || !boardRect.height) return;

    svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
    lineGroup.replaceChildren();

    layerConnections.forEach(({ from, to }) => {
      const fromLayer = layers[from];
      const toLayer = layers[to];
      if (!fromLayer || !toLayer) return;

      const startRect = fromLayer.getBoundingClientRect();
      const endRect = toLayer.getBoundingClientRect();
      const startCenterX = startRect.left - boardRect.left + startRect.width / 2;
      const startCenterY = startRect.top - boardRect.top + startRect.height / 2;
      const endCenterX = endRect.left - boardRect.left + endRect.width / 2;
      const endCenterY = endRect.top - boardRect.top + endRect.height / 2;
      const isVertical = Math.abs(endCenterY - startCenterY) > 70;

      let startX;
      let startY;
      let endX;
      let endY;
      let pathValue;

      if (isVertical) {
        const movesDown = endCenterY > startCenterY;
        startX = startCenterX;
        startY = (movesDown ? startRect.bottom : startRect.top) - boardRect.top;
        endX = endCenterX;
        endY = (movesDown ? endRect.top : endRect.bottom) - boardRect.top;
        const bend = Math.max(34, Math.abs(endY - startY) * 0.46);
        pathValue = `M ${startX} ${startY} C ${startX} ${startY + (movesDown ? bend : -bend)}, ${endX} ${endY - (movesDown ? bend : -bend)}, ${endX} ${endY}`;
      } else {
        const movesRight = endCenterX > startCenterX;
        startX = (movesRight ? startRect.right : startRect.left) - boardRect.left;
        startY = startCenterY;
        endX = (movesRight ? endRect.left : endRect.right) - boardRect.left;
        endY = endCenterY;
        const bend = Math.max(34, Math.abs(endX - startX) * 0.45);
        pathValue = `M ${startX} ${startY} C ${startX + (movesRight ? bend : -bend)} ${startY}, ${endX - (movesRight ? bend : -bend)} ${endY}, ${endX} ${endY}`;
      }

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathValue);
      path.dataset.mmEdge = `${from}:${to}`;
      path.dataset.mmLayerEdge = "";
      path.dataset.mmFromStage = from;
      path.dataset.mmToStage = to;
      lineGroup.append(path);
    });

    applyVisualState();
  }

  function updateDetailForPath(pathId) {
    if (!detailFields) return;
    const data = pathData[pathId] || pathData.all;
    detailFields.stage.textContent = data.stage;
    detailFields.title.textContent = data.title;
    detailFields.description.textContent = data.description;
    detailFields.upstream.textContent = data.upstream;
    detailFields.current.textContent = data.current;
    detailFields.downstream.textContent = data.downstream;
  }

  function updateDetailForNode(id) {
    if (!detailFields || !nodeData[id]) return;
    const data = nodeData[id];
    const upstreamIds = getUpstreamIds(id);
    detailFields.stage.textContent = data.stage;
    detailFields.title.textContent = data.title;
    detailFields.description.textContent = data.description;
    detailFields.upstream.textContent = upstreamIds.length ? getNames(upstreamIds) : data.receives;
    detailFields.current.textContent = data.title;
    detailFields.downstream.textContent = data.links.length ? getNames(data.links) : "用户可感知的反馈与设备动作";
  }

  function applyVisualState() {
    const activeNode = hoveredNode || pinnedNode;
    const svgPaths = Array.from(lineGroup?.querySelectorAll("[data-mm-edge]") || []);

    nodes.forEach((node) => {
      node.classList.remove("is-active", "is-related", "is-dimmed", "is-path-node");
      node.setAttribute("aria-pressed", String(node.dataset.mmNode === pinnedNode));
    });
    svgPaths.forEach((path) => path.classList.remove("is-active", "is-dimmed"));

    if (activeNode && nodeData[activeNode]) {
      nodes.forEach((node, id) => {
        node.classList.toggle("is-active", id === activeNode);
        node.classList.remove("is-related");
        node.classList.toggle("is-dimmed", id !== activeNode);
      });
      svgPaths.forEach((path) => {
        const activeStage = nodeStages[activeNode];
        const isConnected = path.dataset.mmFromStage === activeStage || path.dataset.mmToStage === activeStage;
        path.classList.toggle("is-active", isConnected);
        path.classList.toggle("is-dimmed", !isConnected);
      });
      updateDetailForNode(activeNode);
      return;
    }

    const activePath = pathData[selectedPath] || pathData.all;
    const pathNodes = new Set(activePath.nodes);
    const pathStages = new Set(activePath.nodes.map((id) => nodeStages[id]).filter(Boolean));
    if (selectedPath !== "all") {
      nodes.forEach((node, id) => {
        node.classList.toggle("is-path-node", pathNodes.has(id));
        node.classList.toggle("is-dimmed", !pathNodes.has(id));
      });
      svgPaths.forEach((path) => {
        const isInPath = pathStages.has(path.dataset.mmFromStage) && pathStages.has(path.dataset.mmToStage);
        path.classList.toggle("is-active", isInPath);
        path.classList.toggle("is-dimmed", !isInPath);
      });
    }
    updateDetailForPath(selectedPath);
  }

  function selectPath(pathId, shouldScroll = false) {
    if (!pathData[pathId]) return;
    selectedPath = pathId;
    pinnedNode = null;
    hoveredNode = null;
    pathButtons.forEach((button) => {
      const isActive = button.dataset.mmPath === pathId;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    applyVisualState();

    if (shouldScroll) {
      document.querySelector("#capability-map")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  nodes.forEach((node, id) => {
    node.addEventListener("mouseenter", () => {
      hoveredNode = id;
      applyVisualState();
    });
    node.addEventListener("mouseleave", () => {
      hoveredNode = null;
      applyVisualState();
    });
    node.addEventListener("focus", () => {
      hoveredNode = id;
      applyVisualState();
    });
    node.addEventListener("blur", () => {
      hoveredNode = null;
      applyVisualState();
    });
    node.addEventListener("click", () => {
      pinnedNode = pinnedNode === id ? null : id;
      hoveredNode = null;
      applyVisualState();
    });
  });

  pathButtons.forEach((button) => {
    button.addEventListener("click", () => selectPath(button.dataset.mmPath));
  });

  pathTriggers.forEach((button) => {
    button.addEventListener("click", () => selectPath(button.dataset.mmPathTrigger, true));
  });

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => window.requestAnimationFrame(() => {
      drawLines();
      drawAllFeatureLines();
    }));
    resizeObserver.observe(board);
  } else {
    window.addEventListener("resize", () => {
      drawLines();
      drawAllFeatureLines();
    }, { passive: true });
  }

  setupFeatureGroups();
  window.requestAnimationFrame(() => {
    drawLines();
    drawAllFeatureLines();
  });
}

toggle?.addEventListener("click", () => {
  setNavOpen(!header?.classList.contains("is-open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setNavOpen(false));
});

window.addEventListener("scroll", updateHeaderState, { passive: true });

window.addEventListener("resize", () => {
  if (window.innerWidth > 1040) {
    setNavOpen(false);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  window.lucide?.createIcons();
  updateHeaderState();
  await initPartnerLogos();
  initHeroParallax();
  initAboutTabs();
  initHoverVideos();
  initJoinMailForm();
  await initHomeArticles();
  await initArticleList();
  await initArticleDetail();
  initMultimodalCapabilityMap();
  initRevealMotion();
  initActiveSectionTracking();
});

if (document.readyState !== "loading") {
  initHoverVideos();
}
