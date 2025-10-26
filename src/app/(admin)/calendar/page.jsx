"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui components are available

// Helper function to get the number of days in a month
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Helper function to get the first day of the month (0=Sun, 1=Mon, ...)
const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const statusColors = {
  READY: 'bg-green-500',
  BOOKED: 'bg-yellow-500',
  ON_TRIP: 'bg-red-500',
  MAINTENANCE: 'bg-gray-500',
};

export default function CalendarPage() {
  const [armadas, setArmadas] = useState([]);
  const [transactions, setTransactions] = useState([]); // Will be empty for now
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  async function fetchData() {
    // Fetch armadas
    const armadaRes = await fetch('/api/armada');
    const armadaData = await armadaRes.json();
    setArmadas(armadaData);

    // In the future, fetch transactions for the current month view
    // const transactionRes = await fetch(`/api/transactions?year=${year}&month=${month + 1}`);
    // const transactionData = await transactionRes.json();
    // setTransactions(transactionData);
  }

  useEffect(() => {
    fetchData();
  }, [currentDate]); // Refetch when month changes

  const getStatusForCell = (armada, day) => {
    // This logic will be expanded when transactions are available
    if (armada.status === 'MAINTENANCE') {
        return 'MAINTENANCE';
    }

    // Placeholder logic until Module 2 is ready
    // Check for transactions that overlap with this day
    // For now, default to READY
    return 'READY';
  };

  const renderCalendarGrid = () => {
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);

    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: numDays }, (_, i) => i + 1);

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-1">
        {/* Render day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-center p-2 border-b">{day}</div>
        ))}
        {/* Render blank cells for alignment */}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="border-r border-b"></div>)}
        {/* Render day cells */}
        {days.map(day => (
          <div key={day} className="p-2 border-r border-b">
            <div className="font-bold">{day}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderArmadaRows = () => {
    const numDays = daysInMonth(year, month);
    const days = Array.from({ length: numDays }, (_, i) => i + 1);
    const gridCols = `grid-cols-[150px_repeat(${numDays},_minmax(0,_1fr))]`;

    return armadas.map(armada => (
      <div key={armada.id} className={`grid ${gridCols}`}>
        <div className="font-bold p-2 border-b border-r truncate" title={armada.license_plate}>{armada.license_plate}</div>
        {days.map(day => {
          const status = getStatusForCell(armada, day);
          const color = statusColors[status] || 'bg-gray-200';
          return <div key={day} className={`h-full w-full ${color} border-r border-b`} title={status}></div>
        })}
      </div>
    ));
  };

  const numDays = daysInMonth(year, month);
  const headerGridCols = `grid-cols-[150px_repeat(${numDays},_minmax(0,_1fr))]`;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Kalender Ketersediaan</h1>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>Previous</Button>
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <Button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>Next</Button>
      </div>

      {/* Calendar View */}
       <div className="overflow-x-auto border">
          {/* Header */}
          <div className={`grid ${headerGridCols} sticky top-0 bg-white z-10`}>
              <div className="font-bold p-2 border-b border-r">Plat Mobil</div>
              {Array.from({ length: numDays }, (_, i) => i + 1).map(day => (
                  <div key={day} className="font-bold text-center p-2 border-b border-r">{day}</div>
              ))}
          </div>
          {/* Body */}
          <div className="min-w-full">
             {renderArmadaRows()}
          </div>
       </div>
    </div>
  );
}
