/**
 * Convert Database from Rs. to VND
 * Script chuyển đổi giá vé từ Rs. sang VND
 */

const { sequelize } = require('../models');

// Cấu hình
const CONFIG = {
  // Tỷ giá chuyển đổi: 1 Rs ≈ 300 VND (điều chỉnh theo nhu cầu)
  CONVERSION_RATE: 300,

  // Làm tròn đến nghìn đồng
  ROUND_TO_THOUSAND: true,

  // Dry run mode (test trước, không thực sự update)
  DRY_RUN: false,
};

/**
 * Làm tròn giá trị
 */
function roundPrice(value, roundToThousand = true) {
  if (!roundToThousand) {
    return Math.round(value);
  }
  return Math.round(value / 1000) * 1000;
}

/**
 * Chuyển đổi giá từ Rs. sang VND
 */
function convertPrice(rsPrice) {
  const vndPrice = rsPrice * CONFIG.CONVERSION_RATE;
  return roundPrice(vndPrice, CONFIG.ROUND_TO_THOUSAND);
}

/**
 * Main conversion function
 */
async function convertToVND() {
  try {
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   VND Conversion Script                        ║');
    console.log('╚════════════════════════════════════════════════╝\n');

    console.log('Configuration:');
    console.log('  - Conversion Rate:', CONFIG.CONVERSION_RATE, 'VND per Rs.');
    console.log('  - Round to Thousand:', CONFIG.ROUND_TO_THOUSAND);
    console.log('  - Dry Run Mode:', CONFIG.DRY_RUN);
    console.log('');

    if (CONFIG.DRY_RUN) {
      console.log('⚠️  DRY RUN MODE - No actual changes will be made\n');
    }

    // Step 1: Update bus_schedules
    console.log('📊 Step 1: Converting bus_schedules...');

    const [schedules] = await sequelize.query(`
      SELECT id, price 
      FROM bus_schedules 
      WHERE price IS NOT NULL
      LIMIT 5;
    `);

    if (schedules.length > 0) {
      console.log('   Sample conversions:');
      schedules.forEach((schedule) => {
        const oldPrice = parseFloat(schedule.price);
        const newPrice = convertPrice(oldPrice);
        console.log(
          `   ID ${schedule.id}: Rs. ${oldPrice.toFixed(2)} → ${newPrice.toLocaleString('vi-VN')} ₫`
        );
      });
    }

    if (!CONFIG.DRY_RUN) {
      await sequelize.query(`
        UPDATE bus_schedules 
        SET price = ROUND(price * ${CONFIG.CONVERSION_RATE} / 1000) * 1000
        WHERE price IS NOT NULL;
      `);

      const [result] = await sequelize.query(`
        SELECT COUNT(*) as count FROM bus_schedules WHERE price IS NOT NULL;
      `);

      console.log(`   ✓ Updated ${result[0].count} schedules\n`);
    } else {
      console.log('   ⊘ Skipped (Dry Run)\n');
    }

    // Step 2: Update bus_bookings
    console.log('📊 Step 2: Converting bus_bookings...');

    const [bookings] = await sequelize.query(`
      SELECT 
        id, 
        payment_busFare,
        payment_convenienceFee,
        payment_bankCharge,
        payment_totalPay
      FROM bus_bookings 
      WHERE payment_totalPay IS NOT NULL
      LIMIT 3;
    `);

    if (bookings.length > 0) {
      console.log('   Sample conversions:');
      bookings.forEach((booking) => {
        const oldTotal = parseFloat(booking.payment_totalPay);
        const newTotal = convertPrice(oldTotal);
        console.log(`   ID ${booking.id}:`);
        console.log(
          `     Total: Rs. ${oldTotal.toFixed(2)} → ${newTotal.toLocaleString('vi-VN')} ₫`
        );
      });
    }

    if (!CONFIG.DRY_RUN) {
      await sequelize.query(`
        UPDATE bus_bookings 
        SET 
          payment_busFare = ROUND(payment_busFare * ${CONFIG.CONVERSION_RATE} / 1000) * 1000,
          payment_convenienceFee = ROUND(payment_convenienceFee * ${CONFIG.CONVERSION_RATE} / 1000) * 1000,
          payment_bankCharge = ROUND(payment_bankCharge * ${CONFIG.CONVERSION_RATE} / 1000) * 1000,
          payment_totalPay = ROUND(payment_totalPay * ${CONFIG.CONVERSION_RATE} / 1000) * 1000
        WHERE id IS NOT NULL;
      `);

      const [result] = await sequelize.query(`
        SELECT COUNT(*) as count FROM bus_bookings WHERE payment_totalPay IS NOT NULL;
      `);

      console.log(`   ✓ Updated ${result[0].count} bookings\n`);
    } else {
      console.log('   ⊘ Skipped (Dry Run)\n');
    }

    // Step 3: Verify results
    console.log('📊 Step 3: Verifying results...');

    const [scheduleStats] = await sequelize.query(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        COUNT(*) as count
      FROM bus_schedules
      WHERE price IS NOT NULL;
    `);

    const [bookingStats] = await sequelize.query(`
      SELECT 
        MIN(payment_totalPay) as min_total,
        MAX(payment_totalPay) as max_total,
        AVG(payment_totalPay) as avg_total,
        COUNT(*) as count
      FROM bus_bookings
      WHERE payment_totalPay IS NOT NULL;
    `);

    console.log('   Schedule Prices:');
    console.log(`     Min: ${parseFloat(scheduleStats[0].min_price).toLocaleString('vi-VN')} ₫`);
    console.log(`     Max: ${parseFloat(scheduleStats[0].max_price).toLocaleString('vi-VN')} ₫`);
    console.log(`     Avg: ${parseFloat(scheduleStats[0].avg_price).toLocaleString('vi-VN')} ₫`);
    console.log(`     Count: ${scheduleStats[0].count}`);

    console.log('   Booking Totals:');
    console.log(`     Min: ${parseFloat(bookingStats[0].min_total).toLocaleString('vi-VN')} ₫`);
    console.log(`     Max: ${parseFloat(bookingStats[0].max_total).toLocaleString('vi-VN')} ₫`);
    console.log(`     Avg: ${parseFloat(bookingStats[0].avg_total).toLocaleString('vi-VN')} ₫`);
    console.log(`     Count: ${bookingStats[0].count}`);

    console.log('');

    if (CONFIG.DRY_RUN) {
      console.log('✅ DRY RUN COMPLETED - No changes made');
      console.log('   To apply changes, set DRY_RUN = false in the script');
    } else {
      console.log('✅ VND CONVERSION COMPLETED SUCCESSFULLY!');
      console.log('   All prices have been converted from Rs. to VND');
    }
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    console.error('   Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n📌 Database connection closed');
  }
}

// Run conversion
console.log('Starting VND conversion...\n');

convertToVND()
  .then(() => {
    console.log('\n✓ Process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Process failed:', error.message);
    process.exit(1);
  });
