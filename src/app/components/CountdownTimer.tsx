'use client';

import React, { useState, useEffect } from 'react';
import { differenceInSeconds, parse, format } from 'date-fns';

interface CountdownTimerProps {
  targetTime: string;
  prayerName: string;
  arabicPrayerName: string;
}

export default function CountdownTimer({ targetTime, prayerName, arabicPrayerName }: CountdownTimerProps) {
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
    <div className="text-center bg-[#2D333B] rounded-lg p-6">
      <div className="space-y-5">
        <div>
          <div className="text-xs text-gray-500/60 font-[300] tracking-[0.05em] uppercase mb-2">next prayer</div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl text-[#9AB17D] tracking-[0.05em] font-[400]">{prayerName}</span>
            <span className="text-sm text-gray-500 tracking-[0.02em] font-[300] opacity-60">•</span>
            <span className="text-2xl text-[#9AB17D] tracking-[0.05em] font-arabic">{arabicPrayerName}</span>
          </div>
        </div>
        
        <div>
          <div className="relative -top-[5px] text-xs text-gray-500/60 font-[300] tracking-[0.05em] uppercase mb-3">in</div>
          <div className="text-6xl tracking-[0.02em] text-[#9AB17D] font-[500]">
            {timeLeft}
          </div>
        </div>

        <div>
          <div className="relative -top-[4px] text-xs text-gray-500/60 font-[300] tracking-[0.05em] uppercase mb-3">at</div>
          <div className="text-2xl tracking-[0.02em] text-[#9AB17D] font-[400]">
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
} 