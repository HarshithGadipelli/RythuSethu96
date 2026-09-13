import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, CheckCircle2, ArrowRight, Building2, MapPin, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const centralSchemes = [
  {
    id: "c1",
    name: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    description: "Financial benefit of ₹6,000 per year provided to all landholding farmer families, payable in three equal installments of ₹2,000 each.",
    eligibility: "All landholding farmers' families in the country.",
    link: "https://pmkisan.gov.in/",
    tags: ["Financial Assistance", "Direct Transfer"]
  },
  {
    id: "c2",
    name: "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
    description: "Comprehensive crop insurance scheme protecting farmers against non-preventable natural risks from pre-sowing to post-harvest.",
    eligibility: "Farmers growing notified crops in notified areas.",
    link: "https://pmfby.gov.in/",
    tags: ["Insurance", "Crop Protection"]
  },
  {
    id: "c3",
    name: "Kisan Credit Card (KCC)",
    description: "Provides farmers with timely access to credit for their cultivation and other needs with simplified procedures and lower interest rates.",
    eligibility: "All farmers, tenant farmers, and sharecroppers.",
    link: "https://www.myscheme.gov.in/schemes/kcc",
    tags: ["Credit", "Loan"]
  },
  {
    id: "c4",
    name: "PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)",
    description: "Aims to enhance physical access of water on farm and expand cultivable area under assured irrigation (Har Khet ko Pani).",
    eligibility: "Farmers seeking irrigation facilities.",
    link: "https://pmksy.gov.in/",
    tags: ["Irrigation", "Infrastructure"]
  },
  {
    id: "c5",
    name: "e-NAM (National Agriculture Market)",
    description: "Pan-India electronic trading portal linking APMCs to create a unified national market for agricultural commodities.",
    eligibility: "Farmers, traders, and buyers.",
    link: "https://enam.gov.in/web/",
    tags: ["Market", "Trading"]
  }
];

const stateSchemes = {
  "Telangana": [
    {
      id: "ts1",
      name: "Rythu Bandhu",
      description: "Investment support scheme offering ₹5,000 per acre per season to farmers for purchase of seeds, fertilizers, and pesticides.",
      eligibility: "Land-owning farmers in Telangana.",
      link: "http://rythubandhu.telangana.gov.in/",
      tags: ["Investment Support", "Cash Transfer"]
    },
    {
      id: "ts2",
      name: "Rythu Bima",
      description: "Farmers Group Life Insurance Scheme providing ₹5.00 lakh financial relief to the bereaved family members in case of farmer's death.",
      eligibility: "Pattadar farmers aged 18 to 59 years.",
      link: "http://rythubandhu.telangana.gov.in/RythuBima.aspx",
      tags: ["Insurance", "Life Cover"]
    }
  ],
  "Andhra Pradesh": [
    {
      id: "ap1",
      name: "YSR Rythu Bharosa",
      description: "Financial assistance to farmers where each farmer family gets ₹13,500 per year, including the PM-KISAN benefit.",
      eligibility: "Landholding farmers and eligible tenant farmers.",
      link: "https://ysrrythubharosa.ap.gov.in/",
      tags: ["Financial Assistance"]
    },
    {
      id: "ap2",
      name: "YSR Sunna Vaddi (Zero Interest)",
      description: "Crop loans at zero interest to farmers who repay their loans within the stipulated time.",
      eligibility: "Farmers taking crop loans up to ₹1 Lakh.",
      link: "https://apgovscheme.com/ysr-sunna-vaddi/",
      tags: ["Loans", "Zero Interest"]
    }
  ],
  "Maharashtra": [
    {
      id: "mh1",
      name: "Namo Shetkari Maha Samman Nidhi",
      description: "State government scheme offering an additional ₹6,000 per year, matching the PM-KISAN benefit.",
      eligibility: "Farmers registered under PM-KISAN in Maharashtra.",
      link: "https://mahaschemes.maharashtra.gov.in/",
      tags: ["Financial Assistance"]
    },
    {
      id: "mh2",
      name: "Mahatma Jotirao Phule Shetkari Karjmukti",
      description: "A farm loan waiver scheme for farmers who are burdened with debt.",
      eligibility: "Farmers with outstanding crop loans.",
      link: "https://mjpsky.maharashtra.gov.in/",
      tags: ["Loan Waiver"]
    }
  ],
  "Karnataka": [
    {
      id: "ka1",
      name: "Raitha Vidya Nidhi",
      description: "Scholarship scheme for the children of farmers to encourage higher education.",
      eligibility: "Children of farmers pursuing education beyond 10th standard.",
      link: "https://ssp.postmatric.karnataka.gov.in/",
      tags: ["Education", "Scholarship"]
    }
  ]
};

export default function FarmerSchemes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("central"); // "central" or "state"
  const [searchQuery, setSearchQuery] = useState("");
  
  // Extract state from user's location if available (basic mock logic)
  const userState = user?.location?.toLowerCase().includes("telangana") ? "Telangana" : 
                    user?.location?.toLowerCase().includes("andhra") ? "Andhra Pradesh" : 
                    user?.location?.toLowerCase().includes("maharashtra") ? "Maharashtra" : 
                    user?.location?.toLowerCase().includes("karnataka") ? "Karnataka" : "Telangana";
                    
  const [selectedState, setSelectedState] = useState(userState);

  const availableStateSchemes = stateSchemes[selectedState] || [];
  const displaySchemes = activeTab === "central" ? centralSchemes : availableStateSchemes;
  
  const filteredSchemes = displaySchemes.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fade-in" style={{ paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Landmark color="var(--primary)" /> Government Schemes & Benefits
          </h2>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Explore and avail central and state government services designed to support farmers.
          </p>
        </div>
      </div>

      <div className="glass-card mb-4" style={{ padding: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            className={`btn-${activeTab === "central" ? "primary" : "secondary"}`} 
            onClick={() => setActiveTab("central")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Building2 size={16} /> Central Schemes
          </button>
          <button 
            className={`btn-${activeTab === "state" ? "primary" : "secondary"}`} 
            onClick={() => setActiveTab("state")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <MapPin size={16} /> State Schemes
          </button>
        </div>

        <div style={{ display: "flex", gap: "1rem", flex: 1, maxWidth: "500px" }}>
          {activeTab === "state" && (
            <select 
              className="rs-select" 
              value={selectedState} 
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ minWidth: "150px" }}
            >
              {Object.keys(stateSchemes).map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          )}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input 
              type="text" 
              className="rs-input" 
              placeholder="Search schemes..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "32px", width: "100%" }}
            />
          </div>
        </div>
      </div>

      {filteredSchemes.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <Landmark size={48} color="var(--text-muted)" style={{ marginBottom: "1rem", opacity: 0.5 }} />
          <h3 style={{ color: "var(--text-dark)", marginBottom: "0.5rem" }}>No Schemes Found</h3>
          <p style={{ color: "var(--text-muted)" }}>Try adjusting your search criteria or switching regions.</p>
        </div>
      ) : (
        <div className="grid-2">
          <AnimatePresence>
            {filteredSchemes.map((scheme, i) => (
              <motion.div 
                key={scheme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card" 
                style={{ 
                  display: "flex", flexDirection: "column", 
                  borderTop: `4px solid ${activeTab === "central" ? "#f59e0b" : "#3b82f6"}` 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-dark)", margin: 0, lineHeight: 1.3 }}>{scheme.name}</h3>
                </div>
                
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                  {scheme.tags.map(tag => (
                    <span key={tag} style={{ 
                      fontSize: "0.75rem", background: "var(--bg-light)", 
                      color: "var(--primary)", padding: "2px 8px", borderRadius: "12px", fontWeight: 600 
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", flex: 1, marginBottom: "1.5rem", lineHeight: 1.5 }}>
                  {scheme.description}
                </p>

                <div style={{ background: "#f8fafc", padding: "0.8rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, display: "block" }}>ELIGIBILITY</span>
                      <span style={{ fontSize: "0.9rem", color: "var(--text-dark)" }}>{scheme.eligibility}</span>
                    </div>
                  </div>
                </div>

                <a 
                  href={scheme.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary" 
                  style={{ 
                    textAlign: "center", textDecoration: "none", 
                    display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" 
                  }}
                >
                  Apply Now / Know More <ArrowRight size={16} />
                </a>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
