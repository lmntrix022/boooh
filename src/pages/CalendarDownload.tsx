/**
 * Calendar Download Page
 * Generates and downloads an ICS file for an appointment
 * URL: /calendar/download?title=...&start=...&end=...&description=...
 */

import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, Calendar } from 'lucide-react';

const CalendarDownload = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const title = searchParams.get('title') || 'Rendez-vous';
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const description = searchParams.get('description') || '';

    if (!start || !end) {
      // Redirect to home if missing params
      navigate('/');
      return;
    }

    // Format date for ICS (YYYYMMDDTHHmmssZ)
    const formatICSDate = (dateStr: string): string => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    // Generate ICS content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Booh//Appointment//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${description.replace(/,/g, '\\,').replace(/\n/g, '\\n')}`,
      `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@booh.ga`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rendez-vous.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success message briefly then close/redirect
    setTimeout(() => {
      window.close();
      // If window.close() doesn't work (not opened by script), redirect
      navigate('/');
    }, 2000);
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
        <div className="mb-4 flex justify-center">
          <div className="p-4 bg-green-500/20 rounded-full">
            <Calendar className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Téléchargement en cours...
        </h1>
        <p className="text-gray-300 mb-4">
          Le fichier de calendrier va être téléchargé automatiquement.
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-white mx-auto" />
        <p className="text-sm text-gray-400 mt-4">
          Vous pouvez fermer cette page après le téléchargement.
        </p>
      </div>
    </div>
  );
};

export default CalendarDownload;







