//used to load environment variables from .env file into process.env
require('dotenv').config();

//import our app.js 
const app = require('./app')

//use port from env else use 3000
const PORT = process.env.PORT || 3000;

// start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

 
//i used server js just to start the server only, other all will be in app.js 