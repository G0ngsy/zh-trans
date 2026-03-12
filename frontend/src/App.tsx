/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion'; 

import Header from './components/Header';
import HeroText from './components/HeroText';
import ActionButtons from './components/ActionButtons';
import CameraCapture from './components/CameraCapture';
import ResultCard from './components/ResultCard';
import ImageUploader from './components/ImageUploader';
import SplashScreen from './components/SplashScreen';
import VocabPage from './components/VocabPage';
// 화면 상태 정의
type ViewState = 'HOME' | 'CAMERA' | 'UPLOAD' | 'LOADING' | 'RESULT' | 'VOCAB';

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

  // 1. 화면 이동을 담당하는 통합 함수 (기록을 쌓으면서 이동)
  const navigateTo = (nextView: ViewState) => {
    // 현재 화면을 브라우저 기록에 저장
    window.history.pushState({ view: nextView }, '', '');
    setView(nextView);
  };

  // 2. 홈으로 돌아가기 (기록 초기화하며 이동)
  const goHome = () => {
    window.history.pushState({ view: 'HOME' }, '', ''); // 홈 기록 추가
    setView('HOME');
    setSelectedFile(null);
    setResult(null);
    setPreviewUrl(null);
    // 홈으로 올 때는 기록을 새로 깨끗하게 정리할 수도 있습니다.
  };

  // 3. 브라우저/폰의 뒤로가기 신호 감지 로직
  useEffect(() => {
    // 앱이 처음 켜질 때 현재 상태(HOME)를 기록에 한 번 박아줍니다.
    if (window.history.state === null) {
      window.history.replaceState({ view: 'HOME' }, '', '');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        // 폰의 뒤로가기를 누르면 브라우저 기록에 저장된 '이전 view'를 읽어서 보여줍니다.
        setView(event.state.view);
      } else {
        // 기록이 없으면 안전하게 홈으로 보냅니다.
        setView('HOME');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);


  // 2. [핵심] 이중 서버 연결 함수 (메인 PC 서버 -> 실패 시 허깅페이스 비상 서버)
  const analyzeImage = async (file: File) => {
    setView('LOADING'); 

    const formData = new FormData();
    formData.append('file', file);

    // 환경 변수(메인)와 비상용 허깅페이스 주소
    const mainApi = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const fallbackApi = "https://suny0731-hanyu-lens-fallback.hf.space"; 

    try {
      // 1순위: 내 PC 서버 시도
      const response = await axios.post(`${mainApi}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'ngrok-skip-browser-warning': '69420' },
        timeout: 5000 // 5초 대기
      });
      setResult(response.data); 
      navigateTo('RESULT');
    } catch (_error) {
      console.warn("메인 서버 실패, 비상 서버로 전환합니다.");
      try {
        // 2순위: 내 PC 서버 실패 시 허깅페이스로 시도
        const fallbackResponse = await axios.post(`${fallbackApi}/analyze`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setResult(fallbackResponse.data); 
        navigateTo('RESULT');
      } catch (_fallbackError) {
        alert("분석 실패! 서버 연결을 확인해주세요.");
        setView('HOME');
      }
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
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!showSplash && (
        <div className="animate-fade-in">
          {/* 헤더에 goHome 함수 연결 */}
          <Header onLogoClick={goHome}
                  onVocabClick={() => navigateTo('VOCAB')} /> 

          <main className="flex-1 pb-20">
            {/* === CASE 1: 홈 화면 === */}
            {view === 'HOME' && (
              <div className="animate-fade-in pt-12">
                <HeroText />
                <div className="mt-8">
                  <ActionButtons 
                    onCameraClick={() => navigateTo('CAMERA')}
                    onUploadClick={() => navigateTo('UPLOAD')}
                  />
                 
                </div>
              </div>
            )}

            {/* 단어장: 뒤로가기는 폰 버튼이 대신하므로 onBack은 goHome 혹은 간단히 처리 */}
            {view === 'VOCAB' && <VocabPage onBack={() => window.history.back()} />}

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
                        ? 'bg-jade-600 hover:bg-jade-700' 
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

            {/* 결과창: 여기서 단어장 갔다가 뒤로오면 다시 여기가 보임! */}
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