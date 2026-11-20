#!/usr/bin/env python3
"""Gera a fala de cada personagem (Chatterbox Multilingual, licença MIT) e a linha do tempo da história.
Cada fala é conferida por transcrição automática (Whisper) e refeita se sair errada.
Uso: voices.py <historia.json> <build_dir>"""
import sys, os, json, re, subprocess, difflib, unicodedata
import torch, torchaudio as ta, soundfile as sf
torch.set_num_threads(4)
story_path, build = sys.argv[1], sys.argv[2]
os.makedirs(build, exist_ok=True)
story = json.load(open(story_path, encoding='utf-8'))
here = os.path.dirname(os.path.abspath(__file__))
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
from faster_whisper import WhisperModel
tts = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
asr = WhisperModel("small", device="cpu", compute_type="int8")


def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', '', s).split()


t = 0.0
for i, b in enumerate(story['beats']):
    b['t0'] = round(t, 3)
    if b.get('say'):
        c = story['cast'][b['who']]
        raw, wav = f'{build}/l{i:02d}_raw.wav', f'{build}/l{i:02d}.wav'
        if not os.path.exists(wav):
            best = (-1, None)
            for attempt in range(3):
                torch.manual_seed(100 * i + attempt)
                w = tts.generate(b.get('tts', b['say']), language_id="pt", audio_prompt_path=os.path.join(here, c['voice_ref']),
                                 exaggeration=c.get('exaggeration', 0.7), cfg_weight=c.get('cfg', 0.45))
                ta.save(raw, w, tts.sr)
                heard = ' '.join(s.text for s in asr.transcribe(raw, language='pt')[0])
                score = difflib.SequenceMatcher(None, norm(b['say']), norm(heard)).ratio()
                print(f'fala {i} tentativa {attempt}: {score:.2f} | {heard.strip()}', flush=True)
                if score > best[0]: best = (score, w)
                if score >= 0.85: break
            ta.save(raw, best[1], tts.sr); b['asr_score'] = round(best[0], 2)
            p = 2 ** (c.get('pitch', 0) / 12)  # sobe o tom para voz de personagem, mantendo a duração
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af',
                            f'asetrate={tts.sr}*{p:.4f},aresample=24000,atempo={1 / p:.4f},silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                            '-ar', '24000', '-ac', '1', wav], check=True)
        dur = sf.info(wav).duration
        b['start'] = round(t + b.get('delay', 0.25), 3); b['end'] = round(b['start'] + dur, 3); b['wav'] = os.path.basename(wav)
        t = b['end'] + b.get('gap', 0.45)
    else:
        t += b.get('wait', 1.0)
story['duration'] = round(t, 3)
json.dump(story, open(f'{build}/timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', story['duration'])
