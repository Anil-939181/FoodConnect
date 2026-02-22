import { useEffect, useState } from "react";
import { subscribe } from "../utils/loadingManager";

export default function Loading() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(setLoading);
    return unsubscribe;
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-25 z-50">
      <div className="bg-white/95 p-4 rounded-lg shadow">
        <div className="w-9 h-9 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}
