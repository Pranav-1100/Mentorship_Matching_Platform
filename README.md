# MentorMate - Find Your Perfect Mentor Match

MentorMate is a platform that connects you with experienced mentors in your field. Get personalized guidance to accelerate your career growth. Additionally, MentorMate can analyze your progress and provide insights to help you improve.

## 🚀 Live Demo
Check out the live version here: [MentorMate](https://mentorship-platform-gamma.vercel.app/)

## 📂 Project Repositories
- **Frontend:** [GitHub Repo](https://github.com/Pranav-1100/mentorship-platform)
- **Backend:** [GitHub Repo](https://github.com/Pranav-1100/Mentorship_Matching_Platform)

---

## 💻 Running MentorMate Locally

### Backend Setup (Express.js + SQLite)
1. Clone the backend repository:
   ```sh
   git clone https://github.com/Pranav-1100/Mentorship_Matching_Platform.git
   ```
2. Navigate to the backend folder:
   ```sh
   cd Mentorship_Matching_Platform
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Set up environment variables in a `.env` file:
   ```sh
   PORT=5000
   DATABASE_URL=sqlite:./database.sqlite
   JWT_SECRET=your_secret_key
   ```
5. Run database migrations:
   ```sh
   npm run migrate
   ```
6. Start the server:
   ```sh
   npm start
   ```
   The backend will run on `http://localhost:5000`

---

### Frontend Setup (Next.js)
1. Clone the frontend repository:
   ```sh
   git clone https://github.com/Pranav-1100/mentorship-platform.git
   ```
2. Navigate to the frontend folder:
   ```sh
   cd mentorship-platform
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
4. Set up environment variables in a `.env.local` file:
   ```sh
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```
5. Start the development server:
   ```sh
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

---

## 📌 Features
- **Find Mentors**: Connect with industry experts.
- **Personalized Guidance**: Get customized mentorship.
- **Growth Analysis**: Track and analyze your progress.

## 🤝 Contributing
Feel free to contribute to MentorMate by submitting issues or pull requests.

## 📄 License
This project is licensed under the MIT License.

---

🚀 **Start your mentorship journey today with MentorMate!**
