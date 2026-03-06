import { Request, Response, NextFunction } from 'express';
import { bulkUploadService } from '../services/bulkUpload.service';
import { BadRequestError } from '../errors';

export const bulkUploadPlayers = async (req: Request, res: Response, next: NextFunction) => {
    const { tournamentId, categoryId } = req.body;

    if (!req.file) {
        throw new BadRequestError('Excel file is required.');
    }

    const response = await bulkUploadService.processExcel(req.file.buffer, tournamentId, categoryId);
    next(response);
};
