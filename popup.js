document.addEventListener('DOMContentLoaded', function() {
  const links = document.getElementsByTagName("a");
  for (let i = 0; i < links.length; i++) {
    (function() {
      const ln = links[i];
      const location = ln.href;
      ln.onclick = function() {
        chrome.tabs.create({active: true, url: location});
        return false;
      };
    })();
  }
});
