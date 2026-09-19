import HubLocation from "../models/HubLocation.js";

export const getHubs = async (req, res) => {
  try {
    const hubs = await HubLocation.find({ isActive: true });
    res.json(hubs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createHub = async (req, res) => {
  try {
    const hub = await HubLocation.create(req.body);
    res.status(201).json(hub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHub = async (req, res) => {
  try {
    const hub = await HubLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hub) return res.status(404).json({ error: "Hub not found" });
    res.json(hub);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHub = async (req, res) => {
  try {
    const hub = await HubLocation.findByIdAndDelete(req.params.id);
    if (!hub) return res.status(404).json({ error: "Hub not found" });
    res.json({ message: "Hub deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Seed initial Hubs based on requirements
export const seedHubs = async (req, res) => {
  try {
    const initialHubs = [
      // Outer Hubs
      { name: "Bowenpally", type: "outer_hub", region: "North" },
      { name: "Medchal", type: "outer_hub", region: "North" },
      { name: "Patancheru", type: "outer_hub", region: "West" },
      { name: "Lingampally", type: "outer_hub", region: "West" },
      { name: "Batasingaram", type: "outer_hub", region: "East" },
      { name: "Uppal", type: "outer_hub", region: "East" },
      { name: "Ramanthapur", type: "outer_hub", region: "East" },
      { name: "Mir Alam Mandi", type: "outer_hub", region: "South" },
      { name: "Shamshabad", type: "outer_hub", region: "South" },
      { name: "Thimmapur", type: "outer_hub", region: "South" },
      // Inner Cold Storages (mapped to roughly their regions in Hyderabad)
      { name: "Kukatpally", type: "inner_cold_storage", region: "West" }, // West/North
      { name: "Mehdipatnam", type: "inner_cold_storage", region: "West" },
      { name: "Kothapet", type: "inner_cold_storage", region: "East" },
      { name: "Erragadda", type: "inner_cold_storage", region: "North" }, // North/Central
      { name: "Gudimalkapur", type: "inner_cold_storage", region: "South" } // South/Central
    ];

    await HubLocation.deleteMany({}); // clear existing
    const created = await HubLocation.insertMany(initialHubs);
    res.json({ message: "Seeded", hubs: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
