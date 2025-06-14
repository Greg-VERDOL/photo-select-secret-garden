
import React from 'react';
import { Heart } from 'lucide-react';

const EmptySelectionState: React.FC = () => {
  return (
    <div className="text-center py-8 text-gray-500">
      <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
      <p>No photos selected yet</p>
      <p className="text-sm">Go back and select your favorite photos</p>
    </div>
  );
};

export default EmptySelectionState;
