import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFileDrop: (file: File) => void;
  children?: ReactNode;
  className?: string;
  accept?: string;
  label?: string;
}

export default function FileDropZone({ onFileDrop, children, className = '', accept, label = 'اسحب الملف هنا أو اضغط للاختيار' }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) onFileDrop(file);
  }, [onFileDrop]);

  const handleClick = () => inputRef.current?.click();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileDrop(file);
    e.target.value = '';
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative cursor-pointer transition-all duration-200 ${className} ${isDragging ? 'ring-2 ring-primary-400 bg-primary-50 border-primary-400' : ''}`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary-50/90 rounded-2xl border-2 border-dashed border-primary-400">
          <div className="text-center">
            <Upload size={32} className="mx-auto text-primary-500 mb-2" />
            <p className="text-primary-600 font-medium text-sm">أفلت الملف هنا</p>
          </div>
        </div>
      )}
      {children || (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary-300 hover:bg-primary-50/30 transition-all">
          <Upload size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">{label}</p>
        </div>
      )}
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={handleChange} />
    </div>
  );
}
