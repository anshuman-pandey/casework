// Restore appearance before painting the workspace; storage may be unavailable.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("casework-theme") === "light" ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}
