CitySense Reporter with Geo-Mapping

CitySense Reporter is a fullstack web application that allows citizens to report and track city issues such as potholes, waste management problems, and safety concerns. Users can submit reports with location, category, description, priority, and optional photos, while admins can update statuses for better transparency.

🚀 Features

User registration and login with JWT authentication

Report issues with geolocation, description, category, priority, and photo upload

Live feed of reported issues with status updates and image previews

Role-based access: user and admin

RESTful backend built with Node.js, Express, and MongoDB

Photo uploads via Multer with optional Cloudinary integration

Docker and Docker Compose support for easy setup

🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express, MongoDB, Mongoose

Authentication: JWT, bcrypt

Uploads: Multer + Cloudinary

Deployment: Docker & Docker Compose

📦 Getting Started

Clone the repository

git clone https://github.com/your-username/City-Sense-Reporter-with-Geo-Mapping.git
cd City-Sense-Reporter-with-Geo-Mapping/server


Install dependencies

npm install


Copy .env.example to .env and configure MongoDB and JWT_SECRET (plus Cloudinary if needed).

Start the backend server

npm run dev


Open frontend/index.html in your browser or serve it with a static server.

📌 License

This project is licensed under the MIT License.
