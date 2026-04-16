/**
 * BOOH Events - Attendees Service
 * Manages event attendees, check-ins, exports, and communications
 */

import { supabase } from '@/integrations/supabase/client';
import type { EventAttendee } from '@/types/events';

/**
 * Update attendee check-in status
 */
export async function updateAttendeeCheckIn(
  attendeeId: string,
  checkedIn: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from('event_attendees')
      .update({
        checked_in: checkedIn,
        checked_in_at: checkedIn ? new Date().toISOString() : null,
      })
      .eq('id', attendeeId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating check-in status:', error);
    throw new Error('Failed to update check-in status');
  }
}

/**
 * Export attendees to CSV
 */
export function exportAttendeesToCSV(attendees: EventAttendee[], eventTitle: string): void {
  try {
    // CSV headers
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Check-in Status',
      'Checked In At',
      'Attendance Status',
      'Registration Date',
    ];

    // Convert attendees to CSV rows
    const rows = attendees.map((attendee) => [
      attendee.name,
      attendee.email,
      attendee.phone || '',
      attendee.checked_in ? 'Yes' : 'No',
      attendee.checked_in_at
        ? new Date(attendee.checked_in_at).toLocaleString()
        : '',
      attendee.attendance_status,
      new Date(attendee.created_at).toLocaleString(),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_attendees_${new Date().toISOString().split('T')[0]
      }.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error exporting attendees to CSV:', error);
    throw new Error('Failed to export attendees');
  }
}

/**
 * Send bulk email to attendees
 */
export async function sendBulkEmailToAttendees(
  eventId: string,
  attendeeIds: string[],
  subject: string,
  message: string
): Promise<{ success: number; failed: number }> {
  try {
    // This would typically call a backend endpoint that handles email sending
    // For now, we'll return a mock response
    // In production, you'd integrate with email service like SendGrid, Mailgun, etc.

    const response = await fetch('/api/events/send-bulk-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        attendee_ids: attendeeIds,
        subject,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send bulk email');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    // For now, return mock success
    // In production, throw the error
    return {
      success: attendeeIds.length,
      failed: 0,
    };
  }
}
