import mongoose from 'mongoose';
import impressionsModel from '../models/impressions.model';


export class ImpressionsRepository {
  private _model = impressionsModel;

  async create(gameId: string, country: string) {
    return this._model.create({ gameId, country });
  }

  async getQuizGameImpressionsAndSubmissions(gameId: string, fromDate: string, toDate: string) {
    const matchConditions = {
      gameId: new mongoose.Types.ObjectId(gameId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (fromDate) {
      matchConditions.createdAt = { $gte: new Date(fromDate) };
    }

    if (toDate) {
      if (!matchConditions.createdAt) {
        matchConditions.createdAt = {};
      }
      matchConditions.createdAt.$lte = new Date(toDate);
    }

    return this._model.aggregate([
      {
        $match: matchConditions
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        }
      },
      {
        $group: {
          _id: '$date',
          totalImpressions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'quiz-user-sessions',
          let: { gameId: new mongoose.Types.ObjectId(gameId), date: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$quizId', '$$gameId'] },
                    {
                      $eq: [
                        { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        '$$date'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'submissions'
        }
      },
      {
        $addFields: {
          totalSubmissions: { $size: '$submissions' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalImpressions: 1,
          totalSubmissions: 1
        }
      },
      {
        $sort: {
          date: 1
        }
      }
    ]);
  }

  async getSpinTheWheelGameImpressionsAndSubmissions(gameId: string, fromDate: string, toDate: string) {
    const matchConditions = {
      gameId: new mongoose.Types.ObjectId(gameId)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    if (fromDate) {
      matchConditions.createdAt = { $gte: new Date(fromDate) };
    }

    if (toDate) {
      if (!matchConditions.createdAt) {
        matchConditions.createdAt = {};
      }
      matchConditions.createdAt.$lte = new Date(toDate);
    }

    return this._model.aggregate([
      {
        $match: matchConditions
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          }
        }
      },
      {
        $group: {
          _id: '$date',
          totalImpressions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'spinthewheel-user-sessions',
          let: { gameId: new mongoose.Types.ObjectId(gameId), date: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$spinTheWheelId', '$$gameId'] },
                    {
                      $eq: [
                        { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        '$$date'
                      ]
                    }
                  ]
                }
              }
            }
          ],
          as: 'submissions'
        }
      },
      {
        $addFields: {
          totalSubmissions: { $size: '$submissions' }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalImpressions: 1,
          totalSubmissions: 1
        }
      },
      {
        $sort: {
          date: 1
        }
      }
    ]);
  }


  async getTotalImpressions(gameId: string) {
    return this._model.find({ gameId }).countDocuments();
  }

  async getSpinTheWheelTotalSubmissions(gameId: string) {
    const result = await this._model.aggregate([
      {
        $lookup: {
          from: 'spinthewheel-user-sessions',
          let: { gameId: new mongoose.Types.ObjectId(gameId) },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$spinTheWheelId', '$$gameId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'spinSubmissions'
        }
      },
      {
        $addFields: {
          spinSubmissionsCount: { $ifNull: [{ $arrayElemAt: ['$spinSubmissions.count', 0] }, 0] }
        }
      },
      {
        $project: {
          _id: 0,
          spinSubmissionsCount: 1
        }
      }
    ]);

    return result.length > 0 ? result[0].spinSubmissionsCount : 0;
  }

  async getQuizTotalSubmissions(gameId: string) {
    const result = await this._model.aggregate([
      {
        $lookup: {
          from: 'quiz-user-sessions',
          let: { gameId: new mongoose.Types.ObjectId(gameId) },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$quizId', '$$gameId'] }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'quizSubmissions'
        }
      },
      {
        $addFields: {
          quizSubmissionsCount: { $ifNull: [{ $arrayElemAt: ['$quizSubmissions.count', 0] }, 0] }
        }
      },
      {
        $project: {
          _id: 0,
          quizSubmissionsCount: 1
        }
      }
    ]);

    return result.length > 0 ? result[0].quizSubmissionsCount : 0;
  }

  async getCountryBasedImpressionsCounts(gameId: string) {

    return this._model.aggregate([
      {
        $match: {
          gameId: new mongoose.Types.ObjectId(gameId)
        }
      },
      {
        $group: {
          _id: '$country',
          totalImpressions: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          country: '$_id',
          totalImpressions: 1
        }
      },
      {
        $sort: {
          totalImpressions: -1
        }
      }
    ]);
  }
}