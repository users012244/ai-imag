import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  // Assumi che la chiave API o config siano in environment variables:
  // GOOGLE_API_KEY o variabili richieste dal client @google/genai.
  // Se il client richiede un oggetto config, aggiungilo qui.
  const ai = new GoogleGenAI({ /* lascia vuoto o metti credenziali da env */ });

  const imagePath = process.env.INPUT_IMAGE_PATH ?? "assets/cat_image.png";
  if (!fs.existsSync(imagePath)) {
    console.error(`File non trovato: ${imagePath}`);
    process.exit(1);
  }

  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

  const prompt = [
    { text: "Create a picture of my cat eating a nano-banana in a fancy restaurant under the Gemini constellation" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        const outDir = process.env.OUTPUT_DIR ?? "out";
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const outPath = path.join(outDir, "gemini-native-image.png");
        fs.writeFileSync(outPath, buffer);
        console.log(`Image saved as ${outPath}`);
      }
    }
  } catch (err) {
    console.error("Errore nella generazione:", err);
    process.exit(2);
  }
}

main();
