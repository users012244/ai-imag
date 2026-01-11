// server/index.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '12mb' })); // support images up to ~12MB

const ai = new GoogleGenAI({/* usa autenticazione via GOOGLE_APPLICATION_CREDENTIALS */});

app.post('/api/nano-banana', async (req, res) => {
  try {
    const { imageDataUrl, action, intensity } = req.body;
    if (!imageDataUrl) return res.status(400).json({ error: 'Missing image' });

    // estrai base64 (data:[mime];base64,...)
    const match = imageDataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid data URL' });
    const mimeType = match[1];
    const base64 = match[2];

    // costruisci prompt (personalizza in base ad action)
    const textPrompt = (() => {
      switch(action){
        case 'stylize': return `Apply a stylish posterize effect (intensity ${intensity}).`;
        case 'colorize': return `Enhance colors with vivid tones (intensity ${intensity}).`;
        case 'remove-bg': return `Remove background, make subject isolated (keep transparency).`;
        case 'enhance': return `Enhance detail and clarity (intensity ${intensity}).`;
        default: return `Slightly improve image quality.`;
      }
    })();

    const prompt = [
      { text: textPrompt },
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // trova la parte immagine
    let outBase64 = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        outBase64 = part.inlineData.data;
        break;
      }
    }
    if (!outBase64) return res.status(500).json({ error: 'No image returned from AI' });

    const outDataUrl = `data:${mimeType};base64,${outBase64}`;
    res.json({ image: outDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
