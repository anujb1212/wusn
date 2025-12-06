const DEFAULT_WEIGHTS = {
    battery: 0.30,
    rssi: 0.35,
    depth: 0.15,
    distance: 0.20
};
function normalize(value, min, max) {
    if (max === min)
        return 50;
    return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}
function calculateNodeScore(node, allNodes, weights = DEFAULT_WEIGHTS) {
    const batteryScore = node.batteryLevel;
    const rssiValues = allNodes.map(n => n.rssi);
    const minRssi = Math.min(...rssiValues);
    const maxRssi = Math.max(...rssiValues);
    const rssiScore = normalize(node.rssi, minRssi, maxRssi);
    const depthValues = allNodes.map(n => n.depth);
    const minDepth = Math.min(...depthValues);
    const maxDepth = Math.max(...depthValues);
    const depthScore = 100 - normalize(node.depth, minDepth, maxDepth);
    const distanceValues = allNodes.map(n => n.distance);
    const minDistance = Math.min(...distanceValues);
    const maxDistance = Math.max(...distanceValues);
    const distanceScore = 100 - normalize(node.distance, minDistance, maxDistance);
    const totalScore = (batteryScore * weights.battery) +
        (rssiScore * weights.rssi) +
        (depthScore * weights.depth) +
        (distanceScore * weights.distance);
    return Math.round(totalScore);
}
export function selectBestNode(nodes) {
    if (nodes.length === 0) {
        throw new Error('No nodes provided for selection');
    }
    // Handle single node case
    const firstNode = nodes[0];
    if (nodes.length === 1 && firstNode) {
        return {
            bestNode: firstNode,
            allNodes: nodes,
            score: 100,
            reason: 'Only node available'
        };
    }
    const nodesWithScores = nodes.map(node => ({
        node,
        score: calculateNodeScore(node, nodes)
    }));
    nodesWithScores.sort((a, b) => b.score - a.score);
    // Type-safe access with explicit check
    const bestEntry = nodesWithScores[0];
    if (!bestEntry || !bestEntry.node) {
        throw new Error('Failed to select best node');
    }
    const bestNode = bestEntry.node;
    const bestScore = bestEntry.score;
    let reason = `Node ${bestNode.nodeId} selected: `;
    const reasons = [];
    if (bestNode.batteryLevel > 70) {
        reasons.push(`High battery (${bestNode.batteryLevel}%)`);
    }
    if (bestNode.rssi > -80) {
        reasons.push(`Strong signal (${bestNode.rssi} dBm)`);
    }
    if (bestNode.distance < 15) {
        reasons.push(`Close to gateway (${bestNode.distance}m)`);
    }
    if (reasons.length > 0) {
        reason += reasons.join(', ');
    }
    else {
        reason += `Best overall score (${bestScore}/100)`;
    }
    return {
        bestNode: bestNode,
        allNodes: nodes,
        score: bestScore,
        reason
    };
}
export function filterBlockedNodes(nodes) {
    const BATTERY_THRESHOLD = 15;
    const RSSI_THRESHOLD = -110;
    const activeNodes = [];
    const blockedNodes = [];
    for (const node of nodes) {
        if (node.batteryLevel < BATTERY_THRESHOLD) {
            blockedNodes.push(node);
        }
        else if (node.rssi < RSSI_THRESHOLD) {
            blockedNodes.push(node);
        }
        else {
            activeNodes.push(node);
        }
    }
    return { activeNodes, blockedNodes };
}
//# sourceMappingURL=nodeSelectionService.js.map