// Haversine formula
export const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Crop Perishability Dictionary for Cold-Chain Routing Priority
const PERISHABLE_CROPS = {
  spinach: 10, palak: 10, coriander: 10, mint: 10, lettuce: 10,
  tomato: 8, strawberry: 9, berry: 9, milk: 10, curd: 9, paneer: 9,
  banana: 7, mango: 7, papaya: 7, mushroom: 9, broccoli: 8,
  carrot: 5, potato: 2, onion: 2, rice: 1, wheat: 1, pulse: 1, dal: 1
};

const getPerishabilityScore = (cropName = "") => {
  const name = cropName.toLowerCase();
  for (const [key, score] of Object.entries(PERISHABLE_CROPS)) {
    if (name.includes(key)) return score;
  }
  return 4; // Default medium perishability
};

export const optimizeDeliveryRoute = async (agentLat, agentLng, orders, options = {}) => {
  // Options can be string (legacy agentType) or object { agentType, algorithm }
  let agentType = "bike";
  let algorithm = "dabbawala_cluster";

  if (typeof options === "string") {
    agentType = options;
    algorithm = agentType === "truck" || agentType === "auto" ? "tsp_genetic" : "dabbawala_cluster";
  } else if (typeof options === "object") {
    agentType = options.agentType || "bike";
    algorithm = options.algorithm || (agentType === "truck" ? "tsp_genetic" : "dabbawala_cluster");
  }

  const completedPickups = new Set();
  let unvisitedTasks = [];

  orders.forEach(o => {
    const cropName = o.crop?.name || o.items?.[0]?.name || o.cropName || "Fresh Produce";
    const perishScore = getPerishabilityScore(cropName);
    const isPerishable = perishScore >= 7;

    const pickupLat = parseFloat(o.pickupLatitude || o.order?.farmer?.latitude || o.farmer?.latitude || o.crop?.latitude || agentLat);
    const pickupLng = parseFloat(o.pickupLongitude || o.order?.farmer?.longitude || o.farmer?.longitude || o.crop?.longitude || agentLng);
    const deliveryLat = parseFloat(o.deliveryLatitude || o.customer?.latitude || (pickupLat + 0.03));
    const deliveryLng = parseFloat(o.deliveryLongitude || o.customer?.longitude || (pickupLng + 0.03));

    if (o.status === "picked_up" || o.status === "in_transit") {
      completedPickups.add((o._id || o.id || "").toString());
      unvisitedTasks.push({
        type: "delivery",
        order: o,
        orderId: (o._id || o.id || Math.random()).toString(),
        lat: deliveryLat,
        lng: deliveryLng,
        location: o.deliveryLocation || o.deliveryAddress || o.customer?.address || "Customer Doorstep",
        cropName,
        quantityKg: o.quantity || o.items?.[0]?.quantity || 1,
        perishScore,
        isPerishable,
        farmerName: o.farmer?.name || "Registered Farmer",
        customerName: o.customer?.name || "Customer",
        customerPhone: o.customer?.phone || o.deliveryPhone || "9876543210"
      });
    } else {
      // Default / assigned / pending: Needs both pickup from farm and delivery to customer
      unvisitedTasks.push({
        type: "pickup",
        order: o,
        orderId: (o._id || o.id || Math.random()).toString(),
        lat: pickupLat,
        lng: pickupLng,
        location: o.pickupLocation || o.farmer?.farmLocation || o.farmer?.location || "Farm Field Location",
        cropName,
        quantityKg: o.quantity || o.items?.[0]?.quantity || 1,
        perishScore,
        isPerishable,
        farmerName: o.farmer?.name || o.order?.farmer?.name || "Registered Farmer",
        customerName: o.customer?.name || "Customer",
        customerPhone: o.customer?.phone || o.deliveryPhone || "9876543210"
      });
      unvisitedTasks.push({
        type: "delivery",
        order: o,
        orderId: (o._id || o.id || Math.random()).toString(),
        lat: deliveryLat,
        lng: deliveryLng,
        location: o.deliveryLocation || o.deliveryAddress || o.customer?.address || "Customer Doorstep",
        cropName,
        quantityKg: o.quantity || o.items?.[0]?.quantity || 1,
        perishScore,
        isPerishable,
        farmerName: o.farmer?.name || o.order?.farmer?.name || "Registered Farmer",
        customerName: o.customer?.name || "Customer",
        customerPhone: o.customer?.phone || o.deliveryPhone || "9876543210"
      });
    }
  });

  if (unvisitedTasks.length === 0) {
    return {
      optimized: [],
      totalDistance: "0.00",
      totalMinutes: 0,
      algorithmUsed: algorithm,
      stopsCount: 0
    };
  }

  // Build matrix coordinates starting from Agent's current live location
  const coords = [{ lat: parseFloat(agentLat), lng: parseFloat(agentLng), id: "agent_hub" }];
  unvisitedTasks.forEach((task, idx) => {
    task.matrixIdx = coords.length;
    coords.push({ lat: task.lat, lng: task.lng, id: `task_${idx}` });
  });

  // OSRM Driving Distance Matrix (with Haversine fallback)
  let distanceMatrix = [];
  try {
    const coordString = coords.map(c => `${c.lng},${c.lat}`).join(";");
    const url = `http://router.project-osrm.org/table/v1/driving/${coordString}?annotations=distance`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data.code === "Ok" && data.distances) {
      distanceMatrix = data.distances;
    }
  } catch (err) {
    // console.log("OSRM Table fallback to Haversine calculations");
  }

  const getRouteDistance = (fromIdx, toIdx) => {
    if (distanceMatrix.length > 0 && distanceMatrix[fromIdx] && distanceMatrix[fromIdx][toIdx] !== undefined && distanceMatrix[fromIdx][toIdx] !== null) {
      return distanceMatrix[fromIdx][toIdx] / 1000; // km
    }
    return getDistance(coords[fromIdx].lat, coords[fromIdx].lng, coords[toIdx].lat, coords[toIdx].lng);
  };

  const getZone = (lat, lng) => `Zone-${Math.floor(lat * 50) % 100}_${Math.floor(lng * 50) % 100}`;

  let orderedTasks = [];

  // ──────────────────────────────────────────────────────────────────────────
  // ALGORITHM 1: TSP Simulated Annealing / Genetic (Optimal overall distance)
  // ──────────────────────────────────────────────────────────────────────────
  if (algorithm === "tsp_genetic" || algorithm === "tsp") {
    let currentState = [];
    const tempPickups = new Set(completedPickups);
    const remaining = [...unvisitedTasks];

    while (remaining.length > 0) {
      for (let i = 0; i < remaining.length; i++) {
        const task = remaining[i];
        if (task.type === "delivery" && !tempPickups.has(task.orderId)) continue;
        currentState.push(task);
        if (task.type === "pickup") tempPickups.add(task.orderId);
        remaining.splice(i, 1);
        break;
      }
    }

    const calculateTotalDistance = (route) => {
      let dist = 0;
      let curIdx = 0;
      for (const t of route) {
        dist += getRouteDistance(curIdx, t.matrixIdx);
        curIdx = t.matrixIdx;
      }
      return dist;
    };

    const isValidRoute = (route) => {
      const p = new Set(completedPickups);
      for (const t of route) {
        if (t.type === "pickup") p.add(t.orderId);
        if (t.type === "delivery" && !p.has(t.orderId)) return false;
      }
      return true;
    };

    let currentEnergy = calculateTotalDistance(currentState);
    let bestState = [...currentState];
    let bestEnergy = currentEnergy;

    let temp = 100.0;
    const finalTemp = 0.5;
    const alpha = 0.92;

    while (temp > finalTemp && currentState.length >= 2) {
      for (let i = 0; i < 40; i++) {
        const idx1 = Math.floor(Math.random() * currentState.length);
        const idx2 = Math.floor(Math.random() * currentState.length);
        if (idx1 === idx2) continue;

        const neighbor = [...currentState];
        const swp = neighbor[idx1];
        neighbor[idx1] = neighbor[idx2];
        neighbor[idx2] = swp;

        if (isValidRoute(neighbor)) {
          const neighborEnergy = calculateTotalDistance(neighbor);
          const delta = neighborEnergy - currentEnergy;
          if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
            currentState = neighbor;
            currentEnergy = neighborEnergy;
            if (currentEnergy < bestEnergy) {
              bestState = [...currentState];
              bestEnergy = currentEnergy;
            }
          }
        }
      }
      temp *= alpha;
    }
    orderedTasks = bestState;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ALGORITHM 2: Perishable-First (Cold-Chain Freshness Priority)
  // ──────────────────────────────────────────────────────────────────────────
  else if (algorithm === "perishable_priority" || algorithm === "perishable") {
    let currentIdx = 0;
    const workingCompleted = new Set(completedPickups);
    const pool = [...unvisitedTasks];

    while (pool.length > 0) {
      let candidateIdx = -1;
      let highestScore = -Infinity;

      for (let i = 0; i < pool.length; i++) {
        const task = pool[i];
        if (task.type === "delivery" && !workingCompleted.has(task.orderId)) continue;

        const dist = getRouteDistance(currentIdx, task.matrixIdx);
        // Heavily weight perishability: score = perishScore * 10 - distance * 1.5
        const compositeScore = (task.perishScore * 8) - (dist * 1.2) + (task.type === "pickup" ? 3 : 0);

        if (compositeScore > highestScore) {
          highestScore = compositeScore;
          candidateIdx = i;
        }
      }

      if (candidateIdx === -1) {
        // Fallback to first valid task
        for (let i = 0; i < pool.length; i++) {
          if (pool[i].type === "pickup" || workingCompleted.has(pool[i].orderId)) {
            candidateIdx = i;
            break;
          }
        }
      }

      if (candidateIdx === -1) break;
      const chosen = pool.splice(candidateIdx, 1)[0];
      if (chosen.type === "pickup") workingCompleted.add(chosen.orderId);
      currentIdx = chosen.matrixIdx;
      orderedTasks.push(chosen);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ALGORITHM 3: Greedy Fastest ETA (Closest Urgent Node First)
  // ──────────────────────────────────────────────────────────────────────────
  else if (algorithm === "greedy_fastest" || algorithm === "greedy") {
    let currentIdx = 0;
    const workingCompleted = new Set(completedPickups);
    const pool = [...unvisitedTasks];

    while (pool.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const task = pool[i];
        if (task.type === "delivery" && !workingCompleted.has(task.orderId)) continue;

        const dist = getRouteDistance(currentIdx, task.matrixIdx);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) break;
      const chosen = pool.splice(nearestIdx, 1)[0];
      if (chosen.type === "pickup") workingCompleted.add(chosen.orderId);
      currentIdx = chosen.matrixIdx;
      orderedTasks.push(chosen);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ALGORITHM 4: Eco-Fuel Saver (Smooth cluster with minimum acceleration penalties)
  // ──────────────────────────────────────────────────────────────────────────
  else if (algorithm === "eco_fuel_saver" || algorithm === "eco") {
    let currentIdx = 0;
    const workingCompleted = new Set(completedPickups);
    const pool = [...unvisitedTasks];

    while (pool.length > 0) {
      let bestIdx = -1;
      let minEcoCost = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const task = pool[i];
        if (task.type === "delivery" && !workingCompleted.has(task.orderId)) continue;

        const dist = getRouteDistance(currentIdx, task.matrixIdx);
        // Eco cost minimizes long jumps and groups close deliveries together
        const ecoCost = Math.pow(dist, 1.4) + (task.quantityKg > 50 ? dist * 0.3 : 0);

        if (ecoCost < minEcoCost) {
          minEcoCost = ecoCost;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) break;
      const chosen = pool.splice(bestIdx, 1)[0];
      if (chosen.type === "pickup") workingCompleted.add(chosen.orderId);
      currentIdx = chosen.matrixIdx;
      orderedTasks.push(chosen);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ALGORITHM 5: Dabbawala Zone Clustering (Default for Bike / Hyperlocal)
  // ──────────────────────────────────────────────────────────────────────────
  else {
    let currentIdx = 0;
    let currentZone = getZone(coords[0].lat, coords[0].lng);
    const workingCompleted = new Set(completedPickups);
    const pool = [...unvisitedTasks];

    while (pool.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;

      // Pass 1: Current zone
      for (let i = 0; i < pool.length; i++) {
        const task = pool[i];
        if (task.type === "delivery" && !workingCompleted.has(task.orderId)) continue;

        const taskZone = getZone(task.lat, task.lng);
        if (taskZone !== currentZone) continue;

        const dist = getRouteDistance(currentIdx, task.matrixIdx);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      // Pass 2: Any zone
      if (nearestIdx === -1) {
        for (let i = 0; i < pool.length; i++) {
          const task = pool[i];
          if (task.type === "delivery" && !workingCompleted.has(task.orderId)) continue;

          const dist = getRouteDistance(currentIdx, task.matrixIdx);
          const bundledDist = dist < 2.5 ? dist * 0.2 : dist;
          if (bundledDist < minDistance) {
            minDistance = bundledDist;
            nearestIdx = i;
          }
        }
      }

      if (nearestIdx === -1) break;
      const chosen = pool.splice(nearestIdx, 1)[0];
      if (chosen.type === "pickup") workingCompleted.add(chosen.orderId);

      currentIdx = chosen.matrixIdx;
      currentZone = getZone(chosen.lat, chosen.lng);
      orderedTasks.push(chosen);
    }
  }

  // Compile final structured stops with ETA and Turn-by-Turn links
  const optimized = [];
  let totalDistance = 0;
  let totalMinutes = 0;
  let prevMatrixIdx = 0;

  orderedTasks.forEach((task, index) => {
    const legDistance = getRouteDistance(prevMatrixIdx, task.matrixIdx);
    totalDistance += legDistance;

    // Estimate minutes based on vehicle speed & stop service time (5 min per stop)
    const speedKmH = agentType === "truck" ? 35 : agentType === "auto" ? 40 : 30;
    const legMinutes = Math.max(3, Math.round((legDistance / speedKmH) * 60) + 4);
    totalMinutes += legMinutes;

    const isPickup = task.type === "pickup";
    const o = task.order;

    optimized.push({
      stopNumber: index + 1,
      action: isPickup ? "Pickup" : "Deliver",
      type: task.type,
      location: task.location,
      latitude: task.lat,
      longitude: task.lng,
      cropName: task.cropName,
      quantityKg: task.quantityKg,
      isPerishable: task.isPerishable,
      perishScore: task.perishScore,
      farmerName: task.farmerName,
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      deliveryId: o._id || o.id,
      trackingCode: o.trackingCode || `RS-TRK-${index + 1}`,
      zone: getZone(task.lat, task.lng),
      legDistanceKm: parseFloat(legDistance.toFixed(2)),
      estimatedMinutes: legMinutes,
      googleMapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${task.lat},${task.lng}`
    });

    prevMatrixIdx = task.matrixIdx;
  });

  return {
    optimized,
    optimizedRoute: optimized, // Backward compatibility
    totalDistance: totalDistance.toFixed(2),
    totalDistanceKm: parseFloat(totalDistance.toFixed(2)),
    totalMinutes,
    algorithmUsed: algorithm,
    agentType,
    stopsCount: optimized.length
  };
};
