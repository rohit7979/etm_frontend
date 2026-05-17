import api from '../lib/axios';
import type { Comment } from '../types';

export const fetchComments = async (assignmentId: string): Promise<Comment[]> => {
  const { data } = await api.get<{ count: number; comments: Comment[] }>(
    `/assignments/${assignmentId}/comments`
  );
  return data.comments;
};

export const addComment = async (assignmentId: string, text: string): Promise<Comment> => {
  const { data } = await api.post<{ comment: Comment }>(
    `/assignments/${assignmentId}/comments`,
    { text }
  );
  return data.comment;
};

export const deleteComment = async (assignmentId: string, commentId: string): Promise<void> => {
  await api.delete(`/assignments/${assignmentId}/comments/${commentId}`);
};
