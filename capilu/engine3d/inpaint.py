"""Variações locais de um personagem (bocas, olhos) por inpainting, mantendo o resto idêntico.
Uso: inpaint.py jobs.json -> [{"src":..., "out":..., "prompt":..., "boxes":[[x0,y0,x1,y1],...], "seed":1, "strength":0.9}]"""
import sys, json, time, os, torch
from diffusers import StableDiffusionXLInpaintPipeline, DPMSolverSinglestepScheduler
from PIL import Image, ImageDraw, ImageFilter
torch.set_num_threads(4)
jobs = json.load(open(sys.argv[1]))
NEG = "scary, creepy, teeth, fangs, realistic photo, text, watermark, deformed, blurry, human"
pipe = StableDiffusionXLInpaintPipeline.from_pretrained("Lykon/dreamshaper-xl-lightning", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.scheduler = DPMSolverSinglestepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True, lower_order_final=True)
for j in jobs:
    if os.path.exists(j['out']) and not j.get('force'): continue
    t = time.time(); im = Image.open(j['src']).convert('RGB')
    mask = Image.new('L', im.size, 0); d = ImageDraw.Draw(mask)
    for b in j['boxes']: d.ellipse(b, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(j.get('feather', 6)))
    out = pipe(j['prompt'], negative_prompt=j.get('neg', NEG), image=im, mask_image=mask, width=im.width, height=im.height, strength=j.get('strength', 0.9),
               num_inference_steps=j.get('steps', 7), guidance_scale=2.0, padding_mask_crop=j.get('pad', 96), generator=torch.Generator().manual_seed(j.get('seed', 1))).images[0]
    out.save(j['out']); print('ok', j['out'], round(time.time() - t), flush=True)
