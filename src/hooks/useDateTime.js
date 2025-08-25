"use client";
import { useState, useEffect } from 'react';

/**
 * DateTime Hook for Police Floor Map
 * Displays Indonesian date and time format
 */
const useDateTime = () => {
  const [dateTime, setDateTime] = useState({
    date: '',
    time: ''
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const dateOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      
      const timeOptions = {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };

      setDateTime({
        date: now.toLocaleDateString('id-ID', dateOptions),
        time: now.toLocaleTimeString('id-ID', timeOptions).replace(/\./g, ':')
      });
    };

    // Update immediately
    updateDateTime();

    // Update every second
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return dateTime;
};

export default useDateTime;