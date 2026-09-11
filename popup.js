document.addEventListener('DOMContentLoaded', async () => {
  // Alternância das Abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'tab-list') loadSiteList();
    });
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
    document.getElementById('siteDomain').textContent = 'Página não suportada';
    return;
  }

  const domain = new URL(tab.url).hostname;
  document.getElementById('siteDomain').textContent = domain;

  const siteToggle = document.getElementById('siteToggle');
  const smartMediaToggle = document.getElementById('smartMediaToggle');
  const brightnessInput = document.getElementById('brightness');
  const contrastInput = document.getElementById('contrast');
  const warmthInput = document.getElementById('warmth');

  // Carrega configurações salvas
  chrome.storage.local.get([domain], (result) => {
    const config = result[domain] || { enabled: false, smartMedia: true, brightness: 100, contrast: 100, warmth: 0 };
    siteToggle.checked = config.enabled;
    smartMediaToggle.checked = config.smartMedia;
    brightnessInput.value = config.brightness;
    contrastInput.value = config.contrast;
    warmthInput.value = config.warmth;
    updateLabels(config.brightness, config.contrast, config.warmth);
  });

  function updateLabels(b, c, w) {
    document.getElementById('brightnessVal').textContent = `${b}%`;
    document.getElementById('contrastVal').textContent = `${c}%`;
    document.getElementById('warmthVal').textContent = `${w}%`;
  }

  function applySettings() {
    const config = {
      enabled: siteToggle.checked,
      smartMedia: smartMediaToggle.checked,
      brightness: brightnessInput.value,
      contrast: contrastInput.value,
      warmth: warmthInput.value
    };

    chrome.storage.local.set({ [domain]: config });

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (cfg) => {
        let styleTag = document.getElementById('dark-mode-custom-style');
        
        if (!cfg.enabled) {
          document.body.style.filter = '';
          if (styleTag) styleTag.remove();
          return;
        }

        // Aplica os filtros na página
        document.body.style.filter = `invert(1) hue-rotate(180deg) brightness(${cfg.brightness}%) contrast(${cfg.contrast}%) sepia(${cfg.warmth}%)`;

        // Inversão inteligente de mídias
        if (cfg.smartMedia) {
          if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'dark-mode-custom-style';
            document.head.appendChild(styleTag);
          }
          styleTag.textContent = `
            img, video, canvas, svg image, [style*="background-image"] {
              filter: invert(1) hue-rotate(180deg) !important;
            }
          `;
        } else if (styleTag) {
          styleTag.remove();
        }
      },
      args: [config]
    });
  }

  // Escutadores de Eventos
  siteToggle.addEventListener('change', applySettings);
  smartMediaToggle.addEventListener('change', applySettings);
  brightnessInput.addEventListener('input', (e) => {
    updateLabels(e.target.value, contrastInput.value, warmthInput.value);
    applySettings();
  });
  contrastInput.addEventListener('input', (e) => {
    updateLabels(brightnessInput.value, e.target.value, warmthInput.value);
    applySettings();
  });
  warmthInput.addEventListener('input', (e) => {
    updateLabels(brightnessInput.value, contrastInput.value, e.target.value);
    applySettings();
  });

  // Renderiza a lista (apenas exibição)
  function loadSiteList() {
    chrome.storage.local.get(null, (allData) => {
      const container = document.getElementById('siteList');
      container.innerHTML = '';
      
      const activeDomains = Object.keys(allData).filter(key => allData[key] && allData[key].enabled);

      if (activeDomains.length === 0) {
        container.innerHTML = '<div class="empty-msg">Nenhum site ativo no momento.</div>';
        return;
      }

      activeDomains.forEach(siteDomain => {
        const item = document.createElement('div');
        item.className = 'site-item';
        item.innerHTML = `<span>🌐 ${siteDomain}</span>`;
        container.appendChild(item);
      });
    });
  }
});