# OneMouse offline Japanese conversion

Upstream: Android Open Source Project, `platform/packages/inputmethods/OpenWnn`.
Pinned commit: `5067ec8ec5a80ab12218c961f9b083fbccc71b93`.
Source: https://android.googlesource.com/platform/packages/inputmethods/OpenWnn/+/5067ec8ec5a80ab12218c961f9b083fbccc71b93/

The `aosp/libs/libwnnDictionary` directory contains the original dictionary engine,
JNI adapter and headers. `aosp/libs/libwnnJpnDic/WnnJpnDic.c` is the complete
upstream Japanese dictionary, not a reduced word list. Its source is unchanged:
8,185,630 bytes, SHA-256
`ef905defdf1e03dfcd02e419db63346f70d9728f9114a0ea732d4102967e2504`.
`UPSTREAM.json` records every original source URL, size and SHA-256 before local
portability changes. The Java subset retains its upstream package, source
headers and full conversion/romaji tables; the old IME UI is not included.

License: Apache License 2.0. The original complete `aosp/NOTICE` and source
copyright headers are preserved. `assets/japanese/NOTICE` packages the same
notice; `assets/japanese/ATTRIBUTION.txt` identifies the source and local changes.

## Local portability changes

- `include/nj_lib.h`: use `int32_t`/`uint32_t` for `NJ_INT32`/`NJ_UINT32`. Upstream
  used `long`, whose size changes on LP64; dictionary offsets must stay 32-bit on
  all four supported Android ABIs. The complete dictionary is compiled against
  this same header.
- `OpenWnnDictionaryImplJni.c`: convert native work pointers through `intptr_t`
  rather than type-punning a pointer into part of a Java `long`. The old 32-bit
  return path left the upper half of that `long` uninitialized.
- Java `OpenWnnDictionaryImpl`: reject writable dictionary paths, never open a
  personal/learning SQLite database, and expose idempotent explicit `close()`.
  Its original finalizer delegates to the same close operation. Retained SQLite
  helper/query code is inactive; it uses only public Android APIs.
- Java `OpenWnnEngineJAJP`: remove an unused reference to the old IME class,
  resolve `libWnnJpnDic.so` through the app linker namespace instead of old
  `/data/data` or `/system/lib` paths, fail if the dictionary is unavailable,
  and close its owned dictionary explicitly.
- Java `OpenWnnDictionaryImplJni`: add the existing AndroidX `Keep` annotation
  so future shrinking cannot rename the class/methods bound by native JNI names.
- Java `Romkan`, `RomkanFullKatakana`, and `KanaConverter`: explicitly use
  `Locale.ROOT` for ASCII romaji/alphabet case conversion, so a Turkish device
  locale cannot turn `I` into dotless `ı` or `i` into `İ`. Existing explicit
  Japanese full-width case rules remain unchanged. Internal SQL formatting in
  `OpenWnnDictionaryImpl` also uses `Locale.ROOT`; no locale warning is suppressed.

## New adapter and build

`JapaneseConversionEngine` and `OpenWnnJapaneseConversionEngine` are OneMouse
integration code. Initialization loads `WnnJpnDic` and `wnndict` using
`System.loadLibrary`; JNI then uses the dictionary SONAME with `dlopen`. This
supports Android libraries loaded directly from an APK without assuming an
extracted file exists in `nativeLibraryDir`.

The adapter uses OpenWnn's consecutive-clause conversion and its real dictionary
alternatives. Clause choices are joined with the rest of the converted sentence;
unconverted input beyond the engine's 50 UTF-16-unit limit is retained verbatim.
The caller receives at most 24 complete candidates, including the original
reading. Conversion/close are serialized per owner. Each owner has its own
native work allocation and dictionary-library reference; closing an old owner
cannot close a newer owner's work. There is no network conversion, automatic
personal learning, dictionary download at runtime, or hardcoded word substitute.
The dictionary is the historic upstream OpenWnn vocabulary, not a claim of current
Google Japanese Input vocabulary or Mozc equivalence.

The existing CMake 3.22.1 / NDK 28.2.13676358 project builds two additional C11
shared libraries for arm64-v8a, armeabi-v7a, x86 and x86_64. Both link with
`-Wl,-z,max-page-size=16384`; the decoder needs only the public NDK JNI and `libdl`.
`-fno-strict-aliasing` preserves the legacy engine's byte-buffer access patterns.
The Pinyin library's C++17/static-runtime configuration is unchanged.

`JapaneseConversionEngineProbe.run(context)` in the Android test source set
exercises the packaged dictionary/JNI, real Japanese words, a multi-clause
sentence, long-input tail retention, independent owners, duplicate close,
bounded randomized readings and repeated reopen/close. Two additional checks
temporarily select the Turkish default locale, check uppercase ASCII romaji,
hiragana/katakana and Latin case candidates against the full 日本/東京 dictionary,
then restore the original locale in a `finally` block. The main instrumentation
runner is wired separately; source inspection alone does not establish a passing
Android runtime or 16 KiB-device test.
