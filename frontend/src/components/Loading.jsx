import { useEffect, useState } from "react";
import { subscribe } from "../utils/loadingManager";

export default function Loading() {
  const [loadingState, setLoadingState] = useState({ isLoading: false, type: 'default' });

  useEffect(() => {
    // subscriber expects an object: { isLoading: boolean, type: string }
    const unsubscribe = subscribe(setLoadingState);
    return unsubscribe;
  }, []);

  if (!loadingState.isLoading) return null;

  if (loadingState.type === 'connecting') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-[9999] p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-sm w-full outline outline-1 outline-gray-100">
          <div className="relative w-20 h-20 mb-6 perspective-1000">
            <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 shadow-xl shadow-green-500/30 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2 text-center">
            Connecting Match
          </h2>
          <p className="text-sm text-gray-500 font-medium text-center">Securing your donation request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50">
      <div className="bg-white/95 p-4 rounded-lg shadow">
        <div className="w-9 h-9 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}
