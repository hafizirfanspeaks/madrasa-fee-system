import { apiClient } from '@/lib/api-client';

export const bulkImportStudentsApi = async (studentsData: any[]) => {
  const response = await apiClient.post('/students/bulk-import', { students: studentsData });
  return response.data;
};