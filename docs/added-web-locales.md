# Website locales

The five added languages (Brazilian Portuguese, German, Traditional Chinese for Taiwan, French and Indonesian) mirror the English website: all 13 public routes and two retained guides. Each retains the same sections, demos, document links and legal notices. Build with `python scripts/generate_full_web_locales.py` and check `python -m unittest discover -s tests -q`. The old generator command invokes the same build.

Edit the translation dictionaries under `content/full-web-*.json`; a key is the normalized English source phrase. Run the generator with `--extract path.json` for an inventory. Rebuild after changing English copy or download URLs. Missing translations stop the build rather than knowingly publish a partially English site. The older concise `content/web-locales.json` is retained only as editorial reference.

The demo locale bundles are generated separately from their checked-in source catalog. Keep runtime selectors, IDs, shortcuts, and device names in sync. Keep author-provided screenshot pixels and downloadable third-party license, notice and other original files unchanged; translate surrounding explanations and labels. The user-facing translations preserve the current source provisions rather than silently changing policy.

Demo build command: node --expose-internals tests/test_demo_full_locales_build.cjs --write
Run the same command without --write to verify generated bundles, then run node tests/test_demo_full_locales_browser.cjs for the interaction checks.
