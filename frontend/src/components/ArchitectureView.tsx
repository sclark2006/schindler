import React, { useCallback } from 'react';
import ReactFlow, {
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    Background,
    Controls,
    MiniMap,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { Layout, Server, Database, Share2, Download, Globe, Cpu, User, Layers, Braces } from 'lucide-react';
import { AnalysisResult } from '../types/analysis';

interface ArchitectureViewProps {
    analysisResult: AnalysisResult;
}

// ---- CUSTOM NODE COMPONENTS ----

// 1. Group / Container Node
const GroupNode = ({ data, style }: any) => (
    <div className="h-full w-full rounded-xl bg-slate-50/50 border-2 border-dashed border-slate-300 p-4 relative" style={style}>
        <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            {data.icon}
            {data.label}
        </div>
    </div>
);


// 2. User Node
const UserNode = () => (
    <div className="px-4 py-3 shadow-lg rounded-full bg-blue-600 border-2 border-blue-700 min-w-[150px] text-white flex flex-col items-center justify-center">
        <User size={24} className="mb-1" />
        <div className="text-sm font-bold">User</div>
        <div className="text-[10px] opacity-80">Web Browser</div>
    </div>
);


// 3. Frontend Node (Component)
const FrontendNode = ({ data }: any) => (
    <div className="px-3 py-2 shadow-sm rounded-lg bg-white border border-indigo-200 min-w-[180px] hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-1 border-b border-indigo-50 pb-1">
            <Layout className="text-indigo-500" size={14} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">React Component</div>
        </div>
        <div className="text-sm font-semibold text-slate-800 flex items-center gap-2 truncate">
            {data.label}
        </div>
    </div>
);

// 4. Backend Service Node (Component)
const BackendNode = ({ data }: any) => (
    <div className="px-3 py-2 shadow-sm rounded-lg bg-white border border-emerald-200 min-w-[200px] hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-1 border-b border-emerald-50 pb-1">
            {data.type === 'REST' ? <Globe className="text-emerald-500" size={14} /> : <Cpu className="text-amber-500" size={14} />}
            <div className="text-[10px] font-bold text-slate-500 uppercase">{data.type === 'REST' ? 'REST API' : 'Service'}</div>
        </div>
        <div className="text-xs font-mono text-slate-700 bg-slate-50 p-1 rounded border border-slate-100 mb-1 truncate block">
            {data.label}
        </div>
    </div>
);

// 5. Database Node (Component)
const DatabaseNode = ({ data }: any) => (
    <div className="px-3 py-2 shadow-sm rounded-lg bg-white border border-blue-200 min-w-[160px] hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-1 border-b border-blue-50 pb-1">
            <Database className="text-blue-500" size={14} />
            <div className="text-[10px] font-bold text-slate-500 uppercase">Table</div>
        </div>
        <div className="text-sm font-bold text-slate-800">{data.label}</div>
    </div>
);

const nodeTypes = {
    group: GroupNode,
    user: UserNode,
    frontend: FrontendNode,
    backend: BackendNode,
    database: DatabaseNode
};

// ---- GRAPH LAYOUT LOGIC ----
// Custom Grid Layout to maximize space efficiency (C4 Container View)
const getGridLayout = (nodes: Node[], columns = 2) => {
    const nodeWidth = 200;
    const nodeHeight = 60;
    const spacingX = 20;
    const spacingY = 20;
    const padding = 20;
    const headerHeight = 40;

    let maxX = 0;
    let maxY = 0;

    nodes.forEach((node, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        node.position = {
            x: padding + col * (nodeWidth + spacingX),
            y: padding + headerHeight + row * (nodeHeight + spacingY)
        };

        // Standardize handles for left-to-right flow
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;

        maxX = Math.max(maxX, node.position.x + nodeWidth);
        maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    return {
        width: maxX + padding,
        height: maxY + padding
    };
};


// ---- MAIN DIAGRAM COMPONENT ----
const C4Diagram = ({ analysisResult }: { analysisResult: AnalysisResult }) => {
    const { blocks = [], recordGroups = [], complexityCandidates = [] } = analysisResult.parsedData || {};
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    // Export Function
    const downloadImage = useCallback((format: 'png' | 'json') => {
        if (format === 'json') {
            const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
                JSON.stringify({ nodes, edges }, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `architecture_c4_diagram.json`;
            link.click();
            return;
        }

        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (viewport) {
            toPng(viewport, {
                backgroundColor: '#f8fafc',
                width: 3200, // High res
                height: 1800,
                style: { transform: 'scale(1)' }
            })
                .then((dataUrl) => {
                    const link = document.createElement('a');
                    link.download = 'architecture_c4_diagram.png';
                    link.href = dataUrl;
                    link.click();
                });
        }
    }, [nodes, edges]);

    // Build Graph Data
    React.useEffect(() => {
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];

        // --- 1. PREPARE DATA ---

        // Frontend Nodes
        const frontendNodes: Node[] = blocks.map((block, i) => ({
            id: `fe-${i}`,
            type: 'frontend',
            data: { label: block.name },
            position: { x: 0, y: 0 },
            parentNode: 'group-frontend',
            extent: 'parent'
        }));

        // Backend Nodes (REST from RecordGroups)
        const recordGroupNodes: Node[] = recordGroups.map((rg, i) => ({
            id: `be-rest-${i}`,
            type: 'backend',
            data: { label: `GET /${rg.name.toLowerCase()}`, type: 'REST', source: rg.name },
            position: { x: 0, y: 0 },
            parentNode: 'group-backend',
            extent: 'parent'
        }));

        // Backend Nodes (RPC from Complex Logic)
        const logicNodes: Node[] = complexityCandidates
            .filter(c => c.complexityType === 'Backend Candidate')
            .map((svc, i) => ({
                id: `be-rpc-${i}`,
                type: 'backend',
                data: { label: `POST /${svc.name.toLowerCase()}`, type: 'RPC', source: svc.reason },
                position: { x: 0, y: 0 },
                parentNode: 'group-backend',
                extent: 'parent'
            }));

        const backendNodes = [...recordGroupNodes, ...logicNodes];

        // Database Nodes
        const dbNames = [...new Set(blocks.map(b => b.dataSource).filter(d => d && d !== 'None'))];
        const dbNodes: Node[] = dbNames.map((name) => ({
            id: `db-${name}`,
            type: 'database',
            data: { label: name },
            position: { x: 0, y: 0 },
            parentNode: 'group-database',
            extent: 'parent'
        }));

        // Connections (Edges)
        // User -> Frontend (Generic connection to first few blocks)
        if (frontendNodes.length > 0) {
            initialEdges.push({
                id: 'e-user-fe',
                source: 'user-1',
                target: frontendNodes[0].id,
                animated: true,
                label: 'HTTPS',
                style: { stroke: '#2563eb', strokeWidth: 2 },
            });
        }

        // Frontend -> DB (Legacy Direct)
        blocks.forEach((block, i) => {
            if (block.dataSource && block.dataSource !== 'None') {
                // Find matching DB node
                const targetId = `db-${block.dataSource}`;
                if (dbNodes.find(n => n.id === targetId)) {
                    initialEdges.push({
                        id: `e-fe-${i}-db-${block.dataSource}`,
                        source: `fe-${i}`,
                        target: targetId,
                        animated: true,
                        style: { stroke: '#94a3b8', strokeDasharray: '5,5' },
                        label: 'SQL',
                        labelStyle: { fill: '#94a3b8', fontSize: 10 }
                    });
                }
            }
        });

        // --- 2. CALCULATE LAYOUTS (GRID) ---
        // Dynamically calculate columns based on node count to keep aspect ratio reasonable
        const feCols = Math.ceil(Math.sqrt(frontendNodes.length)) || 1;
        const beCols = Math.ceil(Math.sqrt(backendNodes.length)) || 1;
        const dbCols = Math.ceil(Math.sqrt(dbNodes.length)) || 1;

        // Layout Frontend Group
        const feLayout = getGridLayout(frontendNodes, Math.max(2, feCols));
        // Layout Backend Group
        const beLayout = getGridLayout(backendNodes, Math.max(2, beCols));
        // Layout DB Group
        const dbLayout = getGridLayout(dbNodes, Math.max(2, dbCols));

        // --- 3. POSITION GROUPS (C4 Columns) ---

        const spacingX = 80;
        let currentX = 50;

        // User Node
        initialNodes.push({
            id: 'user-1',
            type: 'user',
            data: { label: 'User' },
            position: { x: currentX, y: Math.max(150, feLayout.height / 2 - 50) } // Center vertically relative to Frontend
        });
        currentX += 200 + spacingX; // User width + spacing

        // Frontend Group
        initialNodes.push({
            id: 'group-frontend',
            type: 'group',
            data: { label: 'Frontend Application (React)', icon: <Layout size={16} /> },
            position: { x: currentX, y: 50 },
            style: { width: feLayout.width, height: feLayout.height },
        });
        currentX += feLayout.width + spacingX;

        // Backend Group
        initialNodes.push({
            id: 'group-backend',
            type: 'group',
            data: { label: 'Backend API (NestJS)', icon: <Server size={16} /> },
            position: { x: currentX, y: 50 },
            style: { width: beLayout.width, height: beLayout.height },
        });
        currentX += beLayout.width + spacingX;

        // Database Group
        initialNodes.push({
            id: 'group-database',
            type: 'group',
            data: { label: 'Oracle Database', icon: <Database size={16} /> },
            position: { x: currentX, y: 50 },
            style: { width: dbLayout.width, height: dbLayout.height },
        });

        // Add all nodes
        initialNodes.push(...frontendNodes);
        initialNodes.push(...backendNodes);
        initialNodes.push(...dbNodes);

        setNodes(initialNodes);
        setEdges(initialEdges);

        setTimeout(() => fitView({ padding: 0.2 }), 100);

    }, [analysisResult, fitView, setNodes, setEdges]);

    return (
        <div className="h-[750px] w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner relative group">
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button onClick={() => downloadImage('json')} className="bg-white p-2 text-slate-500 rounded-lg shadow-sm border border-slate-200 hover:text-blue-600 hover:border-blue-300 transition" title="Export JSON">
                    <Braces size={20} />
                </button>
                <button onClick={() => downloadImage('png')} className="bg-white p-2 text-slate-500 rounded-lg shadow-sm border border-slate-200 hover:text-blue-600 hover:border-blue-300 transition" title="Export PNG">
                    <Download size={20} />
                </button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#cbd5e1" gap={20} size={1} />
                <Controls />
                <MiniMap style={{ height: 100 }} zoomable pannable />
                <Panel position="top-left" className="bg-white/80 backdrop-blur p-2 rounded-lg border border-slate-200 text-xs text-slate-500 font-medium shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Layers size={14} className="text-blue-500" />
                        <strong>C4 Container View</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                        Top-down hierarchy from User to DB.
                        Grid layout applied for compaction.
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ analysisResult }) => {
    return (
        <ReactFlowProvider>
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <Share2 className="text-blue-400" />
                            Target Architecture Map (C4)
                        </h2>
                        <p className="text-slate-300 text-sm">
                            Visualizing the system containers and their interactions.
                        </p>
                    </div>
                </div>

                {/* Diagram Canvas */}
                <C4Diagram analysisResult={analysisResult} />
            </div>
        </ReactFlowProvider>
    );
};
