'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notificationService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const NotificationBadge = ({ className = "", showCount = true, size = "md" }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const sizeClasses = {
    sm: { icon: "w-4 h-4", badge: "min-w-[14px] h-[14px] text-[8px]" },
    md: { icon: "w-5 h-5", badge: "min-w-[18px] h-[18px] text-[10px]" },
    lg: { icon: "w-6 h-6", badge: "min-w-[20px] h-[20px] text-xs" }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchUnreadCount = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unreadCount ?? 0);
    } catch (error) {
      console.error('NotificationBadge Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <Link href="/notifications" className={`relative ${className}`}>
      <svg className={`${currentSize.icon} text-gray-400 hover:text-lime-400 transition-colors duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className={`absolute -top-1 -right-1 ${currentSize.badge} bg-red-500 text-white rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse`}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBadge;
