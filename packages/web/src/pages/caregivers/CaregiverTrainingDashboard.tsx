import { useState } from 'react';

/**
 * Caregiver Training & Certification Dashboard
 *
 * Comprehensive training and certification tracking system for caregivers.
 * Ensures compliance, tracks expirations, and provides career development pathways.
 */

interface Certification {
  id: string;
  name: string;
  type: 'required' | 'optional' | 'specialty';
  status: 'active' | 'expiring-soon' | 'expired';
  issuedDate: string;
  expirationDate: string;
  issuer: string;
  certificateUrl?: string;
  daysUntilExpiration: number;
}

interface Training {
  id: string;
  title: string;
  category: string;
  duration: string;
  format: 'online' | 'in-person' | 'hybrid';
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
  dueDate?: string;
  certificationType?: string;
}

interface UpcomingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  spotsLeft: number;
  isEnrolled: boolean;
}

const DEMO_CERTIFICATIONS: Certification[] = [
  {
    id: '1',
    name: 'CPR & First Aid',
    type: 'required',
    status: 'active',
    issuedDate: '2024-01-15',
    expirationDate: '2026-01-15',
    issuer: 'American Red Cross',
    daysUntilExpiration: 395,
  },
  {
    id: '2',
    name: 'Home Health Aide (HHA)',
    type: 'required',
    status: 'active',
    issuedDate: '2023-06-01',
    expirationDate: '2025-06-01',
    issuer: 'Texas DSHS',
    daysUntilExpiration: 177,
  },
  {
    id: '3',
    name: 'Dementia Care Specialist',
    type: 'specialty',
    status: 'expiring-soon',
    issuedDate: '2023-02-10',
    expirationDate: '2025-02-10',
    issuer: 'Alzheimer\'s Association',
    daysUntilExpiration: 66,
  },
  {
    id: '4',
    name: 'Medication Administration',
    type: 'required',
    status: 'expiring-soon',
    issuedDate: '2023-03-20',
    expirationDate: '2025-03-20',
    issuer: 'Texas DSHS',
    daysUntilExpiration: 104,
  },
  {
    id: '5',
    name: 'Diabetes Management',
    type: 'specialty',
    status: 'active',
    issuedDate: '2024-05-10',
    expirationDate: '2026-05-10',
    issuer: 'American Diabetes Association',
    daysUntilExpiration: 520,
  },
  {
    id: '6',
    name: 'Infection Control',
    type: 'required',
    status: 'expired',
    issuedDate: '2022-11-01',
    expirationDate: '2024-11-01',
    issuer: 'CDC Training',
    daysUntilExpiration: -35,
  },
];

const DEMO_TRAININGS: Training[] = [
  {
    id: '1',
    title: 'Advanced Wound Care',
    category: 'Clinical Skills',
    duration: '4 hours',
    format: 'online',
    status: 'in-progress',
    progress: 65,
    dueDate: '2025-01-15',
  },
  {
    id: '2',
    title: 'Cultural Competency in Care',
    category: 'Professional Development',
    duration: '2 hours',
    format: 'online',
    status: 'not-started',
    progress: 0,
    dueDate: '2025-01-30',
  },
  {
    id: '3',
    title: 'Fall Prevention Strategies',
    category: 'Safety',
    duration: '3 hours',
    format: 'hybrid',
    status: 'not-started',
    progress: 0,
  },
  {
    id: '4',
    title: 'Nutrition for Seniors',
    category: 'Health & Wellness',
    duration: '2.5 hours',
    format: 'online',
    status: 'completed',
    progress: 100,
  },
];

const UPCOMING_SESSIONS: UpcomingSession[] = [
  {
    id: '1',
    title: 'CPR Recertification',
    date: '2025-01-10',
    time: '9:00 AM - 12:00 PM',
    location: 'Main Office Training Room',
    instructor: 'Sarah Johnson, RN',
    spotsLeft: 3,
    isEnrolled: true,
  },
  {
    id: '2',
    title: 'Dementia Care Best Practices',
    date: '2025-01-17',
    time: '2:00 PM - 5:00 PM',
    location: 'Community Center',
    instructor: 'Dr. Michael Chen',
    spotsLeft: 8,
    isEnrolled: false,
  },
  {
    id: '3',
    title: 'HIPAA Compliance Update',
    date: '2025-01-24',
    time: '10:00 AM - 11:30 AM',
    location: 'Virtual (Zoom)',
    instructor: 'Legal Team',
    spotsLeft: 15,
    isEnrolled: false,
  },
];

const COURSE_CATALOG = [
  {
    category: 'Required Certifications',
    courses: [
      { title: 'Home Health Aide Certification', duration: '40 hours', format: 'In-Person' },
      { title: 'CPR & First Aid', duration: '4 hours', format: 'In-Person' },
      { title: 'Medication Administration', duration: '16 hours', format: 'Hybrid' },
      { title: 'Infection Control', duration: '2 hours', format: 'Online' },
    ],
  },
  {
    category: 'Specialty Certifications',
    courses: [
      { title: 'Dementia Care Specialist', duration: '12 hours', format: 'Online' },
      { title: 'Diabetes Management', duration: '8 hours', format: 'Online' },
      { title: 'Hospice & Palliative Care', duration: '16 hours', format: 'Hybrid' },
      { title: 'Wound Care Specialist', duration: '10 hours', format: 'Online' },
    ],
  },
  {
    category: 'Professional Development',
    courses: [
      { title: 'Cultural Competency', duration: '2 hours', format: 'Online' },
      { title: 'Communication Skills', duration: '3 hours', format: 'Online' },
      { title: 'Stress Management', duration: '1.5 hours', format: 'Online' },
      { title: 'Leadership for Caregivers', duration: '6 hours', format: 'Hybrid' },
    ],
  },
];

export default function CaregiverTrainingDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'certifications' | 'training' | 'catalog'>('overview');
  const [_selectedCert, setSelectedCert] = useState<Certification | null>(null);

  const certStats = {
    total: DEMO_CERTIFICATIONS.length,
    active: DEMO_CERTIFICATIONS.filter((c) => c.status === 'active').length,
    expiringSoon: DEMO_CERTIFICATIONS.filter((c) => c.status === 'expiring-soon').length,
    expired: DEMO_CERTIFICATIONS.filter((c) => c.status === 'expired').length,
  };

  const trainingStats = {
    inProgress: DEMO_TRAININGS.filter((t) => t.status === 'in-progress').length,
    completed: DEMO_TRAININGS.filter((t) => t.status === 'completed').length,
    notStarted: DEMO_TRAININGS.filter((t) => t.status === 'not-started').length,
  };

  const getCertStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'expiring-soon':
        return '#f59e0b';
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const color = getCertStatusColor(status);
    return {
      ...styles.statusBadge,
      backgroundColor: `${color}20`,
      color,
      border: `1px solid ${color}`,
    };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Training & Certifications</h1>
        <p style={styles.subtitle}>Track your certifications, complete training, and advance your career</p>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        {[
          { id: 'overview' as const, label: 'Overview', icon: '📊' },
          { id: 'certifications' as const, label: 'My Certifications', icon: '🎓' },
          { id: 'training' as const, label: 'My Training', icon: '📚' },
          { id: 'catalog' as const, label: 'Course Catalog', icon: '📖' },
        ].map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={{ ...styles.statCard, ...styles.statCardGreen }}>
              <div style={styles.statValue}>{certStats.active}</div>
              <div style={styles.statLabel}>Active Certifications</div>
            </div>
            <div style={{ ...styles.statCard, ...styles.statCardYellow }}>
              <div style={styles.statValue}>{certStats.expiringSoon}</div>
              <div style={styles.statLabel}>Expiring Soon</div>
              <div style={styles.statNote}>(within 90 days)</div>
            </div>
            <div style={{ ...styles.statCard, ...styles.statCardRed }}>
              <div style={styles.statValue}>{certStats.expired}</div>
              <div style={styles.statLabel}>Expired</div>
              <div style={styles.statNote}>(needs renewal)</div>
            </div>
            <div style={{ ...styles.statCard, ...styles.statCardBlue }}>
              <div style={styles.statValue}>{trainingStats.inProgress}</div>
              <div style={styles.statLabel}>Trainings In Progress</div>
            </div>
          </div>

          {/* Action Items */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>⚠️ Action Required</h2>
            <div style={styles.actionList}>
              {certStats.expired > 0 && (
                <div style={styles.actionItem}>
                  <div style={styles.actionIcon}>🚨</div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Renew Expired Certifications</div>
                    <div style={styles.actionText}>
                      You have {certStats.expired} expired certification(s). Renew immediately to continue working.
                    </div>
                  </div>
                  <button style={styles.actionButton}>Renew Now</button>
                </div>
              )}
              {certStats.expiringSoon > 0 && (
                <div style={styles.actionItem}>
                  <div style={styles.actionIcon}>⏰</div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Certifications Expiring Soon</div>
                    <div style={styles.actionText}>
                      {certStats.expiringSoon} certification(s) expire within 90 days. Schedule renewals now.
                    </div>
                  </div>
                  <button style={styles.actionButton}>View Details</button>
                </div>
              )}
              {trainingStats.inProgress > 0 && (
                <div style={styles.actionItem}>
                  <div style={styles.actionIcon}>📚</div>
                  <div style={styles.actionContent}>
                    <div style={styles.actionTitle}>Complete In-Progress Training</div>
                    <div style={styles.actionText}>
                      Finish your {trainingStats.inProgress} pending training course(s) to earn certifications.
                    </div>
                  </div>
                  <button style={styles.actionButton}>Continue</button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📅 Upcoming Training Sessions</h2>
            <div style={styles.sessionsList}>
              {UPCOMING_SESSIONS.map((session) => (
                <div key={session.id} style={styles.sessionCard}>
                  <div style={styles.sessionHeader}>
                    <div style={styles.sessionTitle}>{session.title}</div>
                    {session.isEnrolled && (
                      <span style={styles.enrolledBadge}>✓ Enrolled</span>
                    )}
                  </div>
                  <div style={styles.sessionDetails}>
                    <div style={styles.sessionDetail}>
                      <span style={styles.sessionIcon}>📅</span>
                      {new Date(session.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={styles.sessionDetail}>
                      <span style={styles.sessionIcon}>🕐</span>
                      {session.time}
                    </div>
                    <div style={styles.sessionDetail}>
                      <span style={styles.sessionIcon}>📍</span>
                      {session.location}
                    </div>
                    <div style={styles.sessionDetail}>
                      <span style={styles.sessionIcon}>👨‍🏫</span>
                      {session.instructor}
                    </div>
                  </div>
                  <div style={styles.sessionFooter}>
                    <div style={styles.spotsLeft}>
                      {session.spotsLeft} spots left
                    </div>
                    {!session.isEnrolled && (
                      <button style={styles.enrollButton}>Enroll Now</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Certifications Tab */}
      {activeTab === 'certifications' && (
        <div>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>My Certifications</h2>
              <button style={styles.uploadButton}>+ Upload Certificate</button>
            </div>

            <div style={styles.certsGrid}>
              {DEMO_CERTIFICATIONS.map((cert) => (
                <div
                  key={cert.id}
                  style={styles.certCard}
                  onClick={() => setSelectedCert(cert)}
                >
                  <div style={styles.certHeader}>
                    <div style={styles.certType}>
                      {cert.type === 'required' && '⭐'}
                      {cert.type === 'specialty' && '🏆'}
                      {cert.type === 'optional' && '📋'}
                    </div>
                    <div style={getStatusBadgeStyle(cert.status)}>
                      {cert.status === 'active' && '✓ Active'}
                      {cert.status === 'expiring-soon' && '⏰ Expiring Soon'}
                      {cert.status === 'expired' && '⚠️ Expired'}
                    </div>
                  </div>
                  <div style={styles.certName}>{cert.name}</div>
                  <div style={styles.certIssuer}>{cert.issuer}</div>
                  <div style={styles.certDivider} />
                  <div style={styles.certDetails}>
                    <div style={styles.certDetailRow}>
                      <span style={styles.certDetailLabel}>Issued:</span>
                      <span style={styles.certDetailValue}>
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.certDetailRow}>
                      <span style={styles.certDetailLabel}>Expires:</span>
                      <span style={styles.certDetailValue}>
                        {new Date(cert.expirationDate).toLocaleDateString()}
                      </span>
                    </div>
                    {cert.status !== 'expired' && (
                      <div style={styles.certDetailRow}>
                        <span style={styles.certDetailLabel}>Days left:</span>
                        <span
                          style={{
                            ...styles.certDetailValue,
                            color: cert.daysUntilExpiration < 90 ? '#f59e0b' : '#10b981',
                            fontWeight: '600',
                          }}
                        >
                          {cert.daysUntilExpiration}
                        </span>
                      </div>
                    )}
                  </div>
                  {cert.status === 'expiring-soon' || cert.status === 'expired' ? (
                    <button style={styles.renewButton}>Renew Now</button>
                  ) : (
                    <button style={styles.viewButton}>View Certificate</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training Tab */}
      {activeTab === 'training' && (
        <div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>My Training Courses</h2>

            <div style={styles.trainingList}>
              {DEMO_TRAININGS.map((training) => (
                <div key={training.id} style={styles.trainingCard}>
                  <div style={styles.trainingHeader}>
                    <div>
                      <div style={styles.trainingTitle}>{training.title}</div>
                      <div style={styles.trainingMeta}>
                        <span style={styles.trainingCategory}>{training.category}</span>
                        <span style={styles.trainingDuration}>• {training.duration}</span>
                        <span style={styles.trainingFormat}>
                          • {training.format === 'online' ? '💻' : training.format === 'in-person' ? '🏫' : '🔄'} {training.format}
                        </span>
                      </div>
                    </div>
                    {training.status === 'completed' && (
                      <span style={styles.completedBadge}>✓ Completed</span>
                    )}
                  </div>

                  {training.status !== 'completed' && (
                    <div style={styles.progressContainer}>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${training.progress}%`,
                          }}
                        />
                      </div>
                      <div style={styles.progressText}>{training.progress}% Complete</div>
                    </div>
                  )}

                  {training.dueDate && (
                    <div style={styles.trainingDue}>
                      Due: {new Date(training.dueDate).toLocaleDateString()}
                    </div>
                  )}

                  <button
                    style={training.status === 'not-started' ? styles.startButton : styles.continueButton}
                  >
                    {training.status === 'not-started' ? 'Start Course' : training.status === 'in-progress' ? 'Continue' : 'View Certificate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Course Catalog</h2>
            <p style={styles.sectionSubtitle}>
              Browse available courses to advance your skills and earn certifications
            </p>

            {COURSE_CATALOG.map((category, idx) => (
              <div key={idx} style={styles.catalogCategory}>
                <h3 style={styles.catalogCategoryTitle}>{category.category}</h3>
                <div style={styles.catalogGrid}>
                  {category.courses.map((course, courseIdx) => (
                    <div key={courseIdx} style={styles.catalogCard}>
                      <div style={styles.catalogCardIcon}>
                        {category.category === 'Required Certifications' ? '⭐' :
                         category.category === 'Specialty Certifications' ? '🏆' : '📚'}
                      </div>
                      <div style={styles.catalogCardTitle}>{course.title}</div>
                      <div style={styles.catalogCardMeta}>
                        <span>{course.duration}</span>
                        <span>•</span>
                        <span>{course.format}</span>
                      </div>
                      <button style={styles.enrollCatalogButton}>Enroll</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '40px',
    borderBottom: '2px solid #e5e7eb',
    overflowX: 'auto',
  },
  tab: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: '#3b82f6',
    borderBottomColor: '#3b82f6',
  },
  tabIcon: {
    fontSize: '18px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    padding: '24px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statCardGreen: {
    backgroundColor: '#d1fae5',
    border: '2px solid #10b981',
  },
  statCardYellow: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
  },
  statCardRed: {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444',
  },
  statCardBlue: {
    backgroundColor: '#dbeafe',
    border: '2px solid #3b82f6',
  },
  statValue: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  statNote: {
    fontSize: '12px',
    color: '#6b7280',
  },
  section: {
    marginBottom: '40px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '8px',
    marginBottom: '24px',
  },
  uploadButton: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: 'white',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  actionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  actionIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '4px',
  },
  actionText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  actionButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  sessionsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  sessionCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  sessionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  sessionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
  },
  enrolledBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderRadius: '12px',
    border: '1px solid #10b981',
  },
  sessionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  sessionDetail: {
    fontSize: '14px',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sessionIcon: {
    fontSize: '16px',
  },
  sessionFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  spotsLeft: {
    fontSize: '13px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  enrollButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  certsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  certCard: {
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  certHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  certType: {
    fontSize: '24px',
  },
  statusBadge: {
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: '600',
    borderRadius: '12px',
  },
  certName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  certIssuer: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  certDivider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    marginBottom: '16px',
  },
  certDetails: {
    marginBottom: '16px',
  },
  certDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  certDetailLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  certDetailValue: {
    fontSize: '13px',
    color: '#111827',
    fontWeight: '500',
  },
  renewButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  viewButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: 'white',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  trainingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  trainingCard: {
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
  },
  trainingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  trainingTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  trainingMeta: {
    fontSize: '13px',
    color: '#6b7280',
  },
  trainingCategory: {
    fontWeight: '500',
  },
  trainingDuration: {
    marginLeft: '4px',
  },
  trainingFormat: {
    marginLeft: '4px',
  },
  completedBadge: {
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderRadius: '12px',
    border: '1px solid #10b981',
  },
  progressContainer: {
    marginBottom: '16px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'right',
  },
  trainingDue: {
    fontSize: '13px',
    color: '#f59e0b',
    marginBottom: '16px',
  },
  startButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  continueButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: 'white',
    border: '2px solid #3b82f6',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  catalogCategory: {
    marginBottom: '40px',
  },
  catalogCategoryTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '20px',
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px',
  },
  catalogCard: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    textAlign: 'center',
  },
  catalogCardIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  catalogCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '8px',
  },
  catalogCardMeta: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
  },
  enrollCatalogButton: {
    padding: '8px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    width: '100%',
  },
};
