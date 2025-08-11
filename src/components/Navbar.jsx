import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSearch } from "../context/SearchContext";
import { useState, useEffect, useRef } from "react";
import LogoutConfirmationModal from "./LogoutConfirmationModal";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { searchQuery, setSearchQuery } = useSearch();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const notificationsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsRef]);


  useEffect(() => {
    if (searchQuery.trim() && location.pathname !== '/') {
      navigate('/');
    }
  }, [searchQuery, location.pathname, navigate]);

  async function fetchNotifications() {
    if (!user) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
    } else {
      setNotifications(data);
    }
  }
  
  const handleMarkAsRead = async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error("Error marking notification as read:", error);
    } else {
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const notificationIdsToUpdate = unreadNotifications.map(n => n.id);

    if (notificationIdsToUpdate.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIdsToUpdate);

    if (error) {
      console.error("Error marking all notifications as read:", error);
    } else {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  useEffect(() => {
    fetchNotifications();

    const notificationChannel = supabase.channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user?.id}` }, payload => {
        if (payload.new.recipient_id === user?.id) {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };

  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-white shadow-md p-4 mb-6">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-pink-700">
          Family Memories Hub ❤️
        </Link>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Search albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="p-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
          />
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a2 2 0 100 4m0-4a2 2 0 100-4m0 4v0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">{unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <div ref={notificationsRef} className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl overflow-hidden z-20">
                <div className="py-2">
                  <p className="text-center text-sm text-gray-500 py-2">
                    {unreadCount > 0 ? `${unreadCount} new notifications` : 'No new notifications'}
                  </p>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="w-full text-center px-4 py-2 text-xs font-semibold text-pink-600 hover:bg-gray-100 transition">
                      Mark all as read
                    </button>
                  )}
                  {notifications.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-500">No notifications yet.</p>
                  ) : (
                    notifications.map(n => (
                      <Link to={n.target_url} key={n.id} onClick={() => handleMarkAsRead(n.id)} className={`block px-4 py-2 border-b text-sm ${n.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'} hover:bg-gray-100`}>
                        {n.message}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/profile"
            className="text-gray-700 hover:text-pink-600 transition-colors duration-200 font-semibold"
          >
            My Profile
          </Link>
          <Link
            to="/heirloom-hub" // New link to Heirloom Hub
            className="text-gray-700 hover:text-pink-600 transition-colors duration-200 font-semibold"
          >
            Heirloom Hub
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-pink-700 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
      {showLogoutModal && (
        <LogoutConfirmationModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </nav>
  );
}