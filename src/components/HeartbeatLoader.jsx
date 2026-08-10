import React from 'react';
import { motion } from 'framer-motion';
import './HeartbeatLoader.css';

const variants = {
  loading: {
    d: "M 0,15 L 30,15 L 35,5 L 45,25 L 55,10 L 60,15 L 100,15",
    stroke: "var(--accent-green)",
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "linear"
    }
  },
  alert: {
    d: "M 0,15 L 20,15 L 25,0 L 35,30 L 45,-5 L 55,25 L 60,15 L 100,15",
    stroke: "var(--accent-amber)",
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "linear"
    }
  },
  stable: {
    d: "M 0,15 L 100,15 L 100,15 L 100,15 L 100,15 L 100,15 L 100,15",
    stroke: "var(--accent-green)",
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  flatline: {
    d: "M 0,15 L 100,15 L 100,15 L 100,15 L 100,15 L 100,15 L 100,15",
    stroke: "var(--text-muted)",
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function HeartbeatLoader({ status = 'loading', className = '', style = {} }) {
  return (
    <div className={`heartbeat-container ${status} ${className}`} style={style}>
      <svg 
        className="heartbeat-svg" 
        viewBox="0 0 100 30" 
        preserveAspectRatio="none"
      >
        <motion.path
          className="heartbeat-path"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial="loading"
          animate={status}
          variants={variants}
          // The pulse animation moves the stroke-dashoffset to simulate the line travelling
        />
      </svg>
    </div>
  );
}
