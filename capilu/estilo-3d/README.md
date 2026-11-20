# Estilo 3D (protótipo)

Teste do novo visual: ilustrações 3D geradas por modelo aberto, câmera com profundidade e voz mais natural.

- `teaser-estilo-3d.mp4` — teaser de 28 s
- `capilu-3d-referencia.png` — desenho de referência da Capilu, usado para manter a personagem igual entre as cenas
- `cena-1.png` a `cena-3.png` — cenas do teaser
- `vozes/` — três amostras da voz nova para escolher
- `prototipo/gen.py` — gera as ilustrações (modelo DreamShaper XL Lightning, licença OpenRAIL++, com IP-Adapter para a referência)
- `prototipo/teaser.py` — monta o vídeo (profundidade com Depth Anything V2, trilha de `engine/synth.py`)

Voz: Chatterbox Multilingual (licença MIT). Tudo roda em CPU, sem custo: cerca de 35 s por ilustração e 5 s de processamento por segundo de fala.

Limite: as cenas são ilustrações com movimento de câmera, não animação de personagem. Personagens andando e gesticulando, como nos canais feitos com geradores de vídeo pagos, não são possíveis com estas ferramentas.
