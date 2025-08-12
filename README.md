# Family Memories Hub ✨

**A private and secure online space to store, organize, and relive your family’s favorite moments.**

This is a full-stack web application designed exclusively for your family. It's a private, invite-only platform where family members can upload photos, videos, and stories, and interact with memories in a personal and meaningful way.

![Image of a family photo album with a heart](https://i.imgur.com/your-image-url.png)

---

## About the Project

This project began as a real-world exercise to learn and master **Supabase**. I wanted to build a practical application that I could use with my own family, and the idea for a private memory-sharing hub was the perfect fit.

I started with a simple concept and built the features from the ground up while learning the intricacies of Supabase's database, authentication, and storage services. The result is a robust and user-friendly application that demonstrates the power and simplicity of using modern tools to solve a personal need.

---

## Key Features

The Family Memories Hub is packed with features that make it a central hub for your family's memories.

### **Authentication & Security**

* **Invite-Only Registration**: A secure, invite-only system ensures only trusted family members can join. An admin can send invitations via a secure backend function.
* **Role-Based Access**: The app supports user roles (`admin` and `member`) to control access to sensitive features like sending invitations and deleting content.
* **Secure Authentication**: Users log in and out with JWT tokens. The initial sign-up flow correctly redirects new users to a dedicated page to set a permanent password.
* **Privacy-First Design**: All user data and media are protected by fine-grained Row-Level Security policies on the Supabase backend.

### **Albums & Memories**

* **Multi-file Album Creation**: Easily upload multiple photos and videos to create a new album. The first uploaded image is automatically set as the album's cover.
* **Flexible Viewing Modes**: Switch between a traditional **Grid View** and a chronological **Timeline View** on the homepage to explore memories.
* **Advanced Filtering**: Filter albums and memories by **title**, **year**, **month**, and **day** to quickly find a specific moment.
* **Item Management**: Each memory has a three-dot menu for quick actions, including a **secure download** and a **delete option** (for the uploader).

### **Community & Interactivity**

* **Collaborative Albums**: The album details page displays all family members who have contributed photos, with clickable links to their profiles.
* **Tagging System**: Tag people in photos to make memories searchable. Each person has a dedicated page showing all the memories they've been tagged in.
* **Heirloom Hub**: A dedicated section to securely upload, store, and download important family documents and recipes.
* **Notifications**: A comprehensive notification system alerts users to new albums, new memories, and new members joining the hub.

---

## Tech Stack

* **Frontend**: `React` for a fast, interactive UI.
* **Styling**: `Tailwind CSS` for responsive, utility-first styling.
* **State Management**: `React Query` for efficient data fetching and state management.
* **Routing**: `React Router` for seamless client-side navigation.
* **Backend**: `Supabase` as a complete backend-as-a-service, providing:
    * PostgreSQL Database
    * User Authentication
    * File Storage
    * Realtime Functionality
    * Server-side Edge Functions

---

## Setup and Installation

Follow these steps to get a local copy of the project running for development.

1.  **Clone the Repository**

    ```bash
    git clone [https://github.com/your-username/Family-Memories-Hub.git](https://github.com/your-username/Family-Memories-Hub.git)
    cd Family-Memories-Hub
    ```

2.  **Set up Supabase**

    * Create a new project on [Supabase.com](https://supabase.com/).
    * Go to **Settings -> API** to get your Project URL and `anon` public key.
    * Set up your database tables and RLS policies using the SQL queries provided throughout this project's documentation.

3.  **Configure Environment Variables**

    Create a `.env` file in the root of your project and add your Supabase keys:

    ```bash
    VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    ```

4.  **Install Dependencies and Run the App**

    ```bash
    npm install
    npm run dev
    ```

    Your app will be running at `http://localhost:5173`.

---

## Contributing

We welcome contributions! If you have suggestions or find a bug, please open an issue or submit a pull request.

---

## License

This project is licensed under the MIT License.
