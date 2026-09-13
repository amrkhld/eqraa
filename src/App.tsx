import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'

// Main pages
import { ExplorePage } from '@/pages/explore/ExplorePage'
import { SearchPage } from '@/pages/search/SearchPage'
import { MyBooksPage } from '@/pages/books/MyBooksPage'
import { BookDetailPage } from '@/pages/books/BookDetailPage'
import { ReaderPage } from '@/pages/reader/ReaderPage'
import { QuestionSetsPage } from '@/pages/question-sets/QuestionSetsPage'
import { ManageQuestionSetPage } from '@/pages/question-sets/ManageQuestionSetPage'
import { TakeQuestionSetPage } from '@/pages/question-sets/TakeQuestionSetPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Reader is outside AppLayout (full screen, no navbar) */}
          <Route
            path="/books/:bookId/read"
            element={
              <ProtectedRoute>
                <ReaderPage />
              </ProtectedRoute>
            }
          />

          {/* All other pages share the AppLayout (with navbar) */}
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/explore" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route
              path="/books"
              element={
                <ProtectedRoute>
                  <MyBooksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:bookId"
              element={
                <ProtectedRoute>
                  <BookDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:bookId/question-sets"
              element={
                <ProtectedRoute>
                  <QuestionSetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:bookId/question-sets/:setId"
              element={
                <ProtectedRoute>
                  <QuestionSetsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:bookId/question-sets/:setId/manage"
              element={
                <ProtectedRoute>
                  <ManageQuestionSetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/books/:bookId/question-sets/:setId/take"
              element={
                <ProtectedRoute>
                  <TakeQuestionSetPage />
                </ProtectedRoute>
              }
            />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
