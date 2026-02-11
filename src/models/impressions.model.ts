import mongoose from 'mongoose';

const impressionsSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Types.ObjectId,
    required: true
  },
  country: {
    type: String,
    required: true
  }
}, { timestamps: true, });

impressionsSchema.index({ gameId: 1 });

const impressionsModel = mongoose.model('impressions', impressionsSchema);

export default impressionsModel;