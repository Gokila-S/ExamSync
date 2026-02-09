/**
 * Export Controller
 * Handles PDF and Excel export endpoints
 */

const exportService = require('../services/exportService');

/**
 * Export seating chart as PDF
 * GET /api/exports/seating-chart/:examId/:hallId
 */
exports.exportSeatingChart = async (req, res) => {
    try {
        const { examId, hallId } = req.params;

        const pdfBuffer = await exportService.generateSeatingChartPDF(examId, hallId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=seating_chart_${examId}_${hallId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Export seating chart error:', error);
        res.status(500).json({ message: 'Failed to generate seating chart PDF' });
    }
};

/**
 * Export student list as PDF
 * GET /api/exports/student-list/:examId
 */
exports.exportStudentList = async (req, res) => {
    try {
        const { examId } = req.params;

        const pdfBuffer = await exportService.generateStudentListPDF(examId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=student_list_${examId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Export student list error:', error);
        res.status(500).json({ message: 'Failed to generate student list PDF' });
    }
};

/**
 * Export invigilator schedule as PDF
 * GET /api/exports/invigilator-schedule/:examId
 */
exports.exportInvigilatorSchedule = async (req, res) => {
    try {
        const { examId } = req.params;

        const pdfBuffer = await exportService.generateInvigilatorSchedulePDF(examId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invigilator_schedule_${examId}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Export invigilator schedule error:', error);
        res.status(500).json({ message: 'Failed to generate invigilator schedule PDF' });
    }
};

/**
 * Export allocations as Excel
 * GET /api/exports/allocations/:examId
 */
exports.exportAllocationsExcel = async (req, res) => {
    try {
        const { examId } = req.params;

        const excelBuffer = await exportService.generateAllocationsExcel(examId);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=allocations_${examId}.xlsx`);
        res.send(excelBuffer);
    } catch (error) {
        console.error('Export allocations error:', error);
        res.status(500).json({ message: 'Failed to generate allocations Excel' });
    }
};
