import express from 'express';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // Ensure JSON body parsing
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;