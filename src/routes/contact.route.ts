import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import { contactLead } from '../controllers/contact.controller';
import { contactLeadValidator } from '../middlewares/validators/contactlead.validator';

const contactRouter = Router();

contactRouter.post('/', contactLeadValidator, asyncHandler(contactLead));

export default contactRouter;