const express = require('express');
const appInsights = require('applicationinsights');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Debug logging for environment variables
console.log('🔍 Environment Variables Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('APPINSIGHTS_CONNECTION_STRING present:', !!process.env.APPINSIGHTS_CONNECTION_STRING);
console.log('APPINSIGHTS_CONNECTION_STRING length:', process.env.APPINSIGHTS_CONNECTION_STRING?.length || 0);
console.log('APP_INSIGHTS_APP_ID:', process.env.APP_INSIGHTS_APP_ID ? `${process.env.APP_INSIGHTS_APP_ID.substring(0, 8)}...` : 'NOT SET');
console.log('APP_INSIGHTS_API_KEY present:', !!process.env.APP_INSIGHTS_API_KEY);
console.log('APP_INSIGHTS_API_KEY length:', process.env.APP_INSIGHTS_API_KEY?.length || 0);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('');

// Initialize Application Insights
if (process.env.APPINSIGHTS_CONNECTION_STRING) {
    console.log('✅ Initializing Application Insights...');
    try {
        appInsights.setup(process.env.APPINSIGHTS_CONNECTION_STRING)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true, true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .setAutoCollectConsole(true)
            .setUseDiskRetryCaching(true)
            .setSendLiveMetrics(true)
            .start();
        
        console.log('✅ Application Insights initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Application Insights:', error.message);
    }
} else {
    console.warn('⚠️  APPINSIGHTS_CONNECTION_STRING not found. Application Insights will not be enabled.');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📥 ${timestamp} ${req.method} ${req.url}`);
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

// Azure Monitor API configuration
const AZURE_MONITOR_API_BASE = 'https://api.applicationinsights.io/v1/apps';
const APP_ID = process.env.APP_INSIGHTS_APP_ID;
const API_KEY = process.env.APP_INSIGHTS_API_KEY;

// Helper function to make Azure Monitor API requests
async function queryApplicationInsights(query) {
    console.log('🔍 Querying Application Insights...');
    console.log('🔍 Query:', query);
    console.log('🔍 APP_ID:', APP_ID ? `${APP_ID.substring(0, 8)}...` : 'NOT SET');
    console.log('🔍 API_KEY length:', API_KEY?.length || 0);
    
    if (!APP_ID || !API_KEY) {
        console.error('❌ APP_INSIGHTS_APP_ID and APP_INSIGHTS_API_KEY must be configured');
        throw new Error('APP_INSIGHTS_APP_ID and APP_INSIGHTS_API_KEY must be configured');
    }

    try {
        const url = `${AZURE_MONITOR_API_BASE}/${APP_ID}/query`;
        console.log('🔍 Request URL:', url);
        
        const response = await axios.get(url, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json'
            },
            params: {
                query: query
            }
        });
        
        console.log('✅ Application Insights query successful');
        console.log('✅ Response status:', response.status);
        console.log('✅ Response data keys:', Object.keys(response.data));
        console.log('🔍 DETAILED RESPONSE:', JSON.stringify(response.data, null, 2));
        
        // Log table structure if available
        if (response.data.tables && response.data.tables.length > 0) {
            const table = response.data.tables[0];
            console.log('📊 Table columns:', table.columns.map(col => `${col.name} (${col.type})`));
            console.log('📊 Number of rows:', table.rows.length);
            if (table.rows.length > 0) {
                console.log('📊 First 3 rows:', table.rows.slice(0, 3));
                console.log('📊 Sample data structure:', table.rows[0]);
            }
        }
        
        return response.data;
    } catch (error) {
        console.error('❌ Error querying Application Insights:');
        console.error('❌ Status:', error.response?.status);
        console.error('❌ Data:', error.response?.data);
        console.error('❌ Message:', error.message);
        throw error;
    }
}

// Routes

// Serve the homepage
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    console.log('📄 Serving homepage:', filePath);
    console.log('📄 File exists:', require('fs').existsSync(filePath));
    res.sendFile(filePath);
});

// Serve the setup guide
app.get('/setup-guide.html', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'setup-guide.html');
    console.log('📋 Serving setup guide:', filePath);
    res.sendFile(filePath);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        appInsightsEnabled: !!process.env.APPINSIGHTS_CONNECTION_STRING
    });
});

// Error endpoint to simulate failures
app.get('/error', (req, res) => {
    const errorMessage = 'This is a simulated error for testing purposes';
    console.error(errorMessage);
    
    // Track custom exception
    if (appInsights.defaultClient) {
        appInsights.defaultClient.trackException({
            exception: new Error(errorMessage),
            severity: appInsights.Contracts.SeverityLevel.Error
        });
    }
    
    // Throw error to trigger automatic exception tracking
    throw new Error(errorMessage);
});

// Slow endpoint for testing performance metrics
app.get('/slow', async (req, res) => {
    const delay = Math.random() * 3000 + 1000; // Random delay between 1-4 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    res.json({ 
        message: 'This endpoint simulates slow response times',
        delay: Math.round(delay) + 'ms'
    });
});

// API endpoint to get telemetry stats
app.get('/stats', async (req, res) => {
    console.log('📊 /stats endpoint called');
    console.log('📊 APP_ID available:', !!APP_ID);
    console.log('📊 API_KEY available:', !!API_KEY);
    
    try {
        const timeRange = req.query.timeRange || 'PT1H'; // Default to last 1 hour
        const now = new Date();
        const timeAgo = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago

        // Query for requests per minute
        const requestsQuery = `
            requests
            | where timestamp > ago(1h)
            | summarize RequestCount = count() by bin(timestamp, 1m)
            | order by timestamp desc
            | limit 60
        `;

        // Query for failed requests per minute
        const failedRequestsQuery = `
            requests
            | where timestamp > ago(1h) and success == false
            | summarize FailedRequestCount = count() by bin(timestamp, 1m)
            | order by timestamp desc
            | limit 60
        `;

        // Query for average response time per minute
        const responseTimeQuery = `
            requests
            | where timestamp > ago(1h)
            | summarize AvgResponseTime = avg(duration) by bin(timestamp, 1m)
            | order by timestamp desc
            | limit 60
        `;

        // Query for top 5 slowest endpoints
        const slowestEndpointsQuery = `
            requests
            | where timestamp > ago(1h)
            | summarize AvgDuration = avg(duration), RequestCount = count() by name
            | where RequestCount > 1
            | order by AvgDuration desc
            | limit 5
        `;

        // Query for overall stats
        const overallStatsQuery = `
            requests
            | where timestamp > ago(1h)
            | summarize 
                TotalRequests = count(),
                FailedRequests = countif(success == false),
                AvgResponseTime = avg(duration),
                P95ResponseTime = percentile(duration, 95)
        `;

        // Execute all queries in parallel
        console.log('📊 Executing 5 parallel queries to Application Insights...');
        const [requestsData, failedRequestsData, responseTimeData, slowestEndpointsData, overallStatsData] = await Promise.all([
            queryApplicationInsights(requestsQuery),
            queryApplicationInsights(failedRequestsQuery),
            queryApplicationInsights(responseTimeQuery),
            queryApplicationInsights(slowestEndpointsQuery),
            queryApplicationInsights(overallStatsQuery)
        ]);

        console.log('📊 Processing query results...');
        
        // Process requests data
        console.log('📊 REQUESTS DATA:', JSON.stringify(requestsData, null, 2));
        const requestCounts = requestsData.tables[0]?.rows.map(row => {
            console.log('📊 Request row:', row);
            return {
                timestamp: row[0], // First column is timestamp
                RequestCount: row[1] || 0 // Second column is count
            };
        }) || [];
        console.log('📊 Processed request counts:', requestCounts);

        // Process failed requests data
        console.log('📊 FAILED REQUESTS DATA:', JSON.stringify(failedRequestsData, null, 2));
        const failedRequests = failedRequestsData.tables[0]?.rows.map(row => {
            console.log('📊 Failed request row:', row);
            return {
                timestamp: row[0], // First column is timestamp
                FailedRequestCount: row[1] || 0 // Second column is count
            };
        }) || [];
        console.log('📊 Processed failed requests:', failedRequests);

        // Process response time data
        console.log('📊 RESPONSE TIME DATA:', JSON.stringify(responseTimeData, null, 2));
        const responseTimes = responseTimeData.tables[0]?.rows.map(row => {
            console.log('📊 Response time row:', row);
            return {
                timestamp: row[0], // First column is timestamp
                AvgResponseTime: row[1] || 0 // Second column is response time
            };
        }) || [];
        console.log('📊 Processed response times:', responseTimes);

        // Process slowest endpoints data
        console.log('📊 SLOWEST ENDPOINTS DATA:', JSON.stringify(slowestEndpointsData, null, 2));
        const slowestEndpoints = slowestEndpointsData.tables[0]?.rows.map(row => {
            console.log('📊 Slowest endpoint row:', row);
            return {
                name: row[0] || 'Unknown', // First column is name
                AvgDuration: row[1] || 0,  // Second column is duration
                RequestCount: row[2] || 0  // Third column is count
            };
        }) || [];
        console.log('📊 Processed slowest endpoints:', slowestEndpoints);

        // Process overall stats data
        console.log('📊 OVERALL STATS DATA:', JSON.stringify(overallStatsData, null, 2));
        const overallStats = overallStatsData.tables[0]?.rows[0] ? {
            TotalRequests: overallStatsData.tables[0].rows[0][0] || 0,
            FailedRequests: overallStatsData.tables[0].rows[0][1] || 0,
            AvgResponseTime: overallStatsData.tables[0].rows[0][2] || 0,
            P95ResponseTime: overallStatsData.tables[0].rows[0][3] || 0
        } : {
            TotalRequests: 0,
            FailedRequests: 0,
            AvgResponseTime: 0,
            P95ResponseTime: 0
        };
        console.log('📊 Processed overall stats:', overallStats);

        // Format the response to match expected format
        const stats = {
            requestCounts: requestCounts,
            failedRequests: failedRequests,
            responseTimes: responseTimes,
            slowestEndpoints: slowestEndpoints,
            summary: overallStats
        };

        console.log('📊 FINAL STATS OBJECT:', JSON.stringify(stats, null, 2));

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ 
            error: 'Failed to fetch telemetry data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Sample data endpoint (fallback when no real data is available)
app.get('/stats/sample', (req, res) => {
    console.log('📊 Generating dynamic sample data...');
    
    const now = new Date();
    const baseTraffic = 25;
    const peakHours = [9, 10, 11, 14, 15, 16, 17]; // Business hours
    const currentHour = now.getHours();
    
    // Generate realistic dynamic data that matches Application Insights format
    const sampleData = {
        requestCounts: Array.from({length: 60}, (_, i) => {
            const timeOffset = 59 - i;
            const timestamp = new Date(now.getTime() - timeOffset * 60000);
            const hour = timestamp.getHours();
            const minute = timestamp.getMinutes();
            
            // Create realistic traffic patterns
            let baseCount = baseTraffic;
            if (peakHours.includes(hour)) baseCount *= 2.2;
            if (hour >= 0 && hour <= 6) baseCount *= 0.4; // Night time
            
            // Add patterns: spikes, waves, and noise
            const spike = Math.random() > 0.92 ? Math.random() * 80 : 0;
            const noise = (Math.random() - 0.5) * 15;
            const sinWave = Math.sin((minute / 30) * Math.PI * 2) * 12;
            const trend = Math.sin((timeOffset / 60) * Math.PI) * 8;
            
            return {
                timestamp: timestamp.toISOString(),
                RequestCount: Math.max(0, Math.floor(baseCount + spike + noise + sinWave + trend))
            };
        }),
        
        failedRequests: Array.from({length: 60}, (_, i) => {
            const timeOffset = 59 - i;
            const timestamp = new Date(now.getTime() - timeOffset * 60000);
            
            // Failed requests correlate with total requests
            const errorRate = 0.015 + (Math.random() * 0.025); // 1.5-4% error rate
            const spike = Math.random() > 0.95 ? Math.floor(Math.random() * 8) : 0;
            const baseErrors = Math.floor(Math.random() * 3) + 1;
            
            return {
                timestamp: timestamp.toISOString(),
                FailedRequestCount: baseErrors + spike
            };
        }),
        
        responseTimes: Array.from({length: 60}, (_, i) => {
            const timeOffset = 59 - i;
            const timestamp = new Date(now.getTime() - timeOffset * 60000);
            const minute = timestamp.getMinutes();
            
            // Response times with realistic patterns
            const baseResponseTime = 85;
            const loadVariation = Math.sin((minute / 20) * Math.PI) * 35;
            const randomSpike = Math.random() > 0.93 ? Math.random() * 300 : 0;
            const noise = (Math.random() - 0.5) * 25;
            const timeOfDayEffect = peakHours.includes(timestamp.getHours()) ? 30 : 0;
            
            return {
                timestamp: timestamp.toISOString(),
                AvgResponseTime: Math.max(15, baseResponseTime + loadVariation + randomSpike + noise + timeOfDayEffect)
            };
        }),
        
        slowestEndpoints: [
            { 
                name: '/api/reports/generate', 
                AvgDuration: 1245.5 + (Math.random() * 400 - 200), 
                RequestCount: 8 + Math.floor(Math.random() * 12) 
            },
            { 
                name: '/api/data/export', 
                AvgDuration: 892.2 + (Math.random() * 300 - 150), 
                RequestCount: 15 + Math.floor(Math.random() * 18) 
            },
            { 
                name: '/api/search/advanced', 
                AvgDuration: 456.8 + (Math.random() * 200 - 100), 
                RequestCount: 45 + Math.floor(Math.random() * 35) 
            },
            { 
                name: '/api/users/profile', 
                AvgDuration: 234.9 + (Math.random() * 120 - 60), 
                RequestCount: 125 + Math.floor(Math.random() * 60) 
            },
            { 
                name: '/api/orders/history', 
                AvgDuration: 187.4 + (Math.random() * 80 - 40), 
                RequestCount: 200 + Math.floor(Math.random() * 80) 
            }
        ],
        
        summary: {
            TotalRequests: 1245 + Math.floor(Math.random() * 800),
            FailedRequests: 18 + Math.floor(Math.random() * 25),
            AvgResponseTime: 156.7 + (Math.random() * 80 - 40),
            P95ResponseTime: 287.3 + (Math.random() * 150 - 75)
        }
    };
    
    console.log('📊 Sample data generated with realistic patterns');
    res.json(sampleData);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    if (appInsights.defaultClient) {
        appInsights.defaultClient.trackException({
            exception: error,
            severity: appInsights.Contracts.SeverityLevel.Error
        });
    }
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('');
    console.log('🚀 =================================');
    console.log('🚀 Azure Monitor Dashboard STARTED');
    console.log('🚀 =================================');
    console.log(`🌐 Server running on port: ${PORT}`);
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`📁 Static files from: ${path.join(__dirname, 'public')}`);
    console.log('');
    
    // Configuration status
    console.log('⚙️  Configuration Status:');
    console.log(`   APPINSIGHTS_CONNECTION_STRING: ${process.env.APPINSIGHTS_CONNECTION_STRING ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   APP_INSIGHTS_APP_ID: ${APP_ID ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`   APP_INSIGHTS_API_KEY: ${API_KEY ? '✅ SET' : '❌ NOT SET'}`);
    console.log('');
    
    if (!process.env.APPINSIGHTS_CONNECTION_STRING) {
        console.log('⚠️  Warning: APPINSIGHTS_CONNECTION_STRING not configured');
        console.log('📋 See README.md for setup instructions');
        console.log('');
    }
    
    if (!APP_ID || !API_KEY) {
        console.log('⚠️  Warning: APP_INSIGHTS_APP_ID or APP_INSIGHTS_API_KEY not configured');
        console.log('📋 API endpoints will return sample data until configured');
        console.log('');
    }
    
    console.log('🎯 Test URLs:');
    console.log(`   Dashboard: http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   Sample Data: http://localhost:${PORT}/stats/sample`);
    console.log(`   Trigger Error: http://localhost:${PORT}/error`);
    console.log('');
});

module.exports = app;