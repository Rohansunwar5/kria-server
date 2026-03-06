import * as XLSX from 'xlsx';
import path from 'path';

const mockData = [
    { Name: "Arjun Mehta", Age: 24, Gender: "Male", Phone: "9876543210", "Skill Level": "Advanced", "Base Price": 5000 },
    { Name: "Priya Sharma", Age: 22, Gender: "Female", Phone: "9876543211", "Skill Level": "Intermediate", "Base Price": 3000 },
    { Name: "Rohan Gupta", Age: 26, Gender: "Male", Phone: "9876543212", "Skill Level": "Beginner", "Base Price": 1000 },
    { Name: "Sneha Reddy", Age: 23, Gender: "Female", Phone: "9876543213", "Skill Level": "Advanced", "Base Price": 4500 },
    { Name: "Vikram Singh", Age: 25, Gender: "Male", Phone: "9876543214", "Skill Level": "Intermediate", "Base Price": 3500 },
    { Name: "Ananya Das", Age: 21, Gender: "Female", Phone: "9876543215", "Skill Level": "Beginner", "Base Price": 1500 },
    { Name: "Karan Patel", Age: 27, Gender: "Male", Phone: "9876543216", "Skill Level": "Advanced", "Base Price": 5500 },
    { Name: "Meera Nair", Age: 24, Gender: "Female", Phone: "9876543217", "Skill Level": "Intermediate", "Base Price": 3200 },
    { Name: "Siddharth Rao", Age: 28, Gender: "Male", Phone: "9876543218", "Skill Level": "Advanced", "Base Price": 6000 },
    { Name: "Nisha Verma", Age: 22, Gender: "Female", Phone: "9876543219", "Skill Level": "Beginner", "Base Price": 1200 },
];

const ws = XLSX.utils.json_to_sheet(mockData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Players");

const filePath = path.resolve(__dirname, 'mock_players.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Mock Excel file created at: ${filePath}`);
