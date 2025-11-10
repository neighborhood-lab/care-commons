# Task 0014: Showcase Vertical Feature Exposure

**Priority**: 🔴 CRITICAL
**Category**: Showcase / Demo / UX
**Estimated Effort**: 1-2 weeks

## Context

Multiple verticals have complete backend implementations but are **NOT exposed** in the showcase or production-demo environments. This means evaluators and new users cannot discover or test these features, severely limiting the platform's perceived value.

**Current State:**
- Care plans: Backend complete, web UI exists, but not prominently featured in showcase
- Time tracking EVV: Core functionality complete, but demo doesn't showcase EVV workflow
- Family engagement: Portal exists, but demo doesn't show family member perspective
- Analytics/reporting: Backend complete, partial UI, not showcased
- Shift matching: Algorithm ready, minimal UI, not demonstrated
- Payroll processing: Schema complete, service partial, not showcased
- Quality assurance: Schema ready, not implemented in demo

**Goal:**
Make ALL implemented features discoverable and usable in the showcase and production-demo environments.

---

## Objectives

1. **Showcase Landing Page Enhancements**
   - Add feature showcase section for each vertical
   - Create "What you can do" feature grid
   - Add quick-start guides per persona

2. **Production Demo Routing**
   - Ensure all vertical UIs are accessible
   - Add navigation menu items for all features
   - Create role-based dashboards showing available features

3. **Feature Discovery**
   - Add tooltips/hints for new features
   - Create "Getting Started" tours per vertical
   - Add demo data that triggers feature visibility

4. **Vertical-Specific Enhancements**

---

## Deliverable 1: Enhanced Showcase Landing Page

**Location:** `showcase/src/pages/index.tsx`

### Feature Showcase Grid

Add a comprehensive feature overview section:

```tsx
export function ShowcaseLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ... existing persona selection ... */}

      {/* NEW: Feature Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Comprehensive Home Healthcare Management
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<CalendarIcon />}
            title="Intelligent Scheduling"
            description="AI-powered shift matching with 8-dimensional scoring"
            status="Production Ready"
            personas={['admin', 'coordinator']}
            demoPath="/demo/scheduling"
          />

          <FeatureCard
            icon={<ClockIcon />}
            title="EVV Compliance"
            description="Multi-state EVV with GPS verification and biometric auth"
            status="Production Ready"
            personas={['admin', 'coordinator', 'caregiver']}
            demoPath="/demo/evv"
          />

          <FeatureCard
            icon={<HeartIcon />}
            title="Care Plans & Tasks"
            description="Personalized care planning with progress tracking"
            status="Production Ready"
            personas={['admin', 'coordinator', 'caregiver', 'family']}
            demoPath="/demo/care-plans"
          />

          <FeatureCard
            icon={<UsersIcon />}
            title="Family Engagement"
            description="Real-time updates and messaging for families"
            status="Production Ready"
            personas={['family', 'coordinator']}
            demoPath="/demo/family-portal"
          />

          <FeatureCard
            icon={<DollarIcon />}
            title="Billing & Invoicing"
            description="Automated billing with payor integration"
            status="Production Ready"
            personas={['admin', 'coordinator']}
            demoPath="/demo/billing"
          />

          <FeatureCard
            icon={<ChartIcon />}
            title="Analytics & Reporting"
            description="Real-time insights and compliance reporting"
            status="70% Complete"
            personas={['admin', 'coordinator']}
            demoPath="/demo/analytics"
          />

          <FeatureCard
            icon={<CashIcon />}
            title="Payroll Processing"
            description="Multi-state tax calculations and pay stubs"
            status="Backend Complete"
            personas={['admin']}
            demoPath="/demo/payroll"
          />

          <FeatureCard
            icon={<ShieldIcon />}
            title="Quality Assurance"
            description="Audit workflows and compliance checklists"
            status="In Development"
            personas={['admin', 'coordinator']}
            demoPath="/demo/qa"
          />

          <FeatureCard
            icon={<PillIcon />}
            title="Medication Tracking"
            description="eMAR compliance with error tracking"
            status="Planned"
            personas={['coordinator', 'caregiver']}
            demoPath="/demo/medications"
          />
        </div>
      </section>

      {/* ... rest of page ... */}
    </div>
  );
}

function FeatureCard({ icon, title, description, status, personas, demoPath }) {
  const statusColor = {
    'Production Ready': 'bg-green-100 text-green-800',
    '70% Complete': 'bg-yellow-100 text-yellow-800',
    'Backend Complete': 'bg-blue-100 text-blue-800',
    'In Development': 'bg-purple-100 text-purple-800',
    'Planned': 'bg-gray-100 text-gray-800',
  }[status];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className={`text-xs px-2 py-1 rounded ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>

      <p className="text-gray-600 mb-4">{description}</p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {personas.map(persona => (
            <PersonaBadge key={persona} persona={persona} />
          ))}
        </div>

        <a
          href={demoPath}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Try Demo →
        </a>
      </div>
    </div>
  );
}
```

---

## Deliverable 2: Production Demo Navigation

**Location:** `packages/web/src/components/Navigation.tsx`

### Add All Vertical Routes

Ensure navigation shows all available features based on user role:

```tsx
export function Navigation({ userRole }: { userRole: string }) {
  const routes = getRoutesForRole(userRole);

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Logo />

            {/* Core Features */}
            <NavSection title="Core">
              <NavLink href="/dashboard" icon={<HomeIcon />}>
                Dashboard
              </NavLink>
              {routes.includes('scheduling') && (
                <NavLink href="/scheduling" icon={<CalendarIcon />}>
                  Scheduling
                </NavLink>
              )}
              {routes.includes('visits') && (
                <NavLink href="/visits" icon={<ClockIcon />}>
                  Visits & EVV
                </NavLink>
              )}
            </NavSection>

            {/* Care Management */}
            {routes.includes('care-plans') && (
              <NavSection title="Care">
                <NavLink href="/care-plans" icon={<HeartIcon />}>
                  Care Plans
                </NavLink>
                {routes.includes('medications') && (
                  <NavLink href="/medications" icon={<PillIcon />}>
                    Medications
                  </NavLink>
                )}
                {routes.includes('qa') && (
                  <NavLink href="/quality-assurance" icon={<ShieldIcon />}>
                    Quality Assurance
                  </NavLink>
                )}
              </NavSection>
            )}

            {/* Operations */}
            {(routes.includes('billing') || routes.includes('payroll')) && (
              <NavSection title="Operations">
                {routes.includes('billing') && (
                  <NavLink href="/billing" icon={<DollarIcon />}>
                    Billing
                  </NavLink>
                )}
                {routes.includes('payroll') && (
                  <NavLink href="/payroll" icon={<CashIcon />}>
                    Payroll
                  </NavLink>
                )}
              </NavSection>
            )}

            {/* Analytics */}
            {routes.includes('analytics') && (
              <NavSection title="Insights">
                <NavLink href="/analytics" icon={<ChartIcon />}>
                  Analytics
                </NavLink>
              </NavSection>
            )}

            {/* Family Portal */}
            {userRole === 'family' && (
              <NavSection title="Family">
                <NavLink href="/family/dashboard" icon={<UsersIcon />}>
                  My Loved One
                </NavLink>
                <NavLink href="/family/messages" icon={<MessageIcon />}>
                  Messages
                </NavLink>
              </NavSection>
            )}
          </div>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}

function getRoutesForRole(role: string): string[] {
  const roleRoutes: Record<string, string[]> = {
    admin: [
      'scheduling', 'visits', 'care-plans', 'medications', 'qa',
      'billing', 'payroll', 'analytics'
    ],
    coordinator: [
      'scheduling', 'visits', 'care-plans', 'medications', 'qa', 'billing'
    ],
    caregiver: ['visits', 'care-plans'],
    family: ['family'],
  };

  return roleRoutes[role] || [];
}
```

---

## Deliverable 3: Role-Based Dashboards

Create dashboards that showcase available features per role.

### Administrator Dashboard

**Location:** `packages/web/src/pages/dashboard/AdminDashboard.tsx`

```tsx
export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Administrator Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Active Clients"
          value="142"
          trend="+8%"
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Active Caregivers"
          value="87"
          trend="+3%"
          icon={<UserGroupIcon />}
        />
        <MetricCard
          title="Visits This Month"
          value="1,234"
          trend="+12%"
          icon={<CalendarIcon />}
        />
        <MetricCard
          title="Revenue (MTD)"
          value="$89,450"
          trend="+15%"
          icon={<DollarIcon />}
        />
      </div>

      {/* Feature Quick Access */}
      <div className="grid grid-cols-3 gap-6">
        <QuickAccessCard
          title="Shift Matching"
          description="AI-powered caregiver-client matching"
          icon={<SparklesIcon />}
          actionLabel="View Matches"
          actionHref="/shift-matching"
          highlight="NEW"
        />

        <QuickAccessCard
          title="EVV Compliance"
          description="Real-time compliance monitoring"
          icon={<ShieldCheckIcon />}
          actionLabel="View Reports"
          actionHref="/evv/compliance"
        />

        <QuickAccessCard
          title="Payroll Processing"
          description="Multi-state payroll with tax calculations"
          icon={<CashIcon />}
          actionLabel="Run Payroll"
          actionHref="/payroll"
          highlight="BETA"
        />

        <QuickAccessCard
          title="Analytics Dashboard"
          description="Business intelligence and insights"
          icon={<ChartBarIcon />}
          actionLabel="View Analytics"
          actionHref="/analytics"
        />

        <QuickAccessCard
          title="Quality Assurance"
          description="Audit workflows and compliance checklists"
          icon={<ClipboardCheckIcon />}
          actionLabel="Start Audit"
          actionHref="/quality-assurance"
          highlight="COMING SOON"
        />

        <QuickAccessCard
          title="Family Portal"
          description="Transparency and engagement for families"
          icon={<HeartIcon />}
          actionLabel="View Portal"
          actionHref="/family"
        />
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity">
        <ActivityFeed limit={10} />
      </Card>
    </div>
  );
}
```

---

## Deliverable 4: Vertical-Specific Demo Routes

Add demo routes for each vertical to allow isolated exploration.

**Location:** `packages/web/src/routes/demo-routes.tsx`

```tsx
export const demoRoutes = [
  {
    path: '/demo/scheduling',
    element: <DemoScheduling />,
    title: 'Scheduling & Shift Matching Demo',
  },
  {
    path: '/demo/evv',
    element: <DemoEVV />,
    title: 'EVV Compliance Demo',
  },
  {
    path: '/demo/care-plans',
    element: <DemoCarePlans />,
    title: 'Care Plans & Tasks Demo',
  },
  {
    path: '/demo/family-portal',
    element: <DemoFamilyPortal />,
    title: 'Family Engagement Demo',
  },
  {
    path: '/demo/billing',
    element: <DemoBilling />,
    title: 'Billing & Invoicing Demo',
  },
  {
    path: '/demo/analytics',
    element: <DemoAnalytics />,
    title: 'Analytics & Reporting Demo',
  },
  {
    path: '/demo/payroll',
    element: <DemoPayroll />,
    title: 'Payroll Processing Demo',
  },
  {
    path: '/demo/medications',
    element: <DemoMedications />,
    title: 'Medication Tracking Demo',
  },
];
```

Each demo page should:
1. Show pre-loaded realistic data
2. Allow interactive exploration
3. Include embedded video walkthrough or animated GIF
4. Provide "Learn More" links to documentation
5. Allow "Try in Full Demo" action

---

## Deliverable 5: Feature Discovery Tooltips

Add contextual help throughout the application.

```tsx
// packages/web/src/components/FeatureHint.tsx

export function FeatureHint({ featureId, children }: {
  featureId: string;
  children: React.ReactNode;
}) {
  const { hasSeenHint, markHintAsSeen } = useFeatureHints();

  if (hasSeenHint(featureId)) {
    return <>{children}</>;
  }

  return (
    <Tooltip
      content={getHintContent(featureId)}
      onDismiss={() => markHintAsSeen(featureId)}
      highlight
    >
      {children}
    </Tooltip>
  );
}

function getHintContent(featureId: string): string {
  const hints: Record<string, string> = {
    'shift-matching': 'NEW: Our AI-powered shift matching finds the best caregiver for each visit. Click to see match scores!',
    'evv-compliance': 'Track EVV compliance in real-time across all states.',
    'family-portal': 'Families can now view visit updates and message the care team.',
    'care-plans': 'Create personalized care plans with task tracking.',
    'payroll': 'Process payroll with automatic multi-state tax calculations.',
  };

  return hints[featureId] || 'Explore this feature!';
}
```

---

## Testing Requirements

### Manual Testing Checklist

- [ ] All features accessible from navigation menu (per role)
- [ ] Showcase landing page shows all features
- [ ] Feature cards link to correct demo pages
- [ ] Demo pages load with realistic data
- [ ] Role-based dashboards show appropriate quick access cards
- [ ] Feature hints appear for new users
- [ ] All demo routes functional and error-free
- [ ] Mobile responsive for all showcase pages

### User Acceptance Criteria

- [ ] Evaluator can discover all features within 5 minutes
- [ ] Each persona dashboard highlights relevant features
- [ ] Demo data compelling and realistic
- [ ] No broken links or 404s in showcase
- [ ] Performance: All pages load in <2 seconds

---

## Success Criteria

- [ ] Showcase landing page features all 9+ verticals
- [ ] Production demo navigation includes all implemented features
- [ ] Role-based dashboards provide quick access to all relevant features
- [ ] Demo routes exist for each vertical
- [ ] Feature discovery hints guide new users
- [ ] 100% of implemented backend features have UI exposure
- [ ] First-time users can find and test all features without assistance

---

## Related Tasks

- Task 0000: Showcase Demo Data Seeding
- Task 0001: Showcase Interactive Tours
- Task 0006: Shift Matching UI Implementation
- Task 0007: Payroll UI
- Task 0008: Analytics UI
- Task 0010: Medication Tracking Module
- Task 0011: Emergency Alerts
