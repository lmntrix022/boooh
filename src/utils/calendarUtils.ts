/**
 * Utility functions for calendar integrations
 */

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Generate an iCalendar file content
 */
const generateICalEvent = (event: CalendarEvent): string => {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Booh Card//Calendar Integration//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
  ];

  if (event.location) {
    ical.push(`LOCATION:${event.location}`);
  }

  if (event.attendees && event.attendees.length > 0) {
    event.attendees.forEach(attendee => {
      ical.push(`ATTENDEE:mailto:${attendee}`);
    });
  }

  ical.push(
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return ical.join('\r\n');
};

/**
 * Generate a Google Calendar URL
 */
const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${formatDateForGoogle(event.startTime)}/${formatDateForGoogle(event.endTime)}`,
    ...(event.location && { location: event.location }),
    ...(event.attendees && { add: event.attendees.join(',') })
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate an Outlook Web Calendar URL
 */
const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  // Format dates for Outlook
  const startDate = event.startTime.toISOString();
  const endDate = event.endTime.toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: startDate,
    enddt: endDate,
    subject: event.title,
    body: event.description,
    location: event.location || '',
    allday: 'false'
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Format date for Google Calendar URL
 */
const formatDateForGoogle = (date: Date): string => {
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Download an iCalendar file
 */
const downloadICalFile = (event: CalendarEvent) => {
  const icalContent = generateICalEvent(event);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export {
  type CalendarEvent,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  downloadICalFile
};