import React from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Review } from '../types/review';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
            {review.userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{review.userName}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center">
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
                {review.isVerifiedPurchase && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Verified Purchase
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Review Text */}
          <div className="mt-3">
            <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
          </div>

          {/* Review Actions */}
          <div className="flex items-center space-x-4 mt-4">
            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
              <ThumbsUp className="w-4 h-4" />
              <span>Helpful</span>
            </button>
            <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700">
              <ThumbsDown className="w-4 h-4" />
              <span>Not helpful</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;