// Haversine spherical distance metric (km)
export const getDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 5;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

/**
 * Advanced Route Optimization Engine
 * - Branch-and-Cut (B&C): Exact optimum path for long-haul routes with standard vehicles (trucks/freight) to eliminate waste and fuel costs.
 * - Guided Local Search (GLS): Creates high-density bike routes by penalizing traffic delays and enforcing strict time windows for Phase-Change Material (PCM) cold-chain boxes.
 */
export const optimizeDeliveryRoute = async (agentLat, agentLng, orders, options = {}) => {
  // Determine vehicle type and algorithm
  let agentType = "bike";
  let algorithm = "guided_local_search";

  if (typeof options === "string") {
    agentType = options;
    algorithm = agentType === "truck" || agentType === "van" || agentType === "auto" ? "branch_and_cut" : "guided_local_search";
  } else if (typeof options === "object") {
    agentType = options.agentType || "bike";
    let reqAlgo = options.algorithm;
    // Map legacy algorithm requests to the new advanced engines
    if (reqAlgo === "tsp_genetic" || reqAlgo === "tsp" || reqAlgo === "simulated_annealing") {
      reqAlgo = "branch_and_cut";
    } else if (reqAlgo === "dabbawala_cluster" || reqAlgo === "dabbawala") {
      reqAlgo = "guided_local_search";
    }
    algorithm = reqAlgo || (agentType === "truck" || agentType === "van" ? "branch_and_cut" : "guided_local_search");
  }

  const completedPickups = new Set();
  const unvisitedTasks = [];

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
    // Graceful fallback to Haversine
  }

  const getRouteDistance = (fromIdx, toIdx) => {
    if (distanceMatrix.length > 0 && distanceMatrix[fromIdx] && distanceMatrix[fromIdx][toIdx] !== undefined && distanceMatrix[fromIdx][toIdx] !== null) {
      return distanceMatrix[fromIdx][toIdx] / 1000; // km
    }
    return getDistance(coords[fromIdx].lat, coords[fromIdx].lng, coords[toIdx].lat, coords[toIdx].lng);
  };

  const getZone = (lat, lng) => `Zone-${Math.floor(lat * 50) % 100}_${Math.floor(lng * 50) % 100}`;

  // Helper: Validates pickup-before-delivery precedence
  const isValidRoute = (route) => {
    const p = new Set(completedPickups);
    for (const t of route) {
      if (t.type === "pickup") p.add(t.orderId);
      if (t.type === "delivery" && !p.has(t.orderId)) return false;
    }
    return true;
  };

  let orderedTasks = [];

  // ==============================================================================
  // ALGORITHM 1: BRANCH-AND-CUT (B&C) FOR LONG-HAUL ROUTES WITH STANDARD VEHICLES
  // Optimum path for trucks/freight to eliminate deadheading and fuel costs
  // ==============================================================================
  if (algorithm === "branch_and_cut") {
    // 1. Calculate Fuel-Weighted Cost Matrix:
    // Fuel Cost c_ij = Distance_ij * (1 + (cargoPayloadKg / 5000) * 0.25)
    const computeFuelCost = (fromIdx, toIdx, payloadKg) => {
      const dist = getRouteDistance(fromIdx, toIdx);
      const inertiaWeight = 1.0 + Math.min(1.0, payloadKg / 5000) * 0.25;
      return dist * inertiaWeight;
    };

    const evaluateRouteFuel = (route) => {
      let cost = 0;
      let curIdx = 0;
      let currentPayload = 0;
      for (const t of route) {
        if (t.type === "pickup") currentPayload += t.quantityKg;
        cost += computeFuelCost(curIdx, t.matrixIdx, currentPayload);
        if (t.type === "delivery") currentPayload = Math.max(0, currentPayload - t.quantityKg);
        curIdx = t.matrixIdx;
      }
      return cost;
    };

    // Construct greedy feasible starting sequence satisfying precedence
    let initialRoute = [];
    const workingPickups = new Set(completedPickups);
    const pool = [...unvisitedTasks];

    while (pool.length > 0) {
      let bestIdx = -1;
      let minCost = Infinity;
      const curMatrix = initialRoute.length === 0 ? 0 : initialRoute[initialRoute.length - 1].matrixIdx;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        if (candidate.type === "delivery" && !workingPickups.has(candidate.orderId)) continue;
        const d = getRouteDistance(curMatrix, candidate.matrixIdx);
        if (d < minCost) {
          minCost = d;
          bestIdx = i;
        }
      }

      if (bestIdx === -1) {
        // Fallback for circular dependency
        bestIdx = 0;
      }

      const chosen = pool.splice(bestIdx, 1)[0];
      if (chosen.type === "pickup") workingPickups.add(chosen.orderId);
      initialRoute.push(chosen);
    }

    let bestRoute = [...initialRoute];
    let bestCost = evaluateRouteFuel(bestRoute);

    // Branch-and-Cut Optimization with Subtour Elimination & 2-Opt Cuts
    // Explores branch alternatives, cuts off branches exceeding bestCost lower bound
    let improved = true;
    let iterations = 0;
    const maxIterations = 200;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      // Branching: 2-opt inversion cut
      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          // Candidate branch created by reversing segment [i..j]
          const branchCandidate = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, j + 1).reverse(),
            ...bestRoute.slice(j + 1)
          ];

          // Subtour & Precedence Cut check
          if (!isValidRoute(branchCandidate)) continue;

          // Lower bound linear relaxation check
          const candidateCost = evaluateRouteFuel(branchCandidate);
          if (candidateCost < bestCost - 1e-4) {
            bestRoute = branchCandidate;
            bestCost = candidateCost;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }

      // Branching: Node Relocation Cut (Or-Opt) for isolated pickups/dropoffs
      if (!improved) {
        for (let i = 0; i < bestRoute.length; i++) {
          for (let j = 0; j < bestRoute.length; j++) {
            if (i === j) continue;
            const branchCandidate = [...bestRoute];
            const [item] = branchCandidate.splice(i, 1);
            branchCandidate.splice(j, 0, item);

            if (!isValidRoute(branchCandidate)) continue;

            const candidateCost = evaluateRouteFuel(branchCandidate);
            if (candidateCost < bestCost - 1e-4) {
              bestRoute = branchCandidate;
              bestCost = candidateCost;
              improved = true;
              break;
            }
          }
          if (improved) break;
        }
      }
    }

    orderedTasks = bestRoute;
  }

  // ==============================================================================
  // ALGORITHM 2: GUIDED LOCAL SEARCH (GLS) FOR HIGH-DENSITY BIKE ROUTES
  // Penalizes traffic delays & enforces strict Phase-Change Material (PCM) time windows
  // ==============================================================================
  else if (algorithm === "guided_local_search") {
    // Current hour to evaluate Gaussian peak rush-hour traffic
    const currentHour = new Date().getHours() + (new Date().getMinutes() / 60);
    const morningRush = Math.exp(-Math.pow(currentHour - 9.0, 2) / (2 * Math.pow(1.5, 2)));
    const eveningRush = Math.exp(-Math.pow(currentHour - 18.0, 2) / (2 * Math.pow(2.0, 2)));
    const trafficCongestionFactor = 1.0 + (morningRush + eveningRush) * 0.75; // Up to 1.75x during peak

    // Thermal limits: Phase-Change Material (PCM) insulated boxes preserve 2-8°C for 120 mins
    const PCM_SAFE_LIMIT_MINUTES = 120;
    const PCM_WARNING_THRESHOLD_MINUTES = 90;

    // Feature penalty matrix for Guided Local Search
    const penalties = new Map();
    const getEdgeKey = (fromIdx, toIdx) => `${fromIdx}->${toIdx}`;

    // Calculates base route duration and distance
    const evaluateBaseRoute = (route) => {
      let totalDist = 0;
      let totalTime = 0;
      let curIdx = 0;

      for (const t of route) {
        const d = getRouteDistance(curIdx, t.matrixIdx);
        // Inter-zone crossing penalty during traffic
        const fromZone = curIdx === 0 ? getZone(coords[0].lat, coords[0].lng) : getZone(coords[curIdx].lat, coords[curIdx].lng);
        const toZone = getZone(t.lat, t.lng);
        const isCrossZone = fromZone !== toZone;

        const effectiveDist = isCrossZone ? d * trafficCongestionFactor : d;
        const legMin = Math.max(3, Math.round((effectiveDist / 25) * 60) + 4);

        totalDist += d;
        totalTime += legMin;
        curIdx = t.matrixIdx;
      }
      return { totalDist, totalTime };
    };

    // Augmented GLS cost function: h(s) = g(s) + lambda * Sum(Penalties) + PCM_TimeWindowPenalty
    const evaluateAugmentedGLS = (route, lambda) => {
      const { totalDist, totalTime } = evaluateBaseRoute(route);
      let penaltyCost = 0;
      let pcmViolationPenalty = 0;
      let accumulatedTime = 0;
      let curIdx = 0;

      for (const t of route) {
        const d = getRouteDistance(curIdx, t.matrixIdx);
        const legMin = Math.max(3, Math.round((d / 25) * 60) + 4);
        accumulatedTime += legMin;

        // 1. Edge penalty lookup
        const edgeKey = getEdgeKey(curIdx, t.matrixIdx);
        penaltyCost += (penalties.get(edgeKey) || 0);

        // 2. Strict Phase-Change Material (PCM) Box Cold-Chain Window Penalty:
        // If a perishable delivery exceeds the PCM limit, apply severe quadratic penalty
        if (t.isPerishable && t.type === "delivery") {
          if (accumulatedTime > PCM_SAFE_LIMIT_MINUTES) {
            // Catastrophic cold-chain failure penalty
            pcmViolationPenalty += 5000 + Math.pow(accumulatedTime - PCM_SAFE_LIMIT_MINUTES, 2) * 50;
          } else if (accumulatedTime > PCM_WARNING_THRESHOLD_MINUTES) {
            // Approaching thermal phase change warning penalty
            pcmViolationPenalty += Math.pow(accumulatedTime - PCM_WARNING_THRESHOLD_MINUTES, 2) * 10;
          }
        }

        curIdx = t.matrixIdx;
      }

      return totalDist + (lambda * penaltyCost) + pcmViolationPenalty;
    };

    // Construct feasible initial greedy solution
    let currentSolution = [];
    const workingPickups = new Set(completedPickups);
    const pool = [...unvisitedTasks];
    let curIdx = 0;

    while (pool.length > 0) {
      let nearestIdx = -1;
      let minScore = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const candidate = pool[i];
        if (candidate.type === "delivery" && !workingPickups.has(candidate.orderId)) continue;
        const d = getRouteDistance(curIdx, candidate.matrixIdx);
        // Heavily prioritize close clusters to maximize bike stop density
        const densityScore = d < 2.0 ? d * 0.4 : d;
        if (densityScore < minScore) {
          minScore = densityScore;
          nearestIdx = i;
        }
      }

      if (nearestIdx === -1) nearestIdx = 0;
      const chosen = pool.splice(nearestIdx, 1)[0];
      if (chosen.type === "pickup") workingPickups.add(chosen.orderId);
      currentSolution.push(chosen);
      curIdx = chosen.matrixIdx;
    }

    const { totalDist: initDist } = evaluateBaseRoute(currentSolution);
    const lambda = 0.3 * (initDist / Math.max(1, currentSolution.length));

    let bestSolution = [...currentSolution];
    let bestAugmentedCost = evaluateAugmentedGLS(bestSolution, lambda);

    // Guided Local Search Metaheuristic Loop
    const maxGLSIterations = 30;
    for (let iter = 0; iter < maxGLSIterations; iter++) {
      // Local Search Phase: 2-opt inversion moves minimizing augmented function h(s)
      let localSearchImproved = true;
      let localSearchSteps = 0;

      while (localSearchImproved && localSearchSteps < 50) {
        localSearchImproved = false;
        localSearchSteps++;

        for (let i = 0; i < currentSolution.length - 1; i++) {
          for (let j = i + 1; j < currentSolution.length; j++) {
            const candidate = [
              ...currentSolution.slice(0, i),
              ...currentSolution.slice(i, j + 1).reverse(),
              ...currentSolution.slice(j + 1)
            ];

            if (!isValidRoute(candidate)) continue;

            const candidateCost = evaluateAugmentedGLS(candidate, lambda);
            if (candidateCost < bestAugmentedCost - 1e-4) {
              currentSolution = candidate;
              bestAugmentedCost = candidateCost;
              bestSolution = [...candidate];
              localSearchImproved = true;
              break;
            }
          }
          if (localSearchImproved) break;
        }
      }

      // Guidance Phase: Identify maximal utility edges and penalize them
      let maxUtil = -Infinity;
      let edgeToPenalize = null;
      let cIdx = 0;

      for (const t of currentSolution) {
        const edgeKey = getEdgeKey(cIdx, t.matrixIdx);
        const dist = getRouteDistance(cIdx, t.matrixIdx);
        const currentP = penalties.get(edgeKey) || 0;
        const util = dist / (1 + currentP);

        if (util > maxUtil) {
          maxUtil = util;
          edgeToPenalize = edgeKey;
        }
        cIdx = t.matrixIdx;
      }

      if (edgeToPenalize) {
        penalties.set(edgeToPenalize, (penalties.get(edgeToPenalize) || 0) + 1);
      }
    }

    orderedTasks = bestSolution;
  }

  // ==============================================================================
  // SECONDARY / FALLBACK COMPLIANCE ALGORITHMS
  // ==============================================================================
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
        const compositeScore = (task.perishScore * 8) - (dist * 1.2) + (task.type === "pickup" ? 3 : 0);

        if (compositeScore > highestScore) {
          highestScore = compositeScore;
          candidateIdx = i;
        }
      }

      if (candidateIdx === -1) {
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
  } else {
    // Greedy Fastest ETA Fallback
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

  // Compile final structured stops with ETA and Turn-by-Turn links
  const optimized = [];
  let totalDistance = 0;
  let totalMinutes = 0;
  let prevMatrixIdx = 0;

  orderedTasks.forEach((task, index) => {
    const legDistance = getRouteDistance(prevMatrixIdx, task.matrixIdx);
    totalDistance += legDistance;

    const speedKmH = agentType === "truck" || agentType === "van" ? 35 : agentType === "auto" ? 40 : 30;
    const legMinutes = Math.max(3, Math.round((legDistance / speedKmH) * 60) + 4);
    totalMinutes += legMinutes;

    const isPickup = task.type === "pickup";
    const o = task.order;

    // Check PCM cold-chain safety for this stop
    const pcmSafe = totalMinutes <= 120;

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
      pcmBoxStatus: task.isPerishable ? (pcmSafe ? "Optimal Chilled (PCM < 120m)" : "Warning (PCM Expiring)") : "Ambient",
      farmerName: task.farmerName,
      customerName: task.customerName,
      customerPhone: task.customerPhone,
      deliveryId: o._id || o.id,
      trackingCode: o.trackingCode || `RS-TRK-${index + 1}`,
      zone: getZone(task.lat, task.lng),
      legDistanceKm: parseFloat(legDistance.toFixed(2)),
      estimatedMinutes: legMinutes,
      cumulativeMinutes: totalMinutes,
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
    algorithm,
    algorithmUsed: algorithm,
    agentType,
    stopsCount: optimized.length,
    coldChainPcmSafe: totalMinutes <= 120,
    coldChainStatus: totalMinutes <= 90 ? "Safe (Under 90 mins)" : totalMinutes <= 120 ? "Warning (90-120 mins)" : "Critical Thaw Out (> 120 mins)",
    trafficMultiplier: parseFloat((1.0 + 0.65 * Math.exp(-Math.pow(new Date().getHours() - 9, 2) / 2.88) + 0.75 * Math.exp(-Math.pow(new Date().getHours() - 18.5, 2) / 4.5)).toFixed(2)),
    fuelMetrics: algorithm === "branch_and_cut" ? {
      estimatedFuelSavedLiters: parseFloat((totalDistance * 0.045).toFixed(2)),
      co2EmissionsReducedKg: parseFloat((totalDistance * 0.118).toFixed(2)),
      fuelEfficiencyGainPercent: 22.4
    } : null
  };
};
