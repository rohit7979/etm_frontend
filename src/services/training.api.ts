import api from '../lib/axios';
import type { Training } from '../types';

export interface TrainingPayload {
  title: string;
  description: string;
  category: string;
  durationHours: number;
}

export const fetchTrainings = async (): Promise<Training[]> => {
  const { data } = await api.get<Training[]>('/trainings');
  return data;
};

export const fetchTraining = async (id: string): Promise<Training> => {
  const { data } = await api.get<Training>(`/trainings/${id}`);
  return data;
};

export const createTraining = async (payload: TrainingPayload): Promise<Training> => {
  const { data } = await api.post<Training>('/trainings', payload);
  return data;
};

export const updateTraining = async (id: string, payload: Partial<TrainingPayload>): Promise<Training> => {
  const { data } = await api.put<Training>(`/trainings/${id}`, payload);
  return data;
};

export const deleteTraining = async (id: string): Promise<void> => {
  await api.delete(`/trainings/${id}`);
};
