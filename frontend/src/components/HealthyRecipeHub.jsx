import React, { useState, useEffect } from "react";
import { BASE_URL } from "../api/api";
import { useCart } from "../context/CartContext";
import { 
  Utensils, 
  Sparkles, 
  Clock, 
  Heart, 
  AlertCircle, 
  Check, 
  ShoppingCart, 
  ChefHat, 
  Activity, 
  Droplet, 
  ShieldCheck, 
  X, 
  Flame,
  Search,
  BookOpen
} from "lucide-react";

export default function HealthyRecipeHub({ onClose }) {
  const { addToCart } = useCart();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("curated"); // "curated" | "ai_custom"
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMillet, setSelectedMillet] = useState("all");
  const [expandedRecipeId, setExpandedRecipeId] = useState(null);
  const [addedCrops, setAddedCrops] = useState({});

  // AI Generator Form State
  const [aiIngredients, setAiIngredients] = useState("");
  const [aiHealthGoal, setAiHealthGoal] = useState("Diabetes Management & Low GI");
  const [aiMilletChoice, setAiMilletChoice] = useState("Foxtail Millet (Korralu)");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedRecipe, setAiGeneratedRecipe] = useState(null);

  // Fetch Curated Marketplace Recipes on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/ai/marketplace-recipes`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.recipes) {
            setRecipes(data.recipes);
            if (data.recipes.length > 0) {
              setExpandedRecipeId(data.recipes[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load recipes:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRecipes();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (crop) => {
    if (!crop) return;
    addToCart(crop, 1, false, false);
    setAddedCrops(prev => ({ ...prev, [crop._id]: true }));
    setTimeout(() => {
      setAddedCrops(prev => ({ ...prev, [crop._id]: false }));
    }, 2500);
  };

  const handleAddAllAvailableToCart = (recipe) => {
    if (!recipe || !recipe.ingredients) return;
    recipe.ingredients.forEach(ing => {
      if (ing.inStock && ing.crop) {
        addToCart(ing.crop, 1, false, false);
        setAddedCrops(prev => ({ ...prev, [ing.crop._id]: true }));
      }
    });
  };

  const handleGenerateAiRecipe = async (e) => {
    e.preventDefault();
    if (!aiIngredients.trim()) return;

    try {
      setAiLoading(true);
      setAiGeneratedRecipe(null);
      const res = await fetch(`${BASE_URL}/api/ai/recipe-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: aiIngredients.split(",").map(s => s.trim()).filter(Boolean),
          healthGoal: aiHealthGoal,
          milletType: aiMilletChoice
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiGeneratedRecipe(data.recipe);
      }
    } catch (err) {
      console.error("AI Recipe error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Filtered recipes
  const filteredRecipes = recipes.filter(r => {
    const matchCat = selectedCategory === "all" || r.healthCategory === selectedCategory;
    const matchMillet = selectedMillet === "all" || r.primaryMilletKey === selectedMillet;
    return matchCat && matchMillet;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "rgba(10, 25, 18, 0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
    >
      <div
        style={{
          background: "linear-gradient(180deg, #0d2818 0%, #06190f 100%)",
          color: "#e2e8f0",
          width: "100%",
          maxWidth: "1080px",
          height: "92vh",
          borderRadius: "20px",
          border: "1px solid rgba(74, 222, 128, 0.3)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(16, 43, 27, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #15803d, #22c55e)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)"
              }}
            >
              <Utensils size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#f0fdf4" }}>
                  Siridhanya & Heritage Millet Kitchen
                </h2>
                <span
                  style={{
                    background: "rgba(234, 179, 8, 0.2)",
                    color: "#fde047",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    border: "1px solid rgba(234, 179, 8, 0.4)"
                  }}
                >
                  Eat Healthy • Support Farmers
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.84rem", color: "#86efac" }}>
                Reclaim ancestral health by switching from white rice to authentic millets. Cook with fresh produce direct from RythuJanaSethu farmers!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            padding: "8px 24px",
            gap: "12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(6, 20, 12, 0.4)"
          }}
        >
          <button
            onClick={() => setActiveTab("curated")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "curated" ? "#16a34a" : "transparent",
              color: activeTab === "curated" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s ease"
            }}
          >
            <BookOpen size={18} />
            <span>Curated Heritage Recipes ({recipes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ai_custom")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "ai_custom" ? "linear-gradient(135deg, #0284c7, #0ea5e9)" : "transparent",
              color: activeTab === "ai_custom" ? "#ffffff" : "#94a3b8",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s ease"
            }}
          >
            <Sparkles size={18} />
            <span>AI Chef (Cook with My Ingredients)</span>
          </button>
        </div>

        {/* Body Section */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {activeTab === "curated" ? (
            <div>
              {/* Mission Banner: Millets vs White Rice */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(20, 83, 45, 0.5), rgba(15, 23, 42, 0.6))",
                  border: "1px solid rgba(74, 222, 128, 0.25)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px"
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 6px 0", color: "#fde047", fontSize: "0.98rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Flame size={16} /> Why Revive Millets Over Polished White Rice?
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                    Polished rice spikes blood sugar (GI ~78) and lacks fiber (0.2g). Ancient Millets (Siridhanya) release glucose over 6-8 hours (GI ~48-52), contain 30x–50x more fiber, and require 70% less water for our farmers!
                  </p>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid rgba(234, 179, 8, 0.3)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#facc15", fontWeight: 700, fontSize: "0.86rem", marginBottom: "4px" }}>
                    <AlertCircle size={16} /> The Golden Millet Cooking Law:
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>
                    <strong>Mandatory 6-8 Hours Soaking:</strong> Breaks down phytic acid to make 100% zinc, iron, and minerals absorbable. Use 1:3 water ratio in clay pot or thick steel!
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    background: "#0f2f1d",
                    color: "#e2e8f0",
                    border: "1px solid rgba(74, 222, 128, 0.3)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.86rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">🎯 All Health Benefits</option>
                  <option value="diabetes_care">🩺 Diabetes & Blood Sugar Control</option>
                  <option value="heart_care">❤️ Heart Care & Blood Purification</option>
                  <option value="bone_strength">🦴 Bone Strength & Calcium</option>
                  <option value="high_fiber_digestion">🌿 High Fiber & Gut Health</option>
                </select>

                <select
                  value={selectedMillet}
                  onChange={(e) => setSelectedMillet(e.target.value)}
                  style={{
                    background: "#0f2f1d",
                    color: "#e2e8f0",
                    border: "1px solid rgba(74, 222, 128, 0.3)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "0.86rem",
                    cursor: "pointer"
                  }}
                >
                  <option value="all">🌾 All Millet Types</option>
                  <option value="korralu">Foxtail Millet (Korralu)</option>
                  <option value="arikelu">Kodo Millet (Arikelu)</option>
                  <option value="samalu">Little Millet (Samalu)</option>
                  <option value="oodalu">Barnyard Millet (Oodalu)</option>
                  <option value="ragi">Finger Millet (Ragi)</option>
                  <option value="jowar">Sorghum (Jowar / Jonnalu)</option>
                  <option value="bajra">Pearl Millet (Bajra / Sajjalu)</option>
                </select>
              </div>

              {/* Recipe List */}
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div className="loader" style={{ margin: "0 auto 16px" }}></div>
                  <p style={{ color: "#86efac" }}>Harvesting authentic recipes from farm knowledge base...</p>
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px" }}>
                  <p style={{ color: "#94a3b8" }}>No recipes match your current filter selection.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {filteredRecipes.map((recipe) => {
                    const isExpanded = expandedRecipeId === recipe.id;
                    const inStockCount = recipe.matchedIngredientsCount || 0;
                    const totalCount = recipe.totalIngredientsCount || recipe.ingredients.length;

                    return (
                      <div
                        key={recipe.id}
                        style={{
                          background: isExpanded ? "rgba(16, 45, 28, 0.9)" : "rgba(12, 33, 21, 0.6)",
                          border: isExpanded ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                          borderRadius: "16px",
                          overflow: "hidden",
                          transition: "all 0.25s ease"
                        }}
                      >
                        {/* Recipe Header Card */}
                        <div
                          onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                          style={{
                            padding: "16px 20px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "12px"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                              <span
                                style={{
                                  background: "rgba(34, 197, 94, 0.2)",
                                  color: "#4ade80",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "4px"
                                }}
                              >
                                {recipe.milletType}
                              </span>
                              <span
                                style={{
                                  background: "rgba(59, 130, 246, 0.2)",
                                  color: "#93c5fd",
                                  fontSize: "0.74rem",
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: "4px"
                                }}
                              >
                                {recipe.targetHealthBenefit}
                              </span>
                            </div>
                            <h3 style={{ margin: "2px 0 0 0", fontSize: "1.1rem", color: "#f8fafc" }}>
                              {recipe.name} <span style={{ color: "#86efac", fontSize: "0.95rem" }}>({recipe.teluguName})</span>
                            </h3>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            {/* Live Marketplace Produce Available Badge */}
                            <div
                              style={{
                                background: inStockCount > 0 ? "rgba(34, 197, 94, 0.15)" : "rgba(255,255,255,0.05)",
                                border: inStockCount > 0 ? "1px solid rgba(34, 197, 94, 0.4)" : "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "20px",
                                padding: "4px 12px",
                                fontSize: "0.8rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: inStockCount > 0 ? "#86efac" : "#94a3b8"
                              }}
                            >
                              <ShoppingCart size={14} />
                              <span>{inStockCount} of {totalCount} ingredients live in Market</span>
                            </div>

                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: "#86efac",
                                cursor: "pointer",
                                fontSize: "0.88rem",
                                fontWeight: 600
                              }}
                            >
                              {isExpanded ? "Hide Recipe ▲" : "View Recipe ▼"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Recipe Content */}
                        {isExpanded && (
                          <div
                            style={{
                              padding: "0 20px 20px 20px",
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                              marginTop: "4px"
                            }}
                          >
                            {/* Nutrition & GI Comparison Grid */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "12px",
                                margin: "16px 0",
                                background: "rgba(0,0,0,0.25)",
                                padding: "14px",
                                borderRadius: "12px"
                              }}
                            >
                              <div>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Glycemic Index (GI):</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#4ade80" }}>
                                    {recipe.glycemicIndex}
                                  </span>
                                  <span style={{ fontSize: "0.76rem", color: "#cbd5e1" }}>
                                    (vs White Rice: <span style={{ color: "#f87171", textDecoration: "line-through" }}>{recipe.whiteRiceGlycemicIndex}</span>)
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Dietary Fiber:</span>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#38bdf8" }}>
                                    {recipe.fiberGrams}g
                                  </span>
                                  <span style={{ fontSize: "0.76rem", color: "#cbd5e1" }}>
                                    (vs White Rice: <span style={{ color: "#f87171", textDecoration: "line-through" }}>{recipe.whiteRiceFiberGrams}g</span>)
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Prep & Cook Time:</span>
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", marginTop: "2px" }}>
                                  ⏱️ {recipe.prepTime} • {recipe.cookTime}
                                </div>
                              </div>

                              <div>
                                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Servings & Yield:</span>
                                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "#e2e8f0", marginTop: "2px" }}>
                                  🍲 {recipe.servings} Servings
                                </div>
                              </div>
                            </div>

                            {/* Sacred Millet Rule Alert */}
                            <div
                              style={{
                                background: "rgba(234, 179, 8, 0.12)",
                                border: "1px solid rgba(234, 179, 8, 0.35)",
                                borderRadius: "10px",
                                padding: "12px 16px",
                                marginBottom: "16px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fef08a", fontWeight: 700, fontSize: "0.88rem" }}>
                                <Clock size={16} />
                                <span>Essential Millet Soaking Rule ({recipe.essentialMilletRule.soakingHours} Hours)</span>
                              </div>
                              <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "#fef9c3", lineHeight: 1.4 }}>
                                {recipe.essentialMilletRule.soakingReason}
                              </p>
                              <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#fde047" }}>
                                💧 <strong>Water Ratio:</strong> {recipe.essentialMilletRule.waterRatio} | 🍳 <strong>Vessel:</strong> {recipe.essentialMilletRule.vesselAdvice}
                              </div>
                            </div>

                            {/* Ingredients with Live Marketplace Matcher */}
                            <div style={{ marginBottom: "18px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap" }}>
                                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#86efac", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <ShoppingCart size={16} /> Recipe Ingredients (Match with Local Farmers)
                                </h4>
                                {inStockCount > 0 && (
                                  <button
                                    onClick={() => handleAddAllAvailableToCart(recipe)}
                                    style={{
                                      background: "linear-gradient(135deg, #15803d, #22c55e)",
                                      border: "none",
                                      color: "#fff",
                                      borderRadius: "8px",
                                      padding: "6px 14px",
                                      fontSize: "0.8rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "6px"
                                    }}
                                  >
                                    <ShoppingCart size={14} /> Add Available Crops to Cart ({inStockCount})
                                  </button>
                                )}
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
                                {recipe.ingredients.map((ing, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      background: ing.inStock ? "rgba(34, 197, 94, 0.1)" : "rgba(0,0,0,0.25)",
                                      border: ing.inStock ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid rgba(255,255,255,0.06)",
                                      borderRadius: "10px",
                                      padding: "10px 12px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "8px"
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#f8fafc" }}>
                                        {ing.name}
                                      </div>
                                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                                        Quantity: {ing.quantity}
                                      </div>
                                      {ing.inStock && ing.crop && (
                                        <div style={{ fontSize: "0.76rem", color: "#4ade80", marginTop: "2px" }}>
                                          ✓ By {ing.crop.farmerName} • ₹{ing.crop.price}/{ing.crop.unit}
                                        </div>
                                      )}
                                    </div>

                                    {ing.inStock && ing.crop ? (
                                      <button
                                        onClick={() => handleAddToCart(ing.crop)}
                                        style={{
                                          background: addedCrops[ing.crop._id] ? "#16a34a" : "rgba(255,255,255,0.12)",
                                          border: "none",
                                          color: "#fff",
                                          borderRadius: "6px",
                                          padding: "6px 10px",
                                          fontSize: "0.78rem",
                                          fontWeight: 600,
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "4px"
                                        }}
                                      >
                                        {addedCrops[ing.crop._id] ? (
                                          <>
                                            <Check size={12} /> Added
                                          </>
                                        ) : (
                                          <>
                                            <ShoppingCart size={12} /> Add
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span style={{ fontSize: "0.72rem", color: "#94a3b8", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>
                                        Home Pantry
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Step by step instructions */}
                            <div>
                              <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem", color: "#86efac", display: "flex", alignItems: "center", gap: "6px" }}>
                                <ChefHat size={16} /> Authentic Step-by-Step Method
                              </h4>
                              <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.86rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                                {recipe.instructions.map((step, sIdx) => (
                                  <li key={sIdx}>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* AI Chef Generator Tab */
            <div style={{ maxWidth: "760px", margin: "0 auto" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(15, 23, 42, 0.4))",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "20px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <Sparkles size={22} color="#38bdf8" />
                  <h3 style={{ margin: 0, color: "#e0f2fe", fontSize: "1.15rem" }}>
                    AI Millet Chef: Cook with What You Bought
                  </h3>
                </div>
                <p style={{ margin: "0 0 16px 0", fontSize: "0.86rem", color: "#bae6fd", lineHeight: 1.4 }}>
                  Tell our Ayurvedic AI chef what fresh crops or vegetables you have. It will build an authentic, delicious millet recipe that completely replaces white rice with ancient supergrains.
                </p>

                <form onSubmit={handleGenerateAiRecipe} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
                      Ingredients You Have (Comma separated):
                    </label>
                    <input
                      type="text"
                      value={aiIngredients}
                      onChange={(e) => setAiIngredients(e.target.value)}
                      placeholder="e.g. Tomatoes, Spinach (Palakura), Korralu, Toor Dal, Ghee"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        color: "#fff",
                        fontSize: "0.9rem"
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
                        Health Goal:
                      </label>
                      <select
                        value={aiHealthGoal}
                        onChange={(e) => setAiHealthGoal(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          color: "#fff",
                          fontSize: "0.86rem"
                        }}
                      >
                        <option>Diabetes Management & Low GI</option>
                        <option>Heart Health & Blood Pressure</option>
                        <option>High Fiber & Weight Loss</option>
                        <option>Bone Strength & Calcium (Ragi focus)</option>
                        <option>Digestive Ease & Gut Cleansing</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "4px" }}>
                        Preferred Grain / Millet:
                      </label>
                      <select
                        value={aiMilletChoice}
                        onChange={(e) => setAiMilletChoice(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "9px 12px",
                          borderRadius: "8px",
                          background: "rgba(0,0,0,0.35)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          color: "#fff",
                          fontSize: "0.86rem"
                        }}
                      >
                        <option>Foxtail Millet (Korralu)</option>
                        <option>Kodo Millet (Arikelu)</option>
                        <option>Little Millet (Samalu)</option>
                        <option>Barnyard Millet (Oodalu)</option>
                        <option>Finger Millet (Ragi)</option>
                        <option>Sorghum (Jowar / Jonnalu)</option>
                        <option>Pearl Millet (Bajra / Sajjalu)</option>
                        <option>Recommend Best Millet for My Health</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={aiLoading}
                    style={{
                      background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                      border: "none",
                      color: "#fff",
                      padding: "12px 20px",
                      borderRadius: "10px",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      cursor: aiLoading ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "6px"
                    }}
                  >
                    {aiLoading ? (
                      <>
                        <div className="loader" style={{ width: "18px", height: "18px" }}></div>
                        Consulting AI Millet Revival Chef...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Generate Authentic Healthy Recipe
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* AI Result Card */}
              {aiGeneratedRecipe && (
                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "16px",
                    padding: "24px",
                    color: "#f1f5f9",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", color: "#38bdf8", fontWeight: 700 }}>
                    <ChefHat size={20} />
                    <span>Your Personalized Heritage Recipe</span>
                  </div>
                  <div style={{ fontSize: "0.92rem" }}>
                    {aiGeneratedRecipe}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
