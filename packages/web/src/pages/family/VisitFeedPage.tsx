/**
 * Family Portal - Visit Feed
 *
 * Real-time feed showing visit updates for family members.
 * Provides transparency and peace of mind by showing:
 * - Visit status (scheduled, in-progress, completed)
 * - Photos uploaded by caregivers during visits
 * - Visit notes and caregiver observations
 * - Tasks completed
 * - Caregiver details and contact info
 */

import { useState, useEffect } from 'react';

interface VisitUpdate {
  id: string;
  visitId: string;
  clientName: string;
  caregiverName: string;
  caregiverPhoto?: string;
  timestamp: string;
  status: 'scheduled' | 'started' | 'in-progress' | 'completed';
  type: 'status' | 'photo' | 'note' | 'task-completed';
  content?: string;
  photoUrl?: string;
  taskName?: string;
  scheduledTime?: string;
}

// Demo data
const DEMO_UPDATES: VisitUpdate[] = [
  {
    id: '1',
    visitId: 'v1',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: '2 hours ago',
    status: 'completed',
    type: 'status',
    content: 'Visit completed successfully',
  },
  {
    id: '2',
    visitId: 'v1',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: '2 hours ago',
    status: 'completed',
    type: 'note',
    content: 'Your mom had a great day today! We enjoyed lunch together and she was in good spirits. Blood pressure was normal (118/76). She completed all her exercises and we had a nice walk around the garden.',
  },
  {
    id: '3',
    visitId: 'v1',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: '3 hours ago',
    status: 'in-progress',
    type: 'photo',
    content: 'Meal prepared - chicken salad with fresh vegetables',
    photoUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    visitId: 'v1',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: '3 hours ago',
    status: 'in-progress',
    type: 'task-completed',
    taskName: 'Medication reminder - 2PM medications taken',
  },
  {
    id: '5',
    visitId: 'v1',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: '4 hours ago',
    status: 'started',
    type: 'status',
    content: 'Maria has arrived and clocked in',
  },
  {
    id: '6',
    visitId: 'v2',
    clientName: 'Mom',
    caregiverName: 'Maria Garcia',
    timestamp: 'Tomorrow 2:00 PM',
    status: 'scheduled',
    type: 'status',
    content: 'Next visit scheduled',
    scheduledTime: 'Tomorrow 2:00 PM - 4:00 PM',
  },
];

export default function VisitFeedPage() {
  const [updates, setUpdates] = useState<VisitUpdate[]>(DEMO_UPDATES);
  const [filter, setFilter] = useState<'all' | 'today' | 'this-week'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // TODO: Replace with actual API call and WebSocket for real-time updates
  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // In production, this would be a WebSocket listener
      console.log('Checking for new updates...');
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: VisitUpdate['status']) => {
    switch (status) {
      case 'scheduled': return '📅';
      case 'started': return '👋';
      case 'in-progress': return '⏳';
      case 'completed': return '✅';
      default: return '📝';
    }
  };

  const getStatusColor = (status: VisitUpdate['status']) => {
    switch (status) {
      case 'scheduled': return '#9E9E9E';
      case 'started': return '#2196F3';
      case 'in-progress': return '#FF9800';
      case 'completed': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getTypeLabel = (type: VisitUpdate['type']) => {
    switch (type) {
      case 'status': return 'Status Update';
      case 'photo': return 'Photo';
      case 'note': return 'Note';
      case 'task-completed': return 'Task Completed';
      default: return 'Update';
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Visit Updates</h1>
          <p style={styles.subtitle}>Stay connected with your loved one's care</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshButton}>🔄 Refresh</button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsBar}>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>✅</span>
          <div>
            <div style={styles.statValue}>1</div>
            <div style={styles.statLabel}>Completed Today</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>📅</span>
          <div>
            <div style={styles.statValue}>1</div>
            <div style={styles.statLabel}>Scheduled</div>
          </div>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statIcon}>📸</span>
          <div>
            <div style={styles.statValue}>3</div>
            <div style={styles.statLabel}>Photos This Week</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        {(['all', 'today', 'this-week'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterButton,
              ...(filter === f ? styles.filterButtonActive : {}),
            }}
          >
            {f === 'all' ? 'All Updates' : f === 'today' ? 'Today' : 'This Week'}
          </button>
        ))}
      </div>

      {/* Updates Feed */}
      <div style={styles.feed}>
        {updates.map(update => (
          <div key={update.id} style={styles.updateCard}>
            {/* Update Header */}
            <div style={styles.updateHeader}>
              <div style={styles.updateHeaderLeft}>
                <div style={styles.caregiverAvatar}>
                  {update.caregiverPhoto ? (
                    <img src={update.caregiverPhoto} alt={update.caregiverName} style={styles.avatarImage} />
                  ) : (
                    <div style={styles.avatarPlaceholder}>
                      {update.caregiverName.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div>
                  <div style={styles.caregiverName}>{update.caregiverName}</div>
                  <div style={styles.updateTime}>{update.timestamp}</div>
                </div>
              </div>
              <div style={styles.updateHeaderRight}>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(update.status),
                }}>
                  {getStatusIcon(update.status)} {getTypeLabel(update.type)}
                </div>
              </div>
            </div>

            {/* Update Content */}
            <div style={styles.updateContent}>
              {/* Photo Update */}
              {update.type === 'photo' && update.photoUrl && (
                <div>
                  <img
                    src={update.photoUrl}
                    alt={update.content}
                    style={styles.updatePhoto}
                    onClick={() => setSelectedPhoto(update.photoUrl!)}
                  />
                  {update.content && (
                    <p style={styles.photoCaption}>{update.content}</p>
                  )}
                </div>
              )}

              {/* Note Update */}
              {update.type === 'note' && update.content && (
                <div style={styles.noteContent}>
                  <div style={styles.noteIcon}>📝</div>
                  <p style={styles.noteText}>{update.content}</p>
                </div>
              )}

              {/* Task Completed */}
              {update.type === 'task-completed' && update.taskName && (
                <div style={styles.taskContent}>
                  <span style={styles.taskIcon}>✓</span>
                  <span style={styles.taskText}>{update.taskName}</span>
                </div>
              )}

              {/* Status Update */}
              {update.type === 'status' && (
                <div style={styles.statusContent}>
                  <p style={styles.statusText}>{update.content}</p>
                  {update.scheduledTime && (
                    <p style={styles.scheduledTime}>⏰ {update.scheduledTime}</p>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={styles.updateActions}>
              <button style={styles.actionButton}>💬 Send Message</button>
              <button style={styles.actionButton}>📞 Call Caregiver</button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {updates.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <h3 style={styles.emptyTitle}>No updates yet</h3>
          <p style={styles.emptyText}>
            Visit updates will appear here as caregivers complete tasks and add notes.
          </p>
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div style={styles.lightbox} onClick={() => setSelectedPhoto(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.lightboxClose} onClick={() => setSelectedPhoto(null)}>✕</button>
            <img src={selectedPhoto} alt="Visit photo" style={styles.lightboxImage} />
          </div>
        </div>
      )}

      {/* Help Card */}
      <div style={styles.helpCard}>
        <h3 style={styles.helpTitle}>💡 About Visit Updates</h3>
        <p style={styles.helpText}>
          Your caregiver will post updates throughout each visit. You'll see photos of meals, activities,
          and care provided, along with notes about how your loved one is doing. All updates include timestamps
          and are verified by GPS to ensure quality care.
        </p>
        <p style={styles.helpText}>
          <strong>Real-time notifications:</strong> Enable browser notifications to get instant alerts when
          new updates are posted.
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
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
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '32px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
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
  feed: {
    display: 'grid',
    gap: '16px',
    marginBottom: '24px',
  },
  updateCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  updateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  updateHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  caregiverAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    overflow: 'hidden' as const,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2196F3',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  caregiverName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  },
  updateTime: {
    fontSize: '14px',
    color: '#999',
  },
  updateHeaderRight: {},
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  updateContent: {
    marginBottom: '16px',
  },
  updatePhoto: {
    width: '100%',
    maxHeight: '400px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '8px',
  },
  photoCaption: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic' as const,
  },
  noteContent: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#F5F5F5',
    borderRadius: '8px',
    borderLeft: '4px solid #2196F3',
  },
  noteIcon: {
    fontSize: '24px',
  },
  noteText: {
    fontSize: '15px',
    color: '#333',
    lineHeight: '1.6',
    margin: 0,
  },
  taskContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#E8F5E9',
    borderRadius: '8px',
  },
  taskIcon: {
    fontSize: '20px',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  taskText: {
    fontSize: '15px',
    color: '#333',
  },
  statusContent: {
    padding: '12px',
    backgroundColor: '#F5F5F5',
    borderRadius: '8px',
  },
  statusText: {
    fontSize: '15px',
    color: '#333',
    margin: '0 0 8px 0',
  },
  scheduledTime: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  updateActions: {
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
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 12px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#666',
    maxWidth: '400px',
    margin: '0 auto',
  },
  lightbox: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  lightboxContent: {
    position: 'relative' as const,
    maxWidth: '90%',
    maxHeight: '90%',
  },
  lightboxClose: {
    position: 'absolute' as const,
    top: '-40px',
    right: '0',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '32px',
    cursor: 'pointer',
    padding: '8px',
  },
  lightboxImage: {
    maxWidth: '100%',
    maxHeight: '85vh',
    borderRadius: '8px',
  },
  helpCard: {
    backgroundColor: '#E3F2FD',
    padding: '20px',
    borderRadius: '12px',
    borderLeft: '4px solid #2196F3',
  },
  helpTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1976D2',
    margin: '0 0 12px 0',
  },
  helpText: {
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.6',
    margin: '0 0 12px 0',
  },
};
