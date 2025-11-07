# Task 0036: Implement Family Engagement Portal UI

**Priority**: 🟠 HIGH
**Phase**: Phase 1 - Production Readiness
**Estimated Effort**: 12-16 hours

## Context

Family engagement is a core differentiator for Care Commons. The backend API is complete, but families cannot access the portal without a frontend UI. This feature is essential for transparency and family involvement in care.

## Problem Statement

Current state:
- Backend API fully implemented (`verticals/family-engagement/`)
- No frontend UI exists
- Families cannot view loved ones' care information
- No messaging system UI
- No visit updates UI
- Core feature incomplete

## Task

### 1. Create Family Portal Pages

**File**: `packages/web/src/app/pages/family/FamilyDashboard.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { VisitCard } from './components/VisitCard';
import { MessageList } from './components/MessageList';
import { CarePlanSummary } from './components/CarePlanSummary';

export const FamilyDashboard: React.FC = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['family', 'clients'],
    queryFn: () => api.get('/api/family/clients'),
  });

  const selectedClientId = clients?.[0]?.id;

  const { data: todaysVisits } = useQuery({
    queryKey: ['family', 'visits', 'today', selectedClientId],
    queryFn: () => api.get(`/api/family/clients/${selectedClientId}/visits/today`),
    enabled: !!selectedClientId,
  });

  const { data: recentMessages } = useQuery({
    queryKey: ['family', 'messages', selectedClientId],
    queryFn: () => api.get(`/api/family/clients/${selectedClientId}/messages`),
    enabled: !!selectedClientId,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Family Portal</h1>

      {/* Client Selector */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Viewing care for:</label>
        <select className="form-select">
          {clients?.map(client => (
            <option key={client.id} value={client.id}>
              {client.first_name} {client.last_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Visits */}
        <Card title="Today's Visits" className="col-span-1">
          {todaysVisits?.length === 0 ? (
            <p className="text-gray-500">No visits scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todaysVisits?.map(visit => (
                <VisitCard key={visit.id} visit={visit} />
              ))}
            </div>
          )}
        </Card>

        {/* Recent Messages */}
        <Card title="Recent Messages" className="col-span-1">
          <MessageList messages={recentMessages} clientId={selectedClientId} />
          <Button variant="primary" className="mt-4 w-full">
            Send Message
          </Button>
        </Card>

        {/* Care Plan Summary */}
        <Card title="Current Care Plan" className="col-span-2">
          <CarePlanSummary clientId={selectedClientId} />
        </Card>
      </div>
    </div>
  );
};
```

**File**: `packages/web/src/app/pages/family/ClientDetails.tsx`

```typescript
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Tabs } from '@/components/Tabs';
import { VisitHistory } from './components/VisitHistory';
import { CareTeam } from './components/CareTeam';
import { CarePlanDetails } from './components/CarePlanDetails';
import { Documents } from './components/Documents';

export const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  const { data: client, isLoading } = useQuery({
    queryKey: ['family', 'client', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}`),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Client Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {client.first_name} {client.last_name}
        </h1>
        <p className="text-gray-600">
          Care started: {new Date(client.care_start_date).toLocaleDateString()}
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            id: 'overview',
            label: 'Overview',
            content: <ClientOverview client={client} />,
          },
          {
            id: 'visits',
            label: 'Visit History',
            content: <VisitHistory clientId={clientId} />,
          },
          {
            id: 'care-plan',
            label: 'Care Plan',
            content: <CarePlanDetails clientId={clientId} />,
          },
          {
            id: 'care-team',
            label: 'Care Team',
            content: <CareTeam clientId={clientId} />,
          },
          {
            id: 'documents',
            label: 'Documents',
            content: <Documents clientId={clientId} />,
          },
        ]}
      />
    </div>
  );
};
```

### 2. Create Messaging Interface

**File**: `packages/web/src/app/pages/family/components/MessageThread.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'family' | 'coordinator' | 'caregiver';
  content: string;
  created_at: string;
  read_at?: string;
}

export const MessageThread: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [messageText, setMessageText] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['messages', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/messages`),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/family/clients/${clientId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', clientId] });
      setMessageText('');
    },
  });

  const handleSend = () => {
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_role === 'family' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="flex items-start space-x-2 max-w-md">
              {message.sender_role !== 'family' && (
                <Avatar name={message.sender_name} size="sm" />
              )}
              <div
                className={`px-4 py-2 rounded-lg ${
                  message.sender_role === 'family'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm font-medium">{message.sender_name}</p>
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### 3. Create Visit Timeline Component

**File**: `packages/web/src/app/pages/family/components/VisitTimeline.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';

export const VisitTimeline: React.FC<{ visitId: string }> = ({ visitId }) => {
  const { data: visit } = useQuery({
    queryKey: ['visit', visitId],
    queryFn: () => api.get(`/api/family/visits/${visitId}`),
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  const events = [
    {
      time: visit?.check_in_time,
      label: 'Checked In',
      icon: CheckCircleIcon,
      color: 'text-green-500',
      description: `${visit?.caregiver_name} arrived`,
    },
    {
      time: visit?.tasks_completed_time,
      label: 'Tasks Completed',
      icon: CheckCircleIcon,
      color: 'text-blue-500',
      description: `${visit?.completed_tasks_count}/${visit?.total_tasks_count} tasks completed`,
    },
    {
      time: visit?.check_out_time,
      label: 'Checked Out',
      icon: CheckCircleIcon,
      color: 'text-green-500',
      description: 'Visit completed',
    },
  ].filter(event => event.time);

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const Icon = event.icon;
        return (
          <div key={index} className="flex items-start space-x-4">
            <div className={`${event.color} mt-1`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{event.label}</p>
              <p className="text-sm text-gray-600">{event.description}</p>
              <p className="text-xs text-gray-500">
                {new Date(event.time).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}

      {visit?.status === 'in_progress' && (
        <div className="flex items-start space-x-4 opacity-50">
          <ClockIcon className="w-6 h-6 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="font-medium">In Progress</p>
            <p className="text-sm text-gray-600">Visit is currently ongoing</p>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4. Create Care Plan View for Families

**File**: `packages/web/src/app/pages/family/components/CarePlanSummary.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { ProgressBar } from '@/components/ProgressBar';

export const CarePlanSummary: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: carePlan } = useQuery({
    queryKey: ['family', 'care-plan', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/care-plan`),
  });

  if (!carePlan) {
    return <p className="text-gray-500">No active care plan</p>;
  }

  const completionRate =
    (carePlan.completed_tasks / carePlan.total_tasks) * 100;

  return (
    <div className="space-y-6">
      {/* Care Plan Header */}
      <div>
        <h3 className="text-xl font-semibold">{carePlan.name}</h3>
        <p className="text-gray-600 mt-2">{carePlan.goals}</p>
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant={carePlan.status === 'active' ? 'success' : 'default'}>
            {carePlan.status}
          </Badge>
          <span className="text-sm text-gray-500">
            Started: {new Date(carePlan.start_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-gray-500">
            {carePlan.completed_tasks} of {carePlan.total_tasks} tasks completed
          </span>
        </div>
        <ProgressBar value={completionRate} />
      </div>

      {/* Tasks by Category */}
      <div>
        <h4 className="font-medium mb-3">Tasks by Category</h4>
        <div className="space-y-2">
          {carePlan.task_categories?.map(category => (
            <div key={category.name} className="flex justify-between items-center">
              <span className="text-sm">{category.name}</span>
              <span className="text-sm text-gray-500">
                {category.completed}/{category.total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 5. Create Visit Notifications

**File**: `packages/web/src/app/pages/family/components/VisitNotifications.tsx`

```typescript
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const VisitNotifications: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: notifications } = useQuery({
    queryKey: ['family', 'notifications', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/notifications`),
    refetchInterval: 15000, // Check every 15 seconds
  });

  useEffect(() => {
    notifications?.forEach(notification => {
      if (!notification.read) {
        // Show toast notification
        toast(notification.message, {
          icon: notification.type === 'check_in' ? '✅' : notification.type === 'check_out' ? '👋' : 'ℹ️',
          duration: 5000,
        });

        // Mark as read
        api.patch(`/api/family/notifications/${notification.id}/read`);
      }
    });
  }, [notifications]);

  return null; // This is a notification handler, no UI
};
```

### 6. Add Routes

**File**: `packages/web/src/app/routes.tsx`

```typescript
// Add family portal routes
{
  path: '/family',
  element: <ProtectedRoute requiredRoles={['family']} />,
  children: [
    { index: true, element: <FamilyDashboard /> },
    { path: 'clients/:clientId', element: <ClientDetails /> },
    { path: 'messages', element: <MessagesPage /> },
    { path: 'visits/:visitId', element: <VisitDetailsPage /> },
  ]
}
```

### 7. Create API Hooks

**File**: `packages/web/src/hooks/api/useFamily.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useFamilyClients = () => {
  return useQuery({
    queryKey: ['family', 'clients'],
    queryFn: () => api.get('/api/family/clients'),
  });
};

export const useClientVisits = (clientId: string, filters?: any) => {
  return useQuery({
    queryKey: ['family', 'visits', clientId, filters],
    queryFn: () => api.get(`/api/family/clients/${clientId}/visits`, { params: filters }),
    enabled: !!clientId,
  });
};

export const useClientMessages = (clientId: string) => {
  return useQuery({
    queryKey: ['family', 'messages', clientId],
    queryFn: () => api.get(`/api/family/clients/${clientId}/messages`),
    refetchInterval: 10000, // Poll for new messages
  });
};

export const useSendMessage = (clientId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      api.post(`/api/family/clients/${clientId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family', 'messages', clientId] });
    },
  });
};
```

## Acceptance Criteria

- [ ] Family dashboard page implemented
- [ ] Client details page with tabs
- [ ] Messaging interface with real-time updates
- [ ] Visit timeline component
- [ ] Care plan summary for families
- [ ] Visit notifications (toast alerts)
- [ ] Routes configured
- [ ] API hooks implemented
- [ ] Mobile responsive design
- [ ] Real-time updates (polling or WebSocket)
- [ ] Permissions verified (family can only see their clients)
- [ ] Tests written for components

## Testing Checklist

1. **Integration Test**: Family user can log in and view dashboard
2. **Permission Test**: Family cannot access other families' data
3. **Messaging Test**: Send and receive messages
4. **Visit Updates Test**: Verify live visit status updates
5. **Mobile Test**: Verify responsive design on mobile devices

## User Stories

1. **As a family member**, I can view my loved one's visit schedule
2. **As a family member**, I can see real-time updates when caregiver checks in/out
3. **As a family member**, I can message coordinators about care concerns
4. **As a family member**, I can view the current care plan and task completion
5. **As a family member**, I can see who is on my loved one's care team
6. **As a family member**, I can view visit history and notes

## Dependencies

**Blocks**: None
**Depends on**: Task 0024 (Provider interfaces wired up)

## Priority Justification

This is **HIGH** priority because:
1. Core feature for family engagement
2. Backend complete, just needs UI
3. Differentiator from competitors
4. High user value - families want transparency

---

**Next Task**: 0037 - Mobile Visit Workflow Screens
