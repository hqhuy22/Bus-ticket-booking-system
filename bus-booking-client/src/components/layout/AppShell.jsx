import PropTypes from 'prop-types';
import { colors, spacing } from '../../theme/tokens';

/**
 * AppShell Component
 * Main layout wrapper with header, navigation, content, and footer sections
 *
 * @param {Object} props
 * @param {React.ReactNode} props.header - Header content
 * @param {React.ReactNode} props.nav - Navigation content (optional)
 * @param {React.ReactNode} props.children - Main content
 * @param {React.ReactNode} props.footer - Footer content (optional)
 * @param {boolean} props.withSidebar - Whether to show sidebar navigation
 * @param {string} props.className - Additional CSS classes
 */
export default function AppShell({
  header,
  nav,
  children,
  footer,
  withSidebar = false,
  className = '',
}) {
  return (
    <div
      className={`min-h-screen flex flex-col bg-surface-light ${className}`}
      style={{
        backgroundColor: colors.surface.light,
      }}
    >
      {/* Header */}
      {header && (
        <header
          className="sticky top-0 z-fixed bg-white shadow-sm"
          style={{
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          }}
        >
          {header}
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar Navigation (optional) */}
        {withSidebar && nav && (
          <aside
            className="hidden lg:block w-64 bg-white border-r"
            style={{
              borderColor: colors.border.base,
            }}
          >
            <nav className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              {nav}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className="flex-1 w-full"
          style={{
            padding: spacing.md,
          }}
        >
          {/* Top Navigation (if no sidebar) */}
          {!withSidebar && nav && (
            <nav
              className="mb-6 bg-white rounded-lg shadow-sm"
              style={{
                padding: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              {nav}
            </nav>
          )}

          {/* Page Content */}
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Footer */}
      {footer && (
        <footer
          className="mt-auto bg-white border-t"
          style={{
            borderColor: colors.border.base,
          }}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

AppShell.propTypes = {
  header: PropTypes.node,
  nav: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  withSidebar: PropTypes.bool,
  className: PropTypes.string,
};
