# OneMouse PC 1.6.2: zeroconf source and object-code recomposition

This document describes a separate user modification route for the `zeroconf`
library in the OneMouse PC 1.6.2 backend. The released Store package, application
source, settings, login, pairing, and signatures are not modified by preparing
these materials. This is not a Store update or an installer.

The original backend is a PyInstaller one-file executable, not a user-replaceable
library directory. The public notice must therefore describe this recomposition
route instead of claiming that the installed package directly loads an external
replacement library.

## Materials

- Exact upstream `zeroconf-0.151.3.tar.gz`, including its Python/Cython sources,
  build scripts, LGPL 2.1 license, and copyright notices.
- The original OneMouse 1.6.2 backend object code, split into two parts solely to
  fit the website's per-file hosting limit. No proprietary application `.py`
  source files are supplied or needed by the recomposition tool.
- `object-manifest.json`, recording the original backend and each part's size and
  SHA-256 digest.
- `recompose_backend.py`, a standard-library-only CPython 3.11 tool that preserves
  unrelated application object code and the original bootloader, and replaces the
  zeroconf code with user-supplied Python source. The original Cython extensions
  are removed from the reconstructed copy, so modified Python modules take effect.
- Exact license texts, source provenance, and an import/data-only verification
  report. The supplied tool itself is MIT licensed.

The upstream project supports its pure-Python implementation; Cython is an
optional performance optimization. A reconstructed backend may be slower than the
official native build. Interface-compatible changes with the existing dependency
set are supported. New external dependencies need their own packaging work.

## Recomposition

Use 64-bit CPython 3.11 on Windows. Other Python minor versions use incompatible
compiled-code formats. The utility requires no pip packages.

1. Download the small compliance-kit ZIP and both object-code part files into an
   empty working folder. Extract the ZIP into that same folder, keeping the parts
   next to `object-manifest.json`.
2. Extract `source/zeroconf-0.151.3.tar.gz`. Keep `COPYING` and the original
   copyright notices. Make the intended modifications in
   `zeroconf-0.151.3/src/zeroconf`, marking modified files and dates as required by
   the library's license.
3. Recompose a new executable, using paths appropriate for the working folder:

   ```powershell
   py -3.11 recompose_backend.py --base-manifest object-manifest.json --zeroconf-dir zeroconf-0.151.3/src/zeroconf --output custom/MouseLinkBackend.exe
   ```

4. To check library imports and data-only APIs without starting OneMouse, create
   a separate diagnostic copy with `--probe` and run it:

   ```powershell
   py -3.11 recompose_backend.py --base-manifest object-manifest.json --zeroconf-dir zeroconf-0.151.3/src/zeroconf --output custom/MouseLinkBackend-probe.exe --probe
   .\custom\MouseLinkBackend-probe.exe
   ```

   The diagnostic exits before the normal app entry point. It does not create a
   discovery socket, read login/pairing data, start network connections, or change
   settings. It prints the loaded zeroconf version, optional modification markers,
   and the results of constructing a `ServiceInfo` and a `DNSCache` object.

5. To use a reconstructed backend with the desktop interface, close the official
   app yourself, extract an authorized copy of the matching MSIX into a separate
   user-writable folder, and replace **only that extracted copy's**
   `resources/backend/MouseLinkBackend.exe` with the normal reconstructed
   executable from step 3. Preserve `WindowRecovery` and all other package files.
   Start `OneMouse.exe` from the extracted folder. Do not edit WindowsApps, remove
   the official app, or run the official and custom copies simultaneously.

The extracted desktop interface route has not been functionally exercised here.
It may share the official app's data directory: back up your own settings before
using a custom copy. The isolated diagnostic verifies library replacement, not
end-to-end remote input or discovery behavior. Windows does not treat a modified,
unsigned executable as a Microsoft Store signed update. This route neither
changes nor circumvents Windows trust settings.

These source/object materials are supplied so recipients can modify the LGPL
library and recompose the work that uses it. The recipients' LGPL rights,
including reverse engineering needed to debug their library modifications, are
not restricted by proprietary application terms. This document is an engineering
record of the supplied materials and procedure, not a legal opinion.

Permission is granted to copy and reassemble these application object-code
materials, and to modify/recompose the work for the recipient's own use with a
modified LGPL library, including reverse engineering needed to debug those
modifications. OneMouse application object code retains its existing copyright
and proprietary terms, subject to these permissions and the third-party license
rights. Providing object code does not relicense the application under MIT. The
MIT license applies only to the separate recomposition utility and its authored
documentation; each third-party component retains its original license.

## Exact original provenance

- OneMouse backend: 28,034,682 bytes; SHA-256
  `9bee371c5d944d754eb97f7722d7aa5ae702570380899b0ffe8a091edb3d0ae2`.
- Source: `zeroconf-0.151.3.tar.gz`, 223,165 bytes; SHA-256
  `ce6c548e665759b6150cef4db9ab9d7bdd89857e90c513abd6b7340bdd7dbd6a`.
- Source release metadata: <https://pypi.org/pypi/zeroconf/0.151.3/json>.
- Upstream source repository: <https://github.com/python-zeroconf/python-zeroconf>.
- LGPL 2.1 text: <https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>.
- PyInstaller archive behavior:
  <https://pyinstaller.org/en/stable/operating-mode.html#how-the-one-file-program-works>.

The source archive was downloaded from the distribution URL in the PyPI metadata
and verified against PyPI's recorded SHA-256, without modifying the archive.
