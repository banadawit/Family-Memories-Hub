import { Link } from "react-router-dom";

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md space-y-6 text-center">
        <h2 className="text-3xl font-bold text-pink-700">
          Family Memories Hub
        </h2>
        <p className="text-gray-600">
          This is a private, invite-only space for your family. Please ask a
          family member who is already a member to send you an invitation.
        </p>
        <Link to="/login" className="text-pink-600 hover:underline">
          Go to Login
        </Link>
      </div>
    </div>
  );
}
