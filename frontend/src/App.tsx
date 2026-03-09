import { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

import Header from './components/Header';
import HeroText from './components/HeroText';
import ActionButtons from './components/ActionButtons';
import CameraCapture from './components/CameraCapture';
import ResultCard from './components/ResultCard';
import ImageUploader from './components/ImageUploader';

// 화면 상태 정의
type ViewState = 'HOME' | 'CAMERA' | 'UPLOAD' | 'LOADING' | 'RESULT';

interface AnalysisResult {
  original: string;
  pinyin: string;
  meaning: string;
  literary: { word: string; meaning: string }[];
  colloquial: string; 
  hanja_read: string;
}

function App() {
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // --- 기능 로직 ---

  // 1. 홈으로 돌아가기 (초기화)
  const goHome = () => {
    setView('HOME');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  // 2. [공통] 이미지를 받아서 분석을 요청하는 핵심 함수
  const analyzeImage = async (file: File) => {
    setView('LOADING'); // 로딩 화면으로 전환

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 백엔드(FastAPI)로 전송
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setResult(response.data); // 결과 저장
      setView('RESULT');        // 결과 화면으로 이동
    } catch (error) {
      console.error(error);
      alert("분석 실패! 백엔드 서버가 켜져 있는지 확인해주세요.");
      setView('HOME');
    }
  };

  // 3. [업로드 모드] 파일 선택 핸들러
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 4. [업로드 모드] '분석하기' 버튼 클릭 시 실행
  const handleUploadAnalyze = () => {
    if (selectedFile) {
      analyzeImage(selectedFile);
    }
  };

  // 5. [카메라 모드] 촬영 완료 시 실행 (촬영 -> 저장 -> 바로 분석)
  const handleCameraCapture = (file: File, croppedUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(croppedUrl); // 전체 화면이 아닌 잘린 이미지가 결과창에 보임
    analyzeImage(file); // 바로 분석 시작
  };


  // --- 화면 렌더링 ---

  return (
    <div className="min-h-screen bg-jade-50">
      
      {/* 상단 헤더 */}
      <Header />

      <main className="pb-20">

        {/* =========================================
            CASE 1: 홈 화면
           ========================================= */}
        {view === 'HOME' && (
          <div className="animate-fade-in">
            <HeroText />
            <div className="mt-8">
              <ActionButtons 
                onCameraClick={() => setView('CAMERA')}
                onUploadClick={() => setView('UPLOAD')}
              />
            </div>
          </div>
        )}

        {/* 뒤로가기 버튼 (홈, 결과, 카메라 화면 제외) */}
        {/* 카메라는 자체 닫기 버튼이 있고, 결과창은 재시도 버튼이 있으므로 제외 */}
        {view === 'UPLOAD' && (
          <div className="max-w-2xl mx-auto px-6 mt-4 mb-2">
            <button 
              onClick={goHome} 
              className="flex items-center text-gray-500 hover:text-jade-600 font-bold transition-colors"
            >
              <ArrowLeft size={20} className="mr-1"/> 처음으로
            </button>
          </div>
        )}

        {/* =========================================
            CASE 2: 기능 화면들
           ========================================= */}

        {/* A. 카메라 화면 */}
        {view === 'CAMERA' && (
          // 카메라는 전체 화면 느낌을 주기 위해 패딩을 제거하거나 별도 처리
          <div className="animate-slide-up">
            <CameraCapture 
              onCapture={handleCameraCapture} // 촬영 시 분석 함수 실행
              onClose={goHome}                // 닫기 시 홈으로
            />
          </div>
        )}

        {/* B. 업로드 화면 */}
        {view === 'UPLOAD' && (
          <div className="max-w-md mx-auto px-4 animate-slide-up">
            <h2 className="text-xl font-bold text-center mb-6 text-gray-800">이미지 업로드</h2>
            <ImageUploader onImageSelect={handleFileSelect} />
            
            <div className="mt-6">
              <button 
                onClick={handleUploadAnalyze}
                disabled={!selectedFile}
                className={`w-full py-4 rounded-2xl font-bold text-white shadow-md transition-all ${
                  selectedFile 
                    ? 'bg-[#1C1C1C] hover:bg-black' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {selectedFile ? '분석 시작하기' : '이미지를 선택해주세요'}
              </button>
            </div>
          </div>
        )}

        {/* C. 로딩 화면 */}
        {view === 'LOADING' && (
          <div className="flex flex-col items-center justify-center pt-32 animate-fade-in">
            <Loader2 className="w-16 h-16 text-jade-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-gray-800">AI 분석 중...</h3>
            <p className="text-gray-500 mt-2">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* D. 결과 화면 */}
        {view === 'RESULT' && result && (
          <div className="max-w-md mx-auto px-4 animate-fade-in pt-4">
            <ResultCard 
              imageUrl={previewUrl}
              result={result}
              onRetry={goHome}
            />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;