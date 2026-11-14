/* Workspace appearance is a browser preference, never an authorization boundary. */
(function () {
  const $ = (id) => document.getElementById(id);
  const storage = () => (window.caseworkDemo ? sessionStorage : localStorage);
  const defaults = { schema: 1, name: "Sandbox", logo: "" };
  function validate(value) {
    if (
      value?.schema !== 1 ||
      typeof value.name !== "string" ||
      !value.name.trim() ||
      [...value.name].length > 60
    )
      throw new Error("Choose a workspace name between 1 and 60 characters.");
    const logo = value.logo || "";
    if (
      typeof logo !== "string" ||
      logo.length > 90000 ||
      (logo && !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(logo))
    )
      throw new Error("Use a small PNG workspace logo.");
    return { schema: 1, name: value.name.trim(), logo };
  }
  let settings = { ...defaults },
    pendingLogo = "";
  try {
    settings = validate(JSON.parse(storage().getItem("casework-workspace-v1")));
  } catch {}
  function apply() {
    document
      .querySelectorAll("[data-workspace-name]")
      .forEach((el) => (el.textContent = settings.name));
    document.querySelectorAll("[data-workspace-logo]").forEach((el) => {
      el.replaceChildren();
      if (settings.logo) {
        const img = document.createElement("img");
        img.src = settings.logo;
        img.alt = "";
        el.append(img);
      } else el.textContent = settings.name.slice(0, 1).toUpperCase();
    });
    $("workspace-mode").textContent = window.caseworkDemo
      ? "Private browser demo"
      : "Development workspace";
    $("workspace-lock").textContent = window.caseworkDemo ? "Demo" : "Local";
    $("runtime-label").textContent = window.caseworkDemo
      ? "Private browser sandbox"
      : "Local workspace";
    $("runtime-note").textContent = window.caseworkDemo
      ? "Synthetic data · Stored in this tab"
      : "Synthetic data · No AI model connected";
    $("sandbox-caption").textContent = window.caseworkDemo
      ? "Browser sandbox · Apache-2.0"
      : "Local prototype · Apache-2.0";
    $("reset-practice").hidden = !window.caseworkDemo;
    document
      .querySelectorAll("[data-release]")
      .forEach((el) => (el.textContent = "v" + window.CASEWORK_VERSION));
  }
  function preview() {
    const box = $("logo-preview");
    box.replaceChildren();
    if (pendingLogo) {
      const img = document.createElement("img");
      img.src = pendingLogo;
      img.alt = "Logo preview";
      box.append(img);
    } else
      box.textContent = ($("workspace-name").value.trim() || "S")
        .slice(0, 1)
        .toUpperCase();
  }
  function open() {
    pendingLogo = settings.logo;
    $("workspace-name").value = settings.name;
    $("workspace-error").textContent = "";
    $("workspace-logo").value = "";
    preview();
    $("workspace-dialog").showModal();
  }
  function download(value, name) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $("workspace-settings-button").onclick = open;
  $("close-workspace").onclick = () => $("workspace-dialog").close();
  $("workspace-name").oninput = preview;
  $("remove-logo").onclick = () => {
    pendingLogo = "";
    $("workspace-logo").value = "";
    preview();
  };
  $("workspace-logo").onchange = async () => {
    const file = $("workspace-logo").files[0];
    if (!file) return;
    $("workspace-error").textContent = "";
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 2000000
      )
        throw new Error("Choose a PNG, JPEG or WebP image smaller than 2 MB.");
      const bitmap = await createImageBitmap(file);
      if (bitmap.width > 4096 || bitmap.height > 4096) {
        bitmap.close();
        throw new Error("Choose an image no larger than 4096 × 4096 pixels.");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const scale = Math.min(96 / bitmap.width, 96 / bitmap.height),
        w = bitmap.width * scale,
        h = bitmap.height * scale;
      canvas
        .getContext("2d")
        .drawImage(bitmap, (96 - w) / 2, (96 - h) / 2, w, h);
      bitmap.close();
      pendingLogo = canvas.toDataURL("image/png");
      preview();
    } catch (error) {
      $("workspace-error").textContent = error.message;
    }
  };
  $("workspace-form").onsubmit = (event) => {
    event.preventDefault();
    try {
      const next = validate({
        schema: 1,
        name: $("workspace-name").value,
        logo: pendingLogo,
      });
      storage().setItem("casework-workspace-v1", JSON.stringify(next));
      settings = next;
      apply();
      $("workspace-dialog").close();
      document.dispatchEvent(
        new CustomEvent("casework:notice", {
          detail: "Workspace appearance saved in this browser.",
        }),
      );
    } catch (error) {
      $("workspace-error").textContent =
        error.message || "Browser storage is unavailable.";
    }
  };
  $("export-workspace").onclick = () =>
    download(settings, "casework-workspace.json");
  $("import-workspace").onchange = async () => {
    try {
      const file = $("import-workspace").files[0];
      if (!file) return;
      if (file.size > 100000)
        throw new Error("Choose a workspace configuration under 100 KB.");
      const value = validate(JSON.parse(await file.text()));
      $("workspace-name").value = value.name;
      pendingLogo = value.logo;
      preview();
      $("workspace-error").textContent =
        "Configuration loaded. Save to apply it.";
    } catch (error) {
      $("workspace-error").textContent = error.message;
    }
    $("import-workspace").value = "";
  };
  $("reset-practice").onclick = () => $("reset-dialog").showModal();
  $("cancel-reset").onclick = () => $("reset-dialog").close();
  $("confirm-reset").onclick = async () => {
    $("confirm-reset").disabled = true;
    try {
      await window.caseworkDemo.reset();
      $("reset-dialog").close();
      $("workspace-dialog").close();
      document.dispatchEvent(new Event("casework:reset"));
    } catch (error) {
      $("reset-error").textContent = error.message;
    } finally {
      $("confirm-reset").disabled = false;
    }
  };
  function hosting() {
    $("host-version").textContent = "v" + window.CASEWORK_VERSION;
    $("version-download").href =
      `https://github.com/anshuman-pandey/casework/archive/refs/tags/v${window.CASEWORK_VERSION}.zip`;
    $("self-host-dialog").showModal();
  }
  $("self-host-button").onclick = hosting;
  $("close-self-host").onclick = () => $("self-host-dialog").close();
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-personalize]")) open();
    if (event.target.closest("[data-self-host]")) hosting();
  });
  $("copy-start-command").onclick = async () => {
    try {
      await navigator.clipboard.writeText(
        "docker compose up -d --build --wait",
      );
      $("copy-start-command").textContent = "Copied";
    } catch {
      $("copy-start-command").textContent = "Select and copy the command below";
    }
  };
  window.caseworkWorkspace = {
    apply,
    open,
    hosting,
    get: () => ({ ...settings }),
  };
  apply();
})();
