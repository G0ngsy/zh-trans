import { useState, useEffect } from 'react'; // 1. useEffect 추가
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';


import Header from './components/Header';
import HeroText from './components/HeroText';
import ActionButtons from './components/ActionButtons';
import CameraCapture from './components/CameraCapture';
import ResultCard from './components/ResultCard';
import ImageUploader from './components/ImageUploader';
import SplashScreen from './components/SplashScreen';

// 화면 상태 정의
type ViewState = 'HOME' | 'CAMERA' | 'UPLOAD' | 'LOADING' | 'RESULT';

interface AnalysisResult {
  original: string;
  pinyin: string;
  literary: { word: string; meaning: string }[];
  colloquial: string; 
  hanja_read: string;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<ViewState>('HOME');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // --- 0. 시작 화면 제어 로직 ---
  useEffect(() => {
     // 2초 뒤에 시작 화면을 닫음
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 1. 홈으로 돌아가기 (초기화)
  const goHome = () => {
    setView('HOME');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  // 2. [공통] 이미지를 받아서 분석을 요청하는 핵심 함수
  const analyzeImage = async (file: File) => {
    setView('LOADING'); 

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setResult(response.data); 
      setView('RESULT');        
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

  // 5. [카메라 모드] 촬영 완료 시 실행
  const handleCameraCapture = (file: File, croppedUrl: string) => {
    setSelectedFile(file);
    setPreviewUrl(croppedUrl); 
    analyzeImage(file); 
  };

  return (
    <div className="min-h-screen bg-jade-50">
      {/* 시작 화면이 true일 때만 보여줌 */}
      {showSplash ? (
        <SplashScreen />
      ) : (
        <div className="animate-fade-in">
          {/* 헤더에 goHome 함수 연결 */}
          <Header onLogoClick={() => setView('HOME')} /> 

          <main className="flex-1 pb-20">
            {/* === CASE 1: 홈 화면 === */}
            {view === 'HOME' && (
              <div className="animate-fade-in pt-12">
                <HeroText />
                <div className="mt-8">
                  <ActionButtons 
                    onCameraClick={() => setView('CAMERA')}
                    onUploadClick={() => setView('UPLOAD')}
                  />
                </div>
              </div>
            )}

            {/* 뒤로가기 버튼 (UPLOAD 모드에서만 표시) */}
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

            {/* === CASE 2: 기능 화면들 === */}
            {view === 'CAMERA' && (
              <CameraCapture 
                onCapture={handleCameraCapture} 
                onClose={goHome}                
              />
            )}

            {view === 'UPLOAD' && (
              <div className="max-w-md mx-auto px-4 animate-slide-up mt-8">
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

            {view === 'LOADING' && (
              <div className="flex flex-col items-center justify-center pt-32 animate-fade-in">
                <Loader2 className="w-16 h-16 text-jade-500 animate-spin mb-6" />
                <h3 className="text-2xl font-bold text-gray-800">AI 분석 중...</h3>
                <p className="text-gray-500 mt-2">잠시만 기다려주세요.</p>
              </div>
            )}

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
      )}
    </div>
  );
}

export default App;