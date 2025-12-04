import axios from 'axios';

async function testSeatAvailability() {
  try {
    console.log('\n=== Testing Seat Availability API ===\n');

    const scheduleId = 2;
    const url = `http://localhost:4000/api/seats/availability/${scheduleId}`;

    console.log(`Fetching: ${url}\n`);

    const response = await axios.get(url);

    console.log('Response:');
    console.log(JSON.stringify(response.data, null, 2));

    console.log('\n=== Analysis ===');
    console.log(`Total seats: ${response.data.totalSeats}`);
    console.log(
      `Booked seats: [${response.data.bookedSeats.join(', ')}] (${response.data.bookedSeats.length} seats)`
    );
    console.log(
      `Locked seats: [${response.data.lockedSeats.map((l) => l.seatNumber).join(', ')}] (${response.data.lockedSeats.length} seats)`
    );
    console.log(`Available: ${response.data.availableSeatsCount}`);

    if (response.data.bookedSeats.includes('15') || response.data.bookedSeats.includes(15)) {
      console.log('\n✅ SUCCESS: Seat 15 is showing as BOOKED!');
    } else {
      console.log('\n❌ PROBLEM: Seat 15 is NOT showing as booked');
      console.log('Expected: Seat 15 should be in bookedSeats array');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSeatAvailability();
