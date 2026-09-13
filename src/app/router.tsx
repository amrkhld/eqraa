import { createBrowserRouter, Navigate } from 'react-router-dom'
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/explore" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'books',
        element: (
          <ProtectedRoute>
            <MyBooksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'books/:bookId',
        element: (
          <ProtectedRoute>
            <BookDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'books/:bookId/question-sets',
        element: (
          <ProtectedRoute>
            <QuestionSetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'books/:bookId/question-sets/:setId',
        element: (
          <ProtectedRoute>
            <QuestionSetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'books/:bookId/question-sets/:setId/manage',
        element: (
          <ProtectedRoute>
            <ManageQuestionSetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'books/:bookId/question-sets/:setId/take',
        element: (
          <ProtectedRoute>
            <TakeQuestionSetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile/:username',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Reader is outside AppLayout (full screen, no navbar)
  {
    path: 'books/:bookId/read',
    element: (
      <ProtectedRoute>
        <ReaderPage />
      </ProtectedRoute>
    ),
  },
])
