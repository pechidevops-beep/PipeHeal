import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

export default function NumberCounter({ value, duration = 0.6 }) {
  // Parse numeric part from string (e.g., "99.9%" -> 99.9, or "42" -> 42)
  const isPercent = typeof value === 'string' && value.includes('%');
  const numericValue = parseFloat(value) || 0;
  
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    springValue.set(numericValue);
  }, [numericValue, springValue]);

  const displayValue = useTransform(springValue, (current) => {
    const formatted = Number.isInteger(numericValue) ? Math.round(current) : current.toFixed(1);
    return isPercent ? `${formatted}%` : formatted;
  });

  return <motion.span>{displayValue}</motion.span>;
}
