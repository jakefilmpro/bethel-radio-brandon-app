function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return ('standalone' in window.navigator) && window.navigator.standalone;
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function tryShowInstallModal() {
  if (isInStandaloneMode()) return;
  try {
    if (localStorage.getItem("pwaDismissed")) return;
  } catch {}
  showInstallModal();
}

playBtn.addEventListener("click", () => {
  tryShowInstallModal();
}, { once: true });

function showInstallModal() {
  const existingModal = document.getElementById("installModal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");

  modal.innerHTML = `
    <div id="installModal" style="
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 20px;
      box-sizing: border-box;
      backdrop-filter: blur(6px);
    ">

      <div style="
        background: white;
        width: 100%;
        max-width: 340px;
        border-radius: 24px;
        padding: 28px;
        text-align: center;
        font-family: Arial, sans-serif;
        box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      ">

        <h2 style="
          margin-top: 0;
          color: #00341a;
          font-size: 24px;
        ">
          Instalar App
        </h2>

        <p style="
          color: #444;
          line-height: 1.5;
          font-size: 15px;
          margin-bottom: 24px;
        ">
          Instala Bethel Radio en tu teléfono para escuchar la radio fácilmente en cualquier momento.
        </p>

        <button id="installBtn" style="
          width: 100%;
          background: #00af5c;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 14px;
          font-size: 16px;
          cursor: pointer;
          margin-bottom: 12px;
        ">
          📲 Instalar
        </button>

        <button id="closeBtn" style="
          background: transparent;
          border: none;
          color: #777;
          font-size: 14px;
          cursor: pointer;
        ">
          Ahora no
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const installBtn = document.getElementById("installBtn");
  const closeBtn = document.getElementById("closeBtn");

  installBtn.addEventListener("click", async () => {
    try { localStorage.setItem("pwaDismissed", "1"); } catch {}

    if (isIos()) {

      alert(
        "En iPhone:\n\n1. Presiona el botón Compartir\n2. Luego selecciona 'Agregar a pantalla de inicio'"
      );

    } else if (isAndroid() && deferredPrompt) {

      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;

      deferredPrompt = null;
    }

  });

  closeBtn.addEventListener("click", () => {
    try { localStorage.setItem("pwaDismissed", "1"); } catch {}
    const modalEl = document.getElementById("installModal");
    if (modalEl) modalEl.remove();
  });

}
