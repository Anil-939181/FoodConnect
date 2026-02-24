# FoodConnect - Surplus Food Donation Platform 🍲

A full-stack MERN application aimed at reducing food waste by connecting generous **Donors** (individuals, restaurants, event organizers) with verified **Organizations** (NGOs, orphanages, shelters) in real-time. 

![MERN Stack](https://img.shields.io/badge/MERN-Stack-green) 
![React](https://img.shields.io/badge/React-Vite-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Key Features

* **Role-Based Access Control**: Separate workflows and dedicated dashboards for `Donors` and `Organizations`.
* **Real-time Matchmaking**: Organizations can browse nearby available food donations and instantly request them.
* **Precise Map Integration**: Integrated **Leaflet Maps** allows users to drop a pin for exact pickup locations, ensuring smooth logistics.
* **Image Uploads**: Donors can optionally upload photos of their surplus food (powered by **Cloudinary**).
* **Automated Email Notifications**: Beautifully themed, dynamic HTML emails sent via **Nodemailer** for critical events (Requests, Approvals, Cancellations, OTP Verifications).
* **Secure Authentication**: JWT-based login, password hashing with bcrypt, and Email OTP verification during signup and account deletion.
* **Premium UI/UX**: Fully responsive, glassmorphism design with modern transitions, built using **Tailwind CSS**.
* **Dashboard Analytics**: Visual tracking of community impact (total meals donated, active matches, etc.).

## 🛠️ Technology Stack

**Frontend:**
* React 19 (Vite)
* Tailwind CSS (Styling & Animations)
* React Router DOM (Navigation)
* Leaflet & React-Leaflet (Interactive Maps)
* React Toastify (Notifications)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Database)
* JSON Web Tokens (JWT) & Bcrypt (Security)
* Nodemailer (Email Service)
* Multer & Cloudinary (Image Uploads)
* Node-Cron (Automated tasks for expiring old donations)

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and MongoDB installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/your-username/food-donation.git
cd food-donation
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder and add the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   
   # Nodemailer Config
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   SUPPORT_EMAIL=support@yourdomain.com
   
   # Cloudinary Config
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` folder to connect to your local backend:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```

### 4. Open the App Let's Save Food!
Navigate to `http://localhost:5173` in your browser. Register as a Donor or Organization to get started!

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/food-donation/issues).

---
*Built with ❤️ to connect communities and end food waste.*
