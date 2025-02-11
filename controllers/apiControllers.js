const axios=require("axios")


module.exports.apiTest = async function apiTest(request, response) {
  // Access the request body directly
  let { url, method, headers, params, clientId, clientSecret, redirectUrl } = request.body;

  console.log('Incoming Request:', { url, method, headers, params, clientId, clientSecret, redirectUrl }); // Log incoming request data

  if (!url) {
    return response.status(400).json({ error: 'URL is required' });
  }

  const validHeaders = {};
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (key && value) {
        validHeaders[key] = value;
      }
    }
  }   

  console.log('Headers:', validHeaders);
  console.log('Request Body:', { url, method, params, clientId, clientSecret, redirectUrl }); // Log the incoming request data

  // Append query parameters to the URL if provided
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    let modifiedUrl = url; // Change 'url' to 'modifiedUrl' to allow reassignment

    // Check if the query string is not empty
    if (queryString) {
      // Check if the URL already has query parameters
      if (modifiedUrl.includes('?')) {
        modifiedUrl += '&' + queryString; // Append with '&' if it already has parameters
      } else {
        modifiedUrl += '?' + queryString; // Append with '?' if it doesn't have parameters
      }
    }

    // Only reassign if the queryString is not empty
    url = modifiedUrl; // Reassign the modified URL back to 'url'
  }

  // Ensure that the URL does not end with a '?' if there are no parameters
  if (url.endsWith('?')) {
    url = url.slice(0, -1); // Remove the trailing '?'
  }

  let allData = [];
  let nextPageInfo = null; // Initialize nextPageInfo
  let pageCount = 0; // To track the number of pages fetched

  try {
    // Check if the request is for Pinterest token exchange
    if (params && params.code && clientId && clientSecret) {
      const { code } = params; // Extract the authorization code from params

      // Prepare the request body for Pinterest token exchange
      const tokenRequestBody = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUrl
      }).toString();

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      // Log the token request details
      console.log('Token Request Body:', tokenRequestBody);
      console.log('Authorization Header:', `Basic ${auth}`);

      // Make the request to Pinterest API to exchange the code for a token
      const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          "Content-Type": "application/json",        },
        body: tokenRequestBody, // Include the request body
      });

      if (!response.ok) {
        const errorText = await response.text(); // Get the error response text
        console.error('Pinterest API Error:', errorText); // Log the error response
        throw new Error(`Pinterest API error: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      console.log('Token Response:', data); // Log the token response
      return response.status(200).json({ token: data.access_token });

    } else {
      // Existing logic for handling other API requests
      
      // Construct the fetch URL
      let fetchUrl;

      if (nextPageInfo) {
        // If page_info is present, construct the URL with only page_info
        const baseUrl = new URL(url);
        fetchUrl = `${baseUrl.origin}${baseUrl.pathname}?page_info=${nextPageInfo}`;
      } else {
        // Append query parameters to the URL if provided
        const queryString = new URLSearchParams(params).toString();
        fetchUrl = url + (url.includes('?') ? '&' : '?') + queryString;
      }

      console.log('Request URL:', fetchUrl);

      const apiResponse = await fetch(fetchUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...validHeaders,
        },
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${apiResponse.status}, details: ${errorText}`);
      }

      const data = await apiResponse.json(); // Read the response body once
      console.log('API Response:', data);

      console.log(`Total data fetched: ${data.length}`);
      return response.status(200).json({ data: data });
    }

  } catch (error) {
    console.error('Error connecting to API:', error);
    return response.status(500).json({
      error: 'Error connecting to API',
      details: error.message,
    });
  }
}

const BATCH_SIZE = 150; // Number of boards to process at once
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for retrying failed requests
const retryWithDelay = async (fn, retries = MAX_RETRIES, delayMs = RETRY_DELAY) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Attempt ${i + 1} failed, retrying after ${delayMs}ms...`);
            await delay(delayMs);
        }
    }
};


module.exports.testPinterestApi = async function testPinterestApi(req, res) {
  try {
      const { url, token, params } = req.body;

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
};
