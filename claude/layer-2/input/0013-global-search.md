# Task 0095: Global Search Across Platform

**Priority:** 🟠 HIGH
**Estimated Effort:** 1 week
**Type:** Feature / UX / Developer Speed
**Vertical:** Cross-functional

---

## Context

Coordinators and administrators frequently need to find specific clients, caregivers, visits, or information quickly. Currently, users must navigate to each section and search individually. A global search dramatically improves efficiency and user experience.

**Current Pain Points:**
- "Where is that client's profile?"
- "Which visit had the medication issue?"
- "Who is the caregiver named Emma?"
- Users must remember where data lives
- Multiple clicks to find information

**Goal State:**
- Single search bar accessible everywhere (keyboard shortcut: `/` or `Cmd+K`)
- Search across all entities (clients, caregivers, visits, care plans, messages, etc.)
- Instant results as you type
- Jump directly to relevant page
- Recent searches saved
- Search from mobile app

---

## Objectives

1. **Build Global Search UI Component**
2. **Implement Full-Text Search Backend**
3. **Add Keyboard Shortcuts and Quick Actions**
4. **Create Search Result Ranking Algorithm**
5. **Add Search Analytics** (what users search for)

---

## UI Design

### Desktop: Command Palette (Cmd+K style)

**Trigger:**
- Click search icon in top nav
- Press `/` or `Cmd+K` (Mac) or `Ctrl+K` (Windows)

**Search Modal:**
```
╔═══════════════════════════════════════════╗
║  🔍 Search Care Commons...                ║
║  ┌──────────────────────────────────────┐ ║
║  │ mary johnson                         │ ║
║  └──────────────────────────────────────┘ ║
║                                           ║
║  Clients                                  ║
║  👤 Mary Johnson - 456 Oak St, Austin     ║
║  👤 Mary Williams - 789 Pine Rd, Austin   ║
║                                           ║
║  Visits                                   ║
║  📅 Visit with Mary Johnson - 11/08 9am   ║
║  📅 Visit with Mary Johnson - 11/06 9am   ║
║                                           ║
║  Messages                                 ║
║  💬 From Sarah Johnson about Mary         ║
║                                           ║
║  Press ↑↓ to navigate, ⏎ to select, ESC to close
╚═══════════════════════════════════════════╝
```

**Result Categories:**
- Clients
- Caregivers
- Visits
- Care Plans
- Messages
- Reports
- Settings

### Mobile: Slide-out Search

**Tap search icon → Full-screen search:**
```
┌─────────────────────────────────┐
│ ← 🔍 Search                      │
│                                 │
│ [Search input]                  │
│                                 │
│ Recent Searches:                │
│ • Mary Johnson                  │
│ • Emma Davis                    │
│ • Today's visits                │
│                                 │
│ Quick Actions:                  │
│ • Schedule Visit                │
│ • Add Client                    │
│ • View Today                    │
└─────────────────────────────────┘
```

---

## Backend: Full-Text Search

### Option 1: PostgreSQL Full-Text Search (Simpler)

**Create search indexes:**

```sql
-- Add tsvector columns for full-text search
ALTER TABLE clients ADD COLUMN search_vector tsvector;
ALTER TABLE caregivers ADD COLUMN search_vector tsvector;
ALTER TABLE visits ADD COLUMN search_vector tsvector;

-- Create indexes
CREATE INDEX clients_search_idx ON clients USING GIN(search_vector);
CREATE INDEX caregivers_search_idx ON caregivers USING GIN(search_vector);
CREATE INDEX visits_search_idx ON visits USING GIN(search_vector);

-- Auto-update search vectors
CREATE TRIGGER clients_search_vector_update
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english',
    first_name, last_name, email, address_line1, city);
```

**Search query:**

```typescript
async function globalSearch(query: string, limit = 10) {
  const searchTerm = query.split(' ').join(' & ');

  // Search clients
  const clients = await knex('clients')
    .select('id', 'first_name', 'last_name', 'email', 'address_line1')
    .whereRaw('search_vector @@ to_tsquery(?)', [searchTerm])
    .orderByRaw('ts_rank(search_vector, to_tsquery(?)) DESC', [searchTerm])
    .limit(limit);

  // Search caregivers
  const caregivers = await knex('caregivers')
    .select('id', 'first_name', 'last_name', 'email')
    .whereRaw('search_vector @@ to_tsquery(?)', [searchTerm])
    .orderByRaw('ts_rank(search_vector, to_tsquery(?)) DESC', [searchTerm])
    .limit(limit);

  // Search visits (by client name, caregiver name, date)
  const visits = await knex('visits')
    .select('visits.*', 'clients.first_name', 'clients.last_name')
    .join('clients', 'visits.client_id', 'clients.id')
    .whereRaw('visits.search_vector @@ to_tsquery(?)', [searchTerm])
    .limit(limit);

  return {
    clients,
    caregivers,
    visits,
  };
}
```

### Option 2: Elasticsearch (More Powerful, for Scale)

**For larger deployments (1000+ clients), use Elasticsearch:**

- Index all entities in Elasticsearch
- Support fuzzy matching, typo tolerance
- Advanced relevance ranking
- Faceted search

---

## Search Features

### 1. As-You-Type Search

**Update results on every keystroke (debounced 200ms):**

```tsx
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

const debouncedSearch = useMemo(
  () =>
    debounce(async (q: string) => {
      if (q.length < 2) return;
      const data = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    }, 200),
  []
);

useEffect(() => {
  debouncedSearch(query);
}, [query]);
```

### 2. Keyboard Navigation

- `↑` / `↓` - Navigate results
- `Enter` - Open selected result
- `Cmd+Enter` - Open in new tab
- `ESC` - Close search
- `Tab` - Cycle through result categories

### 3. Recent Searches

**Store last 10 searches per user:**

```typescript
interface RecentSearch {
  query: string;
  timestamp: Date;
  result_clicked?: string; // e.g., "client:123"
}

// Show recent searches when search input is empty
```

### 4. Quick Actions

**Common actions accessible via search:**

- "Schedule visit" → Opens scheduling page
- "Add client" → Opens client creation form
- "Today" → Shows today's visits
- "Messages" → Opens messages

### 5. Search Shortcuts

**Support special syntax:**

- `client:mary` - Search only clients
- `caregiver:emma` - Search only caregivers
- `visit:today` - Today's visits
- `visit:11/08` - Visits on specific date

---

## Search Result Ranking

**Ranking factors:**

1. **Exact match** (highest priority)
   - "Mary Johnson" typed → "Mary Johnson" client = top result

2. **Partial match**
   - "Mary" typed → "Mary Johnson", "Mary Williams" = high results

3. **Recency**
   - Recent visits ranked higher
   - Recently modified clients ranked higher

4. **User's role**
   - Coordinators: prioritize clients, visits
   - Admins: prioritize reports, settings

5. **User's previous interactions**
   - If user frequently views "Mary Johnson", rank higher

---

## API Endpoint

**GET /api/search**

```typescript
interface SearchRequest {
  q: string;          // query string
  types?: string[];   // filter by type: ['clients', 'caregivers']
  limit?: number;     // max results per type (default 5)
}

interface SearchResponse {
  clients: SearchResult[];
  caregivers: SearchResult[];
  visits: SearchResult[];
  messages: SearchResult[];
  total: number;
  query: string;
}

interface SearchResult {
  type: 'client' | 'caregiver' | 'visit' | 'message';
  id: number;
  title: string;        // e.g., "Mary Johnson"
  subtitle?: string;    // e.g., "456 Oak St, Austin TX"
  url: string;          // e.g., "/clients/123"
  highlights?: string[]; // matched text snippets
  relevance_score: number;
}
```

---

## Analytics

**Track search behavior to improve platform:**

```sql
CREATE TABLE search_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  query TEXT,
  results_count INTEGER,
  clicked_result_type VARCHAR(50), -- client, caregiver, visit, etc.
  clicked_result_id INTEGER,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

**Insights:**
- What are users searching for most?
- Which searches return no results? (indicate missing features/data)
- Which results get clicked? (validate ranking algorithm)

**Example insights:**
- "50% of searches are for client names" → prioritize client results
- "20% of searches for 'today' return no results" → add quick action
- "Users search 'medications' but no results" → add medication search

---

## Success Criteria

- [ ] Global search accessible from every page (keyboard shortcut)
- [ ] Search results appear in <200ms
- [ ] 90% of searches find the correct result in top 3
- [ ] Keyboard navigation fully functional
- [ ] Recent searches saved and useful
- [ ] 80% reduction in "I can't find..." support tickets
- [ ] Mobile search works seamlessly

---

## Related Tasks

- Task 0063: Developer Experience Improvements
- Task 0080: Coordinator Quick Start Guide
- Task 0074: End-to-End User Journey Validation
