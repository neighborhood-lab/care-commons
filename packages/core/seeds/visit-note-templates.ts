/**
 * Seed: Visit Note Templates
 *
 * Common templates for visit documentation scenarios.
 * These are system templates available to all organizations.
 */

import { Pool } from 'pg';

export async function seedVisitNoteTemplates(pool: Pool): Promise<void> {
  console.log('Seeding visit note templates...');

  // Get the first organization and admin user for ownership
  const orgResult = await pool.query('SELECT id FROM organizations LIMIT 1');
  const userResult = await pool.query('SELECT id FROM users WHERE email LIKE \'%admin%\' LIMIT 1');

  if (orgResult.rows.length === 0 || userResult.rows.length === 0) {
    console.warn('Skipping template seed - no organization or admin user found');
    return;
  }

  const organizationId = orgResult.rows[0].id;
  const userId = userResult.rows[0].id;

  const templates = [
    // 1. General Progress Note
    {
      name: 'Daily Progress Note',
      description: 'Standard daily visit documentation',
      category: 'GENERAL',
      templateText: `Visit with {{client_name}} on {{date}} from {{start_time}} to {{end_time}}.

Client's mood: {{client_mood}}

Activities performed:
{{activities}}

Client's response to care: [Describe client's cooperation and engagement]

Observations:
[Note any changes in condition, behavior, or needs]

Plan for next visit:
[List any follow-up items or changes needed]`,
      templateHtml: `<p>Visit with <strong>{{client_name}}</strong> on {{date}} from {{start_time}} to {{end_time}}.</p>
<p><strong>Client's mood:</strong> {{client_mood}}</p>
<p><strong>Activities performed:</strong><br>{{activities}}</p>
<p><strong>Client's response to care:</strong> [Describe client's cooperation and engagement]</p>
<p><strong>Observations:</strong><br>[Note any changes in condition, behavior, or needs]</p>
<p><strong>Plan for next visit:</strong><br>[List any follow-up items or changes needed]</p>`,
      prompts: JSON.stringify([
        {
          id: 'client_response',
          label: 'How did the client respond to care?',
          type: 'select',
          required: true,
          options: [
            'Cooperative and engaged',
            'Cooperative but tired',
            'Resistant to some activities',
            'Uncooperative',
            'Unable to participate',
          ],
        },
      ]),
      defaultActivities: JSON.stringify([
        'Personal hygiene assistance',
        'Bathing/showering',
        'Dressing assistance',
        'Meal preparation',
        'Feeding assistance',
        'Light housekeeping',
        'Laundry',
        'Medication reminder',
        'Companionship',
        'Safety monitoring',
      ]),
      requiresSignature: true,
      sortOrder: 1,
    },

    // 2. Fall Incident
    {
      name: 'Fall Incident Report',
      description: 'Documentation of client fall with injury assessment',
      category: 'INCIDENT',
      templateText: `FALL INCIDENT REPORT

Client: {{client_name}}
Date/Time: {{date}} at {{time}}

CIRCUMSTANCES:
[Describe what happened leading up to the fall]

LOCATION OF FALL:
[Where did the fall occur? Bedroom, bathroom, kitchen, etc.]

WITNESSES:
[Who witnessed the fall?]

INJURIES OBSERVED:
[List any visible injuries, bruises, cuts, swelling]

CLIENT'S CONDITION AFTER FALL:
Mental status: [Alert, confused, unconscious]
Mobility: [Able to stand, needs assistance, cannot bear weight]
Pain level (0-10): [Number]
Pain location: [Where]

IMMEDIATE ACTIONS TAKEN:
☐ Called 911
☐ Notified physician (Dr. _______)
☐ Notified family (Name: ______, Time: ______)
☐ Applied ice/first aid
☐ Assisted client to bed/chair
☐ Remained with client for observation
☐ Other: [Specify]

VITAL SIGNS (if taken):
Blood pressure: ______
Heart rate: ______
Respirations: ______

SUPERVISOR NOTIFIED:
Name: ______
Time: ______

FOLLOW-UP REQUIRED:
[Medical attention needed? Equipment changes? Environmental modifications?]`,
      templateHtml: `<h3>FALL INCIDENT REPORT</h3>
<p><strong>Client:</strong> {{client_name}}<br>
<strong>Date/Time:</strong> {{date}} at {{time}}</p>
<h4>CIRCUMSTANCES:</h4>
<p>[Describe what happened leading up to the fall]</p>
<h4>LOCATION OF FALL:</h4>
<p>[Where did the fall occur?]</p>
<h4>INJURIES OBSERVED:</h4>
<p>[List any visible injuries]</p>
<h4>IMMEDIATE ACTIONS TAKEN:</h4>
<ul>
<li>Called 911</li>
<li>Notified physician</li>
<li>Notified family</li>
</ul>`,
      prompts: JSON.stringify([
        {
          id: 'circumstances',
          label: 'What were the circumstances leading to the fall?',
          type: 'textarea',
          required: true,
          placeholder: 'Client was walking to the bathroom unassisted...',
        },
        {
          id: 'injuries',
          label: 'Were there any visible injuries?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No'],
        },
        {
          id: 'injury_description',
          label: 'Describe injuries observed',
          type: 'textarea',
          required: false,
        },
        {
          id: 'er_transport',
          label: 'Was 911 called or client transported to ER?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No'],
        },
      ]),
      requiresSignature: true,
      requiresIncidentFlag: true,
      requiresSupervisorReview: true,
      sortOrder: 2,
    },

    // 3. Medication Refusal
    {
      name: 'Medication Refusal',
      description: 'Client refused prescribed medication',
      category: 'MEDICATION',
      templateText: `MEDICATION REFUSAL

Client: {{client_name}}
Date/Time: {{date}} at {{time}}

MEDICATION(S) REFUSED:
[List medication name(s), dosage, and scheduled time]

REASON FOR REFUSAL:
[Client's stated reason or caregiver's observation]

CAREGIVER ACTIONS:
☐ Offered medication again later
☐ Explained importance of medication
☐ Attempted to address client's concerns
☐ Notified nurse/physician
☐ Notified family member
☐ Other: [Specify]

NOTIFICATIONS:
Physician notified: ☐ Yes ☐ No  Time: ______
Family notified: ☐ Yes ☐ No  Time: ______
Nurse notified: ☐ Yes ☐ No  Time: ______

FOLLOW-UP PLAN:
[Will retry at next scheduled time? Special instructions?]

NOTES:
[Any additional context or observations]`,
      templateHtml: `<h3>MEDICATION REFUSAL</h3>
<p><strong>Client:</strong> {{client_name}}<br>
<strong>Date/Time:</strong> {{date}} at {{time}}</p>
<h4>MEDICATION(S) REFUSED:</h4>
<p>[List medications]</p>
<h4>REASON FOR REFUSAL:</h4>
<p>[Client's reason]</p>
<h4>NOTIFICATIONS:</h4>
<ul>
<li>Physician notified</li>
<li>Family notified</li>
</ul>`,
      prompts: JSON.stringify([
        {
          id: 'medications',
          label: 'Which medication(s) were refused?',
          type: 'textarea',
          required: true,
        },
        {
          id: 'reason',
          label: 'Why did the client refuse?',
          type: 'select',
          required: true,
          options: [
            'Didn\'t want to take it',
            'Feeling nauseous',
            'Already took it (client claims)',
            'Doesn\'t like the taste',
            'Experiencing side effects',
            'Confused/didn\'t understand',
            'Other',
          ],
        },
        {
          id: 'physician_notified',
          label: 'Was the physician notified?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No'],
        },
      ]),
      requiresSignature: true,
      sortOrder: 3,
    },

    // 4. Behavioral Concerns
    {
      name: 'Behavioral Observation',
      description: 'Unusual behavior or mental status changes',
      category: 'BEHAVIORAL',
      templateText: `BEHAVIORAL OBSERVATION

Client: {{client_name}}
Date/Time: {{date}} at {{time}}

BEHAVIOR OBSERVED:
[Describe the specific behavior: agitation, confusion, aggression, withdrawal, etc.]

DURATION:
[How long did the behavior last?]

TRIGGERS (if known):
[What seemed to trigger the behavior?]

CLIENT'S BASELINE:
☐ This is new/unusual behavior
☐ This is ongoing/chronic
☐ Similar to past episodes
☐ Worse than usual

INTERVENTIONS ATTEMPTED:
☐ Redirection
☐ Calming techniques
☐ Removed from triggering situation
☐ Offered food/drink
☐ Toileting assistance
☐ Medication (PRN if ordered)
☐ Other: [Specify]

EFFECTIVENESS:
[Did interventions help? Client's response?]

SAFETY CONCERNS:
☐ None - client and caregiver safe
☐ Client at risk for self-harm
☐ Caregiver safety concern
☐ Environmental hazards

NOTIFICATIONS:
Family: ☐ Yes ☐ No  Time: ______
Physician: ☐ Yes ☐ No  Time: ______
Supervisor: ☐ Yes ☐ No  Time: ______

FOLLOW-UP NEEDED:
[Medication review? Mental health eval? Care plan update?]`,
      templateHtml: `<h3>BEHAVIORAL OBSERVATION</h3>
<p><strong>Client:</strong> {{client_name}}<br>
<strong>Date/Time:</strong> {{date}} at {{time}}</p>
<h4>BEHAVIOR OBSERVED:</h4>
<p>[Describe the behavior]</p>
<h4>INTERVENTIONS:</h4>
<ul>
<li>Redirection</li>
<li>Calming techniques</li>
</ul>`,
      prompts: JSON.stringify([
        {
          id: 'behavior_type',
          label: 'Type of behavior observed',
          type: 'select',
          required: true,
          options: [
            'Agitation/restlessness',
            'Verbal aggression',
            'Physical aggression',
            'Confusion/disorientation',
            'Anxiety/fearfulness',
            'Depression/withdrawal',
            'Hallucinations/delusions',
            'Other',
          ],
        },
        {
          id: 'safety_risk',
          label: 'Was there a safety risk?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No'],
        },
      ]),
      requiresSignature: true,
      requiresSupervisorReview: true,
      sortOrder: 4,
    },

    // 5. Service Refusal
    {
      name: 'Service Refusal',
      description: 'Client refused scheduled care services',
      category: 'REFUSAL',
      templateText: `SERVICE REFUSAL

Client: {{client_name}}
Date/Time: {{date}} at {{time}}

SERVICE(S) REFUSED:
[List which services were refused: bathing, dressing, meal prep, etc.]

REASON FOR REFUSAL:
[Client's stated reason]

CLIENT'S CONDITION:
Mental status: [Alert, confused, oriented x3]
Physical status: [Ambulatory, safe, no immediate concerns]

CAREGIVER ACTIONS:
☐ Explained importance of services
☐ Offered services at different time
☐ Attempted to identify concerns
☐ Respected client's autonomy
☐ Stayed for observation/companionship

NOTIFICATIONS:
Family: ☐ Yes ☐ No  Time: ______
Supervisor: ☐ Yes ☐ No  Time: ______

PLAN:
[Will attempt again next visit? Any modifications needed?]`,
      templateHtml: `<h3>SERVICE REFUSAL</h3>
<p><strong>Client:</strong> {{client_name}}<br>
<strong>Date/Time:</strong> {{date}} at {{time}}</p>
<h4>SERVICE(S) REFUSED:</h4>
<p>[List services]</p>
<h4>REASON:</h4>
<p>[Client's reason]</p>`,
      prompts: JSON.stringify([
        {
          id: 'services',
          label: 'Which services were refused?',
          type: 'textarea',
          required: true,
        },
        {
          id: 'client_capacity',
          label: 'Does client appear to have decision-making capacity?',
          type: 'radio',
          required: true,
          options: ['Yes', 'No', 'Uncertain'],
        },
      ]),
      requiresSignature: true,
      sortOrder: 5,
    },

    // 6. ADL Assessment
    {
      name: 'ADL Assessment Note',
      description: 'Activities of Daily Living observation and assistance',
      category: 'ADL',
      templateText: `ADL ASSESSMENT

Client: {{client_name}}
Date: {{date}}

MOBILITY:
Ambulation: [Independent / Uses walker / Uses cane / Wheelchair / Bedbound]
Transfers: [Independent / Minimal assist / Moderate assist / Maximum assist / Total assist]
Falls this week: [Number]

PERSONAL HYGIENE:
Bathing: [Independent / Supervision / Partial assist / Total assist]
Oral care: [Independent / Reminders needed / Assistance needed]
Grooming: [Independent / Assistance needed]

DRESSING:
Upper body: [Independent / Partial assist / Total assist]
Lower body: [Independent / Partial assist / Total assist]

TOILETING:
Continence: [Continent / Occasional accidents / Incontinent]
Transfers: [Independent / Assistance needed]
Hygiene: [Independent / Assistance needed]

NUTRITION:
Eating: [Independent / Setup needed / Feeding assist / Total assist]
Appetite: [Good / Fair / Poor]
Fluid intake: [Adequate / Needs encouragement]

NOTES:
[Any changes from baseline? Areas of improvement or decline?]`,
      templateHtml: `<h3>ADL ASSESSMENT</h3>
<p><strong>Client:</strong> {{client_name}}<br>
<strong>Date:</strong> {{date}}</p>
<h4>MOBILITY</h4>
<p>[Assessment details]</p>
<h4>PERSONAL HYGIENE</h4>
<p>[Assessment details]</p>`,
      prompts: JSON.stringify([]),
      defaultActivities: JSON.stringify([
        'Bathing',
        'Dressing',
        'Toileting',
        'Transfers',
        'Feeding',
        'Grooming',
      ]),
      requiresSignature: true,
      sortOrder: 6,
    },
  ];

  // Insert templates
  for (const template of templates) {
    await pool.query(
      `
      INSERT INTO visit_note_templates (
        organization_id, branch_id, name, description, category,
        template_text, template_html, prompts, default_activities,
        requires_signature, requires_incident_flag, requires_supervisor_review,
        is_active, is_system_template, sort_order, usage_count, version,
        created_at, created_by, updated_at, updated_by
      ) VALUES (
        $1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 0, 1,
        NOW(), $15, NOW(), $15
      )
      ON CONFLICT DO NOTHING
      `,
      [
        organizationId,
        template.name,
        template.description,
        template.category,
        template.templateText,
        template.templateHtml,
        template.prompts,
        template.defaultActivities,
        template.requiresSignature,
        template.requiresIncidentFlag ?? false,
        template.requiresSupervisorReview ?? false,
        true, // is_active
        true, // is_system_template
        template.sortOrder,
        userId,
      ]
    );
  }

  console.log(`✓ Seeded ${templates.length} visit note templates`);
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await seedVisitNoteTemplates(pool);
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
