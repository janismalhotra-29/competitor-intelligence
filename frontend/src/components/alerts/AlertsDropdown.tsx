import { useState, useRef, useEffect } from 'react';
import type { Alert } from '@/types';

interface Props {
  alerts: Alert[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function AlertsDropdown({ alerts, unreadCount, markAsRead, markAllAsRead }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 hover:text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="View Alerts"
        aria-label="View Alerts"
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 rounded-2xl bg-gray-900/95 backdrop-blur-xl border border-gray-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-800/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications & Alerts</span>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium hover:underline transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List of Alerts */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-800/60">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mx-auto mb-2 text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs text-gray-600 mt-1">No alerts recorded yet.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 transition-colors hover:bg-gray-800/50 ${
                    !alert.isRead ? 'bg-indigo-950/20' : 'bg-transparent opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          alert.significance === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : alert.significance === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-gray-700/40 text-gray-400'
                        }`}
                      >
                        {alert.significance}
                      </span>
                      {!alert.isRead && (
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-gray-200 mt-1.5 truncate">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-3 leading-relaxed">
                    {alert.message}
                  </p>

                  {!alert.isRead && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
                      >
                        Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
