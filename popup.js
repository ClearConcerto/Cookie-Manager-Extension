document.getElementById('addWhitelist').addEventListener('click', () => {
 const domain = document.getElementById('whitelistInput').value.trim();
 if (domain) {
    chrome.storage.sync.get(['whitelist'], (result) => {
      const whitelist = result.whitelist || [];
      if (!whitelist.includes(domain)) {
        whitelist.push(domain);
        chrome.storage.sync.set({ whitelist }, () => {
          alert(`Added ${domain} to whitelist.`);
          updateWhitelistSelect(whitelist);
        });
      }
    });
 }
});

document.getElementById('removeWhitelist').addEventListener('click', () => {
 const select = document.getElementById('whitelistSelect');
 const selectedDomain = select.value;
 if (selectedDomain) {
    chrome.storage.sync.get(['whitelist'], (result) => {
      const whitelist = result.whitelist || [];
      const newWhitelist = whitelist.filter(domain => domain !== selectedDomain);
      chrome.storage.sync.set({ whitelist: newWhitelist }, () => {
        alert(`Removed ${selectedDomain} from whitelist.`);
        updateWhitelistSelect(newWhitelist);
      });
    });
 }
});

document.getElementById('deleteCookies').addEventListener('click', () => {
 chrome.runtime.getBackgroundPage((backgroundPage) => {
    backgroundPage.deleteNonWhitelistCookies();
 });
});

document.getElementById('autoDelete').addEventListener('change', (event) => {
 const autoDelete = event.target.checked;
 chrome.storage.sync.set({ autoDelete }, () => {
    alert(`Auto Delete is now ${autoDelete ? 'enabled' : 'disabled'}.`);
 });
});

function updateWhitelistSelect(whitelist) {
 const select = document.getElementById('whitelistSelect');
 select.innerHTML = '';
 whitelist.forEach(domain => {
    const option = document.createElement('option');
    option.value = domain;
    option.text = domain;
    select.appendChild(option);
 });
}

//初始化页面时加载存储的设置
chrome.storage.sync.get(['whitelist', 'autoDelete'], (result) => {
 const whitelist = result.whitelist || [];
 const autoDelete = result.autoDelete || false;
 document.getElementById('whitelistInput').value = '';
 document.getElementById('autoDelete').checked = autoDelete;
 updateWhitelistSelect(whitelist);
});
