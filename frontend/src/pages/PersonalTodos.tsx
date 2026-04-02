import PersonalTodoWidget from '../components/PersonalTodoWidget';
import { ListTodo } from 'lucide-react';

export default function PersonalTodos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center ring-1 ring-primary-100">
          <ListTodo size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">مهامي الشخصية</h1>
          <p className="text-sm text-gray-400">قائمة المهام الخاصة بك</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <PersonalTodoWidget />
      </div>
    </div>
  );
}
