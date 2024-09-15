//从存储中获取白名单
function getWhitelist() {
 return new Promise((resolve) => {
    chrome.storage.sync.get(['whitelist'], (result) => {
      resolve(result.whitelist || []);
    });
 });
}

//从存储中获取 autoDelete选项
function getAutoDelete() {
 return new Promise((resolve) => {
    chrome.storage.sync.get(['autoDelete'], (result) => {
      resolve(result.autoDelete || false);
    });
 });
}

//删除不在白名单中的 Cookie
async function deleteNonWhitelistCookies() {
 const whitelist = await getWhitelist();
 const autoDelete = await getAutoDelete();

 //只有在 autoDelete为 true时才执行删除操作
 if (autoDelete) {
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

//添加“添加到白名单”选项
chrome.contextMenus.create({
 id: "addWhitelist",
 title: "Add to Whitelist",
 contexts: ["all"]
});

//添加“从白名单移除”选项
chrome.contextMenus.create({
 id: "removeWhitelist",
 title: "Remove from Whitelist",
 contexts: ["all"]
});

//新增：添加“删除当前网页的 Cookie”选项
chrome.contextMenus.create({
 id: "deleteCookies",
 title: "Delete Current Cookies",
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
        //使用 chrome.notifications API替代 alert，因为在后台脚本中 alert不会显示
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png', //请确保存在一个名为 icon.png的图标文件
          title: 'Whitelist Update',
          message: `Added ${domain} to whitelist.`
        });
      });
    }
 } else if (info.menuItemId === "removeWhitelist") {
    const newWhitelist = whitelist.filter(d => d !== domain);
    chrome.storage.sync.set({ whitelist: newWhitelist }, () => {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Whitelist Update',
        message: `Removed ${domain} from whitelist.`
      });
    });
 }
 //新增：处理“删除当前网页的 Cookie”点击事件
 else if (info.menuItemId === "deleteCookies") {
    try {
      const url = new URL(tab.url);
      const scheme = url.protocol === 'https:' ? 'https://' : 'http://';

      //获取当前域名下的所有 Cookie
      chrome.cookies.getAll({ domain: url.hostname }, (cookies) => {
        cookies.forEach((cookie) => {
          //构建每个 Cookie的完整 URL
          const cookieUrl = `${scheme}${cookie.domain}${cookie.path}`;
          chrome.cookies.remove({
            url: cookieUrl,
            name: cookie.name
          }, (removedCookie) => {
            if (removedCookie) {
              console.log(`Deleted cookie: ${removedCookie.name}`);
            }
          });
        });
      });

      //显示通知以确认删除操作
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Cookie Deletion',
        message: `Deleted all cookies for ${url.hostname}.`
      });

    } catch (error) {
      console.error('Error deleting cookies:', error);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Cookie Deletion Failed',
        message: `Failed to delete cookies for the current page.`
      });
    }
 }
});
