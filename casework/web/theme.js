// Restore appearance before painting the workspace; storage may be unavailable.
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("casework-theme") === "dark" ? "dark" : "light";
} catch {
  document.documentElement.dataset.theme = "light";
}
