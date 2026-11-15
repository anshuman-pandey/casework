/* UI translations only. Source evidence and saved case records are never translated. */
(function () {
  const catalogs = window.CASEWORK_MESSAGES;
  const key = "casework-language";
  function resolveLanguage(value) {
    const tag = String(value || "").replaceAll("_", "-").toLowerCase();
    if (/^zh(?:-|$)/.test(tag)) {
      return /(?:^|-)(hant|tw|hk|mo)(?:-|$)/.test(tag) ? "zh-Hant" : "zh-Hans";
    }
    const base = tag.split("-")[0];
    return ["en", "de", "es", "ja"].includes(base) ? base : null;
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  let locale = resolveLanguage(saved) ||
    (navigator.languages || [navigator.language]).map(resolveLanguage).find(Boolean) || "en";

  function t(message, values = {}) {
    const source = String(message ?? "");
    const template = Object.hasOwn(catalogs[locale], source) ? catalogs[locale][source] : Object.hasOwn(catalogs.en, source) ? catalogs.en[source] : source;
    // A replacement callback keeps $ and markup in user data literal. Callers escape HTML.
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(values, name) ? String(values[name]) : match);
  }
  function error(message) {
    const match = String(message).match(/^(\w+) must be nonempty text, at most (\d+) characters$/);
    return match ? t("{field} must be nonempty text, at most {limit} characters", {field: match[1], limit: match[2]}) : t(message);
  }
  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    for (const name of ["aria-label", "title", "placeholder"]) {
      root.querySelectorAll(`[data-i18n-${name}]`).forEach(el => {
        el.setAttribute(name, t(el.getAttribute(`data-i18n-${name}`)));
      });
    }
    document.documentElement.lang = locale;
    document.getElementById("language-select").value = locale;
  }
  function setLocale(value) {
    const next = resolveLanguage(value) || "en";
    if (next === locale) return;
    locale = next;
    try { localStorage.setItem(key, locale); } catch {}
    apply();
    document.dispatchEvent(new CustomEvent("casework:language", {detail: locale}));
  }
  window.caseworkI18n = { t, error, apply, setLocale, resolveLanguage, get locale() { return locale; } };
  apply();
  document.getElementById("language-select").addEventListener("change", event => setLocale(event.target.value));
})();
