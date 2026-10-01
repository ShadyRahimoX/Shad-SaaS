import React from 'react';
import { Info } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4" dir="rtl">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
        <Info className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold">من نحن</h1>
      <p className="text-muted-foreground text-sm">قادم في مرحلة H-x</p>
    </div>
  );
};

export default About;
