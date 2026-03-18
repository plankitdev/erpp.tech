import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags';
import toast from 'react-hot-toast';

export function useTags() {
  return useQuery({ queryKey: ['tags'], queryFn: tagsApi.getAll });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('تم إنشاء العلامة'); },
    onError: () => toast.error('فشل إنشاء العلامة'),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; color?: string } }) => tagsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('تم تحديث العلامة'); },
    onError: () => toast.error('فشل تحديث العلامة'),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); toast.success('تم حذف العلامة'); },
    onError: () => toast.error('فشل حذف العلامة'),
  });
}

export function useAttachTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, type, id }: { tagId: number; type: string; id: number }) => tagsApi.attach(tagId, type, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
}

export function useDetachTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, type, id }: { tagId: number; type: string; id: number }) => tagsApi.detach(tagId, type, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tags'] }); },
  });
}
