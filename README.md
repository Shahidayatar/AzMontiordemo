# 🔍 Azure Monitor Dashboard

A comprehensive Node.js + Express web application for monitoring Azure Application Insights telemetry data with real-time charts and interactive dashboards.

## ✨ Features

- **Real-time Monitoring**: Live telemetry data from Azure Application Insights
- **Interactive Charts**: Dynamic visualization of requests, response times, and errors  
- **Error Tracking**: Monitor failed requests and exceptions
- **Performance Metrics**: Track response times and slowest endpoints
- **Responsive Design**: Works on desktop and mobile devices
- **Auto-refresh**: Dashboard updates every 10 seconds

## 🚀 Quick Start

Choose your deployment method:

### 🏠 Local Development

Perfect for testing and development on your local machine.

### ☁️ Azure App Service Deployment  

Production-ready deployment with automatic scaling and management.

---

## 🏠 Local Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- Azure Application Insights resource
- Application Insights API key with read permissions

### Step 1: Clone and Install

```bash
git clone https://github.com/Shahidayatar/AzMontiordemo.git
cd AzMontiordemo
npm install
```

### Step 2: Configure Environment Variables

1. **Create `.env` file** in the root directory with your Application Insights details:
   ```env
   # Azure Application Insights Connection String
   APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=YOUR_KEY;IngestionEndpoint=https://YOUR_REGION.in.applicationinsights.azure.com/;LiveEndpoint=https://YOUR_REGION.livediagnostics.monitor.azure.com/;ApplicationId=YOUR_APP_ID

   # Azure Application Insights Application ID  
   APP_INSIGHTS_APP_ID=your-application-id-here

   # Azure Application Insights API Key
   APP_INSIGHTS_API_KEY=your-api-key-here

   # Server Configuration
   PORT=3000
   NODE_ENV=development
   ```

### Step 3: Get Your Application Insights Credentials

1. **Connection String**:
   - Azure Portal → Your Application Insights → **Overview** → Copy "Connection String"

2. **Application ID**:
   - Azure Portal → Your Application Insights → **API Access** → Copy "Application ID"

3. **Create API Key**:
   - Azure Portal → Your Application Insights → **API Access** → **Create API Key**
   - Name: `Dashboard-Access`
   - Permissions: ✅ **Read telemetry**
   - Click **Generate key** → Copy immediately (you won't see it again!)

### Step 4: Run Locally

```bash
# Development mode (auto-restart on changes)
npm run dev

# Or production mode
npm start
```

**Open**: http://localhost:3000

---

## ☁️ Azure App Service Deployment

### Step 1: Create App Service

1. **Azure Portal** → **Create a resource** → **Web App**
2. **Runtime stack**: Node.js (latest LTS)
3. **Operating System**: Windows or Linux
4. **Create** the resource

### Step 2: Connect to GitHub (Recommended)

1. **Your App Service** → **Deployment Center**
2. **Source**: GitHub
3. **Organization**: Your GitHub account
4. **Repository**: `AzMontiordemo` (or your fork)
5. **Branch**: `main`
6. **Save**

Azure will automatically build and deploy your app when you push to GitHub!

### Step 3: Configure Environment Variables

1. **Your App Service** → **Settings** → **Environment Variables**
2. **Add these variables**:

   | Name | Value |
   |------|-------|
   | `APPINSIGHTS_CONNECTION_STRING` | `InstrumentationKey=YOUR_KEY;IngestionEndpoint=https://YOUR_REGION.in.applicationinsights.azure.com/;LiveEndpoint=https://YOUR_REGION.livediagnostics.monitor.azure.com/;ApplicationId=YOUR_APP_ID` |
   | `APP_INSIGHTS_APP_ID` | `your-application-id` |
   | `APP_INSIGHTS_API_KEY` | `your-api-key` |
   | `NODE_ENV` | `production` |

3. **Apply** → **Restart** your App Service

### Step 4: Test Your Deployment

- Visit your App Service URL (e.g., `https://your-app-name.azurewebsites.net`)
- You should see real-time data from your Application Insights!

---

## 📊 Dashboard Features

### 📈 Real-time Metrics
- **Total Requests**: Count of all requests in the last hour
- **Failed Requests**: Number and percentage of failed requests  
- **Average Response Time**: Mean response time with P95 percentile
- **System Status**: Overall health indicator based on error rates

### 📊 Interactive Charts
- **Requests per Minute**: Line chart showing successful vs failed requests over time
- **Response Time Trends**: Performance trends and spikes over the last hour
- **Slowest Endpoints**: Bar chart of endpoints with highest average response times

### 🎛️ Dashboard Controls
- **Setup Guide**: Step-by-step instructions for configuration
- **Trigger Error**: Test button to generate sample errors for testing
- **Auto-refresh**: Dashboard updates every 10 seconds automatically

## 🎯 **What It Does**
1. **📡 Collects telemetry** using Application Insights REST API
2. **📊 Shows real-time charts** of requests, errors, and performance 
3. **🔄 Auto-refreshes every 10 seconds** with latest data
4. **🧪 Provides testing tools** to generate sample telemetry

---

## 🔘 Dashboard Buttons Explained

### **Header Control Buttons:**

#### **"⚠️ Trigger Error" (Red Button)**
- **Purpose**: Test error tracking in Application Insights
- **What it does**: Calls `/error` endpoint → throws intentional exception
- **Result**: Error appears in Application Insights and dashboard charts
- **Use case**: Verify exception tracking is working

#### **"🔄 Refresh" (Gray Button)**  
- **Purpose**: Manually refresh dashboard data immediately
- **What it does**: Fetches latest data from Application Insights
- **Result**: All charts update with most recent data
- **Use case**: Get immediate updates without waiting for auto-refresh

### **Test Endpoint Buttons (Bottom Section):**

#### **"Health Check" Button**
- **Purpose**: Test basic server functionality  
- **What it does**: Calls `/health` → returns server status
- **Result**: Creates normal HTTP request in Application Insights
- **Use case**: Generate successful request data

#### **"Slow Endpoint" Button**
- **Purpose**: Test response time monitoring
- **What it does**: Calls `/slow` → server delays 1-4 seconds
- **Result**: Creates slow requests visible in response time charts
- **Use case**: Test performance monitoring and see varied response times

---

## 🛠️ API Endpoints

| Endpoint | Description | Response |
|----------|-------------|----------|
| `GET /` | Main dashboard UI | HTML page |
| `GET /stats` | Real-time telemetry data | JSON data |
| `GET /health` | Service health check | JSON status |
| `GET /error` | Simulate errors (testing) | 500 error |
| `GET /slow` | Simulate slow responses | Delayed response |
| `GET /setup-guide.html` | Configuration guide | HTML guide |

---

## 🧪 How to Test & See Chart Movement

### **Step 1: Generate Test Data**
```bash
# Generate different types of requests:

# 1. Create errors (for failed requests chart)
curl http://localhost:3000/error
curl http://localhost:3000/error
curl http://localhost:3000/error

# 2. Create slow requests (for response time chart)  
curl http://localhost:3000/slow
curl http://localhost:3000/slow
curl http://localhost:3000/slow

# 3. Create normal requests (for successful requests)
curl http://localhost:3000/health
curl http://localhost:3000/health
curl http://localhost:3000/health
```

### **Step 2: Wait for Data Processing**
- **Application Insights delay**: 2-5 minutes for data to appear
- **Dashboard refresh**: Every 10 seconds automatically

### **Step 3: Verify Chart Movement**
- **Requests chart**: Should show spikes where you made requests
- **Response time chart**: Should show higher values for `/slow` calls
- **Error chart**: Should show spikes for `/error` calls
- **Statistics**: Should update with new totals

---

## 🔧 Development

### Project Structure
```
├── server.js              # Main Express server with Application Insights integration
├── package.json           # Dependencies and scripts  
├── web.config             # IIS configuration for Azure App Service
├── .env                   # Environment variables (create this file - not in git)
├── public/                # Frontend static files
│   ├── index.html        # Main dashboard UI
│   ├── setup-guide.html  # Configuration instructions
│   ├── styles.css        # Responsive dashboard styling
│   └── app.js            # Client-side JavaScript and Chart.js integration
└── README.md             # Documentation
```

### Available Scripts
```bash
npm start       # Production mode
npm run dev     # Development mode with nodemon
```

---

## 🎯 Monitoring Your Applications

This dashboard can monitor any application that sends telemetry to Azure Application Insights:

### Supported Application Types
- **Web Applications** (ASP.NET, Node.js, Python, Java)
- **APIs** (REST APIs, GraphQL, gRPC)
- **Mobile Apps** (iOS, Android, React Native)
- **Desktop Applications** (.NET, Electron)
- **Azure Functions** (Serverless applications)

### Setup Steps
1. **Enable Application Insights** in your application
2. **Get the Application Insights details** (Connection String, App ID, API Key)
3. **Configure this dashboard** with those credentials
4. **Deploy and monitor** your applications remotely

---

## 🆘 Troubleshooting

### Common Issues

#### Dashboard shows "Connection failed"
- ✅ Verify `APPINSIGHTS_CONNECTION_STRING` is correct
- ✅ Check `APP_INSIGHTS_API_KEY` has "Read telemetry" permissions
- ✅ Ensure `APP_INSIGHTS_APP_ID` matches your Application Insights resource

#### Charts show "No data available"  
- ✅ Confirm your application is sending telemetry to Application Insights
- ✅ Wait 2-5 minutes for data to appear (Application Insights has some delay)
- ✅ Try the "Trigger Error" button to generate test data

#### Environment variables not working in Azure
- ✅ Check App Service → Settings → Environment Variables
- ✅ Restart your App Service after adding variables
- ✅ Verify variable names match exactly (case-sensitive)

### Charts Are Flat/Empty
**Cause**: Not enough varied data in Application Insights
**Solution**: 
1. Generate test requests using buttons or curl commands
2. Wait 2-5 minutes for Application Insights processing
3. Check Azure Portal → Application Insights → Logs

### Getting Help
- 📚 [Azure Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- 🐛 [Create an issue](https://github.com/Shahidayatar/AzMontiordemo/issues) for bugs or questions
- 💬 Check existing issues for solutions

---

## 📈 Data Sources
- **Only Application Insights**: Uses Application Insights REST API
- **Query Language**: KQL (Kusto Query Language)  
- **Data Types**: HTTP requests, exceptions, dependencies, performance metrics
- **Update Frequency**: Every 10 seconds
- **Time Range**: Last 60 minutes

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for your own monitoring needs!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request with improvements or bug fixes.