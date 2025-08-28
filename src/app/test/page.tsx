'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-cyan-400 mb-4">CSS 테스트 페이지</h1>
      <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg">
        <p className="text-gray-300">Tailwind CSS가 제대로 작동하는지 확인합니다.</p>
        <button className="mt-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all">
          테스트 버튼
        </button>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 rounded">빨강</div>
        <div className="bg-green-500 p-4 rounded">초록</div>
        <div className="bg-blue-500 p-4 rounded">파랑</div>
      </div>
    </div>
  );
}