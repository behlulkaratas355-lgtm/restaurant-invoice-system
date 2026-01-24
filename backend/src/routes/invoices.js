import express from 'express';
import {
  getAllInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from '../controllers/invoiceController.js';
import { authenticate } from '../middlewares/auth.js';
import { managerOrAdmin } from '../middlewares/roleCheck.js';

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// GET /api/invoices - получить все накладные
router.get('/', getAllInvoices);

// GET /api/invoices/:id - получить накладную по ID
router.get('/:id', getInvoice);

// POST /api/invoices - создать накладную (manager или admin)
router.post('/', managerOrAdmin, createInvoice);

// PUT /api/invoices/:id - обновить накладную (manager или admin)
router.put('/:id', managerOrAdmin, updateInvoice);

// DELETE /api/invoices/:id - удалить накладную (manager или admin)
router.delete('/:id', managerOrAdmin, deleteInvoice);

export default router;
