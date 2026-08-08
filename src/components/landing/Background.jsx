import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Background() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1200], [0, -160]);
  const y2 = useTransform(scrollY, [0, 1200], [0, 140]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[var(--bg-base)]">
      {/* Subtle animated grid */}
      <motion.div
        animate={{ backgroundPosition: ['0px 0px', '60px 60px'] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #9ca3af 1px, transparent 1px), linear-gradient(to bottom, #9ca3af 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Top ambient glow */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] md:w-[60vw] h-[600px] rounded-full bg-gradient-to-br from-[var(--accent-blue)]/10 via-[var(--accent-cyan)]/5 to-transparent blur-[120px]"
      />
      {/* Bottom accent glow */}
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[60%] right-[-10%] w-[40vw] h-[500px] rounded-full bg-[var(--accent-blue)]/5 blur-[150px]"
      />
    </div>
  );
}
