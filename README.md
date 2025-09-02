Hotelix - Backend System
📌 Overview

Hotelix is a backend system for hotel/restaurant management developed using Node.js, Express.js, and MySQL.
It provides secure, validated APIs for managing tables, orders, dishes, payments, dues, vendors, and reports.

The system ensures:

✅ Validation during data entry

✅ Prevention of duplicate records

✅ Safe deletion with dependency checks

✅ Support for split payments & dues

✅ Reporting with date-based filters

🛠️ Tech Stack

Backend: Node.js, Express.js

Database: MySQL

Query: Sequelize / Raw MySQL queries (depending on your implementation)

Validation: Custom validations & middleware

API Style: RESTful APIs

📂 Project Structure
Hotelix-Backend/
├── controllers/       # Handles request logic
├── models/            # Database models (MySQL tables)
├── routes/            # API routes
├── middlewares/       # Validation and authentication logic
├── config/            # DB configuration
├── utils/             # Utility functions (date formatting, etc.)
├── app.js          # Entry point
└── package.json

📊 Diagrams
🔹 Activity Diagram (Admin Flow)
<img width="526" height="951" alt="Action Diagram" src="https://github.com/user-attachments/assets/1a3f4763-5706-445e-b6a3-a579ea4e798e" />


🔹 ER Diagram
<img width="526" height="951" alt="Action Diagram" src="https://github.com/user-attachments/assets/76f12fd3-45d3-4376-a880-bb4274cccf27" />

🚀 Features

Table Management: Create, update, and manage hotel tables.

Order Management: Place orders, add items, calculate total amount.

Payment System: Supports Cash, UPI, Card, and Due payments with split payment support.

Due Management: Track pending dues with customer details (name, mobile number).

Expense Tracking: Record income and expenses.

Reports: Filter and generate reports by date range.

Validations:

Prevents duplicate records.

Restricts deletion if linked records exist.

5️⃣ Start the Server
nodemon app.js


Server will run at: http://localhost:4012/
