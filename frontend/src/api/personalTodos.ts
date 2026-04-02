import api from './axios';
import type { ApiResponse, PersonalTodo } from '../types';

export const personalTodosApi = {
  getAll: () =>
    api.get<ApiResponse<PersonalTodo[]>>('/personal-todos'),

  create: (data: { title: string; due_date?: string }) =>
    api.post<ApiResponse<PersonalTodo>>('/personal-todos', data),

  update: (id: number, data: Partial<PersonalTodo>) =>
    api.put<ApiResponse<PersonalTodo>>(`/personal-todos/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/personal-todos/${id}`),

  reorder: (ids: number[]) =>
    api.post<ApiResponse<null>>('/personal-todos/reorder', { ids }),
};
