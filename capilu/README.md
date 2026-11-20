# Capilu

Canal infantil educativo (3 a 6 anos). Veja `ESTRATEGIA.md`.

## Produzir um episódio

```bash
bash engine/setup.sh                      # uma vez: instala a voz (modelo Kokoro, ~350 MB em ./models)
EP=ep01-cores
python3 engine/audio.py episodes/$EP build/$EP --models models   # narração, trilha, linha do tempo, legendas
node engine/render.mjs build/$EP videos/$EP.mp4                  # animação + áudio -> MP4 1080p
cp build/$EP/legendas.srt videos/$EP.srt
node engine/brand.mjs thumb videos/$EP-thumb.png "AS" "CORES" "#E53935" apple,sun,butterfly,frog,orange,grapes
node engine/brand.mjs                     # refaz avatar, banner, logo e paleta
```

Requisitos: Python 3 (`kokoro-onnx`, `soundfile`, `numpy`), Node com Playwright/Chromium, ffmpeg.

- `episodes/<ep>/episode.json` — roteiro: falas e o que acontece na cena em cada fala
- `engine/character.js` — desenho da Capilu, do Tico, cenário e logo
- `engine/props.js` — objetos de cena
- `engine/stage.js` — animação
