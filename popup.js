document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
    document.getElementById('siteDomain').textContent = 'Página não suportada';
    return;
  }

  const url = new URL(tab.url);
  const domain = url.hostname;
  document.getElementById('siteDomain').textContent = domain;

  const siteToggle = document.getElementById('siteToggle');
  const brightnessInput = document.getElementById('brightness');
  const contrastInput = document.getElementById('contrast');

  // Carrega configurações salvas para este site
  chrome.storage.local.get([domain], (result) => {
    const config = result[domain] || { enabled: false, brightness: 100, contrast: 100 };
    siteToggle.checked = config.enabled;
    brightnessInput.value = config.brightness;
    contrastInput.value = config.contrast;
    updateLabels(config.brightness, config.contrast);
  });

  function updateLabels(b, c) {
    document.getElementById('brightnessVal').textContent = `${b}%`;
    document.getElementById('contrastVal').textContent = `${c}%`;
  }

  function applySettings() {
    const config = {
      enabled: siteToggle.checked,
      brightness: brightnessInput.value,
      contrast: contrastInput.value
    };

    // Salva a preferência do domínio
    chrome.storage.local.set({ [domain]: config });

    // Injeta os efeitos CSS na página aberta
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (cfg) => {
        if (!cfg.enabled) {
          document.body.style.filter = '';
        } else {
          document.body.style.filter = `invert(1) hue-rotate(180deg) brightness(${cfg.brightness}%) contrast(${cfg.contrast}%)`;
        }
      },
      args: [config]
    });
  }

  siteToggle.addEventListener('change', applySettings);
  brightnessInput.addEventListener('input', (e) => {
    updateLabels(e.target.value, contrastInput.value);
    applySettings();
  });
  contrastInput.addEventListener('input', (e) => {
    updateLabels(brightnessInput.value, e.target.value);
    applySettings();
  });
});