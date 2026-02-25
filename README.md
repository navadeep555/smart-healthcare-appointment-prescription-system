# Smart Healthcare Appointment & Prescription System

A secure and comprehensive healthcare management system designed for appointment booking and prescription management with robust authentication, encryption, and role-based access control.

## 🌟 Overview

This system provides a complete digital healthcare solution that connects doctors and patients through a modern web-based platform. It streamlines the appointment booking process, manages prescriptions digitally, and maintains secure patient records for improved healthcare delivery.

## ✨ Key Features

### For Patients
- **Smart Appointment Booking**: Schedule appointments with preferred doctors based on specialty, availability, and location
- **Digital Prescription Access**: View and download prescriptions directly from the platform
- **Medical History**: Access complete medical history and previous prescriptions
- **Real-time Notifications**: Receive appointment confirmations and reminders
- **Secure Authentication**: Email/phone-based login with JWT security
- **User-friendly Dashboard**: Track upcoming appointments and medical records

### For Doctors
- **Schedule Management**: Manage availability and appointment slots
- **Patient History Access**: View complete patient medical history before consultations
- **Digital Prescribing**: Create and send prescriptions electronically
- **Appointment Approval Workflow**: Review and approve/reject appointment requests
- **Dashboard Analytics**: View practice statistics and performance metrics

### For Administrators
- **User Management**: Manage doctor and patient accounts
- **System Oversight**: Monitor all appointments and system activities
- **Analytics & Reporting**: Generate reports on system usage and performance
- **Access Control**: Manage role-based permissions and security settings

## 🔒 Security Features

- **Authentication & Authorization**: Secure JWT-based authentication system
- **Data Encryption**: End-to-end encryption for sensitive medical data
- **Role-Based Access Control (RBAC)**: Granular permissions for different user types
- **HIPAA Compliance Ready**: Built with healthcare data privacy standards in mind
- **Secure Session Management**: Automatic session timeout and secure token handling
- **Audit Logging**: Track all system activities for security and compliance

## 🔑 User Access & Permission Matrix

| Action | Patient | Doctor | Admin |
|--------|---------|--------|-------|
| Register Account | ✅ | ✅ | N/A |
| Login/Logout | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ |
| Edit Own Profile | ✅ | ✅ | ✅ |
| Book Appointment | ✅ | ❌ | ✅ |
| Approve Appointment | ❌ | ✅ | ✅ |
| Create Prescription | ❌ | ✅ | ❌ |
| View Own Prescription | ✅ | ❌ | ❌ |
| View Patient History | Own Only | Assigned Patients | All |
| Manage Availability | ❌ | ✅ | ✅ |
| View System Analytics | ❌ | Limited | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Access Audit Logs | ❌ | ❌ | ✅ |
| Delete Records | ❌ | ❌ | ✅ |

## 🛠️ Technology Stack

### Frontend
- **React**: Modern component-based UI framework
- **JavaScript/CSS/HTML**: Core web technologies
- **Responsive Design**: Mobile-friendly interface

### Backend
- **Node.js/Express**: Server-side runtime and framework
- **RESTful API**: Clean API architecture for frontend-backend communication

### Database
- **MongoDB/SQL**: Secure storage for patient records, appointments, and prescriptions
- **Data Encryption**: At-rest and in-transit encryption

## 📁 Project Structure

```
smart-healthcare-appointment-prescription-system/
├── smart-healthcare-frontend/     # React frontend application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API service layer
│   │   └── utils/                 # Utility functions
│   └── public/                    # Static assets
│
├── smart-healthcare-backend/      # Backend API server
│   ├── controllers/               # Request handlers
│   ├── models/                    # Database models
│   ├── routes/                    # API routes
│   ├── middleware/                # Authentication & validation
│   └── config/                    # Configuration files
│
└── README.md                      # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- MongoDB (if using MongoDB)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/navadeep555/smart-healthcare-appointment-prescription-system.git
cd smart-healthcare-appointment-prescription-system
```

2. **Install Backend Dependencies**
```bash
cd smart-healthcare-backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../smart-healthcare-frontend
npm install
```

4. **Configure Environment Variables**

Create a `.env` file in the backend directory:
```env
PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
```

5. **Start the Backend Server**
```bash
cd smart-healthcare-backend
npm start
```

6. **Start the Frontend Application**
```bash
cd smart-healthcare-frontend
npm start
```

The application should now be running at `http://localhost:3000`

## 📊 Database Schema

### Key Collections/Tables
- **Users**: Patient and doctor accounts with authentication credentials
- **Appointments**: Scheduled appointments with status tracking
- **Prescriptions**: Digital prescriptions linked to appointments
- **Medical Records**: Patient medical history and notes
- **Availability**: Doctor schedule and available time slots

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Prescriptions
- `GET /api/prescriptions` - Get all prescriptions
- `GET /api/prescriptions/:id` - Get specific prescription
- `POST /api/prescriptions` - Create new prescription

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor details

## 🎯 Use Cases

1. **Patient Appointment Booking**: Patients can search for doctors by specialty, view available slots, and book appointments
2. **Doctor Consultation**: Doctors can view patient history, conduct consultations, and issue prescriptions
3. **Prescription Management**: Automated prescription generation and delivery to patients
4. **Medical Records**: Centralized storage and retrieval of patient medical history
5. **Appointment Reminders**: Automated notifications to reduce no-shows

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **navadeep555** - Initial work

## 🙏 Acknowledgments

- Healthcare professionals who provided requirements and feedback
- Open source community for various libraries and tools
- Security best practices from OWASP and healthcare compliance standards

## 📧 Contact

For questions or support, please open an issue in the GitHub repository.


## ⚠️ Disclaimer

This system is designed for educational and demonstration purposes. For production use in a healthcare environment, ensure compliance with all relevant healthcare regulations (HIPAA, GDPR, etc.) and conduct thorough security audits.

---

**Note**: Always ensure patient data privacy and comply with local healthcare regulations when deploying this system in a production environment.