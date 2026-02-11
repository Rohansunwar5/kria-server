import contactLeadModel from '../models/contactLead.model';
import { IContactLeadParams } from '../services/contact.service';

export class ContactLeadRepository {
  private _model = contactLeadModel;

  async create(params: IContactLeadParams) {
    const { email, fullName, iss, message, subject, isdCode, phoneNumber } = params;
    return this._model.create({ email, fullName, iss, message, subject, isdCode, phoneNumber });
  }

}