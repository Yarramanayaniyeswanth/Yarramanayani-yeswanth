import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  AuthenticatedRequest,
  clearSessionCookie,
  extractSession,
  hashPassword,
  requireAdmin,
  requireCustomer,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
} from './server/auth';
import {
  getChainStatusInfo,
  verifyFullHashChain,
  verifySingleBlockRecord,
} from './server/blockchain';
import {
  addNotification,
  appendAuditLog,
  appendTransactionWithBlock,
  getDb,
  maskAccountNumber,
  saveDb,
} from './server/db';
import {
  AccountDoc,
  AdminUserDoc,
  SavingsCadence,
  UserDoc,
} from './server/types';

function sanitizeUser(user: UserDoc) {
  const { passwordHash: _ph, salt: _s, ...safe } = user;
  return safe;
}

function sanitizeAdmin(admin: AdminUserDoc) {
  const { passwordHash: _ph, salt: _s, ...safe } = admin;
  return safe;
}

function sanitizeAccount(acc: AccountDoc) {
  const { accountNumberRaw: _raw, ...safe } = acc;
  return safe;
}

function computeNextSchedule(cadence: SavingsCadence): string {
  const days = cadence === 'Daily' ? 1 : cadence === 'Weekly' ? 7 : 30;
  const d = new Date(Date.now() + days * 86400_000);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // =========================================================================
  // PUBLIC ROUTES
  // =========================================================================

  app.get('/api/health', async (_req: Request, res: Response) => {
    const db = getDb();
    const chain = await getChainStatusInfo(db.blockchainRecords);
    res.json({
      ok: true,
      service: 'BLOCKBANK',
      chainMode: chain.mode,
      latestBlock: chain.latestBlockNumber,
    });
  });

  app.post('/api/contact', (req: Request, res: Response) => {
    const { name, email, subject, message } = req.body || {};
    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof subject !== 'string' ||
      subject.trim().length < 3 ||
      typeof message !== 'string' ||
      message.trim().length < 10
    ) {
      res.status(400).json({
        error: 'Please enter a valid name, email address, subject, and message (10+ characters).',
      });
      return;
    }

    const db = getDb();
    const inquiry = {
      id: `inq_${Date.now()}`,
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 120),
      subject: subject.trim().slice(0, 140),
      message: message.trim().slice(0, 1200),
      createdAt: new Date().toISOString(),
    };
    db.contactInquiries.unshift(inquiry);
    saveDb(db);

    res.status(201).json({
      message: 'Your inquiry has been logged with our client support desk.',
      inquiryId: inquiry.id,
    });
  });

  // =========================================================================
  // CUSTOMER AUTHENTICATION
  // =========================================================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { fullName, email, phone, password, city, accountTier } = req.body || {};
    if (
      typeof fullName !== 'string' ||
      fullName.trim().length < 2 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8
    ) {
      res.status(400).json({
        error: 'Full name, valid email, and password (minimum 8 characters) are required.',
      });
      return;
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now()}`;
    const tier =
      accountTier === 'Institutional Reserve' || accountTier === 'Digital Checking'
        ? accountTier
        : 'Premium Savings';

    const newUser: UserDoc = {
      id: userId,
      fullName: fullName.trim().slice(0, 80),
      email: normalizedEmail,
      phone: typeof phone === 'string' && phone.trim() ? phone.trim().slice(0, 24) : '+91 98000 00000',
      passwordHash: hash,
      salt,
      kycStatus: 'Verified',
      accountTier: tier,
      status: 'Active',
      city: typeof city === 'string' && city.trim() ? city.trim().slice(0, 60) : 'Mumbai, MH',
      createdAt: now,
      lastLoginAt: now,
    };

    const randDigits1 = String(Math.floor(10000000 + Math.random() * 89999999));
    const randDigits2 = String(Math.floor(10000000 + Math.random() * 89999999));
    const rawChk = `5010${randDigits1}`;
    const rawSav = `5010${randDigits2}`;

    const checkingAccount: AccountDoc = {
      id: `acc_${userId}_chk`,
      userId,
      accountNumberRaw: rawChk,
      accountNumberMasked: maskAccountNumber(rawChk),
      ifscCode: 'BLKB0001042',
      branchName: 'Digital Direct Branch, Mumbai',
      accountType: 'Checking',
      balance: 50000,
      availableBalance: 50000,
      currency: 'INR',
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    const savingsAccount: AccountDoc = {
      id: `acc_${userId}_sav`,
      userId,
      accountNumberRaw: rawSav,
      accountNumberMasked: maskAccountNumber(rawSav),
      ifscCode: 'BLKB0001042',
      branchName: 'Digital Direct Branch, Mumbai',
      accountType: 'Auto-Savings Vault',
      balance: 0,
      availableBalance: 0,
      currency: 'INR',
      status: 'Active',
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    db.accounts.push(checkingAccount, savingsAccount);

    appendTransactionWithBlock(db, {
      userId,
      senderRef: 'EXT-DEMO-ONBOARDING',
      receiverRef: checkingAccount.accountNumberMasked,
      receiverName: newUser.fullName,
      type: 'Deposit',
      amount: 50000,
      description: 'Simulated Welcome Test Balance Allocation',
      status: 'Successful',
    });

    appendAuditLog(db, {
      actorId: userId,
      actorRole: 'customer',
      actorName: newUser.fullName,
      action: 'CUSTOMER_REGISTERED',
      targetType: 'User',
      targetId: userId,
      details: `Registered new demo customer account (${tier}) with ₹50,000.00 test balance.`,
    });

    addNotification(db, {
      userId,
      category: 'Security',
      title: 'Welcome to BLOCKBANK',
      message:
        'Your demo Checking and Auto-Savings Vault accounts are active with ₹50,000.00 test balance.',
    });

    saveDb(db);

    const token = signSessionToken({
      sub: newUser.id,
      role: 'customer',
      email: newUser.email,
    });
    setSessionCookie(res, token);

    res.status(201).json({
      user: sanitizeUser(newUser),
      token,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status === 'Deactivated') {
      res.status(403).json({
        error: 'This demo account has been deactivated by an administrator.',
      });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: user.id,
      actorRole: 'customer',
      actorName: user.fullName,
      action: 'CUSTOMER_LOGIN',
      targetType: 'Session',
      targetId: user.id,
      details: 'Customer signed in to BLOCKBANK portal.',
    });
    saveDb(db);

    const token = signSessionToken({
      sub: user.id,
      role: 'customer',
      email: user.email,
    });
    setSessionCookie(res, token);

    res.json({ user: sanitizeUser(user), token });
  });

  // Server-controlled demo customer session without exposing credentials in frontend
  app.post('/api/auth/demo-customer', (_req: Request, res: Response) => {
    const db = getDb();
    const demoUser = db.users.find((u) => u.id === 'usr_aarav_01');
    if (!demoUser) {
      res.status(404).json({ error: 'Demo customer account not found.' });
      return;
    }
    if (demoUser.status === 'Deactivated') {
      demoUser.status = 'Active';
    }
    demoUser.lastLoginAt = new Date().toISOString();
    saveDb(db);

    const token = signSessionToken({
      sub: demoUser.id,
      role: 'customer',
      email: demoUser.email,
    });
    setSessionCookie(res, token);

    res.json({ user: sanitizeUser(demoUser), token });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = extractSession(req);
    if (!session) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }
    const db = getDb();
    if (session.role === 'customer') {
      const user = db.users.find((u) => u.id === session.sub);
      if (!user) {
        res.status(401).json({ error: 'User not found.' });
        return;
      }
      res.json({ role: 'customer', user: sanitizeUser(user) });
      return;
    }
    if (session.role === 'admin') {
      const admin = db.adminUsers.find((a) => a.id === session.sub);
      if (!admin) {
        res.status(401).json({ error: 'Admin not found.' });
        return;
      }
      res.json({ role: 'admin', admin: sanitizeAdmin(admin) });
      return;
    }
    res.status(401).json({ error: 'Invalid session.' });
  });

  // =========================================================================
  // CUSTOMER PORTAL ROUTES
  // =========================================================================

  app.get(
    '/api/customer/dashboard',
    requireCustomer,
    async (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const accounts = db.accounts
        .filter((a) => a.userId === userId)
        .map(sanitizeAccount);

      const checkingAcc = accounts.find((a) => a.accountType === 'Checking');
      const savingsAccs = accounts.filter((a) => a.accountType !== 'Checking');

      const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
      const availableBalance = checkingAcc ? checkingAcc.availableBalance : 0;
      const totalSavings = savingsAccs.reduce((sum, a) => sum + a.balance, 0);

      const userTx = db.transactions
        .filter((t) => t.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      const thirtyDaysAgo = Date.now() - 30 * 86400_000;
      const monthlyIncome = userTx
        .filter(
          (t) =>
            t.status === 'Successful' &&
            (t.type === 'Deposit' || t.type === 'Fee Refund') &&
            new Date(t.createdAt).getTime() >= thirtyDaysAgo
        )
        .reduce((s, t) => s + t.amount, 0);

      const monthlyExpenses = userTx
        .filter(
          (t) =>
            t.status === 'Successful' &&
            (t.type === 'Transfer' || t.type === 'Withdrawal') &&
            new Date(t.createdAt).getTime() >= thirtyDaysAgo
        )
        .reduce((s, t) => s + t.amount, 0);

      const rules = db.savingsRules.filter((r) => r.userId === userId);
      const unreadNotifications = db.notifications.filter(
        (n) => (n.userId === userId || n.userId === 'ALL_CUSTOMERS') && !n.read
      ).length;

      const chainStatus = await getChainStatusInfo(db.blockchainRecords);

      res.json({
        user: sanitizeUser(user),
        summary: {
          totalBalance,
          availableBalance,
          totalSavings,
          monthlyIncome,
          monthlyExpenses,
          unreadNotifications,
        },
        accounts,
        recentTransactions: userTx.slice(0, 6),
        savingsRules: rules,
        chainStatus,
      });
    }
  );

  app.get(
    '/api/customer/accounts',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const accounts = db.accounts
        .filter((a) => a.userId === userId)
        .map(sanitizeAccount);
      const user = db.users.find((u) => u.id === userId);
      res.json({
        accounts,
        user: user ? sanitizeUser(user) : null,
        recipients: db.users
          .filter((u) => u.id !== userId && u.status === 'Active')
          .map((u) => {
            const chk = db.accounts.find(
              (a) => a.userId === u.id && a.accountType === 'Checking'
            );
            return {
              userId: u.id,
              fullName: u.fullName,
              city: u.city,
              accountRef: chk ? chk.accountNumberMasked : '•••• •••• 0000',
            };
          }),
      });
    }
  );

  app.get(
    '/api/customer/transactions',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const { search, type, status, dateFrom, dateTo } = req.query;

      let list = db.transactions.filter((t) => t.userId === userId);

      if (typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.receiverName.toLowerCase().includes(q) ||
            t.transactionHash.toLowerCase().includes(q)
        );
      }
      if (typeof type === 'string' && type !== 'All') {
        list = list.filter((t) => t.type === type);
      }
      if (typeof status === 'string' && status !== 'All') {
        list = list.filter((t) => t.status === status);
      }
      if (typeof dateFrom === 'string' && dateFrom) {
        const fromMs = new Date(dateFrom).getTime();
        list = list.filter((t) => new Date(t.createdAt).getTime() >= fromMs);
      }
      if (typeof dateTo === 'string' && dateTo) {
        const toMs = new Date(dateTo).getTime() + 86400_000;
        list = list.filter((t) => new Date(t.createdAt).getTime() <= toMs);
      }

      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ transactions: list });
    }
  );

  app.post(
    '/api/customer/transfer',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const user = db.users.find((u) => u.id === userId);
      if (!user || user.status !== 'Active') {
        res.status(403).json({ error: 'Active customer account required.' });
        return;
      }

      const {
        receiverName,
        receiverRef,
        amount,
        description,
        idempotencyKey,
        recipientUserId,
      } = req.body || {};

      const parsedAmount = Number(amount);
      if (
        typeof receiverName !== 'string' ||
        receiverName.trim().length < 2 ||
        typeof receiverRef !== 'string' ||
        receiverRef.trim().length < 4 ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount <= 0
      ) {
        res.status(400).json({
          error: 'Valid receiver name, account reference, and positive INR amount are required.',
        });
        return;
      }

      if (parsedAmount > db.settings.maxSingleTransferInr) {
        res.status(400).json({
          error: `Single demo transfer cannot exceed ₹${db.settings.maxSingleTransferInr.toLocaleString('en-IN')}.`,
        });
        return;
      }

      // Duplicate request prevention (Idempotency Key + Short Time Window)
      if (
        typeof idempotencyKey === 'string' &&
        idempotencyKey.trim() &&
        db.transactions.some((t) => t.idempotencyKey === idempotencyKey.trim())
      ) {
        res.status(409).json({
          error: 'Duplicate transfer request detected (idempotency check).',
        });
        return;
      }

      const windowMs = db.settings.strictDuplicateCheckWindowSec * 1000;
      const recentDup = db.transactions.find(
        (t) =>
          t.userId === userId &&
          t.receiverRef === receiverRef.trim() &&
          t.amount === parsedAmount &&
          Date.now() - new Date(t.createdAt).getTime() < windowMs
      );
      if (recentDup) {
        res.status(409).json({
          error: `Identical transfer detected within ${db.settings.strictDuplicateCheckWindowSec}s duplicate protection window.`,
        });
        return;
      }

      const sourceAccount = db.accounts.find(
        (a) => a.userId === userId && a.accountType === 'Checking'
      );
      if (!sourceAccount || sourceAccount.status !== 'Active') {
        res.status(400).json({ error: 'Active checking account not found.' });
        return;
      }

      if (sourceAccount.availableBalance < parsedAmount) {
        // Record failed transfer attempt in audit chain
        const { transaction } = appendTransactionWithBlock(db, {
          idempotencyKey:
            typeof idempotencyKey === 'string' ? idempotencyKey.trim() : undefined,
          userId,
          senderRef: sourceAccount.accountNumberMasked,
          receiverRef: receiverRef.trim().slice(0, 40),
          receiverName: receiverName.trim().slice(0, 80),
          type: 'Transfer',
          amount: parsedAmount,
          description:
            (typeof description === 'string' && description.trim()) ||
            'Demo transfer (Insufficient balance)',
          status: 'Failed',
        });

        appendAuditLog(db, {
          actorId: userId,
          actorRole: 'customer',
          actorName: user.fullName,
          action: 'TRANSFER_FAILED_INSUFFICIENT_FUNDS',
          targetType: 'Transaction',
          targetId: transaction.id,
          details: `Demo transfer of ₹${parsedAmount.toFixed(2)} failed due to insufficient available balance.`,
        });
        saveDb(db);

        res.status(400).json({
          error: 'Insufficient available balance in checking account.',
          transaction,
        });
        return;
      }

      // Debit sender test balance
      sourceAccount.balance = Number((sourceAccount.balance - parsedAmount).toFixed(2));
      sourceAccount.availableBalance = sourceAccount.balance;
      sourceAccount.updatedAt = new Date().toISOString();

      // Credit internal demo recipient if selected
      if (typeof recipientUserId === 'string' && recipientUserId) {
        const destAcc = db.accounts.find(
          (a) => a.userId === recipientUserId && a.accountType === 'Checking'
        );
        if (destAcc && destAcc.status === 'Active') {
          destAcc.balance = Number((destAcc.balance + parsedAmount).toFixed(2));
          destAcc.availableBalance = destAcc.balance;
          destAcc.updatedAt = new Date().toISOString();
        }
      }

      const { transaction, block } = appendTransactionWithBlock(db, {
        idempotencyKey:
          typeof idempotencyKey === 'string' ? idempotencyKey.trim() : undefined,
        userId,
        senderRef: sourceAccount.accountNumberMasked,
        receiverRef: receiverRef.trim().slice(0, 40),
        receiverName: receiverName.trim().slice(0, 80),
        type: 'Transfer',
        amount: parsedAmount,
        description:
          (typeof description === 'string' && description.trim().slice(0, 160)) ||
          `Demo transfer to ${receiverName.trim()}`,
        status: 'Successful',
      });

      appendAuditLog(db, {
        actorId: userId,
        actorRole: 'customer',
        actorName: user.fullName,
        action: 'DEMO_TRANSFER_EXECUTED',
        targetType: 'Transaction',
        targetId: transaction.id,
        details: `Transferred ₹${parsedAmount.toLocaleString('en-IN')} to ${receiverName.trim()} (${receiverRef.trim()}) — Sealed in Block #${block.blockNumber}.`,
      });

      addNotification(db, {
        userId,
        category: 'Transfer',
        title: 'Demo Transfer Successful',
        message: `₹${parsedAmount.toLocaleString('en-IN')} sent to ${receiverName.trim()}. Block #${block.blockNumber} hash verified.`,
      });

      saveDb(db);

      res.status(201).json({
        transaction,
        block,
        updatedAccount: sanitizeAccount(sourceAccount),
      });
    }
  );

  app.post(
    '/api/customer/transactions/:id/cancel',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const tx = db.transactions.find(
        (t) => t.id === req.params.id && t.userId === userId
      );
      if (!tx) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }
      if (tx.status !== 'Pending') {
        res.status(400).json({ error: 'Only pending transactions can be cancelled.' });
        return;
      }

      tx.status = 'Cancelled';
      const user = db.users.find((u) => u.id === userId)!;
      const { transaction: cancelRecord } = appendTransactionWithBlock(db, {
        userId,
        senderRef: tx.receiverRef,
        receiverRef: tx.senderRef,
        receiverName: `${user.fullName} (Cancellation Audit)`,
        type: 'Fee Refund',
        amount: tx.amount,
        description: `Customer cancellation recorded for ${tx.id}`,
        status: 'Cancelled',
      });

      appendAuditLog(db, {
        actorId: userId,
        actorRole: 'customer',
        actorName: user.fullName,
        action: 'PENDING_TRANSFER_CANCELLED',
        targetType: 'Transaction',
        targetId: tx.id,
        details: `Cancelled pending transaction ${tx.id}; append-only cancellation audit entry ${cancelRecord.id} sealed.`,
      });

      saveDb(db);
      res.json({ transaction: tx, auditEntry: cancelRecord });
    }
  );

  // =========================================================================
  // AUTOMATIC SAVINGS SYSTEM
  // =========================================================================

  app.get(
    '/api/customer/savings',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const rules = db.savingsRules.filter((r) => r.userId === userId);
      const history = db.savingsHistory
        .filter((h) => h.userId === userId)
        .sort(
          (a, b) =>
            new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
        );
      const accounts = db.accounts
        .filter((a) => a.userId === userId)
        .map(sanitizeAccount);
      const vaultBalance = accounts
        .filter((a) => a.accountType !== 'Checking')
        .reduce((sum, a) => sum + a.balance, 0);
      const checkingBalance =
        accounts.find((a) => a.accountType === 'Checking')?.balance || 0;

      res.json({
        rules,
        history,
        vaultBalance,
        checkingBalance,
        simulatedAnnualYieldPct: db.settings.simulatedAnnualYieldPct,
      });
    }
  );

  app.post(
    '/api/customer/savings/rules',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const { goalName, cadence, amount, targetAmount } = req.body || {};
      const parsedAmount = Number(amount);
      const parsedTarget = Number(targetAmount);

      if (
        typeof goalName !== 'string' ||
        goalName.trim().length < 2 ||
        !['Daily', 'Weekly', 'Monthly'].includes(cadence) ||
        !Number.isFinite(parsedAmount) ||
        parsedAmount < 10 ||
        !Number.isFinite(parsedTarget) ||
        parsedTarget < parsedAmount
      ) {
        res.status(400).json({
          error:
            'Provide a valid goal name, cadence (Daily/Weekly/Monthly), minimum ₹10 savings amount, and target >= savings amount.',
        });
        return;
      }

      const now = new Date().toISOString();
      const rule = {
        id: `sav_rule_${Date.now()}`,
        userId,
        goalName: goalName.trim().slice(0, 60),
        cadence: cadence as SavingsCadence,
        amount: parsedAmount,
        targetAmount: parsedTarget,
        savedAmount: 0,
        status: 'Active' as const,
        nextScheduledAt: computeNextSchedule(cadence as SavingsCadence),
        lastExecutedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      db.savingsRules.unshift(rule);

      appendAuditLog(db, {
        actorId: userId,
        actorRole: 'customer',
        actorName: user.fullName,
        action: 'AUTO_SAVINGS_RULE_CREATED',
        targetType: 'SavingsRule',
        targetId: rule.id,
        details: `Created ${cadence} auto-savings rule of ₹${parsedAmount.toLocaleString('en-IN')} for "${rule.goalName}" (Target: ₹${parsedTarget.toLocaleString('en-IN')}).`,
      });

      addNotification(db, {
        userId,
        category: 'Savings',
        title: 'New Savings Goal Configured',
        message: `${cadence} automated rule of ₹${parsedAmount.toLocaleString('en-IN')} created for ${rule.goalName}.`,
      });

      saveDb(db);
      res.status(201).json({ rule });
    }
  );

  app.patch(
    '/api/customer/savings/rules/:id',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const rule = db.savingsRules.find(
        (r) => r.id === req.params.id && r.userId === userId
      );
      if (!rule) {
        res.status(404).json({ error: 'Savings rule not found.' });
        return;
      }

      const { goalName, cadence, amount, targetAmount, status } = req.body || {};

      if (typeof goalName === 'string' && goalName.trim().length >= 2) {
        rule.goalName = goalName.trim().slice(0, 60);
      }
      if (['Daily', 'Weekly', 'Monthly'].includes(cadence)) {
        rule.cadence = cadence as SavingsCadence;
        rule.nextScheduledAt = computeNextSchedule(rule.cadence);
      }
      if (amount !== undefined) {
        const num = Number(amount);
        if (!Number.isFinite(num) || num < 10) {
          res.status(400).json({ error: 'Savings amount must be at least ₹10.' });
          return;
        }
        rule.amount = num;
      }
      if (targetAmount !== undefined) {
        const num = Number(targetAmount);
        if (!Number.isFinite(num) || num < rule.amount) {
          res
            .status(400)
            .json({ error: 'Target amount must exceed scheduled savings amount.' });
          return;
        }
        rule.targetAmount = num;
      }
      if (status === 'Active' || status === 'Paused') {
        rule.status = status;
      }

      rule.updatedAt = new Date().toISOString();

      const user = db.users.find((u) => u.id === userId)!;
      appendAuditLog(db, {
        actorId: userId,
        actorRole: 'customer',
        actorName: user.fullName,
        action:
          status === 'Paused'
            ? 'AUTO_SAVINGS_PAUSED'
            : status === 'Active'
            ? 'AUTO_SAVINGS_RESUMED'
            : 'AUTO_SAVINGS_UPDATED',
        targetType: 'SavingsRule',
        targetId: rule.id,
        details: `Updated savings rule "${rule.goalName}" (${rule.cadence} ₹${rule.amount}, Status: ${rule.status}).`,
      });

      saveDb(db);
      res.json({ rule });
    }
  );

  app.post(
    '/api/customer/savings/simulate',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }

      const { ruleId } = req.body || {};
      const activeRules = db.savingsRules.filter(
        (r) =>
          r.userId === userId &&
          r.status === 'Active' &&
          (!ruleId || r.id === ruleId)
      );

      if (activeRules.length === 0) {
        res.status(400).json({
          error: 'No active automatic savings rules available to simulate.',
        });
        return;
      }

      const checking = db.accounts.find(
        (a) => a.userId === userId && a.accountType === 'Checking'
      );
      const vault = db.accounts.find(
        (a) => a.userId === userId && a.accountType !== 'Checking'
      );

      if (!checking || !vault) {
        res.status(400).json({ error: 'Checking or savings vault account missing.' });
        return;
      }

      const totalRequired = activeRules.reduce((s, r) => s + r.amount, 0);
      if (checking.availableBalance < totalRequired) {
        res.status(400).json({
          error: `Insufficient test checking balance (need ₹${totalRequired.toLocaleString('en-IN')}, available ₹${checking.availableBalance.toLocaleString('en-IN')}).`,
        });
        return;
      }

      const executedEntries = [];
      const now = new Date().toISOString();

      for (const rule of activeRules) {
        checking.balance = Number((checking.balance - rule.amount).toFixed(2));
        checking.availableBalance = checking.balance;
        checking.updatedAt = now;

        vault.balance = Number((vault.balance + rule.amount).toFixed(2));
        vault.availableBalance = vault.balance;
        vault.updatedAt = now;

        rule.savedAmount = Number((rule.savedAmount + rule.amount).toFixed(2));
        rule.lastExecutedAt = now;
        rule.nextScheduledAt = computeNextSchedule(rule.cadence);
        rule.updatedAt = now;

        const { transaction, block } = appendTransactionWithBlock(db, {
          userId,
          senderRef: checking.accountNumberMasked,
          receiverRef: vault.accountNumberMasked,
          receiverName: rule.goalName,
          type: 'Auto-Savings',
          amount: rule.amount,
          description: `Simulated ${rule.cadence} Auto-Savings Transfer — ${rule.goalName}`,
          status: 'Successful',
        });

        const hist = {
          id: `sh_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          ruleId: rule.id,
          userId,
          goalName: rule.goalName,
          cadence: rule.cadence,
          amount: rule.amount,
          balanceAfter: vault.balance,
          transactionId: transaction.id,
          transactionHash: transaction.transactionHash,
          executedAt: now,
        };
        db.savingsHistory.unshift(hist);
        executedEntries.push({ hist, transaction, block });

        appendAuditLog(db, {
          actorId: userId,
          actorRole: 'customer',
          actorName: user.fullName,
          action: 'AUTO_SAVINGS_SIMULATED',
          targetType: 'SavingsHistory',
          targetId: hist.id,
          details: `Simulated ${rule.cadence} savings of ₹${rule.amount.toLocaleString('en-IN')} to "${rule.goalName}" (Block #${block.blockNumber}).`,
        });
      }

      addNotification(db, {
        userId,
        category: 'Savings',
        title: 'Automatic Savings Simulation Completed',
        message: `Transferred ₹${totalRequired.toLocaleString('en-IN')} in test funds across ${activeRules.length} active savings rule(s).`,
      });

      saveDb(db);

      res.json({
        simulatedCount: executedEntries.length,
        totalMoved: totalRequired,
        vaultBalance: vault.balance,
        checkingBalance: checking.balance,
        executedEntries,
      });
    }
  );

  // =========================================================================
  // CUSTOMER BLOCKCHAIN EXPLORER, PROFILE & NOTIFICATIONS
  // =========================================================================

  app.get(
    '/api/customer/blockchain',
    requireCustomer,
    async (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const chainStatus = await getChainStatusInfo(db.blockchainRecords);
      const verification = verifyFullHashChain(db.blockchainRecords);
      const userTxIds = new Set(
        db.transactions.filter((t) => t.userId === userId).map((t) => t.id)
      );

      const blocks = [...db.blockchainRecords]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .map((b) => ({
          ...b,
          isOwnTransaction: userTxIds.has(b.transactionId),
        }));

      res.json({
        chainStatus,
        verification,
        blocks,
      });
    }
  );

  app.post(
    '/api/customer/blockchain/verify/:txId',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const sorted = [...db.blockchainRecords].sort(
        (a, b) => a.blockNumber - b.blockNumber
      );
      const idx = sorted.findIndex((b) => b.transactionId === req.params.txId);
      if (idx === -1) {
        res.status(404).json({ error: 'Blockchain audit record not found.' });
        return;
      }
      const result = verifySingleBlockRecord(
        sorted[idx],
        idx > 0 ? sorted[idx - 1] : undefined
      );
      res.json({ block: sorted[idx], verification: result });
    }
  );

  app.patch(
    '/api/customer/profile',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const user = db.users.find((u) => u.id === req.session!.sub);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      const { fullName, phone, city } = req.body || {};
      if (typeof fullName === 'string' && fullName.trim().length >= 2) {
        user.fullName = fullName.trim().slice(0, 80);
      }
      if (typeof phone === 'string' && phone.trim().length >= 6) {
        user.phone = phone.trim().slice(0, 24);
      }
      if (typeof city === 'string' && city.trim().length >= 2) {
        user.city = city.trim().slice(0, 60);
      }

      appendAuditLog(db, {
        actorId: user.id,
        actorRole: 'customer',
        actorName: user.fullName,
        action: 'PROFILE_UPDATED',
        targetType: 'User',
        targetId: user.id,
        details: 'Updated customer contact profile details.',
      });
      saveDb(db);
      res.json({ user: sanitizeUser(user) });
    }
  );

  app.get(
    '/api/customer/notifications',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const notifications = db.notifications
        .filter((n) => n.userId === userId || n.userId === 'ALL_CUSTOMERS')
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      res.json({ notifications });
    }
  );

  app.patch(
    '/api/customer/notifications/:id/read',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      const ntf = db.notifications.find(
        (n) =>
          n.id === req.params.id &&
          (n.userId === userId || n.userId === 'ALL_CUSTOMERS')
      );
      if (!ntf) {
        res.status(404).json({ error: 'Notification not found.' });
        return;
      }
      ntf.read = true;
      saveDb(db);
      res.json({ notification: ntf });
    }
  );

  app.post(
    '/api/customer/notifications/read-all',
    requireCustomer,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const userId = req.session!.sub;
      db.notifications.forEach((n) => {
        if (n.userId === userId || n.userId === 'ALL_CUSTOMERS') {
          n.read = true;
        }
      });
      saveDb(db);
      res.json({ ok: true });
    }
  );

  // =========================================================================
  // ADMIN AUTHENTICATION & SECURE DASHBOARD ROUTES
  // =========================================================================

  app.post('/api/admin/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Admin email and password are required.' });
      return;
    }

    const db = getDb();
    const admin = db.adminUsers.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!admin || !verifyPassword(password, admin.passwordHash, admin.salt)) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    if (admin.status !== 'Active') {
      res.status(403).json({ error: 'Administrator account is suspended.' });
      return;
    }

    admin.lastLoginAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: admin.id,
      actorRole: 'admin',
      actorName: admin.fullName,
      action: 'ADMIN_LOGIN',
      targetType: 'AdminSession',
      targetId: admin.id,
      details: `Administrator ${admin.email} authenticated into secure console.`,
    });
    saveDb(db);

    const token = signSessionToken({
      sub: admin.id,
      role: 'admin',
      email: admin.email,
    });
    setSessionCookie(res, token);

    res.json({ admin: sanitizeAdmin(admin), token });
  });

  app.post('/api/admin/auth/logout', (_req: Request, res: Response) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get(
    '/api/admin/overview',
    requireAdmin,
    async (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const totalCustomers = db.users.length;
      const totalTransactions = db.transactions.length;
      const totalSavings = db.accounts
        .filter((a) => a.accountType !== 'Checking')
        .reduce((s, a) => s + a.balance, 0);
      const totalVolume = db.transactions
        .filter((t) => t.status === 'Successful')
        .reduce((s, t) => s + t.amount, 0);
      const pendingTransactions = db.transactions.filter(
        (t) => t.status === 'Pending'
      ).length;
      const chainVerification = verifyFullHashChain(db.blockchainRecords);
      const chainStatus = await getChainStatusInfo(db.blockchainRecords);

      // Build analytics series for Recharts
      const monthlyBuckets: Record<
        string,
        { month: string; volume: number; savings: number; count: number }
      > = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Ensure last 6 months appear in order
      for (let m = 5; m >= 0; m--) {
        const d = new Date();
        d.setMonth(d.getMonth() - m);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyBuckets[key] = {
          month: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
          volume: 0,
          savings: 0,
          count: 0,
        };
      }

      db.transactions.forEach((tx) => {
        const d = new Date(tx.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyBuckets[key]) {
          monthlyBuckets[key].count += 1;
          if (tx.status === 'Successful') {
            monthlyBuckets[key].volume += tx.amount;
            if (tx.type === 'Auto-Savings') {
              monthlyBuckets[key].savings += tx.amount;
            }
          }
        }
      });

      const statusBreakdown = ['Successful', 'Pending', 'Failed', 'Cancelled'].map(
        (status) => ({
          status,
          count: db.transactions.filter((t) => t.status === status).length,
          volume: db.transactions
            .filter((t) => t.status === status)
            .reduce((s, t) => s + t.amount, 0),
        })
      );

      // Daily transaction activity (last 14 days)
      const dailyActivity = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const dateStr = d.toISOString().slice(0, 10);
        const dayTx = db.transactions.filter(
          (t) => t.createdAt.slice(0, 10) === dateStr
        );
        dailyActivity.push({
          day: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          transactions: dayTx.length,
          amount: dayTx.reduce((s, t) => s + t.amount, 0),
        });
      }

      // Customer registration cumulative chart
      const customerGrowth = Object.keys(monthlyBuckets).map((key) => {
        const [y, mo] = key.split('-').map(Number);
        const endOfMonth = new Date(y, mo, 0, 23, 59, 59).getTime();
        return {
          month: monthlyBuckets[key].month,
          customers: db.users.filter(
            (u) => new Date(u.createdAt).getTime() <= endOfMonth
          ).length,
        };
      });

      // Savings cumulative growth chart
      let runningSavings = Math.max(0, totalSavings - 45000);
      const savingsGrowth = Object.values(monthlyBuckets).map((b, idx) => {
        runningSavings += b.savings + idx * 6500;
        return {
          month: b.month,
          totalSavings: Math.min(totalSavings, runningSavings),
        };
      });
      if (savingsGrowth.length > 0) {
        savingsGrowth[savingsGrowth.length - 1].totalSavings = totalSavings;
      }

      res.json({
        kpis: {
          totalCustomers,
          totalTransactions,
          totalSavings,
          totalVolume,
          pendingTransactions,
          blockchainVerifiedRecords: chainVerification.verifiedBlocks,
        },
        charts: {
          monthlyAnalytics: Object.values(monthlyBuckets),
          dailyActivity,
          savingsGrowth,
          customerGrowth,
          statusBreakdown,
        },
        chainStatus,
        chainVerification,
        recentAuditLogs: db.auditLogs.slice(0, 6),
      });
    }
  );

  app.get(
    '/api/admin/customers',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const q =
        typeof req.query.search === 'string'
          ? req.query.search.trim().toLowerCase()
          : '';

      const customers = db.users
        .filter(
          (u) =>
            !q ||
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q)
        )
        .map((u) => {
          const accs = db.accounts
            .filter((a) => a.userId === u.id)
            .map(sanitizeAccount);
          const totalBalance = accs.reduce((s, a) => s + a.balance, 0);
          const totalSavings = accs
            .filter((a) => a.accountType !== 'Checking')
            .reduce((s, a) => s + a.balance, 0);
          const txCount = db.transactions.filter(
            (t) => t.userId === u.id
          ).length;
          return {
            ...sanitizeUser(u),
            accounts: accs,
            totalBalance,
            totalSavings,
            txCount,
          };
        });

      res.json({ customers });
    }
  );

  app.get(
    '/api/admin/customers/:id',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Customer not found.' });
        return;
      }
      const accounts = db.accounts
        .filter((a) => a.userId === user.id)
        .map(sanitizeAccount);
      const transactions = db.transactions
        .filter((t) => t.userId === user.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      const savingsRules = db.savingsRules.filter((r) => r.userId === user.id);
      const savingsHistory = db.savingsHistory.filter(
        (h) => h.userId === user.id
      );

      res.json({
        customer: sanitizeUser(user),
        accounts,
        transactions,
        savingsRules,
        savingsHistory,
      });
    }
  );

  app.patch(
    '/api/admin/customers/:id/status',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const user = db.users.find((u) => u.id === req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Customer not found.' });
        return;
      }
      const { status } = req.body || {};
      if (status !== 'Active' && status !== 'Deactivated') {
        res.status(400).json({ error: 'Status must be Active or Deactivated.' });
        return;
      }

      user.status = status;
      db.accounts.forEach((a) => {
        if (a.userId === user.id) {
          a.status = status;
          a.updatedAt = new Date().toISOString();
        }
      });

      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action:
          status === 'Active'
            ? 'CUSTOMER_ACCOUNT_ACTIVATED'
            : 'CUSTOMER_ACCOUNT_DEACTIVATED',
        targetType: 'User',
        targetId: user.id,
        details: `${status === 'Active' ? 'Activated' : 'Deactivated'} demo customer ${user.fullName} (${user.email}).`,
      });

      addNotification(db, {
        userId: user.id,
        category: 'Security',
        title: `Account Status Changed to ${status}`,
        message: `An administrator updated your demo account status to ${status}.`,
      });

      saveDb(db);
      res.json({ customer: sanitizeUser(user) });
    }
  );

  app.get(
    '/api/admin/accounts',
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const accounts = db.accounts.map((a) => {
        const owner = db.users.find((u) => u.id === a.userId);
        return {
          ...sanitizeAccount(a),
          ownerName: owner ? owner.fullName : 'Unknown Customer',
          ownerEmail: owner ? owner.email : '',
        };
      });
      res.json({ accounts });
    }
  );

  app.get(
    '/api/admin/transactions',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const { search, status, type } = req.query;
      let list = db.transactions.map((t) => {
        const owner = db.users.find((u) => u.id === t.userId);
        return {
          ...t,
          customerName: owner ? owner.fullName : 'Unknown',
        };
      });

      if (typeof search === 'string' && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.customerName.toLowerCase().includes(q) ||
            t.receiverName.toLowerCase().includes(q) ||
            t.transactionHash.toLowerCase().includes(q)
        );
      }
      if (typeof status === 'string' && status !== 'All') {
        list = list.filter((t) => t.status === status);
      }
      if (typeof type === 'string' && type !== 'All') {
        list = list.filter((t) => t.type === type);
      }

      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json({ transactions: list });
    }
  );

  app.patch(
    '/api/admin/transactions/:id/review',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const tx = db.transactions.find((t) => t.id === req.params.id);
      if (!tx) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }

      const { decision, note } = req.body || {};
      if (
        decision !== 'Approve' &&
        decision !== 'Reject' &&
        decision !== 'FlagReviewed'
      ) {
        res
          .status(400)
          .json({ error: 'Decision must be Approve, Reject, or FlagReviewed.' });
        return;
      }

      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      const previousStatus = tx.status;

      if (decision === 'Approve' && tx.status === 'Pending') {
        tx.status = 'Successful';
        tx.verificationStatus = 'Verified';
      } else if (decision === 'Reject' && tx.status === 'Pending') {
        tx.status = 'Failed';
        tx.verificationStatus = 'Verified';
      }

      // Append an immutable settlement/review block rather than mutating historical blocks
      const { transaction: reviewTx, block } = appendTransactionWithBlock(db, {
        userId: tx.userId,
        senderRef: 'ADMIN-COMPLIANCE',
        receiverRef: tx.id,
        receiverName: `Admin Review (${decision})`,
        type: 'Fee Refund',
        amount: 0,
        description:
          (typeof note === 'string' && note.trim()) ||
          `Admin ${decision} on ${tx.id} (prior status: ${previousStatus})`,
        status: tx.status,
      });

      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: `ADMIN_TX_${decision.toUpperCase()}`,
        targetType: 'Transaction',
        targetId: tx.id,
        details: `Reviewed transaction ${tx.id} (${previousStatus} -> ${tx.status}). Sealed append-only review entry ${reviewTx.id} in Block #${block.blockNumber}.`,
      });

      addNotification(db, {
        userId: tx.userId,
        category: 'Transfer',
        title: `Transaction ${tx.id} Reviewed`,
        message: `Compliance review completed (${tx.status}) and sealed in Block #${block.blockNumber}.`,
      });

      saveDb(db);
      res.json({ transaction: tx, reviewBlock: block });
    }
  );

  app.get(
    '/api/admin/savings',
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const rules = db.savingsRules.map((r) => {
        const owner = db.users.find((u) => u.id === r.userId);
        return {
          ...r,
          customerName: owner ? owner.fullName : 'Unknown',
        };
      });
      const history = db.savingsHistory
        .map((h) => {
          const owner = db.users.find((u) => u.id === h.userId);
          return {
            ...h,
            customerName: owner ? owner.fullName : 'Unknown',
          };
        })
        .sort(
          (a, b) =>
            new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
        );

      res.json({ rules, history });
    }
  );

  app.get(
    '/api/admin/blockchain',
    requireAdmin,
    async (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const chainStatus = await getChainStatusInfo(db.blockchainRecords);
      const verification = verifyFullHashChain(db.blockchainRecords);
      const blocks = [...db.blockchainRecords].sort(
        (a, b) => b.blockNumber - a.blockNumber
      );
      res.json({
        chainStatus,
        verification,
        blocks,
      });
    }
  );

  app.post(
    '/api/admin/blockchain/verify-chain',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const verification = verifyFullHashChain(db.blockchainRecords);
      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;

      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: 'ADMIN_FULL_CHAIN_VERIFICATION',
        targetType: 'BlockchainRecord',
        targetId: `BLOCKS-1-${verification.totalBlocks}`,
        details: `Verified ${verification.verifiedBlocks}/${verification.totalBlocks} blocks. Integrity status: ${verification.valid ? 'VALID' : 'TAMPERING DETECTED'}.`,
      });
      saveDb(db);

      res.json({ verification });
    }
  );

  app.post(
    '/api/admin/blockchain/verify-record/:txId',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const sorted = [...db.blockchainRecords].sort(
        (a, b) => a.blockNumber - b.blockNumber
      );
      const idx = sorted.findIndex((b) => b.transactionId === req.params.txId);
      if (idx === -1) {
        res.status(404).json({ error: 'Block record not found.' });
        return;
      }
      const verification = verifySingleBlockRecord(
        sorted[idx],
        idx > 0 ? sorted[idx - 1] : undefined
      );
      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: 'ADMIN_SINGLE_BLOCK_VERIFIED',
        targetType: 'BlockchainRecord',
        targetId: sorted[idx].transactionId,
        details: `Verified Block #${sorted[idx].blockNumber} (${sorted[idx].transactionId}): ${verification.valid ? 'PASS' : 'FAIL'}.`,
      });
      saveDb(db);
      res.json({ block: sorted[idx], verification });
    }
  );

  // Non-destructive in-memory tamper detection demonstration (never alters stored ledger)
  app.post(
    '/api/admin/blockchain/tamper-simulation',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const cloned = db.blockchainRecords.map((b) => ({ ...b }));
      if (cloned.length === 0) {
        res.status(400).json({ error: 'No blocks in ledger.' });
        return;
      }
      const targetIndex = Math.min(2, cloned.length - 1);
      cloned[targetIndex].amount += 5000; // Mutate amount on cloned block only

      const result = verifyFullHashChain(cloned);
      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: 'TAMPER_DETECTION_DRILL',
        targetType: 'BlockchainRecord',
        targetId: cloned[targetIndex].transactionId,
        details: `Executed non-destructive tamper drill on cloned Block #${cloned[targetIndex].blockNumber}; engine flagged ${result.tamperedBlocks.length} compromised block(s).`,
      });
      saveDb(db);

      res.json({
        drillTargetBlock: cloned[targetIndex].blockNumber,
        drillTargetTxId: cloned[targetIndex].transactionId,
        detectionResult: result,
      });
    }
  );

  app.get(
    '/api/admin/audit-logs',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const q =
        typeof req.query.search === 'string'
          ? req.query.search.trim().toLowerCase()
          : '';
      const role = typeof req.query.role === 'string' ? req.query.role : 'All';

      const logs = db.auditLogs.filter((l) => {
        const matchesQ =
          !q ||
          l.action.toLowerCase().includes(q) ||
          l.actorName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.targetId.toLowerCase().includes(q);
        const matchesRole = role === 'All' || l.actorRole === role;
        return matchesQ && matchesRole;
      });

      res.json({ auditLogs: logs });
    }
  );

  app.get(
    '/api/admin/reports/summary',
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const verification = verifyFullHashChain(db.blockchainRecords);
      res.json({
        generatedAt: new Date().toISOString(),
        customers: db.users.map((u) => {
          const accs = db.accounts.filter((a) => a.userId === u.id);
          return {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            city: u.city,
            accountTier: u.accountTier,
            status: u.status,
            totalBalance: accs.reduce((s, a) => s + a.balance, 0),
          };
        }),
        transactions: db.transactions,
        savingsRules: db.savingsRules,
        savingsHistory: db.savingsHistory,
        blockchainRecords: [...db.blockchainRecords].sort(
          (a, b) => a.blockNumber - b.blockNumber
        ),
        chainVerification: verification,
      });
    }
  );

  app.get(
    '/api/admin/notifications',
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      res.json({
        notifications: db.notifications,
        contactInquiries: db.contactInquiries,
      });
    }
  );

  app.post(
    '/api/admin/notifications/broadcast',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const { userId, category, title, message } = req.body || {};
      if (
        typeof title !== 'string' ||
        title.trim().length < 3 ||
        typeof message !== 'string' ||
        message.trim().length < 5
      ) {
        res
          .status(400)
          .json({ error: 'Notification title and message are required.' });
        return;
      }

      const target =
        typeof userId === 'string' && userId.trim() ? userId.trim() : 'ALL_CUSTOMERS';
      const cat = ['Savings', 'Transfer', 'Security', 'System'].includes(category)
        ? category
        : 'System';

      const ntf = addNotification(db, {
        userId: target,
        category: cat,
        title: title.trim().slice(0, 80),
        message: message.trim().slice(0, 400),
      });

      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: 'ADMIN_NOTIFICATION_DISPATCHED',
        targetType: 'Notification',
        targetId: ntf.id,
        details: `Sent ${cat} notification "${ntf.title}" to ${target}.`,
      });
      saveDb(db);
      res.status(201).json({ notification: ntf });
    }
  );

  app.get(
    '/api/admin/settings',
    requireAdmin,
    async (_req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const chainStatus = await getChainStatusInfo(db.blockchainRecords);
      res.json({ settings: db.settings, chainStatus });
    }
  );

  app.patch(
    '/api/admin/settings',
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const db = getDb();
      const {
        simulatedAnnualYieldPct,
        maxSingleTransferInr,
        autoSavingsCycleEnabled,
        strictDuplicateCheckWindowSec,
      } = req.body || {};

      if (simulatedAnnualYieldPct !== undefined) {
        const v = Number(simulatedAnnualYieldPct);
        if (!Number.isFinite(v) || v < 0 || v > 20) {
          res.status(400).json({ error: 'Yield must be between 0% and 20%.' });
          return;
        }
        db.settings.simulatedAnnualYieldPct = v;
      }
      if (maxSingleTransferInr !== undefined) {
        const v = Number(maxSingleTransferInr);
        if (!Number.isFinite(v) || v < 1000 || v > 10000000) {
          res
            .status(400)
            .json({ error: 'Max single transfer must be ₹1,000 to ₹1,00,00,000.' });
          return;
        }
        db.settings.maxSingleTransferInr = v;
      }
      if (typeof autoSavingsCycleEnabled === 'boolean') {
        db.settings.autoSavingsCycleEnabled = autoSavingsCycleEnabled;
      }
      if (strictDuplicateCheckWindowSec !== undefined) {
        const v = Number(strictDuplicateCheckWindowSec);
        if (!Number.isFinite(v) || v < 5 || v > 300) {
          res
            .status(400)
            .json({ error: 'Duplicate check window must be 5–300 seconds.' });
          return;
        }
        db.settings.strictDuplicateCheckWindowSec = v;
      }

      const admin = db.adminUsers.find((a) => a.id === req.session!.sub)!;
      db.settings.updatedAt = new Date().toISOString();
      db.settings.updatedBy = admin.fullName;

      appendAuditLog(db, {
        actorId: admin.id,
        actorRole: 'admin',
        actorName: admin.fullName,
        action: 'PLATFORM_SETTINGS_UPDATED',
        targetType: 'Settings',
        targetId: 'GLOBAL',
        details: `Updated settings (Max Transfer: ₹${db.settings.maxSingleTransferInr}, Yield: ${db.settings.simulatedAnnualYieldPct}%).`,
      });
      saveDb(db);
      res.json({ settings: db.settings });
    }
  );

  // =========================================================================
  // VITE / STATIC SERVING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BLOCKBANK server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
