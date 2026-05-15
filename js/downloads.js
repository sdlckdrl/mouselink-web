(function () {
  var repo = "sdlckdrl/mouselink-web";
  var releasesUrl = "https://github.com/" + repo + "/releases";
  var apiUrl = "https://api.github.com/repos/" + repo + "/releases?per_page=1";
  var cacheKey = "onemouse_latest_windows_download";
  var cacheTtlMs = 60 * 60 * 1000;
  var links = document.querySelectorAll("[data-latest-windows-download]");

  if (!links.length || !window.fetch) {
    return;
  }

  function readCache() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
      if (!cached || Date.now() - cached.savedAt > cacheTtlMs) {
        return null;
      }
      return cached;
    } catch (error) {
      return null;
    }
  }

  function writeCache(asset) {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          name: asset.name,
          url: asset.browser_download_url,
          savedAt: Date.now()
        })
      );
    } catch (error) {
      // Session storage is optional. The fallback link still works without it.
    }
  }

  function pickSetupAsset(release) {
    var assets = release && Array.isArray(release.assets) ? release.assets : [];
    var setupAsset = assets.find(function (asset) {
      return /setup/i.test(asset.name || "") && /\.exe$/i.test(asset.name || "");
    });

    return (
      setupAsset ||
      assets.find(function (asset) {
        return /\.exe$/i.test(asset.name || "");
      })
    );
  }

  function applyAsset(asset) {
    if (!asset || !asset.url) {
      return;
    }

    links.forEach(function (link) {
      link.href = asset.url;
      link.dataset.resolvedDownload = "true";
      link.removeAttribute("download");

      var card = link.closest(".download-card");
      var label = card && card.querySelector("[data-download-filename]");
      if (label && asset.name) {
        label.textContent = asset.name;
      }
    });
  }

  function resolveDownload() {
    var cached = readCache();
    if (cached && cached.url) {
      applyAsset(cached);
      return Promise.resolve(cached.url);
    }

    return fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("GitHub releases request failed");
        }
        return response.json();
      })
      .then(function (releases) {
        var release = Array.isArray(releases) ? releases[0] : null;
        var asset = pickSetupAsset(release);
        if (!asset || !asset.browser_download_url) {
          throw new Error("No Windows setup asset found");
        }

        var download = {
          name: asset.name,
          url: asset.browser_download_url,
          browser_download_url: asset.browser_download_url
        };
        writeCache(download);
        applyAsset(download);
        return download.url;
      })
      .catch(function () {
        return releasesUrl;
      });
  }

  var downloadPromise = resolveDownload();

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      if (link.dataset.resolvedDownload === "true") {
        return;
      }

      event.preventDefault();
      downloadPromise.then(function (url) {
        window.location.href = url || releasesUrl;
      });
    });
  });
})();
