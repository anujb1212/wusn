interface NodeData {
    nodeId: number;
    moisture: number;
    temperature: number;
    rssi: number;
    batteryLevel: number;
    depth: number;
    distance: number;
}
interface SelectionResult {
    bestNode: NodeData;
    allNodes: NodeData[];
    score: number;
    reason: string;
}
export declare function selectBestNode(nodes: NodeData[]): SelectionResult;
export declare function filterBlockedNodes(nodes: NodeData[]): {
    activeNodes: NodeData[];
    blockedNodes: NodeData[];
};
export {};
//# sourceMappingURL=nodeSelectionService.d.ts.map