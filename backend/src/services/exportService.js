/**
 * Export Service
 * Generates PDF and Excel reports for allocations, seating charts, and schedules
 * 
 * INTERVIEW POINT: This service demonstrates:
 * - PDF generation with pdfkit
 * - Excel generation with exceljs
 * - Stream-based file generation for memory efficiency
 */

const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');

/**
 * Generate seating chart PDF for a hall
 */
const generateSeatingChartPDF = async (examId, hallId) => {
    // Get exam details
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    const exam = examResult.rows[0];

    // Get hall details
    const hallResult = await pool.query('SELECT * FROM halls WHERE id = $1', [hallId]);
    const hall = hallResult.rows[0];

    // Get allocations
    const allocationsResult = await pool.query(`
    SELECT a.seat_position, s.roll_no, s.name, s.branch
    FROM allocations a
    JOIN students s ON a.student_id = s.id
    WHERE a.exam_id = $1 AND a.hall_id = $2
    ORDER BY a.seat_position
  `, [examId, hallId]);

    const allocations = allocationsResult.rows;

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];

    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('SEATING CHART', { align: 'center' });
    doc.moveDown(0.5);

    // Exam details
    doc.fontSize(12).font('Helvetica');
    doc.text(`Subject: ${exam.subject}`, { align: 'center' });
    doc.text(`Date: ${new Date(exam.exam_date).toLocaleDateString()}`, { align: 'center' });
    doc.text(`Time: ${exam.start_time} | Duration: ${exam.duration} mins`, { align: 'center' });
    doc.moveDown(0.5);

    // Hall details
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`Hall: ${hall.name}`, { align: 'center' });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Building: ${hall.building} | Floor: ${hall.floor}`, { align: 'center' });
    doc.text(`Layout: ${hall.rows} rows × ${hall.columns} columns`, { align: 'center' });
    doc.moveDown(1);

    // Create seating grid
    const cellWidth = 70;
    const cellHeight = 40;
    const startX = (doc.page.width - (hall.columns * cellWidth)) / 2;
    let startY = doc.y;

    // Generate seating map
    const seatsMap = {};
    allocations.forEach(a => {
        seatsMap[a.seat_position] = a;
    });

    for (let row = 1; row <= hall.rows; row++) {
        const rowLabel = String.fromCharCode(64 + row);
        const y = startY + (row - 1) * cellHeight;

        // Row label
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(rowLabel, startX - 20, y + 15);

        for (let col = 1; col <= hall.columns; col++) {
            const seatPos = `${rowLabel}${col}`;
            const allocation = seatsMap[seatPos];
            const x = startX + (col - 1) * cellWidth;

            // Draw cell
            doc.rect(x, y, cellWidth - 2, cellHeight - 2).stroke();

            // Seat label
            doc.fontSize(7).font('Helvetica');
            doc.text(seatPos, x + 2, y + 2, { width: cellWidth - 4, align: 'left' });

            if (allocation) {
                // Roll number
                doc.fontSize(8).font('Helvetica-Bold');
                doc.text(allocation.roll_no, x + 2, y + 12, { width: cellWidth - 4, align: 'center' });

                // Branch
                doc.fontSize(6).font('Helvetica');
                doc.text(allocation.branch, x + 2, y + 24, { width: cellWidth - 4, align: 'center' });
            }
        }
    }

    // Footer
    doc.y = startY + (hall.rows * cellHeight) + 20;
    doc.fontSize(10).text(`Total Students: ${allocations.length}`, { align: 'center' });
    doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
};

/**
 * Generate student list PDF for an exam
 */
const generateStudentListPDF = async (examId) => {
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    const exam = examResult.rows[0];

    const allocationsResult = await pool.query(`
    SELECT 
      s.roll_no, s.name, s.branch, s.email,
      h.name as hall_name, a.seat_position
    FROM allocations a
    JOIN students s ON a.student_id = s.id
    JOIN halls h ON a.hall_id = h.id
    WHERE a.exam_id = $1
    ORDER BY h.name, a.seat_position
  `, [examId]);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('STUDENT ALLOCATION LIST', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Subject: ${exam.subject}`, { align: 'center' });
    doc.text(`Date: ${new Date(exam.exam_date).toLocaleDateString()} | Time: ${exam.start_time}`, { align: 'center' });
    doc.moveDown(1);

    // Table headers
    const tableTop = doc.y;
    const columns = [
        { header: 'S.No', x: 40, width: 40 },
        { header: 'Roll No', x: 80, width: 80 },
        { header: 'Name', x: 160, width: 140 },
        { header: 'Branch', x: 300, width: 50 },
        { header: 'Hall', x: 350, width: 100 },
        { header: 'Seat', x: 450, width: 50 }
    ];

    // Draw header row
    doc.fontSize(9).font('Helvetica-Bold');
    columns.forEach(col => {
        doc.text(col.header, col.x, tableTop, { width: col.width, align: 'left' });
    });

    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    // Draw data rows
    doc.font('Helvetica').fontSize(8);
    let y = tableTop + 20;

    allocationsResult.rows.forEach((row, index) => {
        if (y > 750) {
            doc.addPage();
            y = 50;
        }

        doc.text(String(index + 1), columns[0].x, y, { width: columns[0].width });
        doc.text(row.roll_no, columns[1].x, y, { width: columns[1].width });
        doc.text(row.name, columns[2].x, y, { width: columns[2].width });
        doc.text(row.branch, columns[3].x, y, { width: columns[3].width });
        doc.text(row.hall_name, columns[4].x, y, { width: columns[4].width });
        doc.text(row.seat_position, columns[5].x, y, { width: columns[5].width });

        y += 15;
    });

    // Footer
    doc.fontSize(8).text(`Total: ${allocationsResult.rows.length} students`, 40, y + 20);
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
};

/**
 * Generate invigilator schedule PDF
 */
const generateInvigilatorSchedulePDF = async (examId) => {
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    const exam = examResult.rows[0];

    const assignmentsResult = await pool.query(`
    SELECT 
      u.name as invigilator_name,
      u.email,
      i.employee_id,
      i.department,
      h.name as hall_name,
      h.building,
      h.floor
    FROM invigilator_assignments ia
    JOIN invigilators i ON ia.invigilator_id = i.id
    JOIN users u ON i.user_id = u.id
    JOIN halls h ON ia.hall_id = h.id
    WHERE ia.exam_id = $1
    ORDER BY h.name
  `, [examId]);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('INVIGILATOR SCHEDULE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica');
    doc.text(`Subject: ${exam.subject}`, { align: 'center' });
    doc.text(`Date: ${new Date(exam.exam_date).toLocaleDateString()} | Time: ${exam.start_time}`, { align: 'center' });
    doc.text(`Duration: ${exam.duration} minutes`, { align: 'center' });
    doc.moveDown(1);

    // Assignments table
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Hall Assignments:', 40);
    doc.moveDown(0.5);

    assignmentsResult.rows.forEach((assignment, index) => {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${assignment.hall_name}`, 50);
        doc.fontSize(9).font('Helvetica');
        doc.text(`   Building: ${assignment.building}, Floor: ${assignment.floor}`, 50);
        doc.text(`   Invigilator: ${assignment.invigilator_name}`, 50);
        doc.text(`   Employee ID: ${assignment.employee_id}`, 50);
        doc.text(`   Department: ${assignment.department}`, 50);
        doc.moveDown(0.5);
    });

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).text(`Total Halls: ${assignmentsResult.rows.length}`, 40);
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();

    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
};

/**
 * Generate allocations Excel file
 */
const generateAllocationsExcel = async (examId) => {
    const examResult = await pool.query('SELECT * FROM exams WHERE id = $1', [examId]);
    const exam = examResult.rows[0];

    const allocationsResult = await pool.query(`
    SELECT 
      s.roll_no, s.name, s.branch, s.email, s.semester,
      h.name as hall_name, h.building, h.floor,
      a.seat_position
    FROM allocations a
    JOIN students s ON a.student_id = s.id
    JOIN halls h ON a.hall_id = h.id
    WHERE a.exam_id = $1
    ORDER BY h.name, a.seat_position
  `, [examId]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ExamSync';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Property', key: 'prop', width: 20 },
        { header: 'Value', key: 'val', width: 40 }
    ];
    summarySheet.addRows([
        { prop: 'Subject', val: exam.subject },
        { prop: 'Date', val: new Date(exam.exam_date).toLocaleDateString() },
        { prop: 'Time', val: exam.start_time },
        { prop: 'Duration', val: `${exam.duration} minutes` },
        { prop: 'Semester', val: exam.semester },
        { prop: 'Total Students', val: allocationsResult.rows.length }
    ]);

    // Style header row
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Allocations sheet
    const allocSheet = workbook.addWorksheet('Allocations');
    allocSheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'Roll No', key: 'roll_no', width: 15 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Branch', key: 'branch', width: 10 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Semester', key: 'semester', width: 10 },
        { header: 'Hall', key: 'hall_name', width: 15 },
        { header: 'Building', key: 'building', width: 15 },
        { header: 'Floor', key: 'floor', width: 8 },
        { header: 'Seat', key: 'seat_position', width: 10 }
    ];

    allocationsResult.rows.forEach((row, index) => {
        allocSheet.addRow({ sno: index + 1, ...row });
    });

    // Style header row
    allocSheet.getRow(1).font = { bold: true };
    allocSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    allocSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add autofilter
    allocSheet.autoFilter = {
        from: 'A1',
        to: 'J1'
    };

    // Group by hall sheets
    const hallGroups = {};
    allocationsResult.rows.forEach(row => {
        if (!hallGroups[row.hall_name]) {
            hallGroups[row.hall_name] = [];
        }
        hallGroups[row.hall_name].push(row);
    });

    Object.entries(hallGroups).forEach(([hallName, students]) => {
        const hallSheet = workbook.addWorksheet(hallName.substring(0, 30));
        hallSheet.columns = [
            { header: 'S.No', key: 'sno', width: 8 },
            { header: 'Seat', key: 'seat_position', width: 10 },
            { header: 'Roll No', key: 'roll_no', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Branch', key: 'branch', width: 10 }
        ];

        students.forEach((student, index) => {
            hallSheet.addRow({
                sno: index + 1,
                seat_position: student.seat_position,
                roll_no: student.roll_no,
                name: student.name,
                branch: student.branch
            });
        });

        // Style
        hallSheet.getRow(1).font = { bold: true };
        hallSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF70AD47' }
        };
        hallSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    return workbook.xlsx.writeBuffer();
};

module.exports = {
    generateSeatingChartPDF,
    generateStudentListPDF,
    generateInvigilatorSchedulePDF,
    generateAllocationsExcel
};
