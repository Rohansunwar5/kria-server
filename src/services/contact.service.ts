import config from '../config';
import { InternalServerError } from '../errors/internal-server.error';
import { ContactLeadRepository } from '../repository/contactlead.repository';
import mailService from './mail.service';

export interface IContactLeadParams {
  fullName: string;
  email: string;
  subject: string;
  message: string;
  iss: string;
  isdCode: string;
  phoneNumber: string;
}

class ContactService {
  constructor(private readonly _contactLeadRepository: ContactLeadRepository) { }

  async lead(params: IContactLeadParams) {
    const { email, fullName, iss, message, subject, isdCode, phoneNumber } = params;
    const lead = await this._contactLeadRepository.create({ email, fullName, iss, message, subject, isdCode, phoneNumber });
    if (!lead) throw new InternalServerError('Failed to store lead');

    mailService.sendEmail(config.NOTIFY_TO, 'contact-us-lead.ejs', { email, fullName, iss, message, subject, isdCode, phoneNumber }, 'Contact Us - New Lead');

    return true;
  }
}


export default new ContactService(new ContactLeadRepository());