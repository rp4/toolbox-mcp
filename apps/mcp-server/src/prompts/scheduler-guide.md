# Scheduler Tool Guide

## When to Use Scheduler

Use the **scheduler** tool when you need to:
- **Assign people to time slots** based on availability
- **Create work schedules** for teams (shifts, rotations, coverage)
- **Plan meetings** with multiple participants
- **Allocate resources** over time periods
- **Manage project timelines** with team assignments

## DO NOT use scheduler for:
- Process visualization (use swimlanes)
- Data anomaly detection (use needle_finder)
- Document linking (use tickntie)
- Relationship graphs (use auditverse)

## Input Structure

The scheduler tool requires three components:

### 1. People (Required)
Array of people/resources to be scheduled:
```json
{
  "people": [
    {
      "id": "emp_001",
      "name": "Alice Johnson"
    },
    {
      "id": "emp_002",
      "name": "Bob Smith"
    }
  ]
}
```

**Limits:**
- Min: 1 person
- Max: 500 people

### 2. Slots (Required)
Array of time slots to fill:
```json
{
  "slots": [
    {
      "id": "slot_monday_9am",
      "start": "2024-10-14T09:00:00Z",
      "end": "2024-10-14T17:00:00Z"
    }
  ]
}
```

**Time format:**
- Use ISO 8601 format: `"YYYY-MM-DDTHH:mm:ssZ"`
- Include timezone (Z for UTC or offset like +05:00)
- Example: `"2024-10-14T14:30:00-05:00"` (2:30 PM CST)

**Limits:**
- Min: 1 slot
- Max: 5,000 slots

### 3. Assignments (Required)
Array of person-to-slot assignments:
```json
{
  "assignments": [
    {
      "personId": "emp_001",
      "slotId": "slot_monday_9am"
    }
  ]
}
```

**Limits:**
- Max: 10,000 assignments

## Scheduling Strategies

### 1. Round-Robin Rotation
Distribute assignments evenly:
```
Week 1: Alice (Mon-Wed), Bob (Thu-Fri)
Week 2: Bob (Mon-Wed), Alice (Thu-Fri)
```

**Use for:** Fair distribution, shared responsibility

### 2. Availability-Based
Assign based on stated preferences:
```
Alice available: Mon, Wed, Fri
Bob available: Tue, Thu
→ Schedule accordingly
```

**Use for:** Part-time staff, flexible scheduling

### 3. Skill-Based
Match expertise to requirements:
```
Morning shift needs senior staff → Assign experienced team members
Evening shift allows junior staff → Assign newer employees
```

**Use for:** Quality requirements, training scenarios

### 4. Load Balancing
Ensure fair workload:
```
Target: Each person works 40 hours/week
Current: Alice 45hrs, Bob 35hrs
→ Adjust to balance
```

**Use for:** Preventing burnout, equity

### 5. Constraint Satisfaction
Respect hard/soft constraints:
```
Hard: No one works >12 hours/day
Soft: Prefer <8 hours/day
→ Optimize within constraints
```

**Use for:** Labor regulations, policies

## Common Use Cases

### Example 1: Customer Support Shift Coverage
```
People: 5 support agents
Slots: Mon-Fri, 6am-10pm (in 4-hour shifts)
Constraints:
- 24/7 coverage required
- Max 8 hours per person per day
- Min 2 people per shift for redundancy

Assignments:
- 6am-10am: Alice, Bob
- 10am-2pm: Carol, David
- 2pm-6pm: Eve, Alice
- 6pm-10pm: Bob, Carol
```

### Example 2: Meeting Room Scheduling
```
People: 3 teams (Engineering, Sales, HR)
Slots: Mon-Fri, 9am-5pm (hourly blocks)
Constraints:
- Each team needs conference room daily
- No overlapping bookings
- Sales prefers mornings

Assignments:
- Mon 9am: Sales
- Mon 10am: Engineering
- Mon 2pm: HR
```

### Example 3: On-Call Rotation
```
People: 4 engineers
Slots: Weekly on-call (7-day periods)
Constraints:
- Rotating schedule
- No one on-call 2 weeks in a row
- Fair distribution over quarter

Assignments:
- Week 1: Alice
- Week 2: Bob
- Week 3: Carol
- Week 4: David
- Week 5: Alice (cycle repeats)
```

## Best Practices

### 1. Clear Time Definitions
```json
{
  "id": "morning_shift_monday",
  "start": "2024-10-14T08:00:00-05:00",
  "end": "2024-10-14T12:00:00-05:00"
}
```
- Use full timestamps with timezones
- Be explicit about start/end boundaries
- Consider overlap for shift handoffs

### 2. Descriptive IDs
```json
{
  "id": "engineer_on_call_week_42",  // Good: descriptive
  "id": "slot_001",                   // Bad: meaningless
}
```

### 3. Validate Assignments
Before creating assignments:
- Check person availability
- Verify no double-booking
- Ensure slot exists
- Confirm constraints met

### 4. Handle Conflicts
If conflicts arise:
```json
// Conflict: Alice assigned to overlapping slots
{
  "personId": "alice",
  "slotId": "mon_9am",  // 9am-12pm
}
{
  "personId": "alice",
  "slotId": "mon_11am", // 11am-2pm  ← OVERLAP!
}
```
Solution: Reassign one slot to different person

## Output Format

The scheduler returns:
```json
{
  "people": [...],
  "slots": [...],
  "assignments": [...]
}
```

The UI will display:
- **Calendar view** with color-coded assignments
- **Person view** showing each person's schedule
- **Slot view** showing coverage for each time period
- **Download** as Excel or CSV

## Constraints to Consider

### Hard Constraints (Must satisfy)
- Labor laws (max hours, required breaks)
- Availability (people can't work when unavailable)
- Required coverage (minimum staffing levels)

### Soft Constraints (Prefer to satisfy)
- Work-life balance (avoid back-to-back shifts)
- Fairness (equal distribution)
- Preferences (preferred days/times)

## Optimization Goals

When creating schedules, optimize for:
1. **Coverage**: All slots filled
2. **Fairness**: Equal distribution
3. **Preferences**: Respect stated preferences
4. **Efficiency**: Minimize gaps and transitions
5. **Quality**: Right skills at right times

## Quality Checklist

Before submitting schedule:
- [ ] All critical slots are filled
- [ ] No person double-booked
- [ ] Workload is balanced
- [ ] Constraints are respected
- [ ] Timezone handling is correct
- [ ] IDs are unique and descriptive

## Limits
- Max people: 500
- Max slots: 5,000
- Max assignments: 10,000
- Name max length: 200 characters
