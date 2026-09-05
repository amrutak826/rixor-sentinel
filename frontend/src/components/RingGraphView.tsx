import { useState, useMemo } from 'react';
import { 
  GraphNode, 
  GraphEdge, 
  EntityType 
} from '../types';
import { 
  Laptop, 
  Globe, 
  MapPin, 
  CreditCard, 
  User, 
  Store, 
  Receipt,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Copy,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

interface RingGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode: GraphNode | null;
  onSelectEdge?: (edge: GraphEdge | null) => void;
}

export function RingGraphView({
  nodes,
  edges,
  onSelectNode,
  selectedNode,
}: RingGraphViewProps) {
  const [zoom, setZoom] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [minRisk, setMinRisk] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Compute node layout positions in a structured concentric graph layout
  const layoutNodes = useMemo(() => {
    const width = 860;
    const height = 580;
    const centerX = width / 2;
    const centerY = height / 2;

    const customers = nodes.filter(n => n.type === 'customer');
    const devices = nodes.filter(n => n.type === 'device');
    const instruments = nodes.filter(n => n.type === 'payment_instrument');
    const ips = nodes.filter(n => n.type === 'ip');
    const addresses = nodes.filter(n => n.type === 'address');
    const merchants = nodes.filter(n => n.type === 'merchant');
    const transactions = nodes.filter(n => n.type === 'transaction');

    const positions: Record<string, { x: number; y: number }> = {};

    // 1. Center: Flagged Devices
    devices.forEach((dev, i) => {
      const offsetX = (i - (devices.length - 1) / 2) * 60;
      positions[dev.id] = { x: centerX + offsetX, y: centerY - 15 };
    });

    // 2. Inner Orbit: Payment Instruments & IPs (Radius: 130)
    const innerRing = [...instruments, ...ips];
    const innerRadius = 135;
    innerRing.forEach((node, i) => {
      const angle = (i / innerRing.length) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: centerX + innerRadius * Math.cos(angle),
        y: centerY + innerRadius * Math.sin(angle),
      };
    });

    // 3. Mid Orbit: Addresses, Merchants, Flagged Transactions (Radius: 215)
    const midRing = [...addresses, ...merchants, ...transactions];
    const midRadius = 215;
    midRing.forEach((node, i) => {
      const angle = (i / midRing.length) * 2 * Math.PI - Math.PI / 3;
      positions[node.id] = {
        x: centerX + midRadius * Math.cos(angle),
        y: centerY + midRadius * Math.sin(angle),
      };
    });

    // 4. Outer Perimeter Orbit: Customers (Radius: 290)
    const outerRadius = 285;
    customers.forEach((node, i) => {
      const angle = (i / customers.length) * 2 * Math.PI - Math.PI / 2;
      positions[node.id] = {
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle),
      };
    });

    return nodes.map(node => ({
      ...node,
      x: positions[node.id]?.x ?? centerX,
      y: positions[node.id]?.y ?? centerY,
    }));
  }, [nodes]);

  // Filter nodes based on UI controls
  const visibleNodes = useMemo(() => {
    return layoutNodes.filter(n => {
      if (filterType !== 'all' && n.type !== filterType) return false;
      if (n.riskScore < minRisk) return false;
      return true;
    });
  }, [layoutNodes, filterType, minRisk]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map(n => n.id)), [visibleNodes]);

  // Only render edges where both endpoints are visible
  const visibleEdges = useMemo(() => {
    return edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  // Counts by node type for the 7 requested node types:
  // transaction, device, customer, payment_instrument, ip, address, merchant
  const nodeTypeCounts = useMemo(() => {
    const counts: Record<EntityType, number> = {
      customer: 0,
      device: 0,
      payment_instrument: 0,
      ip: 0,
      address: 0,
      merchant: 0,
      transaction: 0,
    };
    nodes.forEach(n => {
      if (counts[n.type] !== undefined) {
        counts[n.type]++;
      }
    });
    return counts;
  }, [nodes]);

  const getNodeIcon = (type: EntityType, size = 14) => {
    switch (type) {
      case 'device':
        return <Laptop size={size} className="text-rose-500" />;
      case 'ip':
        return <Globe size={size} className="text-amber-500" />;
      case 'address':
        return <MapPin size={size} className="text-sky-400" />;
      case 'payment_instrument':
        return <CreditCard size={size} className="text-purple-400" />;
      case 'merchant':
        return <Store size={size} className="text-emerald-400" />;
      case 'transaction':
        return <Receipt size={size} className="text-pink-400" />;
      case 'customer':
      default:
        return <User size={size} className="text-slate-300" />;
    }
  };

  const getNodeColor = (node: GraphNode) => {
    if (node.id === 'Device-17' || node.id === 'Device-31') return '#E11D48'; // Strong rose
    if (node.riskScore >= 0.90) return '#EF4444'; // Red
    if (node.riskScore >= 0.70) return '#F59E0B'; // Amber
    if (node.riskScore >= 0.40) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  };

  const handleCopyReport = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshAI = () => {
    setIsGeneratingAI(true);
    setTimeout(() => setIsGeneratingAI(false), 800);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Metrics Card: Customers in ring, Cluster density, Flagged overlap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ring ID & Title */}
        <InfoTooltip
          title="Active Sybil Ring (Spiderweb Map)"
          content="An interactive visual chart where you can see all the nodes (accounts, computers, credit cards, Wi-Fi networks) and physically see how the criminal gang is linked together behind the scenes."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-4 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider">Active Sybil Ring</div>
            <div className="text-xl font-bold text-[#192837] mt-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <span>RING-017</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold border border-rose-200">
                CRITICAL
              </span>
            </div>
            <div className="text-xs text-[#192837]/70 mt-1">Velocity Card Stuffing & Bulk Accounts</div>
          </div>
        </InfoTooltip>

        {/* Customers in Ring */}
        <InfoTooltip
          title="Customers in Ring"
          content="14 synthetic or hijacked customer profiles created in coordinated batches, operating from the same hardware and IP subnet."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-4 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider">Customers in Ring</div>
            <div className="text-2xl font-bold text-[#192837] mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
              {nodeTypeCounts.customer} Accounts
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
              <AlertTriangle size={12} />
              <span>14 shared on 1 hardware fingerprint</span>
            </div>
          </div>
        </InfoTooltip>

        {/* Cluster Density */}
        <InfoTooltip
          title="Cluster Density"
          content="Bipartite graph edge connectivity score measuring how tightly clustered these entities are compared to ordinary customer populations."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-4 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider">Cluster Density</div>
            <div className="text-2xl font-bold text-[#7342E2] mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
              0.84
            </div>
            <div className="text-xs text-[#192837]/70 mt-1">
              Bipartite graph edge connectivity score
            </div>
          </div>
        </InfoTooltip>

        {/* Flagged Overlap */}
        <InfoTooltip
          title="Flagged Overlap"
          content="Entity cross-attribute reuse index revealing that 93.4% of hardware tokens, credit cards, or IPs are shared across separate customer names."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-4 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider">Flagged Overlap</div>
            <div className="text-2xl font-bold text-rose-600 mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
              93.4%
            </div>
            <div className="text-xs text-[#192837]/70 mt-1">
              Entity cross-attribute reuse index
            </div>
          </div>
        </InfoTooltip>
      </div>

      {/* 2. Node Types Breakdown Bar (7 requested node types: transaction, device, customer, payment_instrument, ip, address, merchant) */}
      <div className="p-4 rounded-2xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#192837] uppercase tracking-wider">
              Graph Node Types (7 Dimensions)
            </span>
            <InfoTooltip
              title="7-Dimensional Graph Engine"
              content="Rixor decomposes transactions into 7 distinct topological dimensions: Customer accounts, Hardware Devices, Payment Instruments, IP nodes, Delivery Addresses, Merchants, and Transaction nodes."
              position="top"
              maxWidth="max-w-xs"
            >
              <HelpCircle size={14} className="text-[#192837]/40 cursor-help" />
            </InfoTooltip>
          </div>
          <span className="text-xs text-[#192837]/60">
            Click any node type pill below to isolate view
          </span>
        </div>

        {/* Explanatory lines to help user understand how it works */}
        <div className="p-3 rounded-xl bg-[#F2F2EE]/80 border border-[#192837]/10 text-xs text-[#192837]/80 leading-relaxed flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-[#7342E2]/10 text-[#7342E2] shrink-0 mt-0.5">
            <Sparkles size={13} />
          </div>
          <div>
            <span className="font-semibold text-[#192837]">How Graph Analysis Works: </span>
            Syndicate fraud looks innocent when looking at single accounts. Rixor links together accounts that share the same computer fingerprint (<strong>Device-17</strong>), virtual payment card (<strong>Instrument-4</strong>), or Tor network (<strong>IP-07</strong>). This exposes the hidden spiderweb of coordinated actors before payments are approved.
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-2 border ${
              filterType === 'all'
                ? 'bg-[#7342E2] text-white border-[#7342E2] shadow-xs'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <span>All Entities</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodes.length}
            </span>
          </button>

          {/* 1. Customer */}
          <button
            onClick={() => setFilterType('customer')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'customer'
                ? 'bg-[#192837] text-white border-[#192837]'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <User size={13} className="text-slate-600" />
            <span>customer</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.customer}
            </span>
          </button>

          {/* 2. Device */}
          <button
            onClick={() => setFilterType('device')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'device'
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <Laptop size={13} className="text-rose-500" />
            <span>device</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.device}
            </span>
          </button>

          {/* 3. Payment Instrument */}
          <button
            onClick={() => setFilterType('payment_instrument')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'payment_instrument'
                ? 'bg-purple-700 text-white border-purple-700'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <CreditCard size={13} className="text-purple-600" />
            <span>payment_instrument</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.payment_instrument}
            </span>
          </button>

          {/* 4. IP */}
          <button
            onClick={() => setFilterType('ip')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'ip'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <Globe size={13} className="text-amber-500" />
            <span>ip</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.ip}
            </span>
          </button>

          {/* 5. Address */}
          <button
            onClick={() => setFilterType('address')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'address'
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <MapPin size={13} className="text-sky-500" />
            <span>address</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.address}
            </span>
          </button>

          {/* 6. Merchant */}
          <button
            onClick={() => setFilterType('merchant')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'merchant'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <Store size={13} className="text-emerald-500" />
            <span>merchant</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.merchant}
            </span>
          </button>

          {/* 7. Transaction */}
          <button
            onClick={() => setFilterType('transaction')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
              filterType === 'transaction'
                ? 'bg-pink-600 text-white border-pink-600'
                : 'bg-[#F2F2EE] text-[#192837] border-[#192837]/10 hover:bg-[#192837]/10'
            }`}
          >
            <Receipt size={13} className="text-pink-500" />
            <span>transaction</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/10 text-[10px] font-bold">
              {nodeTypeCounts.transaction}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Main SVG Entity Graph Canvas */}
      <div className="flex flex-col bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden text-slate-100 shadow-xl">
        {/* Top Graph Canvas Controls */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">Interactive Canvas:</span>
            <span className="text-slate-400">
              Showing {visibleNodes.length} nodes & {visibleEdges.length} relationship links
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Risk Threshold:</span>
              <select
                value={minRisk}
                onChange={(e) => setMinRisk(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
              >
                <option value={0}>All Scores (0.00+)</option>
                <option value={0.70}>Review (0.70+)</option>
                <option value={0.85}>Hold (0.85+)</option>
                <option value={0.90}>Critical Block (0.90+)</option>
              </select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-1 text-[11px] font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(1.8, z + 0.15))}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 ml-1 cursor-pointer"
                title="Reset layout"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* SVG Viewport */}
        <div className="relative min-h-[500px] h-[580px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex items-center justify-center p-2">
          {/* Grid background */}
          <div 
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox="0 0 860 580"
            className="w-full h-full select-none transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            <defs>
              <linearGradient id="edgeGradCritical" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E11D48" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#7342E2" stopOpacity="0.45" />
              </linearGradient>
              <filter id="glowCritical" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#E11D48" floodOpacity="0.6" />
              </filter>
              <filter id="glowSelected" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#7342E2" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* Concentric orbital circles */}
            <circle cx={430} cy={290} r={135} fill="none" stroke="#334155" strokeWidth={1} strokeDasharray="3 6" opacity={0.35} />
            <circle cx={430} cy={290} r={215} fill="none" stroke="#334155" strokeWidth={1} strokeDasharray="3 6" opacity={0.25} />
            <circle cx={430} cy={290} r={285} fill="none" stroke="#334155" strokeWidth={1} strokeDasharray="3 6" opacity={0.2} />

            {/* Edges */}
            <g id="graph-edges">
              {visibleEdges.map(edge => {
                const sourceNode = layoutNodes.find(n => n.id === edge.source);
                const targetNode = layoutNodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isConnectedToSelected = selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);
                const isHighRiskEdge = edge.weight >= 0.95;

                return (
                  <line
                    key={edge.id}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={
                      isConnectedToSelected 
                        ? '#7342E2' 
                        : isHighRiskEdge 
                        ? 'url(#edgeGradCritical)' 
                        : '#334155'
                    }
                    strokeWidth={isConnectedToSelected ? 3 : isHighRiskEdge ? 1.8 : 1}
                    strokeDasharray={edge.relationship === 'connected_ip' ? '4 3' : undefined}
                    className="transition-all duration-300 opacity-70 hover:opacity-100 hover:stroke-white cursor-pointer"
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g id="graph-nodes">
              {visibleNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isCenterHub = node.type === 'device';
                const radius = isCenterHub ? 22 : node.type === 'customer' ? 14 : 17;
                const nodeColor = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => onSelectNode(isSelected ? null : node)}
                    className="cursor-pointer group"
                    filter={isSelected ? 'url(#glowSelected)' : isCenterHub ? 'url(#glowCritical)' : undefined}
                  >
                    {/* Outer pulse circle for flagged high risk */}
                    {node.isFlagged && (
                      <circle
                        r={radius + 4}
                        fill="none"
                        stroke={nodeColor}
                        strokeWidth={1.5}
                        strokeOpacity={0.45}
                        className="animate-pulse"
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      r={radius}
                      fill="#0F172A"
                      stroke={nodeColor}
                      strokeWidth={isSelected ? 3 : isCenterHub ? 3 : 2}
                      className="transition-transform duration-200 group-hover:scale-110"
                    />

                    {/* Inner ring for selected */}
                    {isSelected && (
                      <circle
                        r={radius - 4}
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    )}

                    {/* Node Label Text */}
                    <text
                      y={radius + 13}
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                      fontSize={isCenterHub ? '11px' : '9.5px'}
                      fontWeight={isCenterHub || isSelected ? 'bold' : 'normal'}
                      className="pointer-events-none drop-shadow-md select-none font-sans"
                    >
                      {node.id}
                    </text>

                    {/* Node Risk Score Badge */}
                    <text
                      y={radius + 23}
                      textAnchor="middle"
                      fill={node.riskScore >= 0.90 ? '#F87171' : node.riskScore >= 0.70 ? '#FBBF24' : '#34D399'}
                      fontSize="8px"
                      fontWeight="600"
                      className="pointer-events-none select-none font-mono"
                    >
                      {Math.round(node.riskScore * 100)}%
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Quick Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 flex flex-col gap-1.5 shadow-lg">
            <div className="font-semibold text-slate-100 flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#7342E2]" />
              <span>Concentric Hierarchy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Center: Shared Hardware Devices</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Inner: Instruments & Tor/VPN Proxies</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Mid: Addresses & Merchants</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span>Outer: Customer Identity Nodes</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer if clicked */}
        {selectedNode && (
          <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                {getNodeIcon(selectedNode.type, 18)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100 text-sm">{selectedNode.id}</span>
                  <span className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {selectedNode.type}
                  </span>
                  {selectedNode.isFlagged && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                      <AlertTriangle size={10} />
                      FLAGGED OVERLAP
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5">{selectedNode.label}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block uppercase tracking-wider">Risk Score</span>
                <span className={`text-base font-mono font-bold ${
                  selectedNode.riskScore >= 0.90 ? 'text-rose-400' : selectedNode.riskScore >= 0.70 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {Math.round(selectedNode.riskScore * 100)}%
                </span>
              </div>

              <button
                onClick={() => onSelectNode(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. AI Investigator Section at the end of the Ring Explorer page */}
      {/* Prompt request: "at the end add ai investigator that is basically the layer that takes the graph evidence you've already discovered and turns it into an investigator-friendly explanation/report." */}
      <div 
        id="ai-investigator-section" 
        className="p-6 sm:p-8 rounded-3xl bg-white border border-[#192837]/10 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[#192837]/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-xs font-bold mb-2">
              <Sparkles size={14} />
              <span>AI Investigator Report Layer</span>
            </div>
            <InfoTooltip
              title="Synthesis & Incident Dossier"
              content="Automated graph evidence translation converting multi-hop topological connections into court-admissible, investigator-friendly briefings."
              position="top"
              maxWidth="max-w-md"
            >
              <h3 
                className="text-2xl font-bold text-[#192837] tracking-tight cursor-help"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Synthesis & Incident Dossier • RING-017
              </h3>
            </InfoTooltip>
            <p className="text-sm text-[#192837]/75 mt-1">
              Automated graph evidence translation converting multi-hop topological connections into an investigator-friendly briefing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAI}
              disabled={isGeneratingAI}
              className="px-3.5 py-2 rounded-xl bg-[#F2F2EE] hover:bg-[#192837]/10 text-[#192837] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={14} className={isGeneratingAI ? 'animate-spin' : ''} />
              <span>{isGeneratingAI ? 'Re-analyzing Graph...' : 'Refresh AI Analysis'}</span>
            </button>

            <button
              onClick={handleCopyReport}
              className="px-4 py-2 rounded-xl bg-[#7342E2] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Report Copied!' : 'Copy Investigator Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7342E2] mb-2 flex items-center gap-1.5">
                <ShieldAlert size={14} />
                <span>Suspected Syndicate Modus Operandi</span>
              </h4>
              <p className="text-sm leading-relaxed text-[#192837] font-medium bg-[#F2F2EE]/70 p-4 rounded-2xl border border-[#192837]/10">
                Coordinated account generation and card-testing attack orchestrating 14 discrete customer profiles across a shared macOS hardware device (<strong>Device-17</strong>). Traffic is masked via Tor Exit Relays and DigitalOcean VPN proxies, executing 83 high-velocity transactions totalling <strong>₹38,95,118</strong> within 47 minutes targeting liquid digital gift cards and cloud computing credits.
              </p>
            </div>

            {/* Key Multi-Hop Graph Evidence */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/80 mb-3 flex items-center gap-1.5">
                <FileCheck size={14} className="text-[#7342E2]" />
                <span>Strongest Discovered Graph Evidence</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoTooltip
                  title="Hardware Convergence"
                  content="Cross-account hardware correlation. Multiple identities logging in from the exact same physical device profile, WebGL renderer, and screen resolution."
                  position="top"
                  maxWidth="max-w-xs"
                >
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200/80 shadow-xs hover:border-rose-400 transition-all cursor-help h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Hardware Convergence</span>
                    <p className="text-xs text-[#192837] font-semibold mt-1">14 customer accounts bound to Device-17</p>
                    <p className="text-[11px] text-[#192837]/70 mt-1">Canvas & WebGL fingerprints match with 99.8% precision despite rotating user agents.</p>
                  </div>
                </InfoTooltip>

                <InfoTooltip
                  title="Instrument Reuse"
                  content="Payment token recycling. The same debit/credit card number or virtual card token being reused across disparate identity records."
                  position="top"
                  maxWidth="max-w-xs"
                >
                  <div className="p-3.5 rounded-xl bg-white border border-rose-200/80 shadow-xs hover:border-rose-400 transition-all cursor-help h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Instrument Reuse</span>
                    <p className="text-xs text-[#192837] font-semibold mt-1">Instrument-4 (Visa 8812) recycled across 4 names</p>
                    <p className="text-[11px] text-[#192837]/70 mt-1">Prepaid BIN 414720 used sequentially on accounts C101, C102, C107, and C110.</p>
                  </div>
                </InfoTooltip>

                <InfoTooltip
                  title="Smurfing & Structuring Pattern"
                  content="Indian Banking Regulation avoidance. Fraudsters intentionally calibrate orders between ₹46,000 and ₹49,999 to bypass the statutory ₹50,000 PAN verification threshold."
                  position="top"
                  maxWidth="max-w-xs"
                >
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-400 transition-all cursor-help h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Structuring Pattern</span>
                    <p className="text-xs text-[#192837] font-semibold mt-1">Amounts calibrated between ₹46,281 & ₹47,225</p>
                    <p className="text-[11px] text-[#192837]/70 mt-1">Micro-variations intentionally staying below ₹50,000 to evade mandatory KYC reporting.</p>
                  </div>
                </InfoTooltip>

                <InfoTooltip
                  title="Anonymized Proxy Ingress"
                  content="Anonymity network masking. Attackers hopping between Tor exit nodes and datacenter VPNs within seconds to hide their true geographic location."
                  position="top"
                  maxWidth="max-w-xs"
                >
                  <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs hover:border-amber-400 transition-all cursor-help h-full">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Anonymized Proxy Ingress</span>
                    <p className="text-xs text-[#192837] font-semibold mt-1">Tor Exit Node #41 & Datacenter VPN</p>
                    <p className="text-[11px] text-[#192837]/70 mt-1">Sub-second IP switching across accounts C103, C104, C109, and C114.</p>
                  </div>
                </InfoTooltip>
              </div>
            </div>
          </div>

          {/* Right Column: Key Questions & Recommended Actions */}
          <div className="space-y-6 lg:border-l lg:border-[#192837]/10 lg:pl-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/80 mb-2">
                Key Analyst Investigation Questions
              </h4>
              <ul className="space-y-2 text-xs text-[#192837]/80">
                <li className="flex items-start gap-2 bg-[#F2F2EE]/50 p-2.5 rounded-xl">
                  <ArrowRight size={14} className="text-[#7342E2] shrink-0 mt-0.5" />
                  <span>Are there dormant accounts created in the same 10:12–10:59 batch not yet activated?</span>
                </li>
                <li className="flex items-start gap-2 bg-[#F2F2EE]/50 p-2.5 rounded-xl">
                  <ArrowRight size={14} className="text-[#7342E2] shrink-0 mt-0.5" />
                  <span>Has merchant QuickPerks GiftCards India fulfilled the digital code redemptions?</span>
                </li>
                <li className="flex items-start gap-2 bg-[#F2F2EE]/50 p-2.5 rounded-xl">
                  <ArrowRight size={14} className="text-[#7342E2] shrink-0 mt-0.5" />
                  <span>Can BIN 414720 (Virtual Prepaid) be stepped up to mandatory 3DS on all merchant endpoints?</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">
                Recommended Policy Enforcement
              </h4>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900 block">1. Enforce Hardware Blacklist</span>
                  <span className="text-emerald-800/80 text-[11px]">Reject all inbound ingress sessions containing Device-17 WebGL hash.</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                  <span className="font-bold text-emerald-900 block">2. Freeze Pending Authorizations</span>
                  <span className="text-emerald-800/80 text-[11px]">Hold 8 queued authorizations (₹3,75,410) pending manual review.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
