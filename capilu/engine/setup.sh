#!/usr/bin/env bash
# Instala dependências e baixa o modelo de voz Kokoro (Apache 2.0).
set -euo pipefail
cd "$(dirname "$0")/.."
pip install -q kokoro-onnx soundfile numpy
mkdir -p models
B=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro.onnx ] || curl -fL -o models/kokoro.onnx $B/kokoro-v1.0.onnx
[ -f models/voices.bin ] || curl -fL -o models/voices.bin $B/voices-v1.0.bin
