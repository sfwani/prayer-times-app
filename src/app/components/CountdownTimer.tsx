'use client';

import React, { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

interface CountdownTimerProps {
  targetTime: string;
  prayerName: string;
  arabicPrayerName: string;
  timezone: string;
}

export default function CountdownTimer({ targetTime, prayerName, arabicPrayerName, timezone }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const currentTimeInZone = formatInTimeZone(now, timezone, 'HH:mm');
      
      // Parse target and current time into minutes
      const [targetHours, targetMinutes] = targetTime.split(':').map(Number);
      const [currentHours, currentMinutes] = currentTimeInZone.split(':').map(Number);
      
      let targetTotalMinutes = targetHours * 60 + targetMinutes;
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      
      // If target is earlier than current time, add 24 hours
      if (targetTotalMinutes <= currentTotalMinutes) {
        targetTotalMinutes += 24 * 60;
      }
      
      // Calculate difference
      const diffMinutes = targetTotalMinutes - currentTotalMinutes;
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      const seconds = 59 - now.getSeconds();
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetTime, timezone]);

  // Convert 24h time to 12h format
  const [hours, minutes] = targetTime.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

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
          <div className="relative -top-[5px] text-xs text-gray-500/60 font-[300] tracking-[0.05em] uppercase mb-3">at</div>
          <div className="text-2xl tracking-[0.02em] text-[#9AB17D] font-[400]">
            {formattedTime}
          </div>
        </div>
      </div>
    </div>
  );
} 