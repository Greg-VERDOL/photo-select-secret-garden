
import React from 'react';
import { Heart } from 'lucide-react';

const EmptySelectionsState: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-slate-400" />
        </div>
        <h3 className="text-2xl font-light mb-3 text-white">No Selections Yet</h3>
        <p className="text-slate-400 text-lg leading-relaxed">
          Client photo selections will appear here when they make their choices
        </p>
      </div>
    </div>
  );
};

export default EmptySelectionsState;
