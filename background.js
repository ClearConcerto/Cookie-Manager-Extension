//从存储中获取白名单
function getWhitelist() {
 return new Promise((resolve) => {
    chrome.storage.sync.get(['whitelist'], (result) => {
      resolve(result.whitelist || []);
    });
 });
}

//删除不在白名单中的Cookie
async function deleteNonWhitelistCookies() {
 const whitelist = await getWhitelist();
 chrome.cookies.getAll({}, (cookies) => {
    cookies.forEach((cookie) => {
      if (!whitelist.includes(cookie.domain)) {
        chrome.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
      }
    });
 });
}

//监听标签页关闭事件
chrome.tabs.onRemoved.addListener(() => {
 deleteNonWhitelistCookies();
});

//监听浏览器关闭事件
chrome.windows.onRemoved.addListener(() => {
 deleteNonWhitelistCookies();
});

//创建右键菜单选项
chrome.contextMenus.create({
 id: "addWhitelist",
 title: "Add to Whitelist",
 contexts: ["all"]
});

chrome.contextMenus.create({
 id: "removeWhitelist",
 title: "Remove from Whitelist",
 contexts: ["all"]
});

//处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
 const whitelist = await getWhitelist();
 const domain = new URL(tab.url).hostname;

 if (info.menuItemId === "addWhitelist") {
    if (!whitelist.includes(domain)) {
      whitelist.push(domain);
      chrome.storage.sync.set({ whitelist }, () => {
        alert(`Added ${domain} to whitelist.`);
      });
    }
 } else if (info.menuItemId === "removeWhitelist") {
    const newWhitelist = whitelist.filter(d => d !== domain);
    chrome.storage.sync.set({ whitelist: newWhitelist }, () => {
      alert(`Removed ${domain} from whitelist.`);
    });
 }
});
