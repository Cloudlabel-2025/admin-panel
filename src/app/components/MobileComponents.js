"use client";

import { useEffect, useState } from 'react';

// Mobile-optimized loading spinner
export const MobileLoader = ({ 
  size = 'medium', 
  color = '#d4af37', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    small: 'spinner-border-sm',
    medium: '',
    large: 'spinner-border-lg'
  };

  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  };

  return (
    <div style={containerStyle}>
      <div 
        className={`spinner-border ${sizeClasses[size]}`}
        role="status"
        style={{ 
          color: color,
          width: size === 'large' ? '3rem' : size === 'small' ? '1.5rem' : '2rem',
          height: size === 'large' ? '3rem' : size === 'small' ? '1.5rem' : '2rem'
        }}
      >
        <span className="visually-hidden">Loading...</span>
      </div>
      {text && (
        <div 
          className="mt-3 text-center"
          style={{ 
            color: fullScreen ? '#f4e5c3' : color,
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

// Skeleton loader for mobile
export const MobileSkeleton = ({ 
  lines = 3, 
  height = '1rem', 
  className = '' 
}) => {
  return (
    <div className={`mobile-skeleton ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="skeleton-line"
          style={{
            height: height,
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            marginBottom: '0.5rem',
            animation: 'skeleton-loading 1.5s ease-in-out infinite alternate',
            width: index === lines - 1 ? '60%' : '100%'
          }}
        />
      ))}
      <style jsx>{`
        @keyframes skeleton-loading {
          0% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Mobile-optimized error boundary
export class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-error-container">
          <div className="text-center p-4">
            <div 
              className="mb-3"
              style={{
                fontSize: '3rem',
                color: '#dc3545'
              }}
            >
              ⚠️
            </div>
            <h5 className="mb-3" style={{ color: '#dc3545' }}>
              Something went wrong
            </h5>
            <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #d4af37 0%, #f4e5c3 100%)',
                border: 'none',
                color: '#1a1a1a',
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: '8px'
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mobile-optimized toast notifications
export const MobileToast = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose 
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose && onClose(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: { backgroundColor: '#28a745', color: 'white' },
    error: { backgroundColor: '#dc3545', color: 'white' },
    warning: { backgroundColor: '#ffc107', color: '#1a1a1a' },
    info: { backgroundColor: '#17a2b8', color: 'white' }
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  return (
    <div
      className={`mobile-toast ${visible ? 'show' : 'hide'}`}
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        maxWidth: 'calc(100vw - 40px)',
        fontSize: '0.9rem',
        fontWeight: '500',
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-20px)',
        ...typeStyles[type]
      }}
    >
      <span>{typeIcons[type]}</span>
      <span>{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onClose && onClose(), 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '8px'
        }}
      >
        ×
      </button>
    </div>
  );
};

// Mobile-optimized modal
export const MobileModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    small: { maxWidth: '300px' },
    medium: { maxWidth: '500px' },
    large: { maxWidth: '700px' },
    fullscreen: { width: '100vw', height: '100vh', maxWidth: 'none', borderRadius: '0' }
  };

  return (
    <div
      className="mobile-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: size === 'fullscreen' ? '0' : '20px'
      }}
      onClick={onClose}
    >
      <div
        className="mobile-modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: size === 'fullscreen' ? '0' : '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          width: '100%',
          maxHeight: size === 'fullscreen' ? '100vh' : 'calc(100vh - 40px)',
          overflowY: 'auto',
          ...sizeStyles[size]
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            className="mobile-modal-header"
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #dee2e6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 1
            }}
          >
            <h5 className="mb-0" style={{ fontWeight: '600' }}>{title}</h5>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0',
                color: '#6c757d'
              }}
            >
              ×
            </button>
          </div>
        )}
        <div
          className="mobile-modal-body"
          style={{
            padding: '20px'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default {
  MobileLoader,
  MobileSkeleton,
  MobileErrorBoundary,
  MobileToast,
  MobileModal
};