"use client";

import { useState } from "react";

interface BytecodeViewerProps {
  bytecode: string;
  preview: string;
}

export default function BytecodeViewer({ bytecode, preview }: BytecodeViewerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm break-all text-gray-900 dark:text-white">
          {preview}
        </span>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800 transition flex items-center justify-center text-xs font-semibold"
          title="전체 바이트코드 보기"
        >
          ?
        </button>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                전체 바이트코드
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                <code className="font-mono text-gray-800 dark:text-gray-200 break-all whitespace-pre-wrap">
                  {bytecode}
                </code>
              </pre>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>총 길이: {bytecode.length} 문자</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

