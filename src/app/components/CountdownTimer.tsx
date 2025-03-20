'use client';

import React, { useState, useEffect } from 'react';
import { differenceInSeconds, parse, format } from 'date-fns';

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

  // Convert 24h time to 12h format
  const formattedTime = format(parse(targetTime, 'HH:mm', new Date()), 'h:mm a');

  return (
    <div className="text-center bg-[#2D333B] rounded-lg p-8">
      <div className="space-y-6">
        <div>
          <span className="text-2xl text-gray-400 tracking-wider font-light capitalize">{prayerName} in</span>
        </div>
        <div className="font-mono text-5xl tracking-wider text-[#9AB17D] font-light">
          {timeLeft}
        </div>
        <div className="text-sm text-gray-500 tracking-wide font-light">
          at {formattedTime}
        </div>
      </div>
    </div>
  );
} 