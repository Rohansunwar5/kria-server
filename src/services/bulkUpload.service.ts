import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import { tournamentRegistrationRepository } from '../repository/tournamentRegistration.repository';
import { ITournamentRegistrationStatus, ISkillLevel, IPlayerGender } from '../models/tournamentRegistration.model';
import { BadRequestError } from '../errors';
import { SuccessResponse } from '../utils/response.util';

interface ExcelRow {
    Name: string;
    Age: number;
    Gender: string;
    Phone: string;
    'Skill Level': string;
    'Base Price': number;
}

class BulkUploadService {
    async processExcel(fileBuffer: Buffer, tournamentId: string, categoryId: string) {
        // Parse Excel
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) throw new BadRequestError('Excel file has no sheets.');

        const sheet = workbook.Sheets[sheetName];
        const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) throw new BadRequestError('Excel file has no data rows.');

        const results = {
            total: rows.length,
            created: 0,
            errors: [] as { row: number; name: string; error: string }[],
        };

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Validate required fields
                if (!row.Name || !row.Name.toString().trim()) {
                    results.errors.push({ row: i + 2, name: '', error: 'Name is required' });
                    continue;
                }

                // Normalize gender
                const gender = (row.Gender || 'male').toString().toLowerCase();
                if (!['male', 'female'].includes(gender)) {
                    results.errors.push({ row: i + 2, name: row.Name, error: `Invalid gender: ${row.Gender}` });
                    continue;
                }

                // Normalize skill level
                const skillLevel = (row['Skill Level'] || 'intermediate').toString().toLowerCase();
                const validSkills = Object.values(ISkillLevel) as string[];
                const normalizedSkill = validSkills.includes(skillLevel) ? skillLevel : ISkillLevel.INTERMEDIATE;

                // Generate random player ID
                const randomPlayerId = new mongoose.Types.ObjectId().toString();

                const nameParts = row.Name.toString().trim().split(/\s+/);
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '-';

                await tournamentRegistrationRepository.create({
                    playerId: randomPlayerId,
                    tournamentId,
                    categoryId,
                    status: ITournamentRegistrationStatus.APPROVED,
                    profile: {
                        firstName,
                        lastName,
                        age: Number(row.Age) || 0,
                        gender: gender as IPlayerGender,
                        phone: (row.Phone || '').toString().trim(),
                        skillLevel: normalizedSkill as ISkillLevel,
                    },
                    auctionData: {
                        basePrice: Number(row['Base Price']) || 0,
                    },
                } as any);

                results.created++;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                results.errors.push({ row: i + 2, name: row.Name || '', error: msg });
            }
        }

        return new SuccessResponse('Bulk upload complete.', results);
    }
}

export const bulkUploadService = new BulkUploadService();
