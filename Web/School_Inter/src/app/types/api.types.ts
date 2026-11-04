export const API_BASE_URL = 'http://localhost:5192';

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  jwt?: string;
  email?: string;
  fullName?: string;
  studentId?: string;
  user?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
  [key: string]: unknown;
}

export interface Course {
  id: string;
  name: string;
  credits?: number;
  professorId?: string;
  professorName?: string;
  teacherName?: string;
  instructor?: string;
  professor?: {
    id?: string;
    name?: string;
    fullName?: string;
  } | string;
  description?: string;
}

export interface CreateStudentRequest {
  fullName: string;
  email: string;
  password: string;
  courseIds: string[];
}

export interface UpdateStudentRequest {
  fullName: string;
  courseIds: string[];
}

export interface StudentCourseSummary {
  id?: string;
  courseId?: string;
  name?: string;
  courseName?: string;
  professorName?: string;
  credits?: number;
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  credits?: number;
  totalCredits?: number;
  courseIds?: string[];
  courses?: (Course | StudentCourseSummary | string)[];
  createdAt?: string;
}

export interface Enrollment {
  id?: string;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
  courseId?: string;
  courseName?: string;
  professorName?: string;
  credits?: number;
  enrolledAt?: string;
  courses?: (Course | StudentCourseSummary | string)[];
  students?: string[];
}

export interface MyCourseClassmate {
  id?: string;
  fullName?: string;
  name?: string;
  email?: string;
}

export interface MyCourseItem {
  id?: string;
  courseId?: string;
  name?: string;
  courseName?: string;
  professorName?: string;
  teacherName?: string;
  credits?: number;
  classmates?: (MyCourseClassmate | string)[];
  students?: (MyCourseClassmate | string)[];
  companions?: (MyCourseClassmate | string)[];
}

export interface ApiErrorLog {
  id?: string;
  logId?: string;
  timestamp?: string;
  createdAt?: string;
  date?: string;
  level?: string;
  message?: string;
  error?: string;
  detail?: string;
  details?: string;
  exception?: string;
  stackTrace?: string;
  path?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userEmail?: string;
  [key: string]: unknown;
}

export interface NormalizedApiError {
  status: number;
  message: string;
  logId?: string;
  raw?: unknown;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  logId?: string;
  createdAt: number;
}
