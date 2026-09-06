// Haversine formula
export const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export const optimizeDeliveryRoute = async (agentLat, agentLng, orders, agentType = "bike") => {
  let unvisitedTasks = [];
  orders.forEach(o => {
    if (o.status === "assigned") {
      unvisitedTasks.push({ type: "pickup", order: o, orderId: o._id.toString() });
      unvisitedTasks.push({ type: "delivery", order: o, orderId: o._id.toString() });
    } else if (o.status === "picked_up") {
      unvisitedTasks.push({ type: "delivery", order: o, orderId: o._id.toString() });
    }
  });

  if (unvisitedTasks.length === 0) return { optimized: [], totalDistance: 0 };

  // Collect all unique coordinates to build a distance matrix
  const coords = [{ lat: parseFloat(agentLat), lng: parseFloat(agentLng), id: "agent" }];
  
  unvisitedTasks.forEach((task, idx) => {
    const o = task.order;
    const lat = task.type === "pickup" ? (o.pickupLatitude || o.order?.farmer?.latitude || 0) : (o.deliveryLatitude || 0);
    const lng = task.type === "pickup" ? (o.pickupLongitude || o.order?.farmer?.longitude || 0) : (o.deliveryLongitude || 0);
    task.lat = lat;
    task.lng = lng;
    task.matrixIdx = coords.length;
    coords.push({ lat, lng, id: `task_${idx}` });
  });

  // Fetch real driving distances from OSRM Table API
  let distanceMatrix = [];
  try {
    const coordString = coords.map(c => `${c.lng},${c.lat}`).join(";");
    // OSRM Public API limits to 100 coordinates, our payload is typically < 20
    const url = `http://router.project-osrm.org/table/v1/driving/${coordString}?annotations=distance`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === "Ok" && data.distances) {
      distanceMatrix = data.distances; // distances in meters
    }
  } catch (err) {
    console.error("OSRM Table API Error, falling back to Haversine:", err);
  }

  // Helper to get distance between two matrix indices
  const getRouteDistance = (fromIdx, toIdx) => {
    if (distanceMatrix.length > 0 && distanceMatrix[fromIdx] && distanceMatrix[fromIdx][toIdx] !== undefined) {
      return distanceMatrix[fromIdx][toIdx] / 1000; // convert meters to km
    }
    // Fallback to Haversine
    return getDistance(coords[fromIdx].lat, coords[fromIdx].lng, coords[toIdx].lat, coords[toIdx].lng);
  };

  const getZone = (lat, lng) => `${Math.floor(lat * 50)}_${Math.floor(lng * 50)}`; // Approx 2km zones

  const optimized = [];
  let totalDistance = 0;
  
  if (agentType === "truck" || agentType === "auto") {
    // ─── Simulated Annealing TSP for Heavy Transport ───
    // A robust stochastic optimization algorithm designed to escape local minima 
    // and find a globally optimal route for vehicles where fuel efficiency is critical.
    
    // 1. Initial State: Simple greedy path honoring pickup precedence constraints
    let currentState = [];
    const tempPickups = new Set();
    const remaining = [...unvisitedTasks];
    
    while (remaining.length > 0) {
      for (let i = 0; i < remaining.length; i++) {
        const task = remaining[i];
        if (task.type === "delivery" && task.order.status === "assigned" && !completedPickups.has(task.orderId) && !tempPickups.has(task.orderId)) continue;
        currentState.push(task);
        if (task.type === "pickup") tempPickups.add(task.orderId);
        remaining.splice(i, 1);
        break;
      }
    }
    
    const calculateTotalDistance = (route) => {
      let dist = 0;
      let currentIdx = 0; // agent start
      for (const task of route) {
        dist += getRouteDistance(currentIdx, task.matrixIdx);
        currentIdx = task.matrixIdx;
      }
      return dist;
    };
    
    const isValidRoute = (route) => {
      const p = new Set();
      for (const task of route) {
        if (task.type === "pickup") p.add(task.orderId);
        if (task.type === "delivery" && task.order.status === "assigned" && !completedPickups.has(task.orderId) && !p.has(task.orderId)) {
          return false;
        }
      }
      return true;
    };
    
    let currentEnergy = calculateTotalDistance(currentState);
    let bestState = [...currentState];
    let bestEnergy = currentEnergy;
    
    // Annealing parameters
    let initialTemp = 100.0;
    const finalTemp = 0.1;
    const alpha = 0.95;
    
    // Simulated Annealing Loop
    while (initialTemp > finalTemp) {
      for (let i = 0; i < 50; i++) {
        if (currentState.length < 2) break;
        // Swap two random nodes
        const idx1 = Math.floor(Math.random() * currentState.length);
        const idx2 = Math.floor(Math.random() * currentState.length);
        
        const neighbor = [...currentState];
        const temp = neighbor[idx1];
        neighbor[idx1] = neighbor[idx2];
        neighbor[idx2] = temp;
        
        // Only consider valid configurations (pickup before delivery)
        if (isValidRoute(neighbor)) {
          const neighborEnergy = calculateTotalDistance(neighbor);
          const delta = neighborEnergy - currentEnergy;
          
          if (delta < 0 || Math.random() < Math.exp(-delta / initialTemp)) {
            currentState = neighbor;
            currentEnergy = neighborEnergy;
            if (currentEnergy < bestEnergy) {
              bestState = [...currentState];
              bestEnergy = currentEnergy;
            }
          }
        }
      }
      initialTemp *= alpha;
    }
    
    // Compile output
    let currentMatrixIdx = 0;
    for (const task of bestState) {
      const o = task.order;
      const isPickup = task.type === "pickup";
      optimized.push({
        action: isPickup ? "Pickup" : "Deliver",
        location: (isPickup ? o.pickupLocation : o.deliveryLocation) || "Unknown Location",
        deliveryId: o._id,
        trackingCode: o.trackingCode,
        zone: getZone(task.lat, task.lng),
        agentType: agentType
      });
      totalDistance += getRouteDistance(currentMatrixIdx, task.matrixIdx);
      currentMatrixIdx = task.matrixIdx;
    }
    
  } else {
    // ─── Dabbawala-style Zone Heuristic for Bike Agents ───
    let currentMatrixIdx = 0; // Starts at agent (index 0)
    let currentZone = getZone(coords[0].lat, coords[0].lng);

    while (unvisitedTasks.length > 0) {
      let nearestIdx = -1;
      let minDistance = Infinity;
      
      // First pass: try to find the nearest task in the CURRENT zone
      for (let i = 0; i < unvisitedTasks.length; i++) {
        const task = unvisitedTasks[i];
        if (task.type === "delivery" && task.order.status === "assigned" && !completedPickups.has(task.orderId)) continue;
        
        const taskZone = getZone(task.lat, task.lng);
        if (taskZone !== currentZone) continue; // Skip out-of-zone tasks in this pass
        
        const dist = getRouteDistance(currentMatrixIdx, task.matrixIdx);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      // Second pass: if no tasks left in current zone, find the absolute nearest task anywhere
      if (nearestIdx === -1) {
        for (let i = 0; i < unvisitedTasks.length; i++) {
          const task = unvisitedTasks[i];
          if (task.type === "delivery" && task.order.status === "assigned" && !completedPickups.has(task.orderId)) continue;
          
          const dist = getRouteDistance(currentMatrixIdx, task.matrixIdx);
          const bundledDist = dist < 2 ? dist * 0.1 : dist;

          if (bundledDist < minDistance) {
            minDistance = bundledDist;
            nearestIdx = i;
          }
        }
      }
      
      if (nearestIdx === -1) break; 
      
      const nearestTask = unvisitedTasks.splice(nearestIdx, 1)[0];
      const o = nearestTask.order;
      const isPickup = nearestTask.type === "pickup";
      
      if (isPickup) completedPickups.add(nearestTask.orderId);
      
      const actualDist = getRouteDistance(currentMatrixIdx, nearestTask.matrixIdx);
      
      currentMatrixIdx = nearestTask.matrixIdx;
      currentZone = getZone(nearestTask.lat, nearestTask.lng);

      optimized.push({
        action: isPickup ? "Pickup" : "Deliver",
        location: (isPickup ? o.pickupLocation : o.deliveryLocation) || "Unknown Location",
        deliveryId: o._id,
        trackingCode: o.trackingCode,
        zone: currentZone,
        agentType: "bike"
      });
      
      totalDistance += actualDist;
    }
  }
  
  return { optimized, totalDistance };
};
