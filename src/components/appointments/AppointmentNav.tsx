/**
 * AppointmentNav Component
 * Navigation tabs for appointment management pages
 * Follows the design system with gradient effects and premium buttons
 */

import React from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { CalendarClock, Calendar, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface AppointmentNavProps {
  className?: string;
}

export const AppointmentNav: React.FC<AppointmentNavProps> = ({ className }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    {
      href: `/cards/${id}/appointments`,
      label: t('appointmentNav.calendar'),
      icon: Calendar,
      description: t('appointmentNav.calendarDescription'),
    },
    {
      href: `/cards/${id}/appointment-manager`,
      label: t('appointmentNav.management'),
      icon: LayoutDashboard,
      description: t('appointmentNav.managementDescription'),
    },
    {
      href: `/cards/${id}/appointment-settings`,
      label: t('appointmentNav.settings'),
      icon: Settings,
      description: t('appointmentNav.settingsDescription'),
    },
  ];

  return (
    <div className={cn("mb-6", className)}>
      {/* Desktop version - hidden on mobile */}
      <div className="hidden md:flex flex-wrap gap-3">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-lg border transition-all duration-200",
                  isActive
                    ? "border-gray-900 bg-gray-900 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                )}
              >
                <div className="relative px-4 py-3 flex items-center gap-3">
                  {/* Icon container */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white"
                        : "bg-gray-100 group-hover:bg-gray-200"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        isActive
                          ? "text-gray-900"
                          : "text-gray-600 group-hover:text-gray-900"
                      )}
                    />
                  </div>

                  {/* Text content */}
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-light transition-colors duration-200",
                        isActive
                          ? "text-white"
                          : "text-gray-700 group-hover:text-gray-900"
                      )}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs transition-colors duration-200",
                        isActive
                          ? "text-gray-200"
                          : "text-gray-500 group-hover:text-gray-600"
                      )}
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                        fontWeight: 300,
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Mobile compact version - visible only on mobile */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg whitespace-nowrap transition-all duration-200 shadow-sm",
                    isActive
                      ? "bg-gray-900 text-white border border-gray-900"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      isActive
                        ? "bg-white"
                        : "bg-gray-100"
                  )}
                >
                    <Icon className={cn("h-4 w-4", isActive ? "text-gray-900" : "text-gray-600")} />
                  </div>
                  <span
                    className={cn("text-sm font-light", isActive ? "text-white" : "text-gray-900")}
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                      fontWeight: 300,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentNav;
