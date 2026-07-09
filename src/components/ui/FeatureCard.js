import React from 'react';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="bg-heritage-800/50 backdrop-blur border border-heritage-700 rounded-2xl p-8">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-heritage-300 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;