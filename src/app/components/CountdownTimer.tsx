'use client';

import React, { useState, useEffect } from 'react';
import { differenceInSeconds, parse } from 'date-fns';

interface CountdownTimerProps {
  targetTime: string;
  prayerName: string;
}

export default function CountdownTimer({ targetTime, prayerName }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = parse(targetTime, 'HH:mm', now);
      
      // If target is in the past, add 24 hours
      if (target < now) {
        target.setDate(target.getDate() + 1);
      }
      
      const diffInSeconds = differenceInSeconds(target, now);
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="text-center bg-[#2D333B] rounded-lg p-4 mb-4">
      <p className="text-gray-400 mb-2">Time until {prayerName}</p>
      <div className="text-2xl font-mono text-white">{timeLeft}</div>
    </div>
  );
} 