/**
 * Visit Monitoring Dashboard
 *
 * Real-time dashboard for care coordinators to monitor active visits,
 * track caregiver locations, verify EVV compliance, and respond to issues.
 *
 * Features:
 * - Live visit status updates
 * - GPS location tracking
 * - Late arrival alerts
 * - Task completion monitoring
 * - Quick actions (call, message, modify schedule)
 */

import { useState, useEffect } from 'react';

interface Visit {
  id: string;
  caregiverId: string;
  caregiverName: string;
  caregiverPhone: string;
  clientId: string;
  clientName: string;
  clientAddress: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualClockIn?: string;
  actualClockOut?: string;
  location?: { lat: number; lng: number };
  distanceFromClient?: number; // meters
  tasksCompleted: number;
  tasksTotal: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'late' | 'issue';
  alerts: Alert[];
  notes?: string;
}

interface Alert {
  type: 'late-clock-in' | 'missing-clock-out' | 'location-issue' | 'incomplete-tasks' | 'incident';
  message: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: string;
}

// Demo data for development
const DEMO_VISITS: Visit[] = [
  {
    id: '1',
    caregiverId: 'cg1',
    caregiverName: 'Maria Garcia',
    caregiverPhone: '512-555-0101',
    clientId: 'cl1',
    clientName: 'Robert Johnson',
    clientAddress: '123 Main St, Austin, TX 78701',
    scheduledStart: '9:00 AM',
    scheduledEnd: '1:00 PM',
    actualClockIn: '9:03 AM',
    location: { lat: 30.2672, lng: -97.7431 },
    distanceFromClient: 45,
    tasksCompleted: 3,
    tasksTotal: 7,
    status: 'in-progress',
    alerts: [],
  },
  {
    id: '2',
    caregiverId: 'cg2',
    caregiverName: 'John Smith',
    caregiverPhone: '512-555-0102',
    clientId: 'cl2',
    clientName: 'Susan Williams',
    clientAddress: '456 Oak Ave, Austin, TX 78702',
    scheduledStart: '9:15 AM',
    scheduledEnd: '10:15 AM',
    actualClockIn: '9:35 AM',
    location: { lat: 30.2711, lng: -97.7437 },
    distanceFromClient: 120,
    tasksCompleted: 0,
    tasksTotal: 4,
    status: 'late',
    alerts: [
      {
        type: 'late-clock-in',
        message: 'Clocked in 20 minutes late',
        severity: 'warning',
        timestamp: '9:35 AM',
      },
      {
        type: 'location-issue',
        message: 'Location 120m from client address (>100m threshold)',
        severity: 'warning',
        timestamp: '9:35 AM',
      },
    ],
  },
  {
    id: '3',
    caregiverId: 'cg3',
    caregiverName: 'Lisa Chen',
    caregiverPhone: '512-555-0103',
    clientId: 'cl3',
    clientName: 'James Brown',
    clientAddress: '789 Elm Dr, Austin, TX 78703',
    scheduledStart: '2:00 PM',
    scheduledEnd: '6:00 PM',
    tasksCompleted: 0,
    tasksTotal: 5,
    status: 'scheduled',
    alerts: [],
  },
  {
    id: '4',
    caregiverId: 'cg1',
    caregiverName: 'Maria Garcia',
    caregiverPhone: '512-555-0101',
    clientId: 'cl4',
    clientName: 'Dorothy Miller',
    clientAddress: '321 Pine Rd, Austin, TX 78704',
    scheduledStart: '2:00 PM',
    scheduledEnd: '4:00 PM',
    tasksCompleted: 0,
    tasksTotal: 6,
    status: 'scheduled',
    alerts: [],
  },
];

export default function VisitMonitoringPage() {
  const [visits, setVisits] = useState<Visit[]>(DEMO_VISITS);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'late' | 'scheduled' | 'issue'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // TODO: Replace with actual API call and WebSocket connection for real-time updates
  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setVisits(prevVisits =>
        prevVisits.map(visit => {
          // Simulate task completion progress
          if (visit.status === 'in-progress' && visit.tasksCompleted < visit.tasksTotal) {
            return {
              ...visit,
              tasksCompleted: Math.min(visit.tasksCompleted + Math.random() > 0.7 ? 1 : 0, visit.tasksTotal),
            };
          }
          return visit;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredVisits = visits.filter(visit => {
    // Apply status filter
    if (filter !== 'all' && visit.status !== filter) return false;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        visit.caregiverName.toLowerCase().includes(term) ||
        visit.clientName.toLowerCase().includes(term) ||
        visit.clientAddress.toLowerCase().includes(term)
      );
    }

    return true;
  });

  const stats = {
    total: visits.length,
    inProgress: visits.filter(v => v.status === 'in-progress').length,
    late: visits.filter(v => v.status === 'late').length,
    scheduled: visits.filter(v => v.status === 'scheduled').length,
    issues: visits.filter(v => v.alerts.length > 0).length,
  };

  const getStatusColor = (status: Visit['status']) => {
    switch (status) {
      case 'in-progress': return '#4CAF50';
      case 'late': return '#FF9800';
      case 'issue': return '#E53935';
      case 'completed': return '#2196F3';
      case 'scheduled': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: Visit['status']) => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'late': return 'Late';
      case 'issue': return 'Issue';
      case 'completed': return 'Completed';
      case 'scheduled': return 'Scheduled';
      default: return status;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Visit Monitoring Dashboard</h1>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search caregivers, clients, addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button style={styles.refreshButton}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, borderLeftColor: '#2196F3'}}>
          <div style={styles.statValue}>{stats.total}</div>
          <div style={styles.statLabel}>Total Visits Today</div>
        </div>
        <div style={{...styles.statCard, borderLeftColor: '#4CAF50'}}>
          <div style={styles.statValue}>{stats.inProgress}</div>
          <div style={styles.statLabel}>In Progress</div>
        </div>
        <div style={{...styles.statCard, borderLeftColor: '#FF9800'}}>
          <div style={styles.statValue}>{stats.late}</div>
          <div style={styles.statLabel}>Late</div>
        </div>
        <div style={{...styles.statCard, borderLeftColor: '#E53935'}}>
          <div style={styles.statValue}>{stats.issues}</div>
          <div style={styles.statLabel}>Issues</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        {(['all', 'in-progress', 'late', 'scheduled', 'issue'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterButton,
              ...(filter === f ? styles.filterButtonActive : {}),
            }}
          >
            {f === 'all' ? 'All' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Visit List */}
      <div style={styles.visitList}>
        {filteredVisits.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No visits found matching your filters.</p>
          </div>
        ) : (
          filteredVisits.map(visit => (
            <div
              key={visit.id}
              style={styles.visitCard}
              onClick={() => setSelectedVisit(visit)}
            >
              {/* Visit Header */}
              <div style={styles.visitHeader}>
                <div style={styles.visitHeaderLeft}>
                  <div style={styles.caregiverName}>{visit.caregiverName}</div>
                  <div style={styles.arrow}>→</div>
                  <div style={styles.clientName}>{visit.clientName}</div>
                </div>
                <div style={styles.visitHeaderRight}>
                  <div style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(visit.status),
                  }}>
                    {getStatusLabel(visit.status)}
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div style={styles.visitDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>⏰ Scheduled:</span>
                  <span style={styles.detailValue}>{visit.scheduledStart} - {visit.scheduledEnd}</span>
                </div>
                {visit.actualClockIn && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>✓ Clocked In:</span>
                    <span style={styles.detailValue}>{visit.actualClockIn}</span>
                  </div>
                )}
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>📍 Location:</span>
                  <span style={styles.detailValue}>{visit.clientAddress}</span>
                </div>
                {visit.distanceFromClient !== undefined && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>📏 Distance:</span>
                    <span style={{
                      ...styles.detailValue,
                      color: visit.distanceFromClient > 100 ? '#E53935' : '#4CAF50',
                      fontWeight: 'bold',
                    }}>
                      {visit.distanceFromClient}m from client
                      {visit.distanceFromClient > 100 && ' ⚠️'}
                    </span>
                  </div>
                )}
              </div>

              {/* Task Progress */}
              <div style={styles.taskProgress}>
                <div style={styles.taskProgressLabel}>
                  Tasks: {visit.tasksCompleted}/{visit.tasksTotal}
                </div>
                <div style={styles.taskProgressBar}>
                  <div style={{
                    ...styles.taskProgressFill,
                    width: `${(visit.tasksCompleted / visit.tasksTotal) * 100}%`,
                  }} />
                </div>
              </div>

              {/* Alerts */}
              {visit.alerts.length > 0 && (
                <div style={styles.alerts}>
                  {visit.alerts.map((alert, idx) => (
                    <div key={idx} style={{
                      ...styles.alert,
                      borderLeftColor: alert.severity === 'error' ? '#E53935' : '#FF9800',
                    }}>
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div style={styles.quickActions}>
                <button style={styles.actionButton} onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${visit.caregiverPhone}`;
                }}>
                  📞 Call Caregiver
                </button>
                <button style={styles.actionButton} onClick={(e) => {
                  e.stopPropagation();
                  alert('View full details');
                }}>
                  📋 Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Visit Modal (simplified for now) */}
      {selectedVisit && (
        <div style={styles.modal} onClick={() => setSelectedVisit(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Visit Details</h2>
              <button style={styles.modalClose} onClick={() => setSelectedVisit(null)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p><strong>Caregiver:</strong> {selectedVisit.caregiverName}</p>
              <p><strong>Client:</strong> {selectedVisit.clientName}</p>
              <p><strong>Address:</strong> {selectedVisit.clientAddress}</p>
              <p><strong>Scheduled:</strong> {selectedVisit.scheduledStart} - {selectedVisit.scheduledEnd}</p>
              {selectedVisit.actualClockIn && (
                <p><strong>Clocked In:</strong> {selectedVisit.actualClockIn}</p>
              )}
              <p><strong>Tasks:</strong> {selectedVisit.tasksCompleted}/{selectedVisit.tasksTotal} completed</p>
              {selectedVisit.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p>{selectedVisit.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
  },
  searchInput: {
    padding: '10px 16px',
    fontSize: '14px',
    border: '1px solid #DDD',
    borderRadius: '8px',
    width: '300px',
  },
  refreshButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '4px',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#666',
    border: '1px solid #DDD',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
    color: '#fff',
    borderColor: '#2196F3',
  },
  visitList: {
    display: 'grid',
    gap: '16px',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center' as const,
    color: '#999',
  },
  visitCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s',
    ':hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
  },
  visitHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  visitHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  caregiverName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  arrow: {
    color: '#999',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#2196F3',
  },
  visitHeaderRight: {},
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  visitDetails: {
    marginBottom: '16px',
  },
  detailRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#666',
    minWidth: '120px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#333',
  },
  taskProgress: {
    marginBottom: '16px',
  },
  taskProgressLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  taskProgressBar: {
    height: '8px',
    backgroundColor: '#E0E0E0',
    borderRadius: '4px',
    overflow: 'hidden' as const,
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s',
  },
  alerts: {
    marginBottom: '16px',
  },
  alert: {
    padding: '12px',
    backgroundColor: '#FFF9C4',
    borderLeft: '4px solid',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  quickActions: {
    display: 'flex',
    gap: '12px',
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #DDD',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  modal: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto' as const,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #E0E0E0',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
  },
  modalBody: {
    padding: '20px',
  },
};
