# Motor de animação 3D com bonecos

Personagens 3D gerados por modelo aberto viram bonecos articulados: boca sincronizada com a fala, piscada, cabeça que inclina e vira para o outro personagem, respiração, pulos e caminhada pulando. Cada personagem tem a própria voz.

## Passos

```bash
# ambientes (uma vez): um para imagem, outro para voz
uv venv -p 3.11 img && uv pip install -p img/bin/python torch diffusers transformers accelerate safetensors peft pillow "rembg[cpu]" opencv-python-headless soundfile
uv venv -p 3.11 tts && uv pip install -p tts/bin/python chatterbox-tts faster-whisper "setuptools<81"
export HF_HUB_DISABLE_XET=1

img/bin/python engine3d/gen.py jobs.json            # desenho do personagem e cenários
img/bin/python engine3d/inpaint.py jobs.json        # bocas e olhos do mesmo personagem
img/bin/python engine3d/build_puppet.py personagens/<nome> rig.json
tts/bin/python engine3d/voices.py historias/<h>/historia.json build/<h>     # falas + linha do tempo
img/bin/python engine3d/render.py build/<h> historias/<h> personagens videos/<h>.mp4
```

`historia.json` descreve o elenco (boneco, voz de referência, tom), o cenário e a sequência: falas (`who`, `say`) e ações (`enter`, `exit`, `move`, `hop`).

Modelos: DreamShaper XL Lightning (OpenRAIL++), Depth Anything V2 Small (Apache 2.0), Chatterbox Multilingual (MIT), Whisper small (MIT). Tudo em CPU: ~40 s por desenho, ~5 s por segundo de fala, ~5 s por segundo de vídeo.

## Limites

Os bonecos partem de um desenho por personagem, sempre de frente. Não há troca de pose (sentar, correr de lado, pegar objetos) nem ação complexa; isso exige gerador de vídeo por IA.
