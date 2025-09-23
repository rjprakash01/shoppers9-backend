import mongoose, { Schema } from 'mongoose';
import { IProductReview, IReviewComment, ReviewStatus } from '../types';

// Review Comment schema
const reviewCommentSchema = new Schema<IReviewComment>({
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'request_changes'],
    required: true
  }
});

// Product Review schema
const productReviewSchema = new Schema<IProductReview>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.DRAFT,
    required: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    required: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  comments: [reviewCommentSchema],
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  requestedChanges: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  version: {
    type: Number,
    default: 1,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
productReviewSchema.index({ product: 1 });
productReviewSchema.index({ status: 1 });
productReviewSchema.index({ submittedBy: 1 });
productReviewSchema.index({ reviewedBy: 1 });
productReviewSchema.index({ submittedAt: -1 });
productReviewSchema.index({ reviewedAt: -1 });
productReviewSchema.index({ product: 1, version: -1 });
productReviewSchema.index({ status: 1, submittedAt: -1 });

// Ensure only one active review per product
productReviewSchema.index(
  { product: 1, isActive: 1 },
  { 
    unique: true,
    partialFilterExpression: { isActive: true }
  }
);

const ProductReview = mongoose.model<IProductReview>('ProductReview', productReviewSchema);

export default ProductReview;