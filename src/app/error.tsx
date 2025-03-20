'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl text-red-400 mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="bg-[#6B7E50] text-white py-2 px-4 rounded-lg hover:bg-[#5C6C44] transition-colors"
      >
        Try again
      </button>
    </div>
  );
} 