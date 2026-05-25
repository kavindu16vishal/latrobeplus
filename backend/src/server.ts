import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import studentRoutes from './routes/student';
import insightsRoutes from './routes/insights';
import quizzesRoutes from './routes/quizzes';
import lecturerRoutes from './routes/lecturer';
import notificationsRoutes from './routes/notifications';
import studentFeaturesRoutes from './routes/student-features';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/quizzes', quizzesRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/student-features', studentFeaturesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Learning Journey Assistant API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
