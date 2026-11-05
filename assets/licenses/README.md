# OneMouse license notices and source references

Updated: 2026-11-05.

This directory supplies component-specific license/copyright notices, exact
publisher notice files and separate source archives. License texts copied from
publishers have not been rewritten. A combined text file may add file-boundary
headings while preserving each original notice body.

Release scope:
- Windows Microsoft Store MSIX 1.6.2.0, Electron45.2.3, CPython3.11.9.
- Android Play/Galaxy1.2.43(79); Play-only SDKs are identified in the runtime inventory.
- Public macOS1.6.0 source commit155de5c310868a20301e9a8e7afff32189d83fc4:
  WebRTC152.0.0 and Swift Sodium0.11.0. This page update does not publish a new Mac app.

Electron's Chromium notice includes its browser/media third-party components.
The Android WebRTC notice is the publisher's complete notice at tag144.7559.05.
Mac WebRTC's license was extracted from the SHA256-verified152.0.0xcframework;
its bytes match the pinned upstream source LICENSE. Its LICENSE/PATENTS and
upstream source commit are recorded, but the Mac framework's transitive third-party
notice completeness has not been independently certified here.

The notice ZIP contains license/NOTICE/provenance texts, not executable object
code or source archives. LazySodium source archives are separate downloads.
The separate zeroconf source/recombination kit is maintained alongside these
assets and is linked by the public license page.

Publisher repository licenses for Android WebRTC and stasel WebRTC are identified
separately from the WebRTC engine license. PyInstaller's bootloader exception is
retained; build/test tooling is not represented as an application runtime library.

See license-assets.json for source URLs, file hashes, sizes and exact scope.
