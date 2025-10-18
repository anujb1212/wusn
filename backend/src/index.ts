import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/sensor', (req, res) => {
    console.log('Received:', req.body);
    res.send({ status: 'ok' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
