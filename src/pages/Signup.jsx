import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Signup() {
  const [isCurrentThemeDark, setIsCurrentThemeDark] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsCurrentThemeDark(isDark);
    });

    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    setIsCurrentThemeDark(document.documentElement.classList.contains('dark'));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-inter transition-colors duration-300
                   ${isCurrentThemeDark ? 
                     'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 
                     'bg-gradient-to-br from-pink-50 via-white to-pink-50'}`}>
      
      <div className={`w-full max-w-md p-8 rounded-xl shadow-2xl space-y-8 text-center transition-all duration-300
                      ${isCurrentThemeDark ? 
                        'bg-gray-800 border border-gray-700' : 
                        'bg-white border border-gray-100'}`}>
        
        <div className="space-y-4">
          <h2 className={`text-3xl font-bold ${isCurrentThemeDark ? 'text-pink-400' : 'text-pink-600'}`}>
            Family Memories Hub
          </h2>
          <div className={`w-16 h-1 mx-auto rounded-full ${isCurrentThemeDark ? 'bg-pink-500' : 'bg-pink-300'}`}></div>
        </div>

        <div className="space-y-6">
          <p className={`text-lg leading-relaxed ${isCurrentThemeDark ? 'text-gray-300' : 'text-gray-600'}`}>
            This is a private, invite-only space for your family. Please ask a
            family member who is already a member to send you an invitation.
          </p>

          <div className="pt-4">
            <Link 
              to="/login" 
              className={`inline-flex items-center font-semibold transition-all duration-300 group
                         ${isCurrentThemeDark ? 
                           'text-pink-400 hover:text-pink-300' : 
                           'text-pink-600 hover:text-pink-700'}`}
              aria-label="Go to login page"
            >
              Go to Login
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M14 5l7 7m0 0l-7 7m7-7H3" 
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}