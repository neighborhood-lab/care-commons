import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import moment from 'moment';

export interface MiniCalendarProps {
  currentDate: Date;
  daysWithVisits: Set<string>;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDate,
  daysWithVisits,
  onDateSelect,
  onMonthChange,
}) => {
  const currentMoment = moment(currentDate);
  
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMoment.clone().startOf('month');
    const endOfMonth = currentMoment.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');
    
    const days: Array<{ date: moment.Moment; isCurrentMonth: boolean; hasVisits: boolean; isToday: boolean; isSelected: boolean }> = [];
    const current = startDate.clone();
    
    while (current.isSameOrBefore(endDate)) {
      const dateKey = current.format('YYYY-MM-DD');
      days.push({
        date: current.clone(),
        isCurrentMonth: current.month() === currentMoment.month(),
        hasVisits: daysWithVisits.has(dateKey),
        isToday: current.isSame(moment(), 'day'),
        isSelected: current.isSame(currentMoment, 'day'),
      });
      current.add(1, 'day');
    }
    
    return days;
  }, [currentMoment, daysWithVisits]);

  const handlePrevMonth = () => {
    const prev = currentMoment.clone().subtract(1, 'month');
    onMonthChange(prev.toDate());
  };

  const handleNextMonth = () => {
    const next = currentMoment.clone().add(1, 'month');
    onMonthChange(next.toDate());
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {currentMoment.format('MMMM YYYY')}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-xs font-medium text-gray-500 text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayClasses = [
            'h-8 w-8 flex items-center justify-center text-xs rounded-full cursor-pointer transition-colors relative',
          ];

          if (!day.isCurrentMonth) {
            dayClasses.push('text-gray-300');
          } else if (day.isSelected) {
            dayClasses.push('bg-primary-600 text-white font-semibold');
          } else if (day.isToday) {
            dayClasses.push('bg-primary-100 text-primary-700 font-semibold');
          } else {
            dayClasses.push('text-gray-700 hover:bg-gray-100');
          }

          return (
            <div key={index} className="relative">
              <button
                onClick={() => onDateSelect(day.date.toDate())}
                className={dayClasses.join(' ')}
                disabled={!day.isCurrentMonth}
              >
                {day.date.format('D')}
              </button>
              {day.hasVisits && day.isCurrentMonth && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-1 bg-primary-600 rounded-full"></div>
          <span>Has scheduled visits</span>
        </div>
      </div>
    </div>
  );
};
