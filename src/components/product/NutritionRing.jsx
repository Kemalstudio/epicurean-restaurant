import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

export default function NutritionRing({ calories, protein, fat, carbs }) {
  const total = protein + fat + carbs || 1;
  const proteinPct = (protein / total) * 100;
  const fatPct = (fat / total) * 100;
  const carbsPct = (carbs / total) * 100;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { pct: proteinPct, color: 'hsl(var(--accent))', label: 'Protein', value: protein },
    { pct: fatPct, color: 'hsl(var(--primary))', label: 'Fat', value: fat },
    { pct: carbsPct, color: 'hsl(var(--secondary))', label: 'Carbs', value: carbs },
  ];

  let offset = 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
          {segments.map((seg, i) => {
            const dash = (seg.pct / 100) * circumference;
            const currentOffset = offset;
            offset += dash;
            return (
              <motion.circle
                key={i}
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="6"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${dash} ${circumference - dash}` }}
                transition={{ duration: 1, delay: i * 0.2 }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Flame className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-foreground">{calories}</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-2">
        {segments.map((seg, i) => (
          <div key={i} className="text-center">
            <div className="text-xs text-muted-foreground">{seg.label}</div>
            <div className="text-sm font-bold text-foreground">{seg.value}g</div>
          </div>
        ))}
      </div>
    </div>
  );
}