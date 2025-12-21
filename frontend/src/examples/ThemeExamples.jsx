/**
 * Theme Usage Examples
 * Demonstrates how to use the global theme tokens in components
 */

import {
  AppShell,
  Card,
  Button,
  FormField,
  TextAreaField,
} from '../components/layout';
import { colors, typography, spacing } from '../theme/tokens';

/**
 * Example 1: Using AppShell Layout
 */
export function AppShellExample() {
  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-h4">My Application</h1>
          <Button variant="primary" size="md">
            Login
          </Button>
        </div>
      }
      nav={
        <ul className="space-y-2 p-4">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul>
      }
      footer={
        <div className="text-center py-4">
          <p className="text-caption text-gray-500">
            © 2026 QTechy Bus Booking
          </p>
        </div>
      }
    >
      <h2 className="text-h2 mb-4">Welcome to the Bus Booking System</h2>
      <p className="text-body">Your main content goes here...</p>
    </AppShell>
  );
}

/**
 * Example 2: Using Card Component
 */
export function CardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Default Card */}
      <Card padding="lg">
        <h3 className="text-h5 mb-2">Default Card</h3>
        <p className="text-body-sm text-gray-600">
          This is a default card with shadow.
        </p>
      </Card>

      {/* Outlined Card */}
      <Card variant="outlined" padding="lg">
        <h3 className="text-h5 mb-2">Outlined Card</h3>
        <p className="text-body-sm text-gray-600">
          This card has a border instead of shadow.
        </p>
      </Card>

      {/* Elevated Card with Header and Footer */}
      <Card
        variant="elevated"
        padding="lg"
        header={<h3 className="text-h5">Card Header</h3>}
        footer={
          <Button variant="primary" fullWidth>
            Action
          </Button>
        }
      >
        <p className="text-body-sm text-gray-600">
          Card with header and footer sections.
        </p>
      </Card>

      {/* Clickable/Hoverable Card */}
      <Card
        variant="default"
        padding="lg"
        hoverable
        onClick={() => console.log('Card clicked!')}
      >
        <h3 className="text-h5 mb-2">Interactive Card</h3>
        <p className="text-body-sm text-gray-600">
          This card has hover effects and is clickable.
        </p>
      </Card>
    </div>
  );
}

/**
 * Example 3: Using Button Component
 */
export function ButtonExample() {
  return (
    <div className="space-y-6">
      {/* Button Variants */}
      <div className="flex flex-wrap gap-4">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outlined">Outlined Button</Button>
        <Button variant="ghost">Ghost Button</Button>
        <Button variant="danger">Danger Button</Button>
        <Button variant="success">Success Button</Button>
      </div>

      {/* Button Sizes */}
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
      </div>

      {/* Button States */}
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="primary" loading>
          Loading...
        </Button>
      </div>

      {/* Buttons with Icons */}
      <div className="flex flex-wrap gap-4">
        <Button variant="primary" leftIcon={<span>🚌</span>}>
          Book Now
        </Button>
        <Button variant="secondary" rightIcon={<span>→</span>}>
          Next
        </Button>
      </div>

      {/* Full Width Button */}
      <Button variant="primary" fullWidth>
        Full Width Button
      </Button>
    </div>
  );
}

/**
 * Example 4: Using FormField Component
 */
export function FormExample() {
  return (
    <form className="space-y-6 max-w-md">
      {/* Basic Input */}
      <FormField
        id="email"
        name="email"
        type="email"
        label="Email Address"
        placeholder="Enter your email"
        required
        helpText="We'll never share your email with anyone else."
      />

      {/* Input with Left Icon */}
      <FormField
        id="search"
        name="search"
        type="text"
        label="Search"
        placeholder="Search buses..."
        leftIcon={<span>🔍</span>}
      />

      {/* Input with Error */}
      <FormField
        id="password"
        name="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        required
        error="Password must be at least 8 characters"
      />

      {/* Disabled Input */}
      <FormField
        id="disabled"
        name="disabled"
        label="Disabled Field"
        value="Cannot edit this"
        disabled
      />

      {/* TextArea */}
      <TextAreaField
        id="message"
        name="message"
        label="Message"
        placeholder="Enter your message..."
        rows={5}
        helpText="Maximum 500 characters"
      />

      {/* Submit Button */}
      <Button variant="primary" type="submit" fullWidth>
        Submit Form
      </Button>
    </form>
  );
}

/**
 * Example 5: Using Theme Tokens Directly
 */
export function DirectTokensExample() {
  return (
    <div className="space-y-6">
      {/* Typography Examples */}
      <div>
        <h1
          style={{
            fontSize: typography.fontSize.h1.size,
            lineHeight: typography.fontSize.h1.lineHeight,
            fontWeight: typography.fontSize.h1.weight,
            color: colors.text.primary,
          }}
        >
          Heading 1
        </h1>
        <h2
          style={{
            fontSize: typography.fontSize.h2.size,
            color: colors.text.primary,
          }}
        >
          Heading 2
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.body.size,
            color: colors.text.secondary,
          }}
        >
          Body text with custom styling
        </p>
        <p
          style={{
            fontSize: typography.fontSize.caption.size,
            color: colors.text.tertiary,
          }}
        >
          Caption text
        </p>
      </div>

      {/* Color Examples */}
      <div className="grid grid-cols-5 gap-2">
        <div
          style={{
            backgroundColor: colors.primary[500],
            height: '60px',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-caption"
        >
          Primary
        </div>
        <div
          style={{
            backgroundColor: colors.success[500],
            height: '60px',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-caption"
        >
          Success
        </div>
        <div
          style={{
            backgroundColor: colors.error[500],
            height: '60px',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-caption"
        >
          Error
        </div>
        <div
          style={{
            backgroundColor: colors.warning[500],
            height: '60px',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-caption"
        >
          Warning
        </div>
        <div
          style={{
            backgroundColor: colors.info[500],
            height: '60px',
            borderRadius: '8px',
          }}
          className="flex items-center justify-center text-white text-caption"
        >
          Info
        </div>
      </div>

      {/* Spacing Examples */}
      <div className="border border-gray-200 p-4 rounded-lg">
        <div style={{ marginBottom: spacing.xs }}>XS Spacing</div>
        <div style={{ marginBottom: spacing.sm }}>SM Spacing</div>
        <div style={{ marginBottom: spacing.md }}>MD Spacing</div>
        <div style={{ marginBottom: spacing.lg }}>LG Spacing</div>
        <div style={{ marginBottom: spacing.xl }}>XL Spacing</div>
      </div>
    </div>
  );
}

/**
 * Example 6: Complete Form with All Components
 */
export function CompleteFormExample() {
  return (
    <AppShell
      header={
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-h4 text-primary-500">Bus Booking System</h1>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto py-8">
        <Card variant="elevated" padding="xl">
          <h2 className="text-h3 mb-6 text-center">Book Your Bus Ticket</h2>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="from"
                name="from"
                label="From"
                placeholder="Departure city"
                required
                leftIcon={<span>📍</span>}
              />
              <FormField
                id="to"
                name="to"
                label="To"
                placeholder="Arrival city"
                required
                leftIcon={<span>📍</span>}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="date"
                name="date"
                type="date"
                label="Journey Date"
                required
              />
              <FormField
                id="passengers"
                name="passengers"
                type="number"
                label="Number of Passengers"
                placeholder="1"
                required
              />
            </div>

            <FormField
              id="phone"
              name="phone"
              type="tel"
              label="Contact Number"
              placeholder="+84 123 456 789"
              required
              inputMode="tel"
            />

            <TextAreaField
              id="notes"
              name="notes"
              label="Special Requirements (Optional)"
              placeholder="Any special requirements or notes..."
              rows={4}
            />

            <div className="flex gap-4">
              <Button variant="outlined" fullWidth>
                Reset
              </Button>
              <Button variant="primary" type="submit" fullWidth>
                Search Buses
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
