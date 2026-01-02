# Kanban Workflow Visual Guide

## 📅 Schedule Management Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUS SCHEDULE LIFECYCLE                                │
└─────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  Draft  │ 📝
    │ #94a3b8 │ ← Planning, not visible to customers
    └────┬────┘
         │ Publish (validate all fields)
         ↓
    ┌──────────┐
    │Scheduled │ 📅
    │ #3b82f6  │ ← Published, accepting bookings
    └─┬──────┬─┘
      │      │ Cancel (with notification)
      │      ↓
      │   ┌───────────┐
      │   │ Cancelled │ ❌
      │   │  #ef4444  │ ← Refund processing, notify passengers
      │   └───────────┘
      │
      │ Mark Departed (on departure time)
      ↓
    ┌─────────────┐
    │ In Progress │ 🚌
    │   #f59e0b   │ ← Trip ongoing, read-only
    └──────┬──────┘
           │ Mark Completed (on arrival)
           ↓
    ┌───────────┐
    │ Completed │ ✅
    │  #10b981  │ ← Enable reviews, generate reports
    └───────────┘

AUTOMATIONS:
• on_publish → notify_subscribers
• before_departure (24h) → send_reminders
• on_departure → update_status, lock_bookings
• on_completion → update_bookings, request_reviews, generate_analytics
• on_cancellation → notify_passengers, process_refunds, release_bus
```

---

## 🎫 Booking Management Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BOOKING LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌─────────┐
        ┌───────────│ Pending │ ⏳
        │           │ #fbbf24 │ ← Awaiting payment (15 min timer)
        │           └─┬───┬───┘
        │             │   │ Payment Success
        │             │   ↓
        │ Timer       │  ┌───────────┐
        │ Expired     │  │ Confirmed │ ✅
        │ (15 min)    │  │  #22c55e  │ ← Ticket issued, seat booked
        ↓             │  └─────┬─────┘
    ┌─────────┐      │        │
    │ Expired │ ⏰   │        │ Trip Completed
    │ #6b7280 │      │        ↓
    └─────────┘      │   ┌───────────┐
                     │   │ Completed │ 🎉
    User Cancel      │   │  #3b82f6  │ ← Enable review, award points
    ↓                │   └───────────┘
    ┌────────────┐   │
    │ Cancelled  │ ❌ │
    │  #ef4444   │←──┘
    └────────────┘
    ↑
    └── Process refund based on policy

REFUND POLICY:
• >24h before: 100% refund
• 12-24h before: 50% refund
• <12h before: No refund

AUTOMATIONS:
• on_create → lock_seats, start_timer (15 min)
• timer_expired → expire_booking, release_seats
• on_confirmation → send_confirmation_email, confirm_seat_lock, update_schedule
• before_departure (24h) → send_reminder
• on_completion → award_loyalty_points, request_review, generate_analytics
• on_cancellation → release_seats, calculate_refund, send_email, process_refund
• on_expiry → release_seat_locks, send_notification, delete_booking (24h later)
```

---

## 🚌 Bus Maintenance Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   BUS MAINTENANCE LIFECYCLE                              │
└─────────────────────────────────────────────────────────────────────────┘

    ┌────────┐
    │ Active │ ✅
    │#10b981 │ ← Operational, can be scheduled
    └───┬────┘
        │ Schedule Maintenance
        ↓
    ┌───────────────────────┐
    │Scheduled Maintenance  │ 📅
    │      #f59e0b          │ ← No new schedules after date
    └──────────┬────────────┘
               │ Begin Maintenance
               ↓
    ┌─────────────────┐
    │  Maintenance    │ 🔧
    │    #ef4444      │ ← Cannot be scheduled, log activities
    └────────┬────────┘
             │ Send for Inspection
             ↓
    ┌──────────────────┐
    │Safety Inspection │ 🔍
    │    #8b5cf6       │ ← Certification required
    └───┬──────────┬───┘
        │ Pass     │ Fail (back to maintenance)
        ↓          ↓
    ┌────────┐  ┌─────────────────┐
    │ Active │  │   Maintenance   │
    │#10b981 │  │    #ef4444      │
    └────┬───┘  └─────────────────┘
         │
         │ Decommission (permanent)
         ↓
    ┌─────────┐
    │ Retired │ 📦
    │ #6b7280 │ ← Historical data only, read-only
    └─────────┘

MAINTENANCE TYPES:
• Regular Service (every 3 months)
• Safety Inspection (every 6 months)
• Major Overhaul (annually)
• Emergency Repair (as needed)
```

---

## 🎨 Color Coding Reference

```
Status Colors:
├─ Active/Success    → #10b981 (Green)
├─ Scheduled/Info    → #3b82f6 (Blue)
├─ Pending/Warning   → #fbbf24 (Yellow)
├─ In Progress       → #f59e0b (Orange)
├─ Error/Cancelled   → #ef4444 (Red)
├─ Draft/Disabled    → #94a3b8 (Gray)
├─ Completed/Confirm → #22c55e (Bright Green)
└─ Special/Premium   → #8b5cf6 (Purple)
```

---

## 📊 Workflow Metrics Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                  SCHEDULE METRICS                           │
├─────────────────────────────────────────────────────────────┤
│ Total Schedules        │ 156                                │
│ Active (Scheduled)     │ 45  ━━━━━━━━━━━━░░░░  72%        │
│ In Progress            │ 8   ━━░░░░░░░░░░░░░░  13%        │
│ Completed              │ 85  ━━━━━━━━━━━━━━━━  98%        │
│ Cancelled              │ 2   ░░░░░░░░░░░░░░░░   2%        │
│ Completion Rate        │ 98% ━━━━━━━━━━━━━━━━  Excellent  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BOOKING METRICS                           │
├─────────────────────────────────────────────────────────────┤
│ Total Bookings         │ 432                                │
│ Confirmed              │ 385 ━━━━━━━━━━━━━━━━  89%        │
│ Pending                │ 12  ━░░░░░░░░░░░░░░░   3%        │
│ Expired                │ 15  ━░░░░░░░░░░░░░░░   3%        │
│ Cancelled              │ 20  ━━░░░░░░░░░░░░░░   5%        │
│ Confirmation Rate      │ 89% ━━━━━━━━━━━━━━━━  Good       │
│ Avg Booking Value      │ 456,000 VND                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   BUS FLEET STATUS                          │
├─────────────────────────────────────────────────────────────┤
│ Total Buses            │ 25                                 │
│ Active                 │ 22  ━━━━━━━━━━━━━━░░  88%        │
│ Maintenance            │ 2   ░░░░░░░░░░░░░░░░   8%        │
│ Inspection             │ 1   ░░░░░░░░░░░░░░░░   4%        │
│ Avg Maintenance Days   │ 3.5 days                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Transition Matrix

### Schedule Workflow
```
        │ Draft │ Scheduled │ In Progress │ Completed │ Cancelled
────────┼───────┼───────────┼─────────────┼───────────┼───────────
Draft   │   -   │     ✅    │      ❌     │     ❌    │     ❌
Sched'd │   ❌  │     -     │      ✅     │     ❌    │     ✅
InProg  │   ❌  │     ❌    │      -      │     ✅    │     ⚠️
Complet │   ❌  │     ❌    │      ❌     │     -     │     ❌
Cancel  │   ❌  │     ❌    │      ❌     │     ❌    │     -

✅ = Allowed    ❌ = Not Allowed    ⚠️ = Emergency Only
```

### Booking Workflow
```
        │ Pending │ Confirmed │ Completed │ Cancelled │ Expired
────────┼─────────┼───────────┼───────────┼───────────┼─────────
Pending │    -    │     ✅    │     ❌    │     ✅    │    ✅
Confirm │    ❌   │     -     │     ✅    │     ✅    │    ❌
Complet │    ❌   │     ❌    │     -     │     ❌    │    ❌
Cancel  │    ❌   │     ❌    │     ❌    │     -     │    ❌
Expired │    ❌   │     ❌    │     ❌    │     ❌    │    -
```

---

## 🎯 Implementation Example

### Frontend: Render Kanban Board

```javascript
import { SCHEDULE_WORKFLOW } from './config/kanbanWorkflows';

function ScheduleKanbanBoard() {
  const columns = SCHEDULE_WORKFLOW.columns;
  
  return (
    <div className="kanban-board">
      {columns.map(column => (
        <div 
          key={column.id}
          className="kanban-column"
          style={{ 
            borderTop: `4px solid ${column.color}`,
            background: column.backgroundColor 
          }}
        >
          <h3>
            <span>{column.icon}</span> {column.name}
          </h3>
          <p className="description">{column.description}</p>
          
          {/* Render items in this column */}
          {schedules
            .filter(s => s.status === column.status)
            .map(schedule => (
              <ScheduleCard 
                key={schedule.id} 
                schedule={schedule}
                allowedActions={column.allowedActions}
              />
            ))
          }
        </div>
      ))}
    </div>
  );
}
```

### Backend: Enforce Workflow Rules

```javascript
import { canTransition, getWorkflowConfig } from './config/kanbanWorkflows';

async function updateScheduleStatus(scheduleId, newStatus) {
  const schedule = await BusSchedule.findByPk(scheduleId);
  const workflow = getWorkflowConfig('BusSchedule');
  
  // Check if transition is allowed
  if (!canTransition(workflow, schedule.status, newStatus)) {
    throw new Error(
      `Cannot transition from ${schedule.status} to ${newStatus}`
    );
  }
  
  // Get transition config
  const transitionKey = `${schedule.status} -> ${newStatus}`;
  const transition = workflow.transitions[transitionKey];
  
  // Run validations
  for (const validation of transition.validations) {
    // Validate...
  }
  
  // Update status
  await schedule.update({ status: newStatus });
  
  // Trigger automations
  const column = workflow.columns.find(c => c.status === newStatus);
  for (const automation of column.automations) {
    if (automation.trigger === 'on_' + transition.action) {
      await runAutomation(automation, schedule);
    }
  }
}
```

---

**Last Updated**: January 2, 2026  
**Workflows**: 3 (Schedule, Booking, Maintenance)  
**Total States**: 15 across all workflows  
**Automations**: 20+ automated actions configured
