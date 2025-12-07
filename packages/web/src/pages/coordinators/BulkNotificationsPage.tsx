import { useState } from 'react';

interface Caregiver {
  id: string;
  name: string;
  phone: string;
  email: string;
  clients: string[];
  selected: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  message: string;
  urgency: 'normal' | 'important' | 'urgent' | 'emergency';
}

type UrgencyLevel = 'normal' | 'important' | 'urgent' | 'emergency';

const DEMO_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg-1',
    name: 'Maria Garcia',
    phone: '(512) 555-0101',
    email: 'maria@example.com',
    clients: ['Robert Johnson', 'Patricia Williams'],
    selected: false,
  },
  {
    id: 'cg-2',
    name: 'James Wilson',
    phone: '(512) 555-0102',
    email: 'james@example.com',
    clients: ['Michael Davis'],
    selected: false,
  },
  {
    id: 'cg-3',
    name: 'Sarah Chen',
    phone: '(512) 555-0103',
    email: 'sarah@example.com',
    clients: ['Dorothy Chen', 'Robert Johnson'],
    selected: false,
  },
  {
    id: 'cg-4',
    name: 'David Martinez',
    phone: '(512) 555-0104',
    email: 'david@example.com',
    clients: ['Patricia Williams', 'Michael Davis'],
    selected: false,
  },
];

const MESSAGE_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'schedule-change',
    name: 'Schedule Change',
    message: '[CLIENT]\'s visit on [DATE] has been moved from [OLD_TIME] to [NEW_TIME].',
    urgency: 'important',
  },
  {
    id: 'visit-cancelled',
    name: 'Visit Cancelled',
    message: '[CLIENT]\'s visit on [DATE] at [TIME] has been cancelled. You will be notified when it is rescheduled.',
    urgency: 'important',
  },
  {
    id: 'coverage-needed',
    name: 'Coverage Needed',
    message: 'We need coverage for [CLIENT] on [DATE] from [START_TIME] to [END_TIME]. Reply if available.',
    urgency: 'urgent',
  },
  {
    id: 'client-update',
    name: 'Client Update',
    message: 'Important update regarding [CLIENT]: [DETAILS]',
    urgency: 'normal',
  },
  {
    id: 'emergency',
    name: 'Emergency Alert',
    message: 'URGENT: [CLIENT] has been hospitalized. All visits are cancelled until further notice. Contact office immediately.',
    urgency: 'emergency',
  },
  {
    id: 'training',
    name: 'Training/Meeting',
    message: 'Mandatory training session on [DATE] at [TIME]. Location: [LOCATION]. RSVP required.',
    urgency: 'important',
  },
  {
    id: 'custom',
    name: 'Custom Message',
    message: '',
    urgency: 'normal',
  },
];

export default function BulkNotificationsPage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>(DEMO_CAREGIVERS);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [filterClient, setFilterClient] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedCount = caregivers.filter(cg => cg.selected).length;
  const allClients = Array.from(
    new Set(caregivers.flatMap(cg => cg.clients))
  ).sort();

  const handleSelectAll = () => {
    setCaregivers(caregivers.map(cg => ({ ...cg, selected: true })));
  };

  const handleDeselectAll = () => {
    setCaregivers(caregivers.map(cg => ({ ...cg, selected: false })));
  };

  const handleToggleCaregiver = (id: string) => {
    setCaregivers(
      caregivers.map(cg => (cg.id === id ? { ...cg, selected: !cg.selected } : cg))
    );
  };

  const handleSelectTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setMessage(template.message);
    setUrgency(template.urgency);
  };

  const handleFilterByClient = (client: string) => {
    setFilterClient(client);
    setCaregivers(
      caregivers.map(cg => ({
        ...cg,
        selected: client ? cg.clients.includes(client) : cg.selected,
      }))
    );
  };

  const handleSend = () => {
    if (selectedCount === 0) {
      alert('Please select at least one caregiver');
      return;
    }

    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    // TODO: Send to API
    console.log('Sending notification:', {
      recipients: caregivers.filter(cg => cg.selected).map(cg => cg.id),
      message,
      urgency,
      timestamp: new Date().toISOString(),
    });

    // Show success
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Reset form
      setCaregivers(caregivers.map(cg => ({ ...cg, selected: false })));
      setMessage('');
      setSelectedTemplate(null);
      setUrgency('normal');
      setFilterClient('');
    }, 3000);
  };

  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case 'emergency':
        return '#dc2626';
      case 'urgent':
        return '#ea580c';
      case 'important':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  const getUrgencyLabel = (level: UrgencyLevel) => {
    switch (level) {
      case 'emergency':
        return '🚨 Emergency';
      case 'urgent':
        return '⚠️ Urgent';
      case 'important':
        return '❗ Important';
      default:
        return '💬 Normal';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Bulk Caregiver Notifications</h1>
          <p style={styles.subtitle}>
            Send messages to multiple caregivers with delivery tracking
          </p>
        </div>
      </div>

      {showSuccess && (
        <div style={styles.successBanner}>
          <div style={styles.successIcon}>✓</div>
          <div>
            <div style={styles.successTitle}>Notification Sent!</div>
            <div style={styles.successText}>
              Message delivered to {selectedCount} caregiver{selectedCount !== 1 ? 's' : ''} via
              push notification, SMS, and email.
            </div>
          </div>
        </div>
      )}

      <div style={styles.content}>
        {/* Left column: Recipients */}
        <div style={styles.leftColumn}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Select Recipients ({selectedCount})</h2>

            <div style={styles.recipientActions}>
              <button style={styles.secondaryButton} onClick={handleSelectAll}>
                Select All
              </button>
              <button style={styles.secondaryButton} onClick={handleDeselectAll}>
                Deselect All
              </button>
            </div>

            <div style={styles.filterSection}>
              <label style={styles.filterLabel}>Filter by Client:</label>
              <select
                style={styles.select}
                value={filterClient}
                onChange={e => handleFilterByClient(e.target.value)}
              >
                <option value="">All Clients</option>
                {allClients.map(client => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.caregiverList}>
              {caregivers.map(cg => (
                <div
                  key={cg.id}
                  style={{
                    ...styles.caregiverItem,
                    ...(cg.selected ? styles.caregiverItemSelected : {}),
                  }}
                  onClick={() => handleToggleCaregiver(cg.id)}
                >
                  <div style={styles.checkbox}>
                    {cg.selected && <div style={styles.checkmark}>✓</div>}
                  </div>
                  <div style={styles.caregiverInfo}>
                    <div style={styles.caregiverName}>{cg.name}</div>
                    <div style={styles.caregiverContact}>
                      {cg.phone} • {cg.email}
                    </div>
                    <div style={styles.caregiverClients}>
                      Clients: {cg.clients.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Message */}
        <div style={styles.rightColumn}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Message</h2>

            <div style={styles.templatesSection}>
              <label style={styles.label}>Templates:</label>
              <div style={styles.templateGrid}>
                {MESSAGE_TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    style={{
                      ...styles.templateButton,
                      ...(selectedTemplate?.id === template.id
                        ? styles.templateButtonSelected
                        : {}),
                    }}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.urgencySection}>
              <label style={styles.label}>Urgency Level:</label>
              <div style={styles.urgencyButtons}>
                {(['normal', 'important', 'urgent', 'emergency'] as UrgencyLevel[]).map(
                  level => (
                    <button
                      key={level}
                      style={{
                        ...styles.urgencyButton,
                        ...(urgency === level ? styles.urgencyButtonSelected : {}),
                        borderColor: getUrgencyColor(level),
                        ...(urgency === level
                          ? { backgroundColor: getUrgencyColor(level) }
                          : {}),
                      }}
                      onClick={() => setUrgency(level)}
                    >
                      {getUrgencyLabel(level)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div style={styles.messageSection}>
              <label style={styles.label}>Message:</label>
              <textarea
                style={styles.textarea}
                placeholder="Type your message here..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
              />
              <div style={styles.charCount}>{message.length} characters</div>
            </div>

            <div style={styles.previewSection}>
              <label style={styles.label}>Preview:</label>
              <div
                style={{
                  ...styles.preview,
                  borderLeftColor: getUrgencyColor(urgency),
                }}
              >
                <div style={styles.previewHeader}>
                  <strong>{getUrgencyLabel(urgency)}</strong>
                  <span style={styles.previewTime}>Just now</span>
                </div>
                <div style={styles.previewMessage}>{message || '(No message)'}</div>
                <div style={styles.previewFooter}>
                  To: {selectedCount} caregiver{selectedCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div style={styles.deliveryInfo}>
              <div style={styles.infoIcon}>ℹ️</div>
              <div>
                <div style={styles.infoTitle}>Multi-Channel Delivery</div>
                <div style={styles.infoText}>
                  Messages will be sent via:
                  <ul style={styles.deliveryList}>
                    <li>📱 Push notification (instant, if app installed)</li>
                    <li>💬 SMS text message (backup, within 1 minute)</li>
                    <li>📧 Email (backup, for record-keeping)</li>
                  </ul>
                  {urgency === 'emergency' && (
                    <div style={styles.emergencyNote}>
                      <strong>Emergency alerts</strong> will also trigger phone calls to
                      caregivers who don't acknowledge within 5 minutes.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              style={{
                ...styles.sendButton,
                ...(selectedCount === 0 || !message.trim()
                  ? styles.sendButtonDisabled
                  : {}),
              }}
              onClick={handleSend}
              disabled={selectedCount === 0 || !message.trim()}
            >
              Send to {selectedCount} Caregiver{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
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
  successBanner: {
    padding: '16px',
    backgroundColor: '#d1fae5',
    border: '1px solid: #10b981',
    borderRadius: '8px',
    marginBottom: '24px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  successIcon: {
    fontSize: '24px',
    color: '#059669',
  },
  successTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#065f46',
    marginBottom: '4px',
  },
  successText: {
    fontSize: '14px',
    color: '#065f46',
  },
  content: {
    display: 'flex',
    gap: '24px',
  },
  leftColumn: {
    width: '400px',
  },
  rightColumn: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  recipientActions: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: '16px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block',
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
  },
  caregiverList: {
    maxHeight: '500px',
    overflowY: 'auto',
  },
  caregiverItem: {
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginBottom: '8px',
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    transition: 'all 0.2s',
  },
  caregiverItemSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#3b82f6',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  caregiverContact: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  caregiverClients: {
    fontSize: '12px',
    color: '#6b7280',
  },
  templatesSection: {
    marginBottom: '20px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '8px',
    display: 'block',
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  templateButton: {
    padding: '10px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
  },
  templateButtonSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    fontWeight: '500',
  },
  urgencySection: {
    marginBottom: '20px',
  },
  urgencyButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  },
  urgencyButton: {
    padding: '10px',
    backgroundColor: 'white',
    border: '2px solid',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  urgencyButtonSelected: {
    color: 'white',
  },
  messageSection: {
    marginBottom: '20px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  charCount: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    textAlign: 'right',
  },
  previewSection: {
    marginBottom: '20px',
  },
  preview: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    borderLeft: '4px solid',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  },
  previewTime: {
    color: '#6b7280',
  },
  previewMessage: {
    fontSize: '14px',
    marginBottom: '8px',
    whiteSpace: 'pre-wrap',
  },
  previewFooter: {
    fontSize: '12px',
    color: '#6b7280',
  },
  deliveryInfo: {
    padding: '16px',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
    marginBottom: '20px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: '20px',
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: '4px',
  },
  infoText: {
    fontSize: '13px',
    color: '#1e40af',
  },
  deliveryList: {
    margin: '8px 0',
    paddingLeft: '20px',
  },
  emergencyNote: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '4px',
    color: '#991b1b',
  },
  sendButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
};
