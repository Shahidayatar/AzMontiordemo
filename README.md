# Application Insights Dashboard

A Node.js web application that provides **real-time monitoring** of **Azure Application Insights** telemetry data.

## ⚠️ **Important: Application Insights Only**
This application **ONLY** works with **Azure Application Insights** - it does NOT connect to:
- ❌ Azure Monitor Logs (Log Analytics workspaces)
- ❌ Azure Monitor platform metrics  
- ❌ Other Azure monitoring services

## 🎯 **What It Does**
1. **📡 Collects telemetry** using Application Insights Node.js SDK
2. **📊 Shows real-time charts** of requests, errors, and performance 
3. **🔄 Auto-refreshes every 10 seconds** with latest data
4. **🧪 Provides testing tools** to generate sample telemetry

## 🔘 **Dashboard Buttons Explained**

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

#### **"Sample Data" Button**
- **Purpose**: Test dashboard with mock data
- **What it does**: Shows dashboard with fake telemetry data
- **Result**: Displays charts with varied sample data
- **Use case**: See how dashboard looks with active data

## 📊 **Dashboard Charts**

### **1. Requests per Minute**
- **Green line**: Successful requests
- **Red line**: Failed requests
- **Data source**: Application Insights request telemetry

### **2. Response Time Trends** 
- **Blue line**: Average response time in milliseconds
- **Shows**: Performance patterns over time

### **3. Top 5 Slowest Endpoints**
- **Bar chart**: Endpoints ranked by response time
- **Helps identify**: Performance bottlenecks

### **4. Statistics Cards**
- **Total Requests**: Request count in last hour
- **Failed Requests**: Error count and percentage
- **Avg Response Time**: Mean response time
- **System Status**: Overall health indicator

## 🧪 **How to Test & See Chart Movement**

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

### **Quick Test with Sample Data**
If you want to see charts immediately:
1. Visit: `http://localhost:3000/stats/sample`
2. This shows mock data with varied values
3. Charts will display with ups and downs

## ⚙️ **Setup Instructions**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Configure Environment Variables**
Create `.env` file:
```env
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key;IngestionEndpoint=https://your-region.in.applicationinsights.azure.com/
APP_INSIGHTS_APP_ID=your-application-id
APP_INSIGHTS_API_KEY=your-api-key
PORT=3000
```

### **3. Run Application**
```bash
npm start
# Open: http://localhost:3000
```

## 🚨 **Troubleshooting**

### **Charts Are Flat/Empty**
**Cause**: Not enough varied data in Application Insights
**Solution**: 
1. Generate test requests using buttons or curl commands
2. Wait 2-5 minutes for Application Insights processing
3. Try sample data mode: `/stats/sample`

### **"Using Sample Data" Message**
**Cause**: API key issues or no real data available
**Solution**:
1. Check API key has "Read telemetry" permission
2. Verify Application Insights has received data
3. Check Azure Portal → Application Insights → Logs

### **Connection Errors**
**Cause**: Network or configuration issues
**Solution**:
1. Verify internet connection
2. Check Application Insights connection string
3. Validate API key and Application ID

## 📈 **Data Sources**
- **Only Application Insights**: Uses Application Insights REST API
- **Query Language**: KQL (Kusto Query Language)  
- **Data Types**: HTTP requests, exceptions, dependencies, performance metrics
- **Update Frequency**: Every 10 seconds
- **Time Range**: Last 60 minutes