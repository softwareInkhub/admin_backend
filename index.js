// server/index.js
const serverless = require('serverless-http')

const express = require('express'); // Import Express
const cors = require('cors');       // Import CORS
const bodyParser = require('body-parser'); // Import Body-Parser
const axios = require('axios');     // Import Axios for making API requests
const apiRoutes = require('./routes/apiRoutes'); // Import API routes
const testRoute=require("./routes/route")
const app = express(); // Create an Express application
const PORT = process.env.PORT || 3000; // Set the port

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Sample route
app.get('/',(req,res)=>{
    res.send("hello, world!")
})


app.use('/api', apiRoutes);
app.use('/test', testRoute);

// Proxy route for Pinterest token
app.post('/api/pinterest/token', async (req, res) => {
    console.log('Incoming Request Body:', req.body); // Log the incoming request body
    const { code, clientId, clientSecret, redirectUrl } = req.body;

    // Check if any of the required fields are missing
    if (!code || !clientId || !clientSecret || !redirectUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const tokenRequestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUrl
    }).toString();

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    

    try {
        const response = await axios.post('https://api.pinterest.com/v5/oauth/token', tokenRequestBody, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
       
        res.json(response.data.access_token); // Send the response data back to the client
    
    
    } catch (error) {
        console.error('Error fetching token:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to fetch token' });
    }
});

app.post('/api/testPinterestApi', async (req, res) => {
    try {
        const { url, token } = req.body;
  
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
  
        const apiUrl = new URL(url);
        if (params) {
            Object.keys(params).forEach(key => {
                apiUrl.searchParams.append(key, params[key]);
            });
        }
  
        const response = await axios.get(apiUrl.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
  
        res.json(response.data);
  
    } catch (error) {
        console.error('Error fetching data:', error);
        if (error.response) {
            console.error('Error response data:', error.response.data);
            console.error('Error response status:', error.response.status);
        } else {
            console.error('Error message:', error.message);
        }
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});
  



// Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`); // Log the server URL
// });

module.exports.handler=serverless(app)