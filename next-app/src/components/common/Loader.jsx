import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullPage = false, inline = false, size = 'lg' }) => {
  const containerClasses = fullPage 
    ? "fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center" 
    : inline
      ? "inline-flex flex-col items-center justify-center"
      : "flex flex-col items-center justify-center p-12 w-full";

  const sizeMap = {
    sm: {
      outer: 'w-8 h-8',
      middle: 'inset-1',
      inner: 'inset-2.5',
      dot: 'w-1 h-1'
    },
    md: {
      outer: 'w-14 h-14',
      middle: 'inset-1.5',
      inner: 'inset-4',
      dot: 'w-1.5 h-1.5'
    },
    lg: {
      outer: 'w-24 h-24',
      middle: 'inset-2',
      inner: 'inset-6',
      dot: 'w-1.5 h-1.5'
    }
  };

  const selectedSize = sizeMap[size] || sizeMap.lg;

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${selectedSize.outer} rounded-full border-t-2 border-r-2 border-lime-500/20 border-t-lime-500`}
        />
        
        {/* Middle Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className={`absolute ${selectedSize.middle} rounded-full border-b-2 border-l-2 border-lime-400/20 border-b-lime-400`}
        />

        {/* Inner Pulse */}
        <motion.div
          animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${selectedSize.inner} rounded-full bg-lime-500/10 blur-sm`}
        />

        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${selectedSize.dot} bg-lime-500 rounded-full shadow-[0_0_10px_#84cc16]`} />
        </div>
      </div>

    </div>
  );
};

export default Loader;
