import React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  format,
  isBefore,
  Locale,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

interface CustomCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  minDate?: Date;
  locale?: Locale;
}

const daysShort = ["lu", "ma", "me", "je", "ve", "sa", "di"];

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selected,
  onSelect,
  minDate,
  locale = fr,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected ? startOfMonth(selected) : startOfMonth(new Date())
  );

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-2">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="px-2 py-1 rounded hover:bg-gray-100"
        aria-label="Mois précédent"
      >
        &lt;
      </button>
      <span className="font-medium">
        {format(currentMonth, "LLLL yyyy", { locale })}
      </span>
      <button
        type="button"
        onClick={handleNextMonth}
        className="px-2 py-1 rounded hover:bg-gray-100"
        aria-label="Mois suivant"
      >
        &gt;
      </button>
    </div>
  );

  const renderDays = () => (
    <div className="grid grid-cols-7 mb-1 text-center font-semibold">
      {daysShort.map((day) => (
        <div key={day}>{day}</div>
      ))}
    </div>
  );

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    // Semaine commence lundi (weekStartsOn: 1)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const isDisabled =
          isBefore(day, startOfDay(new Date())) || !isSameMonth(day, monthStart);

        // FIX: Créer une copie de la date pour éviter les mutations
        const currentDay = new Date(day);

        days.push(
          <button
            type="button"
            key={day.toISOString()}
            className={`w-9 h-9 rounded-full mx-auto mb-1 text-sm transition
              ${isSameDay(day, selected ?? new Date()) ? "bg-blue-600 text-white" : "bg-white text-gray-800"}
              ${isDisabled ? "opacity-30 cursor-not-allowed" : "hover:bg-blue-100"}
            `}
            onClick={() => !isDisabled && onSelect && onSelect(currentDay)}
            disabled={isDisabled}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-fit">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}; 