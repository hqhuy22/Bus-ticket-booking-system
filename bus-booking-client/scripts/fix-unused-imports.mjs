#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix
const filesToFix = [
  'src/components/Modal/Modal.jsx',
  'src/components/booking/BookingDetails.jsx',
  'src/components/booking/BookingInfo.jsx',
  'src/components/booking/TextCard.jsx',
  'src/components/booking/components/BookCard.jsx',
  'src/components/booking/components/SubTitle.jsx',
  'src/components/booking/components/Title.jsx',
  'src/components/bus/Bus.jsx',
  'src/components/bus/SeatColumn.jsx',
  'src/components/bus/SeatInfo.jsx',
  'src/components/bus/Seats.jsx',
  'src/components/button/MenuButton.jsx',
  'src/components/button/Switch.jsx',
  'src/components/card/FloatingCircles.jsx',
  'src/components/footer/Footer.jsx',
  'src/components/form/BookingForm.jsx',
  'src/components/header/MobileHeader.jsx',
  'src/components/header/SideNavigation.jsx',
  'src/components/header/TopHeader.jsx',
  'src/components/home/HeroSection.jsx',
  'src/components/home/SectionCard.jsx',
  'src/components/input/AuthInput.jsx',
  'src/components/input/AuthInputIcon.jsx',
  'src/components/input/DateInput.jsx',
  'src/components/input/TextInput.jsx',
  'src/layouts/BusLayout.jsx',
  'src/pages/Booking.jsx',
  'src/pages/BookingProceed.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Login.jsx',
  'src/pages/Register.jsx',
];

const rootDir = path.join(__dirname, '..');

filesToFix.forEach(file => {
  const filePath = path.join(rootDir, file);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove unused React import
    content = content.replace(/import React from ['"]react['"];?\n/g, '');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${file}`);
  } catch (err) {
    console.error(`✗ Error fixing ${file}:`, err.message);
  }
});

console.log('\nDone! Removed unused React imports.');
