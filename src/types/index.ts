export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export interface Book {
  id: string
  owner_id: string
  title: string
  author: string | null
  cover_url: string | null
  description: string | null
  file_path: string
  file_type: string
  status: 'processing' | 'ready' | 'failed'
  created_at: string
}

export interface BookNode {
  id: string
  book_id: string
  parent_id: string | null
  type: 'chapter' | 'section' | 'page'
  label: string
  order_index: number
  content: string | null
  href: string | null
  start_position: number | null
  end_position: number | null
  created_at: string
}

export interface QuestionSet {
  id: string
  book_id: string
  creator_id: string
  name: string
  description: string | null
  visibility: 'public' | 'private'
  total_questions: number
  created_at: string
  updated_at: string
  // Joined
  creator?: Profile
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_correct'

export interface Question {
  id: string
  question_set_id: string
  book_node_id: string | null
  type: QuestionType
  prompt: string
  options: string[] | null
  correct_answer: string | string[]
  explanation: string | null
  order_index: number
  created_at: string
}

export interface QuestionAttempt {
  id: string
  question_id: string
  user_id: string
  answer: string | string[]
  is_correct: boolean
  attempt_count: number
  tested_at: string
}

export type QuestionSetStatus = 'not_started' | 'in_progress' | 'completed'

export interface QuestionSetProgress {
  id: string
  question_set_id: string
  user_id: string
  current_question: number
  attempted_count: number
  correct_count: number
  status: QuestionSetStatus
  last_attempted_at: string | null
}

export interface ReadingProgress {
  id: string
  book_id: string
  user_id: string
  current_node_id: string | null
  position: number
  percent: number
  completed: boolean
  started_at: string
  last_read_at: string
  completed_at: string | null
}
