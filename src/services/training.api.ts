import api from '../lib/axios';
import type { Training } from '../types';

export interface TrainingPayload {
  title: string;
  description: string;
  category: string;
  durationHours: number;
}

export const fetchTrainings = async (): Promise<Training[]> => {
  const { data } = await api.get<{ count: number; trainings: Training[] }>('/trainings');
  return data.trainings;
};

export const fetchTraining = async (id: string): Promise<Training> => {
  const { data } = await api.get<{ training: Training }>(`/trainings/${id}`);
  return data.training;
};

export const createTraining = async (payload: TrainingPayload): Promise<Training> => {
  const { data } = await api.post<{ training: Training }>('/trainings', payload);
  return data.training;
};

export const updateTraining = async (
  id: string,
  payload: Partial<TrainingPayload>
): Promise<Training> => {
  const { data } = await api.put<{ training: Training }>(`/trainings/${id}`, payload);
  return data.training;
};

export const deleteTraining = async (id: string): Promise<void> => {
  await api.delete(`/trainings/${id}`);
};
