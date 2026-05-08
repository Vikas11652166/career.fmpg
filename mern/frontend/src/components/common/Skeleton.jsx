import React from 'react';

const Skeleton = ({ className }) => {
  return (
    <div className={`animate-pulse bg-gray-700/50 rounded ${className}`}></div>
  );
};

export const JobSkeleton = () => {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden mb-4 p-5">
      <div className="flex gap-5">
        <Skeleton className="h-20 w-20 hidden sm:block rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-7 w-2/3 mb-3" />
          <div className="flex gap-3 mb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="hidden md:block">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
