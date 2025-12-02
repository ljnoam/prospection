import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Envoie une liste de noms de commerces à Gemini pour identifier les chaînes et franchises.
 * Retourne la liste des noms à EXCLURE.
 */
export const filterJunkLeads = async (names: string[]): Promise<string[]> => {
  if (names.length === 0) return [];

  // On découpe en chunks de 500 pour ne pas saturer le prompt si la liste est immense
  const CHUNK_SIZE = 500;
  let allExcluded: string[] = [];

  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    const chunk = names.slice(i, i + CHUNK_SIZE);
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `
          Tu es un expert en prospection commerciale B2B sur le marché français.
          
          Voici une liste de noms d'établissements :
          ${JSON.stringify(chunk)}

          TA MISSION :
          Identifier les noms qui correspondent à :
          1. Des grandes chaînes nationales ou internationales (ex: Zara, H&M, McDonald's).
          2. Des franchises connues (ex: Century 21, Orpi).
          3. Des banques et assurances (ex: Crédit Agricole, AXA, BNP).
          4. Des supermarchés et hypermarchés (ex: Carrefour, Leclerc, Auchan, Lidl).
          5. Des services publics ou administratifs (ex: La Poste, Mairie, École, CPAM).
          6. Des stations essence (Total, Esso).
          7. Des pompes funèbres (Roc Eclerc).
          8. Des agences d'intérim (Adecco, Manpower).

          Consigne stricte : Retourne UNIQUEMENT un tableau JSON de chaînes de caractères contenant les noms EXACTS de la liste d'entrée qui doivent être EXCLUS. Si un commerce est un indépendant, ne l'inclus pas dans la réponse.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      if (response.text) {
        const excludedChunk = JSON.parse(response.text);
        if (Array.isArray(excludedChunk)) {
          allExcluded = [...allExcluded, ...excludedChunk];
        }
      }
    } catch (error) {
      console.error("Erreur Gemini lors du filtrage :", error);
      // En cas d'erreur sur un chunk, on continue sans filtrer ce chunk pour ne pas tout bloquer, 
      // ou on pourrait relancer. Ici on log juste.
    }
  }

  return allExcluded;
};