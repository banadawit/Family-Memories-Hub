import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function InviteUser() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        method: "POST",
        body: { email },
      });

      if (error) {
        throw error;
      }
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage(
        "Invitation sent successfully! Please tell them to check their email."
      );
      setEmail("");
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-pink-700 mb-4">
        Invite a New Family Member
      </h3>
      <form onSubmit={handleInvite} className="space-y-4">
        <div>
          <label
            htmlFor="invite-email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-pink-600 text-white p-3 rounded-lg shadow-md hover:bg-pink-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Invitation"}
        </button>
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.startsWith("Error") ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
