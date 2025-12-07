import { useState, useEffect } from 'react';

interface Caregiver {
  id: string;
  name: string;
  color: string;
  skills: string[];
  availability: { [key: string]: boolean };
}

interface Client {
  id: string;
  name: string;
  address: string;
  requiredSkills: string[];
}

interface Visit {
  id: string;
  clientId: string;
  clientName: string;
  caregiverId: string | null;
  caregiverName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  tasks: string[];
  status: 'unassigned' | 'assigned' | 'confirmed';
}

interface TimeSlot {
  time: string;
  hour: number;
}

const DEMO_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg-1',
    name: 'Maria Garcia',
    color: '#3b82f6',
    skills: ['medication', 'mobility', 'meal-prep'],
    availability: { '2025-12-09': true, '2025-12-10': true, '2025-12-11': true },
  },
  {
    id: 'cg-2',
    name: 'James Wilson',
    color: '#10b981',
    skills: ['wound-care', 'mobility', 'bathing'],
    availability: { '2025-12-09': true, '2025-12-10': false, '2025-12-11': true },
  },
  {
    id: 'cg-3',
    name: 'Sarah Chen',
    color: '#f59e0b',
    skills: ['medication', 'meal-prep', 'transportation'],
    availability: { '2025-12-09': true, '2025-12-10': true, '2025-12-11': true },
  },
];

const DEMO_CLIENTS: Client[] = [
  {
    id: 'cl-1',
    name: 'Robert Johnson',
    address: '123 Oak St',
    requiredSkills: ['medication', 'mobility'],
  },
  {
    id: 'cl-2',
    name: 'Patricia Williams',
    address: '456 Maple Ave',
    requiredSkills: ['wound-care', 'bathing'],
  },
  {
    id: 'cl-3',
    name: 'Michael Davis',
    address: '789 Pine Rd',
    requiredSkills: ['meal-prep', 'medication'],
  },
];

const DEMO_VISITS: Visit[] = [
  {
    id: 'v-1',
    clientId: 'cl-1',
    clientName: 'Robert Johnson',
    caregiverId: 'cg-1',
    caregiverName: 'Maria Garcia',
    date: '2025-12-09',
    startTime: '09:00',
    endTime: '11:00',
    duration: 2,
    tasks: ['Medication assistance', 'Mobility support'],
    status: 'assigned',
  },
  {
    id: 'v-2',
    clientId: 'cl-2',
    clientName: 'Patricia Williams',
    caregiverId: null,
    caregiverName: null,
    date: '2025-12-09',
    startTime: '14:00',
    endTime: '16:00',
    duration: 2,
    tasks: ['Wound care', 'Bathing assistance'],
    status: 'unassigned',
  },
  {
    id: 'v-3',
    clientId: 'cl-3',
    clientName: 'Michael Davis',
    caregiverId: 'cg-3',
    caregiverName: 'Sarah Chen',
    date: '2025-12-10',
    startTime: '10:00',
    endTime: '12:00',
    duration: 2,
    tasks: ['Meal preparation', 'Medication assistance'],
    status: 'confirmed',
  },
];

const TIME_SLOTS: TimeSlot[] = Array.from({ length: 14 }, (_, i) => ({
  time: `${String(i + 7).padStart(2, '0')}:00`,
  hour: i + 7,
}));

export default function ScheduleBuilderPage() {
  const [selectedDate, setSelectedDate] = useState<string>('2025-12-09');
  const [visits, setVisits] = useState<Visit[]>(DEMO_VISITS);
  const [draggedVisit, setDraggedVisit] = useState<Visit | null>(null);
  const [unassignedVisits, setUnassignedVisits] = useState<Visit[]>([]);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('day');

  useEffect(() => {
    const unassigned = visits.filter(v => v.status === 'unassigned' && v.date === selectedDate);
    setUnassignedVisits(unassigned);
  }, [visits, selectedDate]);

  const handleDragStart = (visit: Visit) => {
    setDraggedVisit(visit);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (caregiverId: string, timeSlot: string) => {
    if (!draggedVisit) return;

    const [hours] = timeSlot.split(':').map(Number);
    const endHour = hours + draggedVisit.duration;
    const endTime = `${String(endHour).padStart(2, '0')}:00`;

    const updatedVisit: Visit = {
      ...draggedVisit,
      caregiverId,
      caregiverName: DEMO_CAREGIVERS.find(cg => cg.id === caregiverId)?.name || null,
      startTime: timeSlot,
      endTime,
      status: 'assigned',
    };

    setVisits(prev =>
      prev.map(v => (v.id === draggedVisit.id ? updatedVisit : v))
    );
    setDraggedVisit(null);
  };

  const handleUnassign = (visitId: string) => {
    setVisits(prev =>
      prev.map(v =>
        v.id === visitId
          ? { ...v, caregiverId: null, caregiverName: null, status: 'unassigned' as const }
          : v
      )
    );
  };

  const getVisitsForCaregiverAtTime = (caregiverId: string, hour: number) => {
    return visits.filter(v => {
      if (v.caregiverId !== caregiverId || v.date !== selectedDate) return false;
      const [startHour] = v.startTime.split(':').map(Number);
      const [endHour] = v.endTime.split(':').map(Number);
      return hour >= startHour && hour < endHour;
    });
  };

  const getCaregiverAvailability = (caregiverId: string) => {
    const caregiver = DEMO_CAREGIVERS.find(cg => cg.id === caregiverId);
    return caregiver?.availability[selectedDate] ?? false;
  };

  const getNextWeekDates = () => {
    const dates = [];
    const today = new Date('2025-12-09');
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const weekDates = getNextWeekDates();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Schedule Builder</h1>
          <p style={styles.subtitle}>
            Drag unassigned visits to caregiver time slots
          </p>
        </div>
        <div style={styles.headerControls}>
          <div style={styles.viewToggle}>
            <button
              style={{
                ...styles.viewButton,
                ...(viewMode === 'day' ? styles.viewButtonActive : {}),
              }}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              style={{
                ...styles.viewButton,
                ...(viewMode === 'week' ? styles.viewButtonActive : {}),
              }}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
          <select
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={styles.dateSelect}
          >
            {weekDates.map(date => (
              <option key={date} value={date}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.content}>
        {/* Unassigned visits sidebar */}
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>
            Unassigned Visits ({unassignedVisits.length})
          </h3>
          <div style={styles.unassignedList}>
            {unassignedVisits.length === 0 ? (
              <p style={styles.emptyMessage}>All visits assigned! 🎉</p>
            ) : (
              unassignedVisits.map(visit => (
                <div
                  key={visit.id}
                  draggable
                  onDragStart={() => handleDragStart(visit)}
                  style={styles.unassignedVisit}
                >
                  <div style={styles.visitHeader}>
                    <strong>{visit.clientName}</strong>
                    <span style={styles.visitTime}>
                      {visit.startTime} - {visit.endTime}
                    </span>
                  </div>
                  <div style={styles.visitTasks}>
                    {visit.tasks.map((task, idx) => (
                      <span key={idx} style={styles.taskBadge}>
                        {task}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={styles.calendarContainer}>
          <div style={styles.calendarGrid}>
            {/* Header row - caregivers */}
            <div style={styles.timeColumn}>
              <div style={styles.cornerCell}></div>
              {TIME_SLOTS.map(slot => (
                <div key={slot.time} style={styles.timeCell}>
                  {slot.time}
                </div>
              ))}
            </div>

            {DEMO_CAREGIVERS.map(caregiver => {
              const isAvailable = getCaregiverAvailability(caregiver.id);
              return (
                <div key={caregiver.id} style={styles.caregiverColumn}>
                  <div
                    style={{
                      ...styles.caregiverHeader,
                      borderLeft: `4px solid ${caregiver.color}`,
                      opacity: isAvailable ? 1 : 0.5,
                    }}
                  >
                    <strong>{caregiver.name}</strong>
                    {!isAvailable && (
                      <span style={styles.unavailableBadge}>Unavailable</span>
                    )}
                    <div style={styles.skillBadges}>
                      {caregiver.skills.map(skill => (
                        <span key={skill} style={styles.skillBadge}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {TIME_SLOTS.map(slot => {
                    const visitsAtTime = getVisitsForCaregiverAtTime(
                      caregiver.id,
                      slot.hour
                    );
                    const isOccupied = visitsAtTime.length > 0;
                    const visit = visitsAtTime[0];

                    return (
                      <div
                        key={slot.time}
                        style={{
                          ...styles.timeSlotCell,
                          backgroundColor: isOccupied
                            ? `${caregiver.color}20`
                            : isAvailable
                            ? '#ffffff'
                            : '#f9fafb',
                          cursor: isAvailable && !isOccupied ? 'pointer' : 'default',
                        }}
                        onDragOver={isAvailable && !isOccupied ? handleDragOver : undefined}
                        onDrop={
                          isAvailable && !isOccupied
                            ? () => handleDrop(caregiver.id, slot.time)
                            : undefined
                        }
                      >
                        {isOccupied && visit && slot.hour === parseInt(visit.startTime.split(':')[0]) && (
                          <div
                            style={{
                              ...styles.visitBlock,
                              backgroundColor: caregiver.color,
                              height: `${visit.duration * 60}px`,
                            }}
                          >
                            <div style={styles.visitBlockHeader}>
                              <strong>{visit.clientName}</strong>
                              <button
                                onClick={() => handleUnassign(visit.id)}
                                style={styles.unassignButton}
                                title="Unassign"
                              >
                                ✕
                              </button>
                            </div>
                            <div style={styles.visitBlockTime}>
                              {visit.startTime} - {visit.endTime}
                            </div>
                            {visit.status === 'confirmed' && (
                              <div style={styles.confirmedBadge}>✓ Confirmed</div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {visits.filter(v => v.date === selectedDate && v.status !== 'unassigned').length}
          </div>
          <div style={styles.statLabel}>Assigned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{unassignedVisits.length}</div>
          <div style={styles.statLabel}>Unassigned</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {visits.filter(v => v.date === selectedDate && v.status === 'confirmed').length}
          </div>
          <div style={styles.statLabel}>Confirmed</div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
  },
  headerControls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  viewToggle: {
    display: 'flex',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  viewButton: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  viewButtonActive: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  dateSelect: {
    padding: '8px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
  },
  content: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  sidebar: {
    width: '300px',
    flexShrink: 0,
  },
  sidebarTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
  },
  unassignedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyMessage: {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  unassignedVisit: {
    padding: '12px',
    border: '2px dashed #e5e7eb',
    borderRadius: '8px',
    cursor: 'grab',
    backgroundColor: 'white',
  },
  visitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  visitTime: {
    fontSize: '12px',
    color: '#6b7280',
  },
  visitTasks: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  taskBadge: {
    padding: '2px 8px',
    fontSize: '11px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    color: '#374151',
  },
  calendarContainer: {
    flex: 1,
    overflow: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
  },
  calendarGrid: {
    display: 'flex',
    minWidth: 'fit-content',
  },
  timeColumn: {
    width: '80px',
    flexShrink: 0,
  },
  cornerCell: {
    height: '120px',
    borderBottom: '1px solid #e5e7eb',
  },
  timeCell: {
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    color: '#6b7280',
    borderBottom: '1px solid #e5e7eb',
  },
  caregiverColumn: {
    minWidth: '200px',
    borderLeft: '1px solid #e5e7eb',
  },
  caregiverHeader: {
    height: '120px',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  unavailableBadge: {
    fontSize: '11px',
    color: '#ef4444',
    fontWeight: '500',
  },
  skillBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  skillBadge: {
    padding: '2px 6px',
    fontSize: '10px',
    backgroundColor: '#e0e7ff',
    color: '#4338ca',
    borderRadius: '4px',
  },
  timeSlotCell: {
    height: '60px',
    borderBottom: '1px solid #e5e7eb',
    position: 'relative',
  },
  visitBlock: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    right: '2px',
    borderRadius: '6px',
    padding: '8px',
    color: 'white',
    fontSize: '12px',
    overflow: 'hidden',
  },
  visitBlockHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  visitBlockTime: {
    fontSize: '11px',
    opacity: 0.9,
  },
  unassignButton: {
    background: 'rgba(255, 255, 255, 0.3)',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    padding: '2px 6px',
    fontSize: '12px',
  },
  confirmedBadge: {
    marginTop: '4px',
    padding: '2px 6px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
  },
  stats: {
    display: 'flex',
    gap: '16px',
  },
  statCard: {
    flex: 1,
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
};
