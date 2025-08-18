# 🚀 FreeFlow

**AI-Powered Workflow Automation for Freelancers**

FreeFlow transforms your freelance business with intelligent automation. From client inquiries to contract generation to invoice management, let AI handle the repetitive tasks while you focus on delivering exceptional work.

![FreeFlow Dashboard](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-19.0-blue) ![Python](https://img.shields.io/badge/Python-FastAPI-green) ![Claude](https://img.shields.io/badge/AI-Claude%20Sonnet%204-purple)

## ✨ Features

### 🤖 **AI Email Processing**
Paste client emails and watch AI extract project details, budget, timeline, and client information with high accuracy.

### 📄 **Smart Contract Generation**
Generate professional service agreements automatically based on project details. Edit, customize, and send for signature.

### 💰 **Intelligent Invoicing**
Create detailed invoices with line items, payment terms, and professional formatting. Download PDFs or send directly to clients.

### 📊 **Workflow Dashboard**
Monitor your project pipeline from intake to completion. Track contracts, invoices, and AI agent activity in real-time.

### 📱 **Fully Responsive**
Works seamlessly on desktop, tablet, and mobile devices.

## 🔧 Tech Stack

- **Frontend**: React 19, Tailwind CSS, shadcn/ui
- **Backend**: Python FastAPI, MongoDB Atlas
- **AI**: Claude Sonnet 4 for intelligent document processing
- **Deployment**: Vercel (Frontend + Backend)
- **Database**: MongoDB Atlas (Cloud)

## 🎯 How It Works

1. **📧 Process Emails** - Paste client inquiries in the Inbox
2. **🔍 AI Extraction** - Claude AI extracts structured project data
3. **✅ Review & Create** - Review extracted info and create projects
4. **📋 Generate Contracts** - AI creates professional service agreements
5. **💳 Create Invoices** - Generate invoices with payment terms
6. **✉️ Send & Track** - Email contracts/invoices and track status

## 🌟 Demo

**[👉 Try FreeFlow Live Demo](https://your-vercel-app-url.vercel.app)**

*Experience the full AI workflow with sample data*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account
- Claude API key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/TejSuklikar/FreeFlow.git
   cd FreeFlow
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Add your MongoDB URL and Claude API key to .env
   python server.py
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Open** http://localhost:3000

### Environment Variables

```bash
# Backend (.env)
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=freeflow_database
CLAUDE_API_KEY=sk-ant-api03-your-claude-key
```

## 📖 Usage

### Processing Client Emails
1. Navigate to **Inbox**
2. Paste client email or inquiry
3. Click **"Extract with AI"**
4. Review and edit extracted information
5. Click **"Create Project"**

### Generating Contracts
1. Go to **Projects** and select a project
2. Click **"Generate Contract"** 
3. Review AI-generated contract variables
4. Download PDF or send to client

### Creating Invoices
1. From project detail page, click **"Create Invoice"**
2. Review AI-generated invoice details
3. Download PDF or send payment request

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



*Streamline your workflow, maximize your productivity, focus on what matters most.*
