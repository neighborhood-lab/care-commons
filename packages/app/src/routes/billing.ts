/**
 * Billing & Invoicing Routes
 * 
 * RESTful API endpoints for billing and invoice management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { Database, AuthMiddleware } from '@care-commons/core';
import { BillingRepository, InvoiceSearchFilters, InvoiceStatus } from '@care-commons/billing-invoicing';

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SENT', 'SUBMITTED', 
          'PARTIALLY_PAID', 'PAID', 'PAST_DUE', 'DISPUTED', 'CANCELLED', 'VOIDED'].includes(value);
}

export function createBillingRouter(db: Database): Router {
  const router = Router();
  const authMiddleware = new AuthMiddleware(db);
  const billingRepo = new BillingRepository(db.getPool());

  // All billing routes require authentication
  router.use(authMiddleware.requireAuth);

  /**
   * GET /api/billing/invoices
   * Search invoices with filters
   */
  router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId;

      if (typeof organizationId !== 'string') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filters: InvoiceSearchFilters = {
        organizationId
      };

      // Apply query filters
      if (typeof req.query.clientId === 'string') filters.clientId = req.query.clientId;
      if (typeof req.query.payerId === 'string') filters.payerId = req.query.payerId;
      if (typeof req.query.status === 'string' && isInvoiceStatus(req.query.status)) {
        filters.status = [req.query.status];
      }
      if (typeof req.query.startDate === 'string') filters.startDate = new Date(req.query.startDate);
      if (typeof req.query.endDate === 'string') filters.endDate = new Date(req.query.endDate);
      if (req.query.isPastDue === 'true') filters.isPastDue = true;
      if (req.query.hasBalance === 'true') filters.hasBalance = true;

      const invoices = await billingRepo.searchInvoices(filters);

      res.json({
        items: invoices,
        total: invoices.length,
        hasMore: false
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/billing/summary
   * Get billing summary statistics
   */
  router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.user?.organizationId;

      if (typeof organizationId !== 'string') {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get all invoices for organization
      const allInvoices = await billingRepo.searchInvoices({ organizationId });

      const now = new Date();
      const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalOutstanding = allInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
      
      const overdueInvoices = allInvoices.filter(inv => 
        inv.balanceDue > 0 && new Date(inv.dueDate) < now
      );
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

      res.json({
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        overdueAmount,
        invoiceCount: {
          total: allInvoices.length,
          draft: allInvoices.filter(i => i.status === 'DRAFT').length,
          pending: allInvoices.filter(i => i.status === 'PENDING_REVIEW').length,
          sent: allInvoices.filter(i => i.status === 'SENT').length,
          paid: allInvoices.filter(i => i.status === 'PAID').length,
          overdue: overdueInvoices.length
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/billing/invoices/:id
   * Get invoice by ID
   */
  router.get('/invoices/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (typeof id !== 'string' || id.length === 0) {
        res.status(400).json({ error: 'Invoice ID is required' });
        return;
      }

      const invoice = await billingRepo.findInvoiceById(id);
      
      if (invoice === null) {
        res.status(404).json({
          error: 'Invoice not found'
        });
        return;
      }

      res.json(invoice);
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/billing/invoices/:id/payments
   * Get payments for an invoice
   */
  router.get('/invoices/:id/payments', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      if (typeof id !== 'string' || id.length === 0) {
        res.status(400).json({ error: 'Invoice ID is required' });
        return;
      }

      const invoice = await billingRepo.findInvoiceById(id);
      
      if (invoice === null) {
        res.status(404).json({
          error: 'Invoice not found'
        });
        return;
      }

      // Return payments array from invoice
      res.json(invoice.payments);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
