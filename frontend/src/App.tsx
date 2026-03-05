
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        중국어 번역기 프로젝트
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <ruby className="text-4xl">
          你好 <rt className="text-sm text-red-500">nǐ hǎo</rt>
        </ruby>
        <p className="mt-2 text-gray-600">여기에 번역 결과가 표시됩니다.</p>
      </div>
    </div>
  )
}

export default App
