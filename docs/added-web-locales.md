# Added website locales

Edit `content/web-locales.json` for Brazilian Portuguese, German, Traditional Chinese (Taiwan), French and Indonesian. Keep the pipes and row order; the generator validates the structure. Run `python scripts/generate_web_locales.py` and `python -m unittest discover -s tests -q` before publishing.

Rerun the generator after changing the Windows installer, Mac disk image, store links, or downloads script URL in `en/download.html`. The five added languages inherit those URLs. Their home, features, guide, help, download and compatibility pages are localized. Longer documentation, interactive demos and legal pages linked in English are labeled. Only genuine localized routes belong in the reciprocal hreflang group.
