"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, AlertCircle, ExternalLink } from 'lucide-react';

interface GmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  gmailAuthUrl: string;
  onAuthComplete: () => void;
}

export default function GmailAuthModal({ 
  isOpen, 
  onClose, 
  gmailAuthUrl,
  onAuthComplete 
}: GmailAuthModalProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGmailAuth = () => {
    setIsAuthenticating(true);
    
    // 새 창에서 Gmail 인증 열기
    const authWindow = window.open(
      gmailAuthUrl, 
      'gmail-auth', 
      'width=600,height=700,scrollbars=yes,resizable=yes'
    );

    // 인증 완료 확인을 위한 폴링
    const checkAuthComplete = setInterval(() => {
      try {
        if (authWindow?.closed) {
          clearInterval(checkAuthComplete);
          setIsAuthenticating(false);
          
          // 인증 완료 후 콜백 호출
          setTimeout(() => {
            onAuthComplete();
          }, 1000);
        }
      } catch (error) {
        // 새 창이 닫혔을 때 발생할 수 있는 에러 무시
        console.log('Auth window check error (expected):', error);
      }
    }, 1000);

    // 5분 후 자동으로 폴링 종료
    setTimeout(() => {
      clearInterval(checkAuthComplete);
      setIsAuthenticating(false);
      if (authWindow && !authWindow.closed) {
        authWindow.close();
      }
    }, 5 * 60 * 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            {/* 모달 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative inline-block bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
            >
              {/* 헤더 */}
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={onClose}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* 내용 */}
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Mail className="h-6 w-6 text-yellow-600" />
                </div>
                
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Gmail API 권한 필요
                  </h3>
                  
                  <div className="mt-2">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">
                            왜 Gmail 권한이 필요한가요?
                          </h4>
                          <div className="mt-2 text-sm text-yellow-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>TA들에게 이메일을 발송하기 위해</li>
                              <li>Gmail API를 통한 안전한 이메일 전송</li>
                              <li>1시간 후에도 계속 이메일 전송 가능</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                      이메일 전송을 위해 Google Gmail 권한이 필요합니다. 
                      아래 버튼을 클릭하여 Gmail 접근을 허용해주세요.
                    </p>

                    {isAuthenticating && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-sm text-blue-700">
                            Gmail 권한 승인 대기 중...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={handleGmailAuth}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isAuthenticating ? 'Gmail 권한 승인 대기 중...' : 'Gmail 권한 허용하기'}
                </button>
                
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}


