import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    // 전체 화면 배경 (흰색)
    <div className="fixed inset-0 bg-[#FAF9F6] z-[9999] flex flex-col items-center justify-center overflow-hidden">
      
      {/* 1. 중앙 로고 박스 (텍스트 로고) */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-24 h-24 rounded-[2rem] bg-jade-400 flex items-center justify-center text-white font-bold text-4xl shadow-2xl shadow-jade-100 mb-6"
      >
        汉à
      </motion.div>
      
      {/* 2. 서비스 명 */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
          Hanyu <span className="text-jade-500">Lens</span>
        </h1>
        <p className="text-gray-400 font-bold tracking-[0.3em] text-[10px] uppercase">
          AI Chinese Translator
        </p>
      </motion.div>

      {/* 3. 하단 로딩 바 디자인 (심플) */}
      <div className="absolute bottom-20 w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ left: "-100%" }}
          animate={{ left: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 w-full h-full bg-jade-400/50"
        />
      </div>
    </div>
  );
}