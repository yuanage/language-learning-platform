import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { RequireAuth, RequireAdmin } from '@/components/RequireAuth';

import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import HomePage from '@/pages/HomePage';
import PlacementPage from '@/pages/PlacementPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import LessonLayout from '@/pages/lesson/LessonLayout';
import LessonVocab from '@/pages/lesson/LessonVocab';
import LessonGrammar from '@/pages/lesson/LessonGrammar';
import LessonListening from '@/pages/lesson/LessonListening';
import LessonSpeaking from '@/pages/lesson/LessonSpeaking';
import ProfilePage from '@/pages/ProfilePage';
import CommunityPage from '@/pages/CommunityPage';
import PostDetailPage from '@/pages/PostDetailPage';
import AdminPage from '@/pages/AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/placement/:code" element={<PlacementPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:code" element={<CoursesPage />} />
          <Route path="/course/:id" element={<CourseDetailPage />} />
          <Route path="/lesson/:id" element={<LessonLayout />}>
            <Route index element={<Navigate to="vocab" replace />} />
            <Route path="vocab" element={<LessonVocab />} />
            <Route path="grammar" element={<LessonGrammar />} />
            <Route path="listening" element={<LessonListening />} />
            <Route path="speaking" element={<LessonSpeaking />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:id" element={<PostDetailPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
