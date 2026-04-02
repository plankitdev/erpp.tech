import { useState, useRef, useEffect } from 'react';
import { usePersonalTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from '../hooks/usePersonalTodos';
import { Plus, Trash2, GripVertical, ListTodo, Loader2 } from 'lucide-react';
import type { PersonalTodo } from '../types';

export default function PersonalTodoWidget() {
  const { data: todos = [], isLoading } = usePersonalTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    createTodo.mutate({ title });
    setNewTitle('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleToggle = (todo: PersonalTodo) => {
    updateTodo.mutate({ id: todo.id, data: { is_completed: !todo.is_completed } });
  };

  const handleDelete = (id: number) => {
    deleteTodo.mutate(id);
  };

  const pending = todos.filter(t => !t.is_completed);
  const completed = todos.filter(t => t.is_completed);

  return (
    <div className="animate-fade-in-up card overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center ring-1 ring-primary-100">
              <ListTodo size={18} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">مهامي الشخصية</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {pending.length > 0 ? `${pending.length} مهمة متبقية` : 'لا توجد مهام'}
              </p>
            </div>
          </div>
          {pending.length > 0 && (
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg">
              {pending.length}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-2">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="أضف مهمة جديدة..."
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 placeholder:text-gray-300 transition-all"
            maxLength={500}
          />
          <button
            onClick={handleAdd}
            disabled={!newTitle.trim() || createTodo.isPending}
            className="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {createTodo.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
          </button>
        </div>
      </div>

      <div className="px-5 pb-5 max-h-[320px] overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8">
            <ListTodo size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">ابدأ بإضافة أول مهمة</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            <div className="space-y-1 mt-2">
              {pending.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Completed */}
            {completed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] text-gray-300 font-medium mb-1.5">مكتملة ({completed.length})</p>
                <div className="space-y-1">
                  {completed.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: {
  todo: PersonalTodo;
  onToggle: (todo: PersonalTodo) => void;
  onDelete: (id: number) => void;
}) {
  const [hovering, setHovering] = useState(false);

  return (
    <div
      className={`group flex items-center gap-2.5 py-2 px-2.5 -mx-2.5 rounded-xl transition-all ${
        hovering ? 'bg-surface-50' : ''
      }`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <button
        onClick={() => onToggle(todo)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          todo.is_completed
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        {todo.is_completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-[13px] leading-relaxed transition-all ${
        todo.is_completed
          ? 'line-through text-gray-300'
          : 'text-gray-700'
      }`}>
        {todo.title}
      </span>

      {todo.due_date && !todo.is_completed && (
        <span className="text-[10px] text-gray-400 shrink-0">
          {new Date(todo.due_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
        </span>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 ${
          hovering ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
