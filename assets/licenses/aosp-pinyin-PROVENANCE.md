OneMouse offline Pinyin decoder provenance

Upstream: Android Open Source Project, packages/inputmethods/PinyinIME.
Pinned commit: `49aebad1c1cfbbcaa9288ffed5161e79e57c3679`.
Source: https://android.googlesource.com/platform/packages/inputmethods/PinyinIME/+/49aebad1c1cfbbcaa9288ffed5161e79e57c3679/

`aosp/include/` and `aosp/share/` are the decoder core from that commit's `jni/` directory. The original platform JNI adapter, Java service, system `Android.mk`, and private Android `libcutils/libutils` dependencies are not included. Original source copyright/license headers and `aosp/NOTICE` are preserved. The full notice is also packaged in `assets/pinyin/NOTICE`.

The binary `assets/pinyin/dict_pinyin.dat` is the upstream `res/raw/dict_pinyin.dat`, unchanged, 1,068,442 bytes. SHA-256: `6bf0bbde4e3134cce38d08524a9f4dc1af40435243c8e36b38eb68d1e14462b2`.
Dictionary source: https://android.googlesource.com/platform/packages/inputmethods/PinyinIME/+/49aebad1c1cfbbcaa9288ffed5161e79e57c3679/res/raw/dict_pinyin.dat

Local changes to upstream code: `aosp/include/dictdef.h` raises `kMaxSearchSteps` from 40 to 66 so the 64-character API limit cannot be silently truncated by native buffers. `dicttrie.cpp` rejects extensions before fixed milestone/mark pools overflow and counts only stored marks; `matrixsearch.cpp` handles a root extension returning no milestone as a normal failed extension. This fixes an assertion reproduced with 64 repeated spelling letters, without suppressing assertions. A private compatibility header makes optional performance logging a no-op; it never logs composition contents. Any additional portability fixes must be listed here.

`matrixsearch.cpp::get_lpis` also reserves the shared candidate/string scratch before querying and clamps capacity before copying, handling many ambiguous phrase matches without a debug abort. Full-sentence candidates are filtered before duplicate reduction so a skipped first copy cannot underflow the retained-candidate index. Other AOSP assertions remain enabled in debug/native tests.

`dicttrie.cpp::free_resource` frees and nulls `lma_idx_buf_`, which is allocated by `load_dict` but was omitted from the upstream cleanup. Nulling makes repeated close/reinitialization safe; the native self-test reopens/searches/closes the model 16 times and repeats each handle close.

OneMouse's `decoder_core.*`, `pinyin_jni.cpp`, Kotlin adapter and CMake build are new integration code. AOSP's global decoder/caches are serialized. Each monotonically allocated opaque handle has independent bounded raw spelling and selection history (at most 16 handles, 64 letters and 64 selections each). Switching owners restores that owner's state by deterministic replay; opening or closing an older owner cannot discard another owner's partial composition. The shared model closes only after the last handle closes. Closed handle IDs cannot be reused. Inputs are at most 64 lowercase ASCII spelling letters/apostrophes; at most 24 candidates are returned. Candidate zero is AOSP's sentence candidate. Partial selection preserves the fixed Chinese prefix and native spelling boundaries. If AOSP's per-search budget decodes only a prefix, explicitly selecting that prefix starts a new bounded search of the untouched tail; no letters are silently discarded or auto-committed. Reset/search start a fresh composition. The supplied system dictionary is used without persistent user vocabulary learning; no typed text is logged or sent to a service.

If a full spelling search has no candidates, the adapter retries at most seven progressively shorter prefixes (64, 32, 16, 8, 4, 2, 1 at the maximum input length). The complete spelling remains in the owner's state; this handles scratch-pool exhaustion without losing the undecoded tail or returning guessed/hardcoded words.

Build: NDK 28.2.13676358, CMake 3.22.1, C++17, static C++ runtime configured by the app's Gradle build. The Android shared library uses a 16 KiB maximum ELF page alignment. All supported ABIs must be built and packaged by the app. `ONEMOUSE_PINYIN_BUILD_SELF_TEST=ON` builds a separate real-dictionary check executable; the Android instrumentation runner checks the Kotlin/JNI path without opening an activity.
