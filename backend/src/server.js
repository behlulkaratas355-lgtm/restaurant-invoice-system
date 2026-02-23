import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://0.0.0.0:${PORT}/api`);
  console.log(`❤️  Health: http://0.0.0.0:${PORT}/health`);
});
