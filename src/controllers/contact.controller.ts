import { NextFunction, Request, Response } from 'express';
import contactService from '../services/contact.service';

export const contactLead = async (req: Request, res: Response, next: NextFunction) => {
  const { fullName, email, subject, message, iss, isdCode, phoneNumber } = req.body;
  const response = await contactService.lead({ fullName, email, subject, message, iss, isdCode, phoneNumber });

  next(response);
};
