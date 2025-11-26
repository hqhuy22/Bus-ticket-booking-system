import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Convert Vietnamese text to non-accented version for PDF display
 * PDFKit's built-in fonts don't support Vietnamese diacritics
 * This ensures text displays correctly without rendering errors
 * Example: "Hà Nội" -> "Ha Noi"
 */
const removeVietnameseAccents = (text) => {
  if (!text) return '';

  const vietnameseMap = {
    à: 'a',
    á: 'a',
    ả: 'a',
    ã: 'a',
    ạ: 'a',
    ă: 'a',
    ằ: 'a',
    ắ: 'a',
    ẳ: 'a',
    ẵ: 'a',
    ặ: 'a',
    â: 'a',
    ầ: 'a',
    ấ: 'a',
    ẩ: 'a',
    ẫ: 'a',
    ậ: 'a',
    đ: 'd',
    è: 'e',
    é: 'e',
    ẻ: 'e',
    ẽ: 'e',
    ẹ: 'e',
    ê: 'e',
    ề: 'e',
    ế: 'e',
    ể: 'e',
    ễ: 'e',
    ệ: 'e',
    ì: 'i',
    í: 'i',
    ỉ: 'i',
    ĩ: 'i',
    ị: 'i',
    ò: 'o',
    ó: 'o',
    ỏ: 'o',
    õ: 'o',
    ọ: 'o',
    ô: 'o',
    ồ: 'o',
    ố: 'o',
    ổ: 'o',
    ỗ: 'o',
    ộ: 'o',
    ơ: 'o',
    ờ: 'o',
    ớ: 'o',
    ở: 'o',
    ỡ: 'o',
    ợ: 'o',
    ù: 'u',
    ú: 'u',
    ủ: 'u',
    ũ: 'u',
    ụ: 'u',
    ư: 'u',
    ừ: 'u',
    ứ: 'u',
    ử: 'u',
    ữ: 'u',
    ự: 'u',
    ỳ: 'y',
    ý: 'y',
    ỷ: 'y',
    ỹ: 'y',
    ỵ: 'y',
    À: 'A',
    Á: 'A',
    Ả: 'A',
    Ã: 'A',
    Ạ: 'A',
    Ă: 'A',
    Ằ: 'A',
    Ắ: 'A',
    Ẳ: 'A',
    Ẵ: 'A',
    Ặ: 'A',
    Â: 'A',
    Ầ: 'A',
    Ấ: 'A',
    Ẩ: 'A',
    Ẫ: 'A',
    Ậ: 'A',
    Đ: 'D',
    È: 'E',
    É: 'E',
    Ẻ: 'E',
    Ẽ: 'E',
    Ẹ: 'E',
    Ê: 'E',
    Ề: 'E',
    Ế: 'E',
    Ể: 'E',
    Ễ: 'E',
    Ệ: 'E',
    Ì: 'I',
    Í: 'I',
    Ỉ: 'I',
    Ĩ: 'I',
    Ị: 'I',
    Ò: 'O',
    Ó: 'O',
    Ỏ: 'O',
    Õ: 'O',
    Ọ: 'O',
    Ô: 'O',
    Ồ: 'O',
    Ố: 'O',
    Ổ: 'O',
    Ỗ: 'O',
    Ộ: 'O',
    Ơ: 'O',
    Ờ: 'O',
    Ớ: 'O',
    Ở: 'O',
    Ỡ: 'O',
    Ợ: 'O',
    Ù: 'U',
    Ú: 'U',
    Ủ: 'U',
    Ũ: 'U',
    Ụ: 'U',
    Ư: 'U',
    Ừ: 'U',
    Ứ: 'U',
    Ử: 'U',
    Ữ: 'U',
    Ự: 'U',
    Ỳ: 'Y',
    Ý: 'Y',
    Ỷ: 'Y',
    Ỹ: 'Y',
    Ỵ: 'Y',
  };

  return String(text)
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');
};

/**
 * Generate E-Ticket PDF with professional design and branding
 * @param {Object} bookingData - Complete booking information
 * @param {string} outputPath - Path to save the PDF (optional)
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateETicket = async (bookingData) => {
  // Generate QR Code first (outside Promise)
  const qrData = JSON.stringify({
    ref: bookingData.bookingReference,
    date: bookingData.journeyDate,
    seats: bookingData.seatNumbers,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 150 });
  const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
  });

  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Use Helvetica as default font
    // Note: Helvetica has limited Vietnamese character support
    doc.font('Helvetica');

    // Company branding colors
    const primaryColor = '#6d4aff';
    const accentColor = '#0D8A4F';
    const textDark = '#1a1a1a';
    const textGray = '#666666';

    // Helper function to safely render Vietnamese text
    // PDFKit's Helvetica doesn't fully support Vietnamese diacritics
    // We'll use the text as-is and rely on PDF viewer's font substitution
    // const safeText = (text) => {
    //   if (!text) return '';
    //   // Ensure text is string and normalize Unicode
    //   return String(text).normalize('NFC');
    // };

    // Header with gradient background
    doc.rect(0, 0, doc.page.width, 150).fill(primaryColor);

    // Company logo/name
    doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold').text('QTechy Bus Booking', 50, 40);

    doc
      .fontSize(12)
      .fillColor('#ffffff')
      .font('Helvetica')
      .text('Your Trusted Travel Partner', 50, 80);

    // E-Ticket label
    doc
      .fontSize(24)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text('E-TICKET', doc.page.width - 200, 50);

    // Status badge
    const statusText =
      bookingData.status === 'confirmed'
        ? 'CONFIRMED'
        : bookingData.status === 'completed'
          ? 'COMPLETED'
          : 'PENDING';
    const statusColor =
      bookingData.status === 'confirmed'
        ? accentColor
        : bookingData.status === 'completed'
          ? '#0066cc'
          : '#ff9800';

    doc.rect(doc.page.width - 200, 90, 150, 30).fill(statusColor);
    doc
      .fontSize(14)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(statusText, doc.page.width - 195, 98, { width: 140, align: 'center' });

    // Reset position after header
    let currentY = 170;

    // Booking Reference - Prominent display
    doc.fontSize(10).fillColor(textGray).font('Helvetica').text('BOOKING REFERENCE', 50, currentY);

    currentY += 20;
    doc
      .fontSize(24)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(bookingData.bookingReference, 50, currentY);

    // QR Code on the right
    doc.image(qrBuffer, doc.page.width - 200, currentY - 20, { width: 120, height: 120 });

    currentY += 50;

    // Journey Details Section
    doc
      .fontSize(16)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('Journey Details', 50, currentY);

    currentY += 25;

    // Route display with arrow
    // Use removeVietnameseAccents for city names that may contain Vietnamese characters
    const departureText = removeVietnameseAccents(bookingData.departure);
    const arrivalText = removeVietnameseAccents(bookingData.arrival);

    doc.fontSize(20).fillColor(textDark).font('Helvetica-Bold').text(departureText, 50, currentY);

    doc
      .fontSize(16)
      .fillColor(primaryColor)
      .text('  →  ', 50 + doc.widthOfString(departureText), currentY);

    doc
      .fontSize(20)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text(arrivalText, 50 + doc.widthOfString(departureText) + 40, currentY);

    currentY += 40;

    // Journey info grid
    const journeyInfo = [
      {
        label: 'Journey Date',
        value: new Date(bookingData.journeyDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      },
      { label: 'Departure Time', value: bookingData.booking_startTime },
      { label: 'Arrival Time', value: bookingData.booking_endTime },
      { label: 'Bus Route', value: `Route ${bookingData.routeNo}` },
    ];

    journeyInfo.forEach((info, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 50 + col * 250;
      const y = currentY + row * 50;

      doc.fontSize(9).fillColor(textGray).font('Helvetica').text(info.label, x, y);

      doc
        .fontSize(12)
        .fillColor(textDark)
        .font('Helvetica-Bold')
        .text(info.value, x, y + 15);
    });

    currentY += 120;

    // Passenger & Seat Information
    doc
      .fontSize(16)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('Passenger & Seat Information', 50, currentY);

    currentY += 25;

    // Seats display
    doc.fontSize(10).fillColor(textGray).font('Helvetica').text('SEAT NUMBER(S)', 50, currentY);

    doc
      .fontSize(18)
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .text(
        Array.isArray(bookingData.seatNumbers)
          ? bookingData.seatNumbers.join(', ')
          : bookingData.seatNumbers,
        50,
        currentY + 18
      );

    currentY += 55;

    // Passenger list
    if (bookingData.passengers && bookingData.passengers.length > 0) {
      bookingData.passengers.forEach((passenger, index) => {
        if (index > 0) currentY += 35;

        // Encode passenger name for Vietnamese support
        const passengerName = removeVietnameseAccents(passenger.name);

        doc
          .fontSize(11)
          .fillColor(textDark)
          .font('Helvetica-Bold')
          .text(`Passenger ${index + 1}: ${passengerName}`, 50, currentY);

        doc
          .fontSize(9)
          .fillColor(textGray)
          .font('Helvetica')
          .text(
            `Seat: ${passenger.seatNumber} | Age: ${passenger.age} | Gender: ${passenger.gender}`,
            50,
            currentY + 15
          );
      });
      currentY += 50;
    }

    // Pickup & Dropoff Points
    if (bookingData.pickupPoint || bookingData.dropoffPoint) {
      doc
        .fontSize(16)
        .fillColor(textDark)
        .font('Helvetica-Bold')
        .text('Boarding Points', 50, currentY);

      currentY += 25;

      if (bookingData.pickupPoint) {
        doc.fontSize(10).fillColor(textGray).font('Helvetica').text('PICKUP POINT', 50, currentY);

        doc
          .fontSize(11)
          .fillColor(textDark)
          .font('Helvetica-Bold')
          .text(removeVietnameseAccents(bookingData.pickupPoint), 50, currentY + 15);

        currentY += 40;
      }

      if (bookingData.dropoffPoint) {
        doc.fontSize(10).fillColor(textGray).font('Helvetica').text('DROP-OFF POINT', 50, currentY);

        doc
          .fontSize(11)
          .fillColor(textDark)
          .font('Helvetica-Bold')
          .text(removeVietnameseAccents(bookingData.dropoffPoint), 50, currentY + 15);

        currentY += 45;
      }
    }

    // Payment Summary
    doc
      .fontSize(16)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('Payment Summary', 50, currentY);

    currentY += 25;

    const paymentDetails = [
      { label: 'Bus Fare', amount: bookingData.payment_busFare },
      { label: 'Convenience Fee', amount: bookingData.payment_convenienceFee },
      { label: 'Bank Charges', amount: bookingData.payment_bankCharge },
    ];

    paymentDetails.forEach((item) => {
      doc.fontSize(10).fillColor(textGray).font('Helvetica').text(item.label, 50, currentY);

      doc
        .fontSize(10)
        .fillColor(textDark)
        .font('Helvetica')
        .text(`Rs. ${parseFloat(item.amount).toFixed(2)}`, doc.page.width - 150, currentY, {
          align: 'right',
        });

      currentY += 20;
    });

    // Total amount - highlighted
    doc.rect(50, currentY, doc.page.width - 100, 35).fill('#f8f9fa');

    doc
      .fontSize(12)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('TOTAL AMOUNT PAID', 60, currentY + 10);

    doc
      .fontSize(14)
      .fillColor(accentColor)
      .font('Helvetica-Bold')
      .text(
        `Rs. ${parseFloat(bookingData.payment_totalPay).toFixed(2)}`,
        doc.page.width - 160,
        currentY + 10,
        { align: 'right' }
      );

    currentY += 55;

    // Important Instructions
    doc
      .fontSize(14)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('Important Instructions', 50, currentY);

    currentY += 20;

    const instructions = [
      '• Please arrive at the boarding point at least 15 minutes before departure time.',
      '• Carry a valid government-issued ID proof for verification.',
      '• Present this e-ticket (printed or digital) to the bus staff.',
      '• Seat numbers are assigned and cannot be changed.',
      '• Cancellation and refund subject to company policies.',
    ];

    doc.fontSize(9).fillColor(textGray).font('Helvetica');

    instructions.forEach((instruction) => {
      doc.text(instruction, 50, currentY, { width: doc.page.width - 100 });
      currentY += 20;
    });

    // Footer
    const footerY = doc.page.height - 80;
    doc.rect(0, footerY, doc.page.width, 80).fill('#f8f9fa');

    doc
      .fontSize(10)
      .fillColor(textDark)
      .font('Helvetica-Bold')
      .text('QTechy Bus Booking System', 50, footerY + 20, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc
      .fontSize(8)
      .fillColor(textGray)
      .font('Helvetica')
      .text('For support: support@qtechy.com | Helpline: +94 11 234 5678', 50, footerY + 38, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc
      .fontSize(7)
      .fillColor(textGray)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 55, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc.end();
  });

  return buffer;
};

/**
 * Generate filename for the ticket
 */
export const generateTicketFilename = (bookingReference) => {
  return `ticket-${bookingReference}.pdf`;
};

export default {
  generateETicket,
  generateTicketFilename,
};
