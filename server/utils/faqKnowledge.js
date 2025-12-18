/**
 * FAQ Knowledge Base
 * Common questions about policies, routes, and booking process
 */

export const FAQ_CATEGORIES = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  CANCELLATION: 'cancellation',
  POLICY: 'policy',
  ROUTES: 'routes',
  GENERAL: 'general',
};

export const FAQ_DATABASE = [
  // Booking Process
  {
    category: FAQ_CATEGORIES.BOOKING,
    keywords: [
      'how to book',
      'booking process',
      'reserve',
      'make reservation',
      'book ticket',
      'how do i book',
    ],
    question: 'How do I book a ticket?',
    answer: `Booking a ticket is easy! Here's how:

1. **Search for trips**: Tell me your departure city, destination, and travel date. For example: "Find trips from Hanoi to Haiphong on January 5th"

2. **Choose your bus**: I'll show you available trips with prices, departure times, and seat availability.

3. **Select seats**: Click "Book now" to choose your preferred seats on the seat map.

4. **Enter details**: Provide passenger information (name, phone, email).

5. **Make payment**: Choose your payment method and complete the booking.

6. **Get confirmation**: You'll receive an e-ticket via email with your booking details.

Would you like to search for a trip now?`,
    suggestions: ['Search for trips', 'View popular routes', 'Booking policies'],
  },
  {
    category: FAQ_CATEGORIES.BOOKING,
    keywords: ['seat selection', 'choose seat', 'pick seat', 'seat preference'],
    question: 'How does seat selection work?',
    answer: `After choosing your trip, you'll see an interactive seat map showing:

🟢 **Green seats**: Available for booking
🔴 **Red seats**: Already booked
🟡 **Yellow seats**: Temporarily locked by other users (expires in 15 minutes)

Simply click on available seats to select them. You can select multiple seats if traveling with others. Your selected seats will be locked for 15 minutes while you complete the booking.`,
    suggestions: ['Book a trip', 'Cancellation policy', 'Payment methods'],
  },
  {
    category: FAQ_CATEGORIES.BOOKING,
    keywords: ['guest booking', 'without account', 'no registration', 'guest checkout'],
    question: 'Can I book without creating an account?',
    answer: `Yes! We offer **Guest Checkout** for your convenience. You can book tickets without creating an account - just provide your contact details during booking.

However, creating an account gives you benefits:
✅ View all your bookings in one place
✅ Track trip history and get personalized recommendations
✅ Faster checkout (saved details)
✅ Receive booking updates and notifications
✅ Write reviews for your trips

Would you like to create an account or continue as guest?`,
    suggestions: ['Book as guest', 'Create account', 'View my bookings'],
  },

  // Payment
  {
    category: FAQ_CATEGORIES.PAYMENT,
    keywords: ['payment', 'pay', 'payment method', 'how to pay', 'accepted payment'],
    question: 'What payment methods do you accept?',
    answer: `We accept multiple payment methods for your convenience:

💳 **Credit/Debit Cards**: Visa, Mastercard, American Express
🏦 **Bank Transfer**: Direct bank transfer (confirmation within 24 hours)
📱 **Digital Wallets**: PayPal, Apple Pay, Google Pay
💵 **Cash**: Pay at boarding (limited availability, must confirm booking)

All online payments are secured with SSL encryption. You'll receive instant confirmation for card and digital wallet payments.`,
    suggestions: ['Book a ticket', 'Payment issues', 'Refund policy'],
  },
  {
    category: FAQ_CATEGORIES.PAYMENT,
    keywords: ['payment failed', 'transaction error', 'payment not working'],
    question: 'What if my payment fails?',
    answer: `If your payment fails, don't worry! Here's what to do:

1. **Check your details**: Verify card number, expiry date, and CVV
2. **Check balance**: Ensure sufficient funds in your account
3. **Try another method**: Use a different card or payment method
4. **Contact bank**: Your bank might be blocking the transaction
5. **Try again**: Wait a few minutes and retry the payment

Your seat reservation is held for 15 minutes. If payment still fails, contact our support team and we'll help you complete the booking manually.

Need help with a specific payment issue?`,
    suggestions: ['Try booking again', 'Contact support', 'Alternative payment'],
  },

  // Cancellation & Refunds
  {
    category: FAQ_CATEGORIES.CANCELLATION,
    keywords: ['cancel', 'cancellation', 'refund', 'cancel booking', 'get refund'],
    question: 'What is your cancellation and refund policy?',
    answer: `Our cancellation policy is designed to be fair and flexible:

**Refund Rates:**
🕐 **24+ hours before departure**: 80% refund
🕐 **12-24 hours before**: 50% refund
🕐 **6-12 hours before**: 25% refund
❌ **Less than 6 hours**: No refund

**How to Cancel:**
1. Go to "My Bookings" or use Guest Lookup
2. Select the booking you want to cancel
3. Click "Cancel Booking"
4. Refund will be processed within 5-7 business days

**Note**: Refunds are processed to the original payment method.

Need to cancel a booking now?`,
    suggestions: ['View my bookings', 'Cancel a booking', 'Contact support'],
  },
  {
    category: FAQ_CATEGORIES.CANCELLATION,
    keywords: ['modify', 'change booking', 'reschedule', 'change date', 'change seat'],
    question: 'Can I modify my booking?',
    answer: `Currently, **direct modifications are not available**. If you need to change your trip:

**Option 1 - Cancel & Rebook:**
1. Cancel your existing booking (refund based on timing)
2. Book a new trip with desired date/seats

**Option 2 - Contact Support:**
For last-minute changes (within 24 hours), contact our support team. We'll try to accommodate your request based on availability.

**What can be changed:**
✅ Travel date (cancel & rebook)
✅ Seats (cancel & rebook)
❌ Passenger name (contact support for correction)

Would you like to cancel and rebook?`,
    suggestions: ['View my bookings', 'Book new trip', 'Contact support'],
  },

  // Policies
  {
    category: FAQ_CATEGORIES.POLICY,
    keywords: ['id required', 'identification', 'document needed', 'what to bring'],
    question: 'What documents do I need for boarding?',
    answer: `Please bring these documents when boarding:

📋 **Required:**
• Valid government-issued ID (passport, driver's license, national ID)
• Booking confirmation (e-ticket - printed or on mobile)

👶 **For Children:**
• Children below 5 years: Birth certificate
• Children 5-12 years: School ID or birth certificate

🎫 **E-Ticket Information:**
Your e-ticket includes:
• Booking reference number
• QR code for quick check-in
• Seat numbers
• Departure time and location

**Important**: Arrive at least 15 minutes before departure for smooth boarding!`,
    suggestions: ['Download e-ticket', 'Boarding locations', 'Book a trip'],
  },
  {
    category: FAQ_CATEGORIES.POLICY,
    keywords: ['luggage', 'baggage', 'bags allowed', 'carry on', 'checked luggage'],
    question: 'What is the baggage policy?',
    answer: `Our baggage policy ensures comfort for all passengers:

🎒 **Allowed Luggage:**
• **2 bags per passenger** (1 checked + 1 carry-on)
• Checked bag: Max 20kg (44 lbs)
• Carry-on: Max 7kg (15 lbs)

📦 **Size Limits:**
• Checked: 75cm x 50cm x 30cm (30" x 20" x 12")
• Carry-on: 55cm x 40cm x 20cm (22" x 16" x 8")

🚫 **Prohibited Items:**
• Flammable materials
• Weapons or sharp objects
• Illegal substances
• Live animals (except service dogs with documentation)

💰 **Excess Baggage:**
Additional bags: $10 per bag (subject to space availability)

Please label your bags with your name and contact information!`,
    suggestions: ['Book a trip', 'Other policies', 'Contact support'],
  },
  {
    category: FAQ_CATEGORIES.POLICY,
    keywords: ['children', 'kids', 'infant', 'child ticket', 'child policy'],
    question: 'What is the policy for children?',
    answer: `Child ticket policy:

👶 **Infants (0-5 years):**
• Travel **FREE** if sitting on parent's lap (no separate seat)
• If seat required: 50% of adult fare
• Must be accompanied by adult (18+)

🧒 **Children (5-12 years):**
• 50% of adult fare
• Must be accompanied by adult
• Separate seat required

👦 **Teens (12+ years):**
• Full adult fare
• Can travel alone (parental consent form required for 12-15 years)

📋 **Required Documents:**
• Birth certificate or school ID
• Guardian's contact information

Safety is our priority! Children must remain seated during the journey.`,
    suggestions: ['Book family trip', 'Other policies', 'Search trips'],
  },

  // Routes
  {
    category: FAQ_CATEGORIES.ROUTES,
    keywords: ['routes', 'destinations', 'where do you go', 'cities served', 'popular routes'],
    question: 'What routes do you operate?',
    answer: `We operate bus services across major cities! 🚌

🌟 **Popular Routes:**
• Hanoi ↔ Haiphong (3-4 hours)
• Hanoi ↔ Halong Bay (3.5-4 hours)  
• Ho Chi Minh ↔ Vung Tau (2-3 hours)
• Danang ↔ Hoi An (45 mins - 1 hour)
• Hanoi ↔ Ninh Binh (2-3 hours)

🗺️ **Coverage:**
We serve 50+ cities nationwide with daily departures!

To see all available routes for your travel dates, just tell me:
• Where you're traveling from
• Where you want to go
• Your preferred date

I'll show you all available options with times and prices!`,
    suggestions: ['Search Hanoi to Haiphong', 'Search HCMC to Vung Tau', 'All routes'],
  },
  {
    category: FAQ_CATEGORIES.ROUTES,
    keywords: ['schedule', 'departure time', 'frequency', 'how often', 'daily buses'],
    question: 'How frequent are the buses?',
    answer: `Our bus frequency varies by route popularity:

🚌 **Major Routes** (e.g., Hanoi-Haiphong):
• Every 1-2 hours from 6:00 AM to 10:00 PM
• Peak times: Every 30-45 minutes (7-9 AM, 5-7 PM)

🚌 **Regular Routes:**
• Every 2-4 hours
• 4-8 departures daily

🚌 **Long-Distance Routes:**
• 2-4 departures daily (morning, afternoon, evening, overnight)

📅 **Schedules vary by:**
• Day of week (more buses on weekends)
• Season (holiday periods have extra services)
• Demand

Tell me your route and date, and I'll show you all available departure times!`,
    suggestions: ['Search for trips', 'Popular routes', 'Weekend schedules'],
  },

  // General
  {
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['amenities', 'facilities', 'ac bus', 'wifi', 'comfort', 'bus features'],
    question: 'What amenities are available on buses?',
    answer: `Our buses are equipped for your comfort! 🌟

❄️ **Standard on All Buses:**
• Air conditioning
• Reclining seats
• Seat belts
• Reading lights
• Overhead storage

✨ **Premium/Luxury Buses:**
• WiFi connectivity
• USB charging ports
• Entertainment system
• Extra legroom
• Snacks and water
• Blankets and pillows
• Restroom (on long-distance routes)

🚍 **Bus Types:**
When searching, you'll see the bus type and amenities listed. Look for:
• "AC" - Air conditioned
• "Sleeper" - Beds for overnight travel
• "Semi-Sleeper" - Fully reclining seats
• "Seater" - Standard seats

Amenities vary by route and bus operator. Check the trip details when booking!`,
    suggestions: ['Search luxury buses', 'Book a trip', 'View all routes'],
  },
  {
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['contact', 'support', 'help', 'customer service', 'phone number', 'email'],
    question: 'How can I contact customer support?',
    answer: `We're here to help! 💬

📞 **Phone Support:**
• Hotline: 1-800-BUS-HELP (1-800-287-4357)
• Available: 24/7
• Average wait: Under 5 minutes

📧 **Email Support:**
• support@busbooking.com
• Response time: Within 24 hours
• For non-urgent inquiries

💬 **Live Chat:**
• You're chatting with me now! I can help with most questions
• For complex issues, I'll connect you to a human agent

🏢 **Office Locations:**
Available in major cities - check our website for addresses

**What I can help with:**
✅ Search and book trips
✅ Answer policy questions
✅ Check booking status
✅ Provide route information

How can I assist you today?`,
    suggestions: ['Search for trips', 'Check my booking', 'FAQs'],
  },
  {
    category: FAQ_CATEGORIES.GENERAL,
    keywords: ['track bus', 'bus location', 'live tracking', 'where is my bus'],
    question: 'Can I track my bus in real-time?',
    answer: `Currently, **live bus tracking is not available** in our system.

However, you can:

📱 **Before Your Trip:**
• Check departure time in your e-ticket
• Get SMS notification 2 hours before departure
• Arrive 15 minutes early at departure point

🚌 **On Travel Day:**
• Buses depart on scheduled time
• In case of delays, we'll send SMS/email updates
• Contact our hotline for real-time updates: 1-800-BUS-HELP

📍 **Departure Locations:**
All departure points are listed in your e-ticket with addresses and maps.

🔔 **Enable Notifications:**
Turn on booking notifications to receive updates about any schedule changes!

Would you like to book a trip or check your booking?`,
    suggestions: ['Book a trip', 'My bookings', 'Notification settings'],
  },
];

/**
 * Find matching FAQ based on user question
 * @param {string} question - User's question
 * @returns {Object|null} - Matching FAQ or null
 */
export const findMatchingFAQ = (question) => {
  const lowerQuestion = question.toLowerCase();

  // Find best matching FAQ based on keywords
  let bestMatch = null;
  let highestScore = 0;

  for (const faq of FAQ_DATABASE) {
    let score = 0;

    // Check how many keywords match
    for (const keyword of faq.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word keywords score higher
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }

  // Return match if score is significant
  return highestScore >= 2 ? bestMatch : null;
};

/**
 * Get FAQ suggestions based on category
 * @param {string} category - FAQ category
 * @returns {Array<string>} - Related questions
 */
export const getFAQSuggestions = (category) => {
  const categoryFAQs = FAQ_DATABASE.filter((faq) => faq.category === category);
  return categoryFAQs.slice(0, 3).map((faq) => faq.question);
};

/**
 * Get all FAQ categories
 * @returns {Array<Object>} - Categories with counts
 */
export const getAllCategories = () => {
  const categories = {};

  FAQ_DATABASE.forEach((faq) => {
    if (!categories[faq.category]) {
      categories[faq.category] = {
        name: faq.category,
        count: 0,
        questions: [],
      };
    }
    categories[faq.category].count++;
    categories[faq.category].questions.push(faq.question);
  });

  return Object.values(categories);
};

export default {
  FAQ_DATABASE,
  FAQ_CATEGORIES,
  findMatchingFAQ,
  getFAQSuggestions,
  getAllCategories,
};
