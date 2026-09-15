import Crop from "../models/Crop.js";

// ─── AUTHENTIC TRADITIONAL MILLET & HERITAGE PRODUCE RECIPES ───
export const RECIPE_KNOWLEDGE_BASE = [
  {
    id: "rec_korralu_bisibele",
    name: "Foxtail Millet (Korralu) Vegetable Bisi Bele Bath",
    teluguName: "కొర్రల వెజిటబుల్ బిసిబేలేబాత్",
    milletType: "Foxtail Millet (Korralu / Kangni)",
    primaryMilletKey: "korralu",
    healthCategory: "diabetes_care",
    targetHealthBenefit: "Low Glycemic Index & Nervous System Tonic",
    prepTime: "20 mins (+ 6 hrs soaking)",
    cookTime: "25 mins",
    servings: 4,
    difficulty: "Easy",
    glycemicIndex: 50,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 8.0,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "280 kcal per bowl",
      protein: "8.5g",
      iron: "3.2mg",
      calcium: "38mg",
      fiber: "8.0g (40x white rice!)"
    },
    whyReviveMillet: "Polished white rice spikes blood sugar within 30 minutes. Foxtail millet releases glucose slowly over 6 hours, repairing nervous tissue and preventing metabolic fatigue while requiring 70% less water to cultivate.",
    essentialMilletRule: {
      soakingHours: 6,
      soakingReason: "Mandatory 6-8 hour soaking neutralizes phytic acid (an anti-nutrient) and unlocks 100% bio-available zinc, iron, and magnesium.",
      waterRatio: "1 cup millet to 3.5 cups water for soft Bisi Bele Bath texture.",
      vesselAdvice: "Prefer a thick-bottomed steel pan or earthen clay pot on low-medium flame."
    },
    ingredients: [
      { name: "Foxtail Millet (Korralu)", searchTerms: ["korralu", "foxtail", "millet"], quantity: "1 Cup", required: true },
      { name: "Toor Dal (Kandi Pappu)", searchTerms: ["toor", "kandi", "arhar", "dal"], quantity: "1/2 Cup", required: true },
      { name: "Country Carrot", searchTerms: ["carrot", "gajar"], quantity: "1 Medium, diced", required: false },
      { name: "Farm French Beans / Desi Beans", searchTerms: ["beans", "chikkudu"], quantity: "1/2 Cup, chopped", required: false },
      { name: "Fresh Tomato", searchTerms: ["tomato", "tamota"], quantity: "2 Medium, chopped", required: true },
      { name: "Desi Cow Ghee / Native Cold Pressed Groundnut Oil", searchTerms: ["ghee", "neyi", "oil", "groundnut", "palli"], quantity: "2 tbsp", required: true },
      { name: "Turmeric Powder (Pasupu)", searchTerms: ["turmeric", "pasupu", "haldi"], quantity: "1/2 tsp", required: true }
    ],
    pantryStaples: ["Mustard seeds (1/2 tsp)", "Curry leaves", "Bisi bele bath powder / Sambar powder (2 tbsp)", "Tamarind extract (1 tbsp)", "Rock salt to taste"],
    instructions: [
      "Wash Foxtail Millet (Korralu) thoroughly in fresh water twice, then soak for 6 to 8 hours.",
      "Pressure cook or clay-pot boil the soaked Korralu and Toor dal together with 4 cups of water, turmeric, and a drop of cold-pressed oil until soft and mashable (3 whistles).",
      "In a separate pan, heat 1 tbsp ghee or cold-pressed oil, add mustard seeds, curry leaves, chopped tomatoes, carrots, and beans. Sauté for 4-5 minutes until tender.",
      "Add 1 cup of water, tamarind pulp, and bisi bele bath masala. Simmer for 6 minutes until vegetable aromatics blend.",
      "Add cooked Korralu-dal mash into the boiling vegetables. Stir well on low heat for 5 minutes, adjusting salt and water for a rich pouring consistency.",
      "Finish with a final tempering of 1 tbsp pure cow ghee, a pinch of hing (asafoetida), and serve steaming hot with fresh cucumber slices."
    ]
  },
  {
    id: "rec_arikelu_pongal",
    name: "Kodo Millet (Arikelu) Ghee Ven Pongal",
    teluguName: "అరిసెల అరిసెల అరిసెల పాకంలాంటి అరికెలు వెన్ పొంగల్",
    milletType: "Kodo Millet (Arikelu / Kodra)",
    primaryMilletKey: "arikelu",
    healthCategory: "heart_care",
    targetHealthBenefit: "Blood Purification, Bone Marrow Nourishment & Lowest Glycemic Load",
    prepTime: "15 mins (+ 8 hrs soaking)",
    cookTime: "20 mins",
    servings: 3,
    difficulty: "Easy",
    glycemicIndex: 48,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 9.8,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "260 kcal per bowl",
      protein: "9.2g",
      fiber: "9.8g (Highest polyphenols among all grains)",
      antiOxidants: "Rich in ferulic and p-coumaric acid"
    },
    whyReviveMillet: "Arikelu was traditionally prescribed by village Vaidyas to purify blood, soothe arthritis, and cleanse the lymphatic system. Reintroducing Arikelu supports drought-prone farmers who harvest it without synthetic chemicals.",
    essentialMilletRule: {
      soakingHours: 8,
      soakingReason: "Arikelu has a fibrous outer bran coat. 8 hours soaking hydrates the grain deeply, guaranteeing a silky, melt-in-the-mouth Pongal without stomach heaviness.",
      waterRatio: "1 cup Arikelu + 1/3 cup Moong dal to 4 cups water.",
      vesselAdvice: "Slow-simmer in an open brass or stainless steel vessel with a lid."
    },
    ingredients: [
      { name: "Kodo Millet (Arikelu)", searchTerms: ["arikelu", "kodo", "millet", "siridhanya"], quantity: "1 Cup", required: true },
      { name: "Yellow Moong Dal (Pesara Pappu)", searchTerms: ["moong", "pesalu", "dal"], quantity: "1/3 Cup", required: true },
      { name: "Desi Cow Ghee / Native Cold Pressed Oil", searchTerms: ["ghee", "neyi", "oil"], quantity: "2.5 tbsp", required: true },
      { name: "Fresh Ginger", searchTerms: ["ginger", "allam"], quantity: "1 inch piece, grated", required: true },
      { name: "Whole Black Pepper & Cumin", searchTerms: ["spice", "pepper", "miriyalu", "jeera"], quantity: "1 tsp each", required: true }
    ],
    pantryStaples: ["Cashew nuts (optional, 10 pcs)", "Curry leaves (fresh sprig)", "Hing / Asafoetida (pinch)", "Rock salt to taste"],
    instructions: [
      "Thoroughly rinse Arikelu (Kodo millet) and soak in fresh drinking water for 8 hours.",
      "Dry roast the yellow moong dal on low flame until fragrant and lightly golden (do not brown).",
      "Combine soaked Arikelu and roasted moong dal with 4 cups of water and 1 tsp rock salt. Cook on medium flame until soft and creamy.",
      "In a small pan, heat pure desi ghee. Sauté crushed black peppercorns, cumin seeds, grated ginger, and curry leaves until sizzling and aromatic.",
      "Pour the sizzling ghee tempering immediately over the steaming hot Pongal. Gently fold together.",
      "Serve warm with fresh coconut-coriander chutney for an authentic, wholesome Ayurvedic meal."
    ]
  },
  {
    id: "rec_ragi_mudde",
    name: "Finger Millet (Ragi) Mudde with Country Greens Stew",
    teluguName: "రాయలసీమ రాగి ముద్ద & ఆకుకూరల పప్పు",
    milletType: "Finger Millet (Ragi / Ragulu)",
    primaryMilletKey: "ragi",
    healthCategory: "bone_health",
    targetHealthBenefit: "Massive 344mg Calcium (30x White Rice) for Bones & Joint Strength",
    prepTime: "10 mins (No long soaking needed for fresh flour)",
    cookTime: "25 mins",
    servings: 4,
    difficulty: "Medium",
    glycemicIndex: 54,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 11.5,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "240 kcal per mudde",
      calcium: "344mg (Highest among all cereals)",
      protein: "7.3g",
      iron: "3.9mg"
    },
    whyReviveMillet: "White rice leads to osteoporosis and joint degeneration over decades. Ragi Mudde has sustained South Indian farmers for millennia with unmatched bone density and endurance, thriving on dry red soils.",
    essentialMilletRule: {
      soakingHours: 0,
      soakingReason: "Freshly milled stone-ground Ragi flour gelatinizes rapidly in boiling water. Constant churning with a wooden rolling pin ('Mudde Kolu') ensures zero lumps.",
      waterRatio: "1 cup Ragi flour to 2.25 cups water.",
      vesselAdvice: "Heavy-gauge iron Kadai or hard-anodized deep pot."
    },
    ingredients: [
      { name: "Stone-Ground Finger Millet (Ragi Flour)", searchTerms: ["ragi", "millet", "flour"], quantity: "1.5 Cups", required: true },
      { name: "Farm Fresh Spinach or Palak / Gongura", searchTerms: ["spinach", "palak", "gongura", "leafy"], quantity: "2 Bunches", required: true },
      { name: "Toor Dal or Moong Dal", searchTerms: ["toor", "kandi", "moong", "dal"], quantity: "1/2 Cup", required: true },
      { name: "Country Tomatoes", searchTerms: ["tomato", "tamota"], quantity: "2 Medium", required: true },
      { name: "Cold Pressed Sesame or Groundnut Oil", searchTerms: ["oil", "nune", "sesame", "groundnut"], quantity: "2 tbsp", required: true },
      { name: "Fresh Green Chillies & Garlic", searchTerms: ["chilli", "mirchi", "garlic", "vellulli"], quantity: "4 chillies, 6 cloves", required: true }
    ],
    pantryStaples: ["Mustard seeds (1/2 tsp)", "Turmeric (1/2 tsp)", "Rock salt", "Desi cow ghee for serving"],
    instructions: [
      "In a pot, bring 2.25 cups water to a rolling boil with 1/2 tsp salt and 1 tsp ghee. Take 2 tbsp of ragi flour, whisk with 4 tbsp water, and pour into boiling water to form a smooth bubbling base.",
      "Pour the remaining ragi flour in the center of boiling water in a pyramid shape. DO NOT STIR yet. Let it steam cook undisturbed on medium flame for 4 minutes.",
      "Using a wooden churner/roller stick, vigorously churn and mix the ragi flour into the bubbling water until glossy and lump-free. Cover with lid on low heat for 3 minutes.",
      "Transfer a warm portion onto a wet plate or ghee-smeared wooden bowl. Roll with damp hands into a smooth, glossy ball (Mudde).",
      "For the stew: Boil toor dal with fresh spinach/gongura, tomatoes, green chillies, garlic, and turmeric. Mash with wooden pestle ('Pappu Gutti') and temper with mustard seeds and curry leaves in cold-pressed oil.",
      "Dip hot Ragi Mudde morsels in the spicy greens dal with a drizzle of desi ghee. Swallow without chewing heavily, exactly as village elders do!"
    ]
  },
  {
    id: "rec_samalu_payasam",
    name: "Little Millet (Samalu) Royal Kheer with Native Palm Sugar",
    teluguName: "సామల తాటిబెల్లం పరమాన్నం",
    milletType: "Little Millet (Samalu / Kutki)",
    primaryMilletKey: "samalu",
    healthCategory: "digestive_health",
    targetHealthBenefit: "Reproductive Vitality, Endocrine Balance & Zero-Refined-Sugar Sweet",
    prepTime: "15 mins (+ 6 hrs soaking)",
    cookTime: "25 mins",
    servings: 4,
    difficulty: "Easy",
    glycemicIndex: 45,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 7.6,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "220 kcal per serving",
      naturalSugars: "Zero refined white sugar; 100% Native Palm Jaggery (Karupatti)",
      iron: "4.5mg (Boosts hemoglobin)"
    },
    whyReviveMillet: "Commercial sweets made from refined white rice and white sulfur sugar deplete vitamins. Little Millet with authentic Palm Sugar nourishes the reproductive organs, cleanses the liver, and satisfies the sweet tooth safely.",
    essentialMilletRule: {
      soakingHours: 6,
      soakingReason: "Little millet grains are delicate. Soaking for 6 hours allows the grain to expand evenly without breaking, creating a silky pudding texture in milk.",
      waterRatio: "1 cup Samalu to 2 cups water + 2 cups organic A2 milk (or coconut milk).",
      vesselAdvice: "Thick bronze uruli or stainless steel saucepan."
    },
    ingredients: [
      { name: "Little Millet (Samalu)", searchTerms: ["samalu", "little", "millet", "siridhanya"], quantity: "1 Cup", required: true },
      { name: "Native Palm Sugar (Thaati Bellam / Karupatti)", searchTerms: ["palm_sugar", "thaati_bellam", "karupatti", "bellam", "jaggery"], quantity: "3/4 Cup, grated", required: true },
      { name: "Organic Ghee", searchTerms: ["ghee", "neyi"], quantity: "2 tbsp", required: true },
      { name: "Dry Fruits (Cashews & Raisins)", searchTerms: ["cashew", "dry_fruit"], quantity: "2 tbsp", required: false }
    ],
    pantryStaples: ["Fresh Cardamom powder (1/2 tsp)", "Milk or Almond/Coconut milk (2.5 cups)"],
    instructions: [
      "Wash and soak Samalu (Little Millet) for 6 hours.",
      "In a pan, simmer soaked Samalu in 2 cups of water and 1 cup of milk until cooked soft and fragrant (about 12 minutes on low flame).",
      "In a separate small vessel, dissolve grated native palm sugar in 1/2 cup of warm water, filter out any natural sediment, and simmer into a light syrup.",
      "Add remaining milk and fresh cardamom powder to the cooked Samalu. Let it bubble gently for 4 minutes.",
      "Turn off the heat. WAIT 2 MINUTES, then stir in the palm sugar syrup (adding palm jaggery while boiling hot curdles dairy milk).",
      "Fry cashews in pure desi ghee until golden and pour over the royal Kheer. Serve warm or chilled."
    ]
  },
  {
    id: "rec_oodalu_khichdi",
    name: "Barnyard Millet (Oodalu) Detox Vegetable Khichdi",
    teluguName: "ఊదల డిటాక్స్ వెజిటబుల్ కిచిడీ",
    milletType: "Barnyard Millet (Oodalu / Sanwa)",
    primaryMilletKey: "oodalu",
    healthCategory: "weight_loss",
    targetHealthBenefit: "Highest Fiber Among All Grains (10x Rice) for Liver & Gut Cleansing",
    prepTime: "15 mins (+ 6 hrs soaking)",
    cookTime: "20 mins",
    servings: 3,
    difficulty: "Easy",
    glycemicIndex: 42,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 10.1,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "210 kcal per bowl",
      fiber: "10.1g per 100g (Deep gut cleansing)",
      digestionSpeed: "Extremely light and easy on the liver"
    },
    whyReviveMillet: "Oodalu contains the lowest carbohydrate and highest crude fiber content of all cereals. It cleanses the liver and thyroid, reversing non-alcoholic fatty liver and aiding natural fat loss.",
    essentialMilletRule: {
      soakingHours: 6,
      soakingReason: "Barnyard millet cooks very quickly. Soaking for 6 hours softens the soluble fiber matrix so it absorbs natural vegetable aromas without turning mushy.",
      waterRatio: "1 cup Oodalu to 3.5 cups water.",
      vesselAdvice: "Steel pot or pressure cooker (2 whistles)."
    },
    ingredients: [
      { name: "Barnyard Millet (Oodalu)", searchTerms: ["oodalu", "barnyard", "sanwa", "millet"], quantity: "1 Cup", required: true },
      { name: "Yellow Moong Dal (Pesara Pappu)", searchTerms: ["moong", "pesalu", "dal"], quantity: "1/3 Cup", required: true },
      { name: "Farm Fresh Green Peas / Beans", searchTerms: ["beans", "peas", "chikkudu"], quantity: "1/2 Cup", required: false },
      { name: "Fresh Country Tomato & Carrot", searchTerms: ["tomato", "carrot", "tamota", "gajar"], quantity: "1 each, diced", required: true },
      { name: "Cold Pressed Groundnut or Sesame Oil", searchTerms: ["oil", "groundnut", "nune"], quantity: "1.5 tbsp", required: true }
    ],
    pantryStaples: ["Cumin seeds (1 tsp)", "Green chillies (2 pcs)", "Ginger (1 tsp minced)", "Turmeric (1/2 tsp)", "Salt to taste"],
    instructions: [
      "Wash and soak Barnyard Millet (Oodalu) for 6 hours in clean water.",
      "In a cooker or heavy pot, heat cold-pressed oil. Splutter cumin seeds, add slit green chillies, minced ginger, and curry leaves.",
      "Add diced carrots, tomatoes, and beans. Sauté for 3 minutes with turmeric powder.",
      "Add washed moong dal and the soaked Oodalu along with 3.5 cups of water and salt.",
      "Pressure cook for 2 whistles or cook open on medium heat for 15 minutes until grains are tender and porridge-like.",
      "Garnish with freshly chopped coriander leaves and a dash of lemon juice. A sublime, light dinner for healthy weight management."
    ]
  },
  {
    id: "rec_jowar_bhakri",
    name: "Sorghum (Jowar / Jonnalu) Gluten-Free Roti with Roasted Tomato Chutney",
    teluguName: "జొన్న రొట్టె & దేశవాళీ టమోటా పచ్చడి",
    milletType: "Sorghum (Jowar / Jonnalu)",
    primaryMilletKey: "jowar",
    healthCategory: "diabetes_care",
    targetHealthBenefit: "100% Gluten-Free, Cardiac Protective & Rich in Resistant Starch",
    prepTime: "15 mins",
    cookTime: "20 mins",
    servings: 4,
    difficulty: "Medium",
    glycemicIndex: 52,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 6.7,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "180 kcal per roti",
      potassium: "360mg (Regulates healthy blood pressure)",
      gluten: "Zero / 100% Naturally Gluten-Free"
    },
    whyReviveMillet: "Wheat and white rice cause chronic gut inflammation and gluten intolerance. Jowar was the staple of Deccan plateau warriors, imparting incredible stamina while requiring no chemical pesticides.",
    essentialMilletRule: {
      soakingHours: 0,
      soakingReason: "Jowar contains no gluten. The secret to soft, puffing rotis is kneading the flour with boiling hot water, which pre-gelatinizes the starches for elasticity.",
      waterRatio: "1 cup Jowar flour to 3/4 cup boiling water.",
      vesselAdvice: "Cast iron tawa on high heat."
    },
    ingredients: [
      { name: "Fresh Stone-Ground Jowar Flour", searchTerms: ["jowar", "jonnalu", "sorghum", "flour"], quantity: "2 Cups", required: true },
      { name: "Ripe Country Tomatoes", searchTerms: ["tomato", "tamota"], quantity: "4 Large", required: true },
      { name: "Fresh Green / Dry Red Chillies", searchTerms: ["chilli", "mirchi"], quantity: "4-5 pcs", required: true },
      { name: "Cold Pressed Native Oil", searchTerms: ["oil", "nune"], quantity: "1 tbsp", required: true }
    ],
    pantryStaples: ["Garlic cloves (6-8 pcs)", "Cumin seeds (1 tsp)", "Rock salt", "Warm drinking water"],
    instructions: [
      "In a bowl, add 2 cups jowar flour and a pinch of salt. Pour boiling water gradually, stirring with a spoon until combined.",
      "Once warm to touch, knead vigorously with your palm for 4-5 minutes until smooth and pliable.",
      "Take a lemon-sized ball of dough, dust with dry jowar flour, and gently pat with the palm of your hand into a round thin disc on a flat board.",
      "Transfer onto a hot cast-iron tawa. Smear a little water over the top surface with your fingers. When moisture evaporates, flip and cook until brown blisters appear and the roti puffs up.",
      "For the chutney: Roast country tomatoes, chillies, and garlic on open flame until charred. Coarsely crush in a stone mortar with cumin seeds, salt, and raw cold-pressed oil.",
      "Serve hot Jowar Rotis with spicy roasted tomato chutney and raw spring onions for an authentic rural feast!"
    ]
  },
  {
    id: "rec_bajra_khichda",
    name: "Pearl Millet (Bajra / Sajjalu) Winter Immunity Porridge",
    teluguName: "సజ్జల పోషకాహార కిచిడీ",
    milletType: "Pearl Millet (Bajra / Sajjalu)",
    primaryMilletKey: "bajra",
    healthCategory: "children_nutrition",
    targetHealthBenefit: "Iron & Zinc Shield, Respiratory Strength & High Stamina",
    prepTime: "15 mins (+ 8 hrs soaking)",
    cookTime: "30 mins",
    servings: 4,
    difficulty: "Easy",
    glycemicIndex: 53,
    whiteRiceGlycemicIndex: 78,
    fiberGrams: 8.5,
    whiteRiceFiberGrams: 0.2,
    nutritionHighlights: {
      calories: "270 kcal per bowl",
      iron: "8.0mg (Triple the iron of white rice)",
      zinc: "3.1mg (Vital for children's immunity & height growth)"
    },
    whyReviveMillet: "Children and women across India suffer from hidden iron deficiency anemia due to excessive polished white rice. Sajjalu delivers 8mg of bioavailable organic iron, keeping the body warm and energizing the lungs.",
    essentialMilletRule: {
      soakingHours: 8,
      soakingReason: "Pearl millet has a hardy seed coat. Soaking for 8 hours followed by slight coarse pounding ('Danadaliga') softens the kernel for smooth cooking.",
      waterRatio: "1 cup soaked Bajra to 4 cups water.",
      vesselAdvice: "Earthen pot or heavy pressure cooker."
    },
    ingredients: [
      { name: "Pearl Millet (Sajjalu / Bajra)", searchTerms: ["bajra", "sajjalu", "pearl", "millet"], quantity: "1 Cup", required: true },
      { name: "Yellow Moong Dal or Green Moong", searchTerms: ["moong", "pesalu", "dal"], quantity: "1/2 Cup", required: true },
      { name: "Desi Cow Ghee", searchTerms: ["ghee", "neyi"], quantity: "2 tbsp", required: true },
      { name: "Farm Fresh Ginger & Garlic", searchTerms: ["ginger", "allam", "garlic", "vellulli"], quantity: "1 tbsp minced", required: true }
    ],
    pantryStaples: ["Cumin seeds (1 tsp)", "Green chillies (2 pcs)", "Turmeric (1/2 tsp)", "Hing (pinch)", "Rock salt"],
    instructions: [
      "Wash and soak Bajra (Pearl millet) for 8 hours in plenty of water. Coarsely pulse in a mixer grinder for 3 seconds to crack the outer husk.",
      "In a pressure cooker, heat 1 tbsp pure cow ghee. Add cumin seeds, hing, minced ginger, and green chillies.",
      "Add turmeric, washed moong dal, soaked cracked Bajra, 4 cups of water, and rock salt.",
      "Cook on medium flame for 4 whistles, then simmer on low flame for 10 minutes until thick and creamy.",
      "Top with a generous dollop of pure desi cow ghee and serve warm with fresh curd or spicy pickle."
    ]
  }
];

// ─── INVENTORY MATCHER: LINK AVAILABLE MARKETPLACE CROPS TO RECIPES ───
export async function getMarketplaceRecipes() {
  try {
    // Fetch all currently active and available crops from marketplace
    const availableCrops = await Crop.find({
      isLive: { $ne: false },
      quantity: { $gt: 0 }
    })
      .populate("farmer", "name farmName location phone avatar")
      .select("name category price unit quantity image farmLocation location isOrganic farmer growingStage lifecycleStage qualityGrade");

    // Match each recipe against available live crops
    const enrichedRecipes = RECIPE_KNOWLEDGE_BASE.map(recipe => {
      let matchedCount = 0;
      const enrichedIngredients = recipe.ingredients.map(ing => {
        // Find best matching crop in marketplace
        const matchedCrop = availableCrops.find(crop => {
          const cropName = (crop.name || "").toLowerCase();
          const cropCat = (crop.category || "").toLowerCase();
          return ing.searchTerms.some(term => 
            cropName.includes(term.toLowerCase()) || 
            cropCat.includes(term.toLowerCase())
          );
        });

        if (matchedCrop) {
          matchedCount++;
          return {
            ...ing,
            inStock: true,
            crop: {
              _id: matchedCrop._id,
              name: matchedCrop.name,
              price: matchedCrop.price,
              unit: matchedCrop.unit || "kg",
              quantity: matchedCrop.quantity,
              image: matchedCrop.image,
              isOrganic: matchedCrop.isOrganic,
              farmerName: matchedCrop.farmer?.name || "Verified Local Farmer",
              farmLocation: matchedCrop.farmLocation || matchedCrop.location || "Telangana / AP",
              qualityGrade: matchedCrop.qualityGrade
            }
          };
        }

        return {
          ...ing,
          inStock: false,
          crop: null
        };
      });

      const totalIngredients = recipe.ingredients.length;
      const inStockPercentage = Math.round((matchedCount / totalIngredients) * 100);
      const readyToCook = matchedCount >= Math.ceil(totalIngredients * 0.5);

      return {
        ...recipe,
        ingredients: enrichedIngredients,
        matchedIngredientsCount: matchedCount,
        totalIngredientsCount: totalIngredients,
        inStockPercentage,
        readyToCook
      };
    });

    // Sort by recipes with most ingredients in stock first
    enrichedRecipes.sort((a, b) => b.inStockPercentage - a.inStockPercentage);

    return {
      recipes: enrichedRecipes,
      totalAvailableCropsCount: availableCrops.length,
      timestamp: new Date()
    };
  } catch (error) {
    console.error("Error matching marketplace crops to recipes:", error.message);
    return {
      recipes: RECIPE_KNOWLEDGE_BASE,
      totalAvailableCropsCount: 0,
      timestamp: new Date()
    };
  }
}
