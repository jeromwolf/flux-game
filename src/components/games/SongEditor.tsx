'use client';

import React, { useState } from 'react';

interface SongEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (song: any) => void;
  language: 'ko' | 'en';
}

export default function SongEditor({ isOpen, onClose, onSave, language }: SongEditorProps) {
  const [songName, setSongName] = useState('');
  const [songNameEn, setSongNameEn] = useState('');
  const [notes, setNotes] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [tempo, setTempo] = useState(400);

  const texts = {
    ko: {
      title: '새 곡 만들기',
      songName: '곡 이름 (한국어)',
      songNameEn: '곡 이름 (영어)',
      tempo: '템포',
      record: '녹음 시작',
      stopRecord: '녹음 중지',
      save: '저장',
      cancel: '취소',
      preview: '미리듣기',
      clear: '초기화',
      instructions: '녹음 버튼을 누르고 피아노 건반을 눌러 멜로디를 만드세요.'
    },
    en: {
      title: 'Create New Song',
      songName: 'Song Name (Korean)',
      songNameEn: 'Song Name (English)',
      tempo: 'Tempo',
      record: 'Start Recording',
      stopRecord: 'Stop Recording',
      save: 'Save',
      cancel: 'Cancel',
      preview: 'Preview',
      clear: 'Clear',
      instructions: 'Press record and play the piano keys to create your melody.'
    }
  };

  const t = texts[language];

  const handleKeyPress = (keyNumber: number) => {
    if (isRecording) {
      setNotes([...notes, keyNumber]);
    }
  };

  const handleSave = () => {
    if (!songName || !songNameEn || notes.length === 0) {
      alert(language === 'ko' ? '모든 필드를 입력해주세요.' : 'Please fill all fields.');
      return;
    }

    const newSong = {
      id: `custom-${Date.now()}`,
      name: songName,
      nameEn: songNameEn,
      difficulty: 'easy' as const,
      notes: notes,
      tempo: tempo,
      requiredLevel: 1
    };

    onSave(newSong);
    
    // Reset form
    setSongName('');
    setSongNameEn('');
    setNotes([]);
    setTempo(400);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          {t.title}
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t.instructions}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.songName}
            </label>
            <input
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="예: 동요 메들리"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.songNameEn}
            </label>
            <input
              type="text"
              value={songNameEn}
              onChange={(e) => setSongNameEn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              placeholder="e.g. Children's Song Medley"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.tempo} (ms)
            </label>
            <input
              type="range"
              min="200"
              max="800"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">{tempo}ms</span>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes: {notes.length} 
              {notes.length > 0 && (
                <button
                  onClick={() => setNotes([])}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  {t.clear}
                </button>
              )}
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-4 py-2 rounded font-bold ${
                  isRecording 
                    ? 'bg-red-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}
              >
                {isRecording ? t.stopRecord : t.record}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {t.save}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-700"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}