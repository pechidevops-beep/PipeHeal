import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, Play, Pause, Filter, Download } from 'lucide-react';
import './LogsPage.css';

import useSocket from '../hooks/useSocket';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

  // Buffer to hold logs while paused
  const pausedLogsBuffer = useRef([]);
  // Use ref so socket callback always sees latest value (no stale closure)
  const isPausedRef = useRef(false);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Connect to the /logs namespace
  useSocket('/logs', {
    new_log: (logData) => {
      const newLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: logData.timestamp,
        level: logData.level,
        service: 'backend-node',
        text: logData.stack || logData.message
      };

      if (isPausedRef.current) {
        pausedLogsBuffer.current.push(newLog);
        if (pausedLogsBuffer.current.length > 200) {
          pausedLogsBuffer.current.shift();
        }
      } else {
        setLogs(prev => {
          const next = [...prev, newLog];
          if (next.length > 200) return next.slice(next.length - 200);
          return next;
        });
      }
    }
  });

  // When unpausing, flush the buffer
  useEffect(() => {
    if (!isPaused && pausedLogsBuffer.current.length > 0) {
      setLogs(prev => {
        const next = [...prev, ...pausedLogsBuffer.current];
        if (next.length > 200) return next.slice(next.length - 200);
        return next;
      });
      pausedLogsBuffer.current = [];
    }
  }, [isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    return log.text.toLowerCase().includes(search.toLowerCase()) || 
           log.service.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="logs-container fade-in">
      
      {/* Header / Toolbar */}
      <div className="logs-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-default)] flex items-center justify-center text-[var(--text-primary)]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Live System Logs</h2>
            <p className="text-[13px] text-[var(--text-secondary)]">Streaming real-time events across all services</p>
          </div>
        </div>

        <div className="logs-toolbar">
          <div className="logs-search">
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button className="h-9 px-3 rounded-lg border border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-base)] transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" /> Levels
          </button>

          <button 
            onClick={() => setIsPaused(!isPaused)}
            className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-2 ${
              isPaused 
                ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 hover:bg-[var(--accent-blue)]/20' 
                : 'bg-[var(--bg-base)] border border-[var(--border-default)] text-white hover:border-[var(--border-highlight)]'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button className="h-9 px-3 rounded-lg bg-white text-black font-semibold text-[13px] hover:scale-105 transition-transform flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Log Stream Area */}
      <div className="log-stream-area" ref={scrollRef}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-3">
            <Terminal className="w-8 h-8 opacity-50" />
            <p>Waiting for incoming logs...</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="log-entry">
              <span className="log-timestamp">[{log.timestamp}]</span>
              <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}</span>
              <span className="log-service">[{log.service}]</span>
              <span className="log-message" dangerouslySetInnerHTML={{ __html: log.text }} />
            </div>
          ))
        )}
      </div>

    </div>
  );
}
