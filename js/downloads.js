(function () {
  var repo = 'sdlckdrl/mouselink-web';
  var windowsFallbackUrl =
    'https://github.com/sdlckdrl/mouselink-web/releases/download/v1.3.8/OneMouse-Setup-1.3.8-x64.exe';
  var apiUrl = 'https://api.github.com/repos/' + repo + '/releases?per_page=100';
  var cacheKey = 'onemouse_latest_windows_download_v1_3_8';
  var cacheTtlMs = 60 * 60 * 1000;
  var requestTimeoutMs = 8000;
  var links = document.querySelectorAll('[data-latest-windows-download]');

  if (!links.length || !window.fetch) {
    return;
  }

  function readCache() {
    try {
      var cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
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
          savedAt: Date.now(),
        }),
      );
    } catch (error) {
      // Session storage is optional. The fallback link still works without it.
    }
  }

  function pickSetupAsset(release) {
    var assets = release && Array.isArray(release.assets) ? release.assets : [];
    var setupAsset = assets.find(function (asset) {
      return /setup/i.test(asset.name || '') && /\.exe$/i.test(asset.name || '');
    });

    return (
      setupAsset ||
      assets.find(function (asset) {
        return /\.exe$/i.test(asset.name || '');
      })
    );
  }

  function applyAsset(asset) {
    if (!asset || !asset.url) {
      return;
    }

    links.forEach(function (link) {
      link.href = asset.url;
      link.dataset.resolvedDownload = 'true';
      link.removeAttribute('download');

      var card = link.closest('.download-card');
      var label = card && card.querySelector('[data-download-filename]');
      if (label && asset.name) {
        label.textContent = asset.name;
      }
    });
  }

  function fetchJsonWithTimeout(url, options) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('Download request timed out'));
      }, requestTimeoutMs);

      fetch(url, options)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Download request failed');
          }
          return response.json();
        })
        .then(
          function (payload) {
            clearTimeout(timer);
            resolve(payload);
          },
          function (error) {
            clearTimeout(timer);
            reject(error);
          },
        );
    });
  }

  function resolveDownload() {
    var cached = readCache();
    if (cached && cached.url) {
      applyAsset(cached);
      return Promise.resolve(cached.url);
    }

    return fetchJsonWithTimeout(apiUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    })
      .then(function (releases) {
        var asset = (Array.isArray(releases) ? releases : [])
          .filter(function (release) {
            return release && !release.draft && !release.prerelease;
          })
          .map(pickSetupAsset)
          .find(function (candidate) {
            return candidate && candidate.browser_download_url;
          });
        if (!asset || !asset.browser_download_url) {
          throw new Error('No Windows setup asset found');
        }

        var download = {
          name: asset.name,
          url: asset.browser_download_url,
          browser_download_url: asset.browser_download_url,
        };
        writeCache(download);
        applyAsset(download);
        return download.url;
      })
      .catch(function () {
        return windowsFallbackUrl;
      });
  }

  var downloadPromise = resolveDownload();

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (link.dataset.resolvedDownload === 'true') {
        return;
      }

      event.preventDefault();
      downloadPromise.then(function (url) {
        window.location.href = url || windowsFallbackUrl;
      });
    });
  });
})();

(function () {
  var links = document.querySelectorAll('[data-latest-macos-download]');
  var requestTimeoutMs = 8000;
  if (!links.length || !window.fetch) {
    return;
  }

  var script = document.currentScript;
  var manifestUrl = new URL(
    '../downloads.json',
    script && script.src ? script.src : window.location.href,
  ).href;

  function asHttpsUrl(value) {
    if (typeof value !== 'string' || !/^https:\/\//i.test(value)) {
      return null;
    }

    try {
      var parsed = new URL(value);
      return parsed.protocol === 'https:' ? parsed.href : null;
    } catch (error) {
      return null;
    }
  }

  function pickMacDownload(macos) {
    var assets = macos && Array.isArray(macos.assets) ? macos.assets : [];
    var universal = assets.find(function (asset) {
      return asset.arch === 'universal' && asHttpsUrl(asset.url);
    });

    if (universal) {
      return {
        url: asHttpsUrl(universal.url),
        name: universal.filename || null,
      };
    }

    var downloadableAssets = assets.filter(function (asset) {
      return asHttpsUrl(asset.url);
    });
    if (downloadableAssets.length === 1) {
      return {
        url: asHttpsUrl(downloadableAssets[0].url),
        name: downloadableAssets[0].filename || null,
      };
    }

    var downloadPageUrl = macos && asHttpsUrl(macos.downloadPageUrl);
    if (downloadPageUrl) {
      return {
        url: downloadPageUrl,
      };
    }

    return null;
  }

  function fetchJsonWithTimeout(url, options) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('Download manifest request timed out'));
      }, requestTimeoutMs);

      fetch(url, options)
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Download manifest request failed');
          }
          return response.json();
        })
        .then(
          function (payload) {
            clearTimeout(timer);
            resolve(payload);
          },
          function (error) {
            clearTimeout(timer);
            reject(error);
          },
        );
    });
  }

  fetchJsonWithTimeout(manifestUrl, { cache: 'no-cache' })
    .then(function (manifest) {
      var macos = manifest && manifest.macos;
      var asset = macos && macos.status === 'released' ? pickMacDownload(macos) : null;
      if (!asset) {
        return;
      }

      links.forEach(function (link) {
        link.href = asset.url;
        link.classList.remove('btn-disabled');
        link.classList.add('btn-sec');
        link.removeAttribute('aria-disabled');
        link.removeAttribute('download');
        link.textContent = link.dataset.readyLabel || 'Download for Mac';

        var card = link.closest('.mac-download-card');
        var label = card && card.querySelector('[data-macos-download-filename]');
        if (label && asset.name) {
          label.textContent = asset.name;
        }
      });
    })
    .catch(function () {
      // The page keeps its current direct-download fallback when the manifest is unavailable.
    });
})();
