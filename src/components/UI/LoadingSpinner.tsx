import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  showText = true 
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'spinner-small';
      case 'large':
        return 'spinner-large';
      default:
        return 'spinner-medium';
    }
  };

  return (
    <div className={`loading-spinner-container ${getSizeClass()}`}>
      <div className="loading-spinner-elegant"></div>
      {showText && <span className="loading-text">読み込み中...</span>}
    </div>
  );
};

export default LoadingSpinner;