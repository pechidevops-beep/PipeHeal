import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Server, Database, Shield, Box, Activity, AlertCircle, PlayCircle, Network } from 'lucide-react';
import useSocket from '../hooks/useSocket';
import './NetworkPage.css';

// Mock Network Topology structure
const INITIAL_NODES = [
  { id: 'lb-1', label: 'Load Balancer', icon: Globe, x: 10, y: 50, type: 'gateway', status: 'healthy', rpm: 12400, latency: '4ms', errorCount: 0, events: [] },
  { id: 'api-gw', label: 'API Gateway', icon: Server, x: 30, y: 50, type: 'gateway', status: 'healthy', rpm: 12200, latency: '12ms', errorCount: 0, events: [] },
  { id: 'auth-svc', label: 'Auth Service', icon: Shield, x: 60, y: 20, type: 'service', status: 'healthy', rpm: 4500, latency: '18ms', errorCount: 0, events: [] },
  { id: 'core-svc', label: 'Core Engine', icon: Box, x: 60, y: 80, type: 'service', status: 'healthy', rpm: 7500, latency: '840ms', errorCount: 0, events: [] },
  { id: 'db-main', label: 'PostgreSQL', icon: Database, x: 90, y: 50, type: 'database', status: 'healthy', rpm: 8900, latency: '6ms', errorCount: 0, events: [] },
];

const EDGES = [
  { source: 'lb-1', target: 'api-gw' },
  { source: 'api-gw', target: 'auth-svc' },
  { source: 'api-gw', target: 'core-svc' }, // We'll add hasErrors dynamically
  { source: 'auth-svc', target: 'db-main' },
  { source: 'core-svc', target: 'db-main' },
];

export default function NetworkPage() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState(INITIAL_NODES[1].id);
  const [packets, setPackets] = useState([]);

  // Connect to live metrics
  useSocket('/network', {
    metrics_update: (metrics) => {
      // Map the real backend metrics onto the API Gateway and Core Engine to simulate a real bottleneck
      setNodes(prev => prev.map(node => {
        if (node.id === 'api-gw') {
          return {
            ...node,
            rpm: metrics.requestsPerMinute,
            latency: metrics.avgLatency,
            status: metrics.activeErrors > 0 ? 'error' : 'healthy',
            errorCount: metrics.activeErrors,
            events: metrics.recentEvents
          };
        }
        if (node.id === 'core-svc') {
          // Simulate the core engine being the slow one
          return {
            ...node,
            rpm: Math.round(metrics.requestsPerMinute * 0.6), // gets 60% of traffic
            latency: metrics.p95Latency,
            status: metrics.activeErrors > 0 ? 'error' : 'healthy',
            errorCount: metrics.activeErrors,
            events: metrics.recentEvents
          };
        }
        return node;
      }));

      setEdges(prev => prev.map(edge => {
        if (edge.source === 'api-gw' && edge.target === 'core-svc') {
          return { ...edge, hasErrors: metrics.activeErrors > 0 };
        }
        return edge;
      }));
    }
  });

  // Simulate network traffic packets
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random edge
      const edge = edges[Math.floor(Math.random() * edges.length)];
      const id = Math.random().toString(36).substr(2, 9);
      
      setPackets(prev => [...prev, { id, edge, progress: 0 }]);
      
      // Remove packet after animation (approx 1.5s)
      setTimeout(() => {
        setPackets(prev => prev.filter(p => p.id !== id));
      }, 1500);
      
    }, 400); // New packet every 400ms
    
    return () => clearInterval(interval);
  }, [edges]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="network-container fade-in">
      
      {/* Main Graph Area */}
      <div className="network-graph-area">
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] shadow-sm z-20">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />
          <span className="text-[12px] font-medium text-[var(--text-secondary)]">Live Traffic Simulation</span>
        </div>

        {/* SVG Layer for Connections */}
        <svg className="network-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
          {edges.map((edge, i) => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;
            return (
              <path
                key={`edge-${i}`}
                d={`M ${source.x} ${source.y} C ${(source.x + target.x) / 2} ${source.y}, ${(source.x + target.x) / 2} ${target.y}, ${target.x} ${target.y}`}
                className={`connection-line ${edge.hasErrors ? 'error' : ''}`}
                style={{ opacity: 0.3 }}
              />
            );
          })}
          
          {/* Animated Packets */}
          <AnimatePresence>
            {packets.map(packet => {
              const source = nodes.find(n => n.id === packet.edge.source);
              const target = nodes.find(n => n.id === packet.edge.target);
              if (!source || !target) return null;

              const isErrorPath = packet.edge.hasErrors && Math.random() > 0.5; // Simulate intermittent errors on the path
              
              const pathD = `M ${source.x} ${source.y} C ${(source.x + target.x) / 2} ${source.y}, ${(source.x + target.x) / 2} ${target.y}, ${target.x} ${target.y}`;
              
              return (
                <motion.circle
                  key={packet.id}
                  r="1"
                  className={`data-packet ${isErrorPath ? 'error' : ''}`}
                  initial={{ offsetDistance: "0%" }}
                  animate={{ offsetDistance: "100%" }}
                  transition={{ duration: 1.5, ease: "linear" }}
                  style={{
                    offsetPath: `path('${pathD}')`,
                  }}
                />
              );
            })}
          </AnimatePresence>
        </svg>

        {/* HTML Layer for Nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`network-node ${selectedNodeId === node.id ? 'selected' : ''} ${node.status === 'error' ? 'status-error' : ''}`}
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => setSelectedNodeId(node.id)}
          >
            <div className="node-icon-wrapper">
              <node.icon className="w-6 h-6" />
            </div>
            <div className="node-label">
              {node.label}
            </div>
          </div>
        ))}
      </div>

      {/* Side Details Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="network-details-panel"
        >
          <div className="details-header">
            <div className="details-icon">
              <selectedNode.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{selectedNode.label}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${selectedNode.status === 'error' ? 'bg-[var(--danger)]' : 'bg-[var(--accent-green)]'}`} />
                <span className="text-[12px] text-[var(--text-secondary)] capitalize">{selectedNode.status}</span>
              </div>
            </div>
          </div>
          
          <div className="details-content">
            <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Metrics</h4>
            
            <div className="stat-row">
              <span className="stat-label flex items-center gap-2"><Activity className="w-4 h-4" /> Throughput</span>
              <span className="stat-value">{selectedNode.rpm.toLocaleString()} RPM</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label flex items-center gap-2"><PlayCircle className="w-4 h-4" /> Latency (p95)</span>
              <span className={`stat-value ${selectedNode.status === 'error' ? 'text-[var(--danger)]' : ''}`}>{selectedNode.latency}</span>
            </div>
            
            {selectedNode.status === 'error' && (
              <div className="stat-row">
                <span className="stat-label flex items-center gap-2 text-[var(--danger)]"><AlertCircle className="w-4 h-4" /> Active Errors</span>
                <span className="stat-value text-[var(--danger)]">{selectedNode.errorCount}</span>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-[var(--border-default)]">
              <h4 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Recent Events</h4>
              
              <div className="space-y-3">
                {selectedNode.events && selectedNode.events.length > 0 ? (
                  selectedNode.events.map((event, idx) => (
                    <div key={idx} className="flex gap-2 text-[13px]">
                      <span className={event.type === 'error' ? 'text-[var(--danger)] mt-0.5' : 'text-[var(--accent-green)] mt-0.5'}>•</span>
                      <p className="text-[var(--text-secondary)]">
                        <span className="text-white">{event.message}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex gap-2 text-[13px]">
                    <span className="text-[var(--accent-green)] mt-0.5">•</span>
                    <p className="text-[var(--text-secondary)]">No recent alerts</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <button className="w-full py-2.5 rounded-lg border border-[var(--border-default)] text-[13px] font-medium text-white hover:bg-[var(--bg-base)] transition-colors">
                View Full Traces
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
