const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 1212;

app.get('/', (req, res) => {
    res.send('KrishiLink server is running')
})

app.listen(port, () => {
    console.log(`KrishiLink server is running on port: ${port}`)
})