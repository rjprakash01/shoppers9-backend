import React from 'react';
import { Star } from 'lucide-react';
import type { ReviewSummary as ReviewSummaryType } from '../types/review';

interface ReviewSummaryProps {
  summary: ReviewSummaryType;
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({ summary }) => {
  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPercentage = (count: number) => {
    if (summary.totalReviews === 0) return 0;
    return Math.round((count / summary.totalReviews) * 100);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Reviews</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {summary.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mb-2">
            {renderStars(summary.averageRating)}
          </div>
          <p className="text-sm text-gray-600">
            Based on {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = summary.ratingDistribution[rating as keyof typeof summary.ratingDistribution];
            const percentage = getPercentage(count);
            
            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-12">
                  <span className="text-sm text-gray-600">{rating}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;