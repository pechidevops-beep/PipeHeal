import React from 'react';
import { motion } from 'framer-motion';

const tech = [
  { name: 'React', color: 'text-[#61DAFB]' },
  { name: 'Node.js', color: 'text-[#339933]' },
  { name: 'Docker', color: 'text-[#2496ED]' },
  { name: 'Redis', color: 'text-[#DC382D]' },
  { name: 'Supabase', color: 'text-[#3ECF8E]' },
  { name: 'OpenAI', color: 'text-white' },
  { name: 'Vercel', color: 'text-white' },
  { name: 'Render', color: 'text-[#46E3B7]' }
];

export default function TechStack() {
  return (
    <section className="py-20 px-6 border-t border-slate-800/60 bg-[#0B0F19] relative z-10">
      <div className="max-w-7xl mx-auto text-center">
        <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-8">Built for Modern Tech Stacks</p>
        
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
          {tech.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.1, filter: 'brightness(1.5)' }}
              className={`text-xl md:text-2xl font-bold cursor-default transition-all opacity-60 hover:opacity-100 ${t.color}`}
            >
              {t.name}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
