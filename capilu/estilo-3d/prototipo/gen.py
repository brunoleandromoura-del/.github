"""Gera ilustrações 3D com modelo aberto (DreamShaper XL Lightning, licença OpenRAIL++), em CPU.
Uso: gen.py jobs.json   -> jobs: [{"out":..., "prompt":..., "seed":1, "w":1024, "h":576, "ref": opcional, "ref_scale":0.6, "steps":5}]"""
import sys, json, time, os, torch
from diffusers import StableDiffusionXLPipeline, DPMSolverSinglestepScheduler
from PIL import Image
torch.set_num_threads(4)
jobs = json.load(open(sys.argv[1]))
NEG = "scary, creepy, horror, realistic photo, text, letters, watermark, signature, deformed, extra limbs, extra heads, blurry, low quality, human"
pipe = StableDiffusionXLPipeline.from_pretrained("Lykon/dreamshaper-xl-lightning", torch_dtype=torch.bfloat16, variant="fp16", use_safetensors=True)
pipe.scheduler = DPMSolverSinglestepScheduler.from_config(pipe.scheduler.config, use_karras_sigmas=True, lower_order_final=True)
if any(j.get('ref') for j in jobs):
    pipe.load_ip_adapter("h94/IP-Adapter", subfolder="sdxl_models", weight_name="ip-adapter_sdxl.safetensors", torch_dtype=torch.bfloat16)
    pipe.image_encoder.to(torch.bfloat16)
for j in jobs:
    if os.path.exists(j['out']) and not j.get('force'): continue
    t = time.time(); kw = {}
    if j.get('ref'):
        pipe.set_ip_adapter_scale(j.get('ref_scale', 0.6)); kw['ip_adapter_image'] = Image.open(j['ref']).convert('RGB')
    elif hasattr(pipe, 'set_ip_adapter_scale') and getattr(pipe, 'image_encoder', None) is not None:
        pipe.set_ip_adapter_scale(0.0); kw['ip_adapter_image'] = Image.new('RGB', (224, 224))
    img = pipe(j['prompt'], negative_prompt=j.get('neg', NEG), num_inference_steps=j.get('steps', 5), guidance_scale=j.get('cfg', 2.0),
               width=j.get('w', 1024), height=j.get('h', 576), generator=torch.Generator().manual_seed(j.get('seed', 1)), **kw).images[0]
    img.save(j['out']); print('ok', j['out'], round(time.time() - t), flush=True)
