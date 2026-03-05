import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void; // 부모에게 파일을 전달하는 함수
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    onImageSelect(file); // 부모(App.tsx)로 파일 전달
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-[300px]">
      {preview ? (
        <div className="relative flex-1 bg-gray-900 rounded-3xl overflow-hidden shadow-sm group">
          <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          <button 
            onClick={clearImage}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <label 
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-200
            ${dragActive ? 'border-jade-400 bg-jade-50' : 'border-gray-200 bg-gray-50 hover:bg-jade-50/50 hover:border-jade-300'}`}
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-jade-400">
            <UploadCloud size={32} />
          </div>
          <p className="text-gray-700 font-medium mb-1">이미지를 드래그하거나 클릭하세요</p>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP 지원</p>
          <input ref={inputRef} type="file" className="hidden" accept="image/*" onChange={handleChange} />
        </label>
      )}
    </div>
  );
}