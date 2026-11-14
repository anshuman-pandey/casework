/* This adapter makes no API calls. Practice records never leave this browser. */
(function () {
  let storageAvailable = true;
  try {
    sessionStorage.setItem("casework-storage-probe", "1");
    sessionStorage.removeItem("casework-storage-probe");
  } catch {
    storageAvailable = false;
  }
  const store = CaseworkDemoStore.createStore({
    fixtures: CASEWORK_DEMO_FIXTURES,
    read: () =>
      storageAvailable ? sessionStorage.getItem("casework-practice-v1") : null,
    write: (value) => {
      if (storageAvailable) {
        try {
          sessionStorage.setItem("casework-practice-v1", value);
        } catch {
          throw new Error(
            "Browser storage is full. Export your work or reset practice in Workspace settings.",
          );
        }
      }
    },
  });
  window.caseworkDemo = { ...store, storageAvailable };
  document.addEventListener("click", async (event) => {
    const link = event.target.closest('a[download][href^="/api/cases/"]');
    if (!link) return;
    event.preventDefault();
    try {
      const data = await store.request(link.getAttribute("href"));
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = link.download;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.dispatchEvent(
        new CustomEvent("casework:exported", { detail: { id: data.id } }),
      );
    } catch (error) {
      document.dispatchEvent(
        new CustomEvent("casework:notice", { detail: error.message }),
      );
    }
  });
})();
