import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import './DiffViewer.css';

const lineVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05, // Stagger effect
      duration: 0.3,
      ease: "easeOut"
    }
  })
};

const delVariants = {
  hidden: { opacity: 1 },
  visible: i => ({
    opacity: 0.4,
    transition: {
      delay: i * 0.05 + 0.2, // Fade out after add lines appear
      duration: 0.5
    }
  })
};

function DiffLine({ line, index }) {
  const isAdd = line.startsWith('+') && !line.startsWith('+++');
  const isDel = line.startsWith('-') && !line.startsWith('---');
  const isHunk = line.startsWith('@@');
  const isHeader = line.startsWith('---') || line.startsWith('+++');

  const cls = isAdd ? 'diff-add'
    : isDel ? 'diff-del'
    : isHunk ? 'diff-hunk'
    : isHeader ? 'diff-header'
    : 'diff-ctx';

  if (isAdd) {
    return (
      <motion.div 
        custom={index}
        initial="hidden"
        animate="visible"
        variants={lineVariants}
        className={`diff-line ${cls}`}
      >
        {line}
      </motion.div>
    );
  }

  if (isDel) {
    return (
      <motion.div 
        custom={index}
        initial="hidden"
        animate="visible"
        variants={delVariants}
        className={`diff-line ${cls}`}
      >
        {line}
      </motion.div>
    );
  }

  return <div className={`diff-line ${cls}`}>{line}</div>;
}

export default function DiffViewer({ diffString, description = 'No diff content' }) {
  const lines = useMemo(() => diffString ? diffString.split('\n') : [], [diffString]);

  if (lines.length === 0 || !diffString) {
    return <div className="patch-fallback">{description}</div>;
  }

  return (
    <div className="diff-viewer-container">
      <div className="diff-viewer-body">
        {lines.map((l, i) => (
          <DiffLine key={i} line={l} index={i} />
        ))}
      </div>
    </div>
  );
}
