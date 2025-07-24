# Vyapaal - Business Management System

A comprehensive business management system built with React, TypeScript, Node.js, and MongoDB Atlas.

## 🚀 Features

- **User Authentication**: Secure login/register with JWT
- **Order Management**: Create, update, delete, and track orders
- **Inventory Management**: Track stock levels and manage products
- **Rate Management**: Set and manage product pricing
- **Customer Management**: Track customer information and payment history
- **Staff Management**: Role-based access control and team management
- **Reports & Analytics**: Export data to Excel/PDF
- **Real-time Updates**: Cloud-based data synchronization

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **MongoDB Atlas** for cloud database
- **JWT** for authentication
- **bcryptjs** for password hashing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shivamkr27/Vyapaal.git
   cd Vyapaal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your MongoDB Atlas connection string and other configurations.

4. **Start the development servers**
   
   **Backend (Terminal 1):**
   ```bash
   npm run server
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   npm run dev
   ```

## 📱 Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Business Setup**: Create a new business or join an existing one
3. **Dashboard**: Access all business management features
4. **Orders**: Manage customer orders and track delivery status
5. **Inventory**: Keep track of stock levels and products
6. **Reports**: Generate and export business reports

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation and sanitization
- CORS protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shivam Kumar**
- GitHub: [@shivamkr27](https://github.com/shivamkr27)
- Email: [your-email@example.com]

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this project
- Special thanks to the open-source community for the amazing tools and libraries

---

**Made with ❤️ for small businesses to manage their operations efficiently.**