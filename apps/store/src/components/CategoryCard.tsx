import React from 'react';
import { Link } from 'wouter';
import { type Category } from '../lib/products';
import {
  Layers,
  Tv,
  Shield,
  Gamepad2,
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  Cpu,
  Key,
} from 'lucide-react';

interface CategoryCardProps {
  category: Category;
  onClick?: () => void;
}

const GRADIENTS = [
  'from-indigo-600 to-purple-600',
  'from-emerald-600 to-teal-600',
  'from-rose-600 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-sky-600 to-cyan-600',
  'from-slate-700 to-gray-800',
];

function getCategoryGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('vpn')) return <Shield className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  if (lower.includes('shahid') || lower.includes('يوتيوب') || lower.includes('tv'))
    return <Tv className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  if (lower.includes('gemini') || lower.includes('ai') || lower.includes('gpt'))
    return <Sparkles className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  if (lower.includes('game') || lower.includes('ببجي') || lower.includes('play'))
    return <Gamepad2 className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  if (lower.includes('code') || lower.includes('سيرفر'))
    return <Key className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  if (lower.includes('هاتف') || lower.includes('خط') || lower.includes('sim'))
    return <Smartphone className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
  return <Layers className="w-9 h-9 sm:w-11 sm:h-11 text-white/90" />;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
  const gradient = getCategoryGradient(category.name);

  return (
    <Link
      data-category-card
      href={`/category/${category.slug}`}
      onClick={onClick}
      className="group relative flex flex-col justify-between aspect-square p-4 sm:p-5 rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer text-white"
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-95 group-hover:opacity-100 transition-opacity`} />

      {/* Decorative backdrop shapes */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl group-hover:scale-125 transition-transform" />
      <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-black/10 blur-lg" />

      {/* Top Tag or icon preview */}
      <div className="relative z-10 flex justify-between items-start">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-xs tracking-wider">
          قسم رقمي
        </span>
      </div>

      {/* Central Icon / Image */}
      <div className="relative z-10 flex items-center justify-center my-auto transition-transform group-hover:scale-110">
        {category.imageUrl ? (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain drop-shadow-md"
            loading="lazy"
          />
        ) : (
          getCategoryIcon(category.name)
        )}
      </div>

      {/* Bottom Category Name Label */}
      <div className="relative z-10 mt-auto text-center">
        <div className="inline-block w-full py-1.5 px-2 rounded-xl bg-black/25 backdrop-blur-md border border-white/15">
          <h3 className="font-extrabold text-xs sm:text-sm truncate drop-shadow-xs">
            {category.name}
          </h3>
        </div>
      </div>
    </Link>
  );
};
