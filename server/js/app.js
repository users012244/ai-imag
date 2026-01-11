// sostituisci la funzione fakeNanoBananaAPI con questa:
async function callNanoBananaServer(payload){
  const resp = await fetch('/api/nano-banana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageDataUrl: payload.image,
      action: payload.action,
      intensity: payload.intensity
    })
  });
  if(!resp.ok){
    const err = await resp.json().catch(()=>({error: resp.statusText}));
    throw new Error(err.error || 'Server error');
  }
  return await resp.json(); // { image: dataUrl }
}
