document.getElementById('toggleBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Impede a execução em páginas protegidas do navegador
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:')) {
    alert('Extensões não podem alterar páginas internas do próprio navegador. Abra um site comum (ex: Wikipedia ou Google).');
    return;
  }
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      document.body.style.filter = document.body.style.filter ? '' : 'invert(1) hue-rotate(180deg)';
    }
  });
});