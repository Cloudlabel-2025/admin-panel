"use client";

export default function SuccessMessage({ show, message, onClose }) {
  if (!show) return null;

  return (
    <>
      <div className="position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
        <div className="bg-white rounded-3 d-flex flex-column align-items-center justify-content-center shadow-lg p-4" style={{ minWidth: '250px', animation: 'fadeIn 0.5s ease-in-out', border: '3px solid #d4af37' }}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
            <path d="M9 12L11 14L15 10" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'drawCheck 1s ease-in-out 0.5s both' }}/>
            <circle cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="2" fill="none" style={{ animation: 'drawCircle 0.5s ease-in-out both' }}/>
          </svg>
          <h5 className="mb-2" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700' }}>Success!</h5>
          <p className="text-muted text-center mb-0">{message}</p>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes drawCircle {
          from { stroke-dasharray: 0 63; }
          to { stroke-dasharray: 63 63; }
        }
        @keyframes drawCheck {
          from { stroke-dasharray: 0 20; }
          to { stroke-dasharray: 20 20; }
        }
      `}</style>
    </>
  );
}