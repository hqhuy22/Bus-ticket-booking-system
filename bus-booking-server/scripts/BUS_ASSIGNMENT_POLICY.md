# 🚌 Bus Assignment Policy

## 📋 Overview

Seed data đã được cập nhật để tuân theo quy tắc: **Một xe buýt chỉ được assign cho MỘT chuyến tại một thời điểm cho đến khi chuyến đó hoàn thành (status = 'Completed')**.

## 🎯 Business Rule

### Before (Old Logic - ❌ WRONG)
```
Bus #1: 
  - Day 0: Schedule A (In Progress)
  - Day 0: Schedule B (Scheduled) ❌ CONFLICT!
  - Day 1: Schedule C (Scheduled) ❌ CONFLICT!
```
**Problem**: Cùng một xe được assign cho nhiều chuyến cùng lúc → Không hợp lý!

### After (New Logic - ✅ CORRECT)
```
Bus #1:
  - Day 0: Schedule A (In Progress)
  - Day 1: SKIP (Bus still on Schedule A)
  - Day 2: Schedule A → Completed ✅
  - Day 3: Schedule B (Scheduled) ✅
  - Day 4: SKIP (Bus still on Schedule B)
  - Day 5: Schedule B → Completed ✅
  - Day 6: Schedule C (Scheduled) ✅
```
**Solution**: Xe chỉ nhận chuyến mới khi chuyến cũ đã hoàn thành!

## 🔧 Implementation

### Key Functions

#### 1. Bus Assignment Tracking
```javascript
const busAssignments = new Map(); 
// Structure: busId -> { scheduleId, status, day }
```

#### 2. Can Assign Check
```javascript
const canAssignBus = (busId) => {
  const assignment = busAssignments.get(busId);
  if (!assignment) return true; // Never assigned
  if (assignment.status === 'Completed') return true; // Previous trip done
  return false; // Still on active trip
};
```

#### 3. Schedule Status Logic
```javascript
const getScheduleStatus = (day, assignedDay) => {
  if (day === 0) return 'In Progress'; // First day = active
  if (day - assignedDay >= 2) return 'Completed'; // Complete after 2 days
  return 'Scheduled'; // Future trips
};
```

## 📊 Example Scenario

### Input Data
- **5 Buses**: Bus #0, #1, #2, #3, #4
- **14 Days**: Day 0 (today) → Day 13
- **Multiple Routes**: Various routes with different schedules

### Bus #0 Assignment Timeline

| Day | Route | Action | Status | Reason |
|-----|-------|--------|--------|--------|
| 0 | 101 | ✅ Assigned | In Progress | First assignment |
| 1 | - | ❌ Skipped | - | Bus still on route 101 |
| 2 | - | ❌ Skipped | - | Bus still on route 101 |
| 3 | 101 | ✅ Completed | Completed | Trip finished after 2 days |
| 3 | 101 | ✅ Assigned | Scheduled | New trip can start |
| 4 | - | ❌ Skipped | - | Bus on new trip |
| 5 | 101 | ✅ Completed | Completed | Trip finished |
| 5 | 101 | ✅ Assigned | Scheduled | Another trip |
| ... | ... | ... | ... | ... |

### Bus #1 Assignment Timeline

| Day | Route | Action | Status | Reason |
|-----|-------|--------|--------|--------|
| 0 | 102 | ✅ Assigned | Scheduled | First assignment |
| 1 | - | ❌ Skipped | - | Bus still on route 102 |
| 2 | 102 | ✅ Completed | Completed | Trip finished |
| 2 | 102 | ✅ Assigned | Scheduled | New trip |
| 3 | - | ❌ Skipped | - | Bus on trip |
| 4 | 102 | ✅ Completed | Completed | Trip finished |
| 4 | 102 | ✅ Assigned | Scheduled | New trip |
| ... | ... | ... | ... | ... |

## 🔍 Code Flow

```
FOR each day (0 to 13):
  FOR each bus (0 to 4):
    IF canAssignBus(busId):
      CREATE schedule with status:
        - Day 0: "In Progress"
        - Day < 2 days since assigned: "Scheduled"
        - Day >= 2 days since assigned: "Completed"
      
      UPDATE busAssignments:
        - scheduleId
        - status
        - day (assignment day)
    ELSE:
      SKIP (bus not available)
```

## 📈 Benefits

### 1. **Realistic Data** ✅
- Mirrors real-world bus operations
- One bus cannot be in two places at once
- Proper schedule management

### 2. **Database Integrity** ✅
- No conflicting schedules
- Proper foreign key relationships
- Clean test data

### 3. **Testing Accuracy** ✅
- API tests work correctly
- Frontend displays accurate data
- No confusing overlapping schedules

### 4. **Business Logic** ✅
- Validates bus availability
- Enforces operational constraints
- Prevents booking conflicts

## 📝 Seed Data Results

With this new logic, you'll get approximately:

```
Total Buses: 5
Total Days: 14
Expected Schedules: ~35-40 (instead of 100+)

Breakdown per bus:
- Bus #0: ~7 schedules (one every 2 days)
- Bus #1: ~7 schedules
- Bus #2: ~7 schedules
- Bus #3: ~7 schedules
- Bus #4: ~7 schedules
```

## 🚀 Running Seed

```bash
# Reset database and seed
npm run sync-db
npm run seed

# Expected output:
# 📅 Seeding bus schedules...
#   ✅ Created 35 bus schedules
#   ℹ️  Bus assignment policy: One bus = One active trip until completed
```

## 🔎 Verification Queries

### Check Bus Assignments
```sql
-- See all schedules for Bus #0
SELECT 
  busId,
  departure_date,
  departure_time,
  status,
  busScheduleID
FROM "BusSchedules"
WHERE busId = 1
ORDER BY departure_date, departure_time;

-- Expected: No overlapping "In Progress" or "Scheduled" trips
```

### Check for Conflicts
```sql
-- Find buses with multiple active schedules (should be 0)
SELECT 
  busId,
  COUNT(*) as active_trips
FROM "BusSchedules"
WHERE status IN ('In Progress', 'Scheduled')
GROUP BY busId
HAVING COUNT(*) > 1;

-- Expected: Empty result (no conflicts)
```

### Daily Schedule Count
```sql
-- Count schedules per day
SELECT 
  departure_date,
  COUNT(*) as schedule_count,
  COUNT(DISTINCT busId) as unique_buses
FROM "BusSchedules"
GROUP BY departure_date
ORDER BY departure_date;

-- Expected: Max 5 schedules per day (one per bus)
```

## ⚠️ Important Notes

1. **Status Lifecycle**:
   - `Scheduled` → Future trips
   - `In Progress` → Currently active
   - `Completed` → Finished (bus available)

2. **Completion Time**:
   - Schedules auto-complete after 2 days from assignment
   - This is configurable in `getScheduleStatus()`

3. **Day 0 Special Case**:
   - First schedule always `In Progress`
   - Simulates "bus currently on trip"

4. **Skip Logic**:
   - When bus unavailable, day is skipped
   - No error thrown, just silent skip
   - Keeps data clean

## 🛠️ Customization

### Change Completion Time
```javascript
const getScheduleStatus = (day, assignedDay) => {
  if (day === 0) return 'In Progress';
  if (day - assignedDay >= 3) return 'Completed'; // 3 days instead of 2
  return 'Scheduled';
};
```

### Add More Buses
```javascript
// In seedBuses() function, create more buses
// New buses will automatically get schedules
```

### Adjust Schedule Frequency
```javascript
// Modify the completion time to create more/fewer trips
// Shorter time = more trips per bus
// Longer time = fewer trips per bus
```

## ✅ Validation Checklist

After running seed:

- [ ] Each bus has only 1 active schedule at a time
- [ ] No overlapping "In Progress" trips
- [ ] Schedules properly transition: Scheduled → In Progress → Completed
- [ ] Total schedules ≈ 35-40 (not 100+)
- [ ] Each bus has ~7 schedules over 14 days
- [ ] No database foreign key errors
- [ ] API endpoints return consistent data

## 📚 Related Files

- `scripts/seed.js` - Main seed file with new logic
- `models/BusSchedule.js` - Schedule model
- `models/Bus.js` - Bus model
- `controllers/busController.js` - Bus availability logic

---

**Updated**: January 3, 2026  
**Policy Version**: 2.0  
**Author**: QTechy Bus Booking Team
