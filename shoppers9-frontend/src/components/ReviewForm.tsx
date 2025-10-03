import React, { useState } from 'react';
import { Star } from 'lucide-react';
import type { CreateReviewData } from '../types/review';

interface ReviewFormProps {
  productId: string;
  onSubmit: (reviewData: CreateReviewData) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  existingReview?: {
    rating: number;
    comment: string;
  };
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  existingReview
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});

  const validateForm = () => {
    const newErrors: { rating?: string; comment?: string } = {};
    
    if (rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!comment.trim()) {
      newErrors.comment = 'Please write a review';
    } else if (comment.trim().length < 10) {
      newErrors.comment = 'Review must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        productId,
        rating,
        comment: comment.trim()
      });
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => {
      const starValue = i + 1;
      const isActive = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={i}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none transition-colors duration-150"
        >
          <Star
            className={`w-8 h-8 ${
              isActive ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-300'
            }`}
          />
        </button>
      );
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center space-x-1">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-2 text-sm text-gray-600">
                {rating} out of 5 stars
              </span>
            )}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
            Review *
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment && (
              <p className="text-sm text-red-600">{errors.comment}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {comment.length}/500 characters
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;