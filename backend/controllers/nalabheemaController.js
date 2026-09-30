import NalabheemaProfile from '../models/NalabheemaProfile.js';
import { ai } from '../server.js'; // Import the initialized Gemini AI instance

export const getProfile = async (req, res) => {
  try {
    let profile = await NalabheemaProfile.findOne({ customerId: req.user.id });
    if (!profile) profile = await NalabheemaProfile.create({ customerId: req.user.id });
    res.status(200).json({ success: true, data: profile });
  } catch (error) { res.status(500).json({ success: false, error: 'Server Error' }); }
};

export const generateRecipe = async (req, res) => {
  try {
    const { ingredients } = req.body;
    const profile = await NalabheemaProfile.findOne({ customerId: req.user.id });
    const constraints = profile ? profile.dietaryConstraints.join(', ') : 'None';
    
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini AI is not configured. Missing GEMINI_API_KEY.' });
    }

    const prompt = `You are Nalabheema, an expert Indian AI Chef. Generate a recipe using exactly these ingredients: ${ingredients.join(', ')}. 
    Dietary constraints: ${constraints}. 
    Respond ONLY in strict JSON format matching this structure: 
    { "title": "Recipe Name", "ingredientsUsed": ["ing1"], "instructions": ["step1"], "macros": { "calories": 0, "protein": 0 } }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Parse the JSON out of the AI response
    let jsonText = response.text().trim();
    if (jsonText.startsWith('\`\`\`json')) {
      jsonText = jsonText.slice(7, -3).trim();
    }
    
    const generatedRecipe = JSON.parse(jsonText);

    // NUTRITIONAL STATE TRACKING (Google Fit Sync)
    // Synchronize with fitness APIs to log the meal macros automatically
    const googleFitToken = req.headers['x-google-fit-token']; // Provided by frontend OAuth
    if (googleFitToken && generatedRecipe.macros) {
      try {
        const { calories, protein } = generatedRecipe.macros;
        const endTimeMillis = Date.now();
        const startTimeMillis = endTimeMillis - (30 * 60 * 1000); // Assume a 30min meal

        await fetch('https://www.googleapis.com/fitness/v1/users/me/dataSources/raw:com.google.nutrition:RythuJanaSethu/datasets/' + startTimeMillis + '000000-' + endTimeMillis + '000000', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${googleFitToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "minStartTimeNs": startTimeMillis * 1000000,
            "maxEndTimeNs": endTimeMillis * 1000000,
            "dataSourceId": "raw:com.google.nutrition:RythuJanaSethu",
            "point": [{
              "startTimeNanos": startTimeMillis * 1000000,
              "endTimeNanos": endTimeMillis * 1000000,
              "dataTypeName": "com.google.nutrition",
              "value": [{ "mapVal": [
                { "key": "calories", "value": { "fpVal": calories } },
                { "key": "protein", "value": { "fpVal": protein } }
              ]}]
            }]
          })
        });
        console.log("Successfully synced meal macros to Google Fit.");
      } catch (fitErr) {
        console.warn("Failed to sync with Google Fit API:", fitErr.message);
      }
    }

    res.status(200).json({ success: true, data: generatedRecipe });
  } catch (error) { 
    console.error("Nalabheema AI Error:", error);
    res.status(500).json({ success: false, error: 'Server Error during AI generation' }); 
  }
};