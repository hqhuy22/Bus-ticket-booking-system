# 📊 ScheduleReviews Component

Component hiển thị reviews và ratings cho một bus schedule cụ thể.

## 🎯 Usage

```jsx
import ScheduleReviews from '../components/reviews/ScheduleReviews';

function TripDetailsPage() {
  const scheduleId = 123; // From route params or props
  
  return (
    <div>
      <h1>Trip Details</h1>
      
      {/* Display reviews for this schedule */}
      <ScheduleReviews scheduleId={scheduleId} />
    </div>
  );
}
```

## 📋 Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `scheduleId` | number | ✅ Yes | ID của bus schedule cần hiển thị reviews |

## ✨ Features

### 1. Rating Summary Card
- Overall average rating (1-5 stars)
- Total review count
- Rating distribution chart (5⭐ → 1⭐)
- Category ratings:
  - Cleanliness
  - Comfort
  - Punctuality
  - Staff Service

### 2. Reviews List
- All reviews for the schedule
- User information
- Review date
- Star ratings
- Title and comment
- Category ratings (if provided)
- Verified trip badge
- Admin response (if any)

### 3. Sort Options
- Most Recent (default)
- Highest Rated
- Most Helpful

### 4. Vote System
- "Was this helpful?" buttons
- Helpful count
- Not Helpful count
- Updates in real-time

## 🎨 UI States

### Loading State
```jsx
<div className="text-center py-12">
  <div className="spinner"></div>
  <p>Loading reviews...</p>
</div>
```

### Empty State
```jsx
<div className="text-center p-6">
  <p>No reviews available for this trip yet.</p>
</div>
```

### Error State
```jsx
<div className="text-red-600">
  <p>Failed to load reviews</p>
</div>
```

### Success State
- Full review display with all features

## 🔄 Data Flow

```
Component Mount
    ↓
Fetch Reviews (API call)
    ↓
Display:
  - Rating Summary
  - Reviews List
    ↓
User Actions:
  - Sort reviews
  - Vote helpful/not helpful
    ↓
Update Display
```

## 📡 API Integration

### Endpoint Used
```javascript
GET /api/reviews/schedule/:scheduleId
Query: ?sortBy=createdAt&order=DESC
```

### Response Structure
```javascript
{
  reviews: [
    {
      id: 1,
      rating: 5,
      title: "Great trip!",
      comment: "...",
      customer: { firstName, lastName },
      helpfulCount: 10,
      notHelpfulCount: 2,
      // ...
    }
  ],
  stats: {
    averageRating: "4.5",
    totalReviews: 25,
    avgCleanliness: "4.3",
    avgComfort: "4.6",
    avgPunctuality: "4.4",
    avgStaff: "4.7",
    ratingDistribution: [
      { rating: 5, count: 15 },
      { rating: 4, count: 8 },
      // ...
    ]
  }
}
```

## 🎯 Business Logic

### Display Rules
- ✅ Only show reviews for completed schedules
- ✅ Only show visible reviews (`isVisible = true`)
- ✅ Public access (no login required to view)
- ✅ Anyone can vote (login required)

### Vote Handling
```javascript
const handleVote = async (reviewId, voteType) => {
  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please login to vote');
    return;
  }
  
  // Submit vote
  await axios.post(`/api/reviews/${reviewId}/vote`, { voteType });
  
  // Refresh reviews
  fetchReviews();
};
```

## 🎨 Styling

Component sử dụng Tailwind CSS với:
- Responsive grid layouts
- Card-based design
- Star rating visualization
- Progress bars cho distribution
- Hover effects
- Badge components

## 🔧 Customization

### Change Sort Default
```javascript
const [sortBy, setSortBy] = useState('rating'); // Sort by rating instead
```

### Add Pagination
```javascript
const [page, setPage] = useState(1);
const [limit] = useState(10);

// Update API call
const response = await axios.get(
  `${API_URL}/api/reviews/schedule/${scheduleId}?page=${page}&limit=${limit}`
);
```

### Custom Empty State
```javascript
if (stats?.totalReviews === 0) {
  return (
    <div className="custom-empty-state">
      <h3>No reviews yet</h3>
      <p>Be the first to review this trip!</p>
    </div>
  );
}
```

## 🧪 Testing

### Test Cases

```javascript
// 1. Component renders with valid scheduleId
<ScheduleReviews scheduleId={123} />
// Expected: Loads and displays reviews

// 2. No reviews available
<ScheduleReviews scheduleId={999} />
// Expected: Shows "No reviews available" message

// 3. Vote interaction
// User clicks "Helpful"
// Expected: Count increases, review refreshes

// 4. Sort changes
// User selects "Highest Rated"
// Expected: Reviews re-order by rating
```

## 📦 Dependencies

```json
{
  "lucide-react": "^0.x.x",  // Icons
  "axios": "^1.x.x",         // HTTP client
  "prop-types": "^15.x.x"    // Prop validation
}
```

## 🔒 Security

- ✅ Public read access
- ✅ Auth required for voting
- ✅ Token validation on vote endpoints
- ✅ XSS prevention (React auto-escapes)

## 📱 Responsive Design

```
Mobile (< 640px):
  - Single column layout
  - Stacked ratings
  - Compact vote buttons

Tablet (640px - 1024px):
  - Two column grid
  - Side-by-side ratings

Desktop (> 1024px):
  - Full layout
  - Four column category ratings
```

## 🎯 Integration Examples

### Example 1: Trip Details Page
```jsx
import ScheduleReviews from '../components/reviews/ScheduleReviews';

function TripDetails({ scheduleId }) {
  return (
    <div>
      <TripInfo scheduleId={scheduleId} />
      <ScheduleReviews scheduleId={scheduleId} />
    </div>
  );
}
```

### Example 2: Search Results
```jsx
function BusScheduleCard({ schedule }) {
  const [showReviews, setShowReviews] = useState(false);
  
  return (
    <div>
      <ScheduleInfo schedule={schedule} />
      
      <button onClick={() => setShowReviews(!showReviews)}>
        {showReviews ? 'Hide' : 'Show'} Reviews
      </button>
      
      {showReviews && (
        <ScheduleReviews scheduleId={schedule.id} />
      )}
    </div>
  );
}
```

### Example 3: Modal Display
```jsx
function ReviewsModal({ scheduleId, onClose }) {
  return (
    <Modal>
      <h2>Customer Reviews</h2>
      <ScheduleReviews scheduleId={scheduleId} />
      <button onClick={onClose}>Close</button>
    </Modal>
  );
}
```

---

## 📞 Support

For issues or questions:
- Check `REVIEWS_RATING_SYSTEM_COMPLETE.md`
- Review API documentation
- Test with sample schedule IDs

---

**Component Version**: 1.0  
**Last Updated**: December 31, 2025  
**Status**: ✅ Production Ready
