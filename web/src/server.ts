import express from 'express';
import path from 'path';

const app = express();
const port = 3000;

// Serve static files from the dist/public directory instead of src/public
app.use(express.static(path.join(__dirname, '..', 'dist', 'public')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 