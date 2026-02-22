# 📝 Task Manager App (Vite + React + Firebase)

A modern **Task Manager / Todo Dashboard** built using **React (Vite)** and **Firebase**, featuring authentication, task tracking, progress analytics, and category-based filtering.

---

## 🚀 Features

### 🔐 Authentication

* Email & Password **Sign Up / Login**
* Google Authentication
* Firebase Authentication powered
* Protected Dashboard routes

### 📊 Dashboard

* Total Tasks count
* Completed Tasks count
* Pending Tasks count
* Auto-calculated Progress percentage

### ✅ Task Management

* Add new tasks
* Mark tasks as completed
* Delete tasks
* Real-time UI updates
* Completed task highlighting

### 🗂 Task Categories

* All
* Work
* Personal
* Study
* Health

### 🔍 Search

* Real-time task search by title

---

## 🛠 Tech Stack

### Frontend

* React.js
* Vite
* React Router DOM
* CSS / Tailwind CSS

### Backend / Services

* Firebase Authentication
* Firebase Firestore

---

## 📁 Project Structure

```bash
src/
│── components/
│   ├── TaskCard.jsx
│   ├── StatsCard.jsx
│   └── Navbar.jsx
│
│── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   └── Dashboard.jsx
│
│── firebase/
│   └── firebaseConfig.js
│
│── App.jsx
│── main.jsx
│── index.css
```

---

## 🔧 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Mddanish4338/Task-Manager-App.git
cd task-manager
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Create Firebase Project

1. Go to Firebase Console
2. Create a new project
3. Enable:

   * Authentication → Email/Password & Google
   * Firestore Database

### 4️⃣ Firebase Configuration

Create the file:

```bash
src/firebase/firebaseConfig.js
```

```js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## ▶️ Run the Project

```bash
npm run dev
```

App will run on:

```
http://localhost:5173
```

---

## 🔐 Routes

| Route        | Description                |
| ------------ | -------------------------- |
| `/signup`    | Create new account         |
| `/login`     | Login page                 |
| `/dashboard` | Task dashboard (protected) |

---

## 🌟 Future Improvements

* Due dates & reminders
* Drag & drop task ordering
* Dark mode
* User profile section
* Task priority levels

---

## 🤝 Contributing

Contributions are welcome!
Feel free to fork the repository and submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.
