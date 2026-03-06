import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { excelUpload } from '../utils/multer.util';
import { bulkUploadPlayers } from '../controllers/bulkUpload.controller';

const bulkUploadRouter = Router();

// No auth — emergency workaround for walk-in player uploads
bulkUploadRouter.post(
    '/bulk-upload',
    excelUpload.single('file'),
    asyncHandler(bulkUploadPlayers)
);

export default bulkUploadRouter;
