import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { getSupabaseServerClient } from './src/lib/supabaseServer';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 10MB limit for rich report payloads
  app.use(express.json({ limit: '10mb' }));

  // Helper middleware to get Supabase client safely
  const getSupabase = (res: Response) => {
    try {
      return getSupabaseServerClient();
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Supabase configuration error',
      });
      return null;
    }
  };

  // -------------------------------------------------------------------
  // 1. Health Check
  // -------------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------------
  // 2. Test Submissions APIs (INSERT & SELECT)
  // -------------------------------------------------------------------

  /**
   * [POST] /api/submissions
   * 테스트 제출 데이터 추가 (INSERT)
   */
  app.post('/api/submissions', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const {
        selfProfile,
        idealProfile,
        explicitWeight,
        implicitWeight,
        finalWeight,
        archetype,
        preferenceConsistency,
        rarityPercent,
        fullReport,
      } = req.body;

      if (!selfProfile) {
        res.status(400).json({ success: false, error: 'selfProfile is required' });
        return;
      }

      // Insert data into test_submissions table
      const { data, error } = await supabase
        .from('test_submissions')
        .insert([
          {
            age: selfProfile.age,
            gender: selfProfile.gender,
            region: selfProfile.region,
            height: selfProfile.height,
            occupation_group: selfProfile.occupationGroup || selfProfile.occupation,
            self_profile: selfProfile,
            ideal_profile: idealProfile || {},
            explicit_weights: explicitWeight || {},
            implicit_weights: implicitWeight || {},
            final_weights: finalWeight || {},
            archetype_code: archetype?.code || null,
            archetype_title: archetype?.title || null,
            consistency_percent: preferenceConsistency ?? null,
            rarity_percent: rarityPercent ?? null,
            full_report: fullReport || req.body,
          },
        ])
        .select('id, created_at')
        .single();

      if (error) {
        console.error('Supabase insert error (test_submissions):', error);
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Test submission saved successfully',
        submissionId: data.id,
        createdAt: data.created_at,
      });
    } catch (err: any) {
      console.error('Server error on POST /api/submissions:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  /**
   * [GET] /api/submissions
   * 관리자용 테스트 제출 목록 및 검색 조회 (SELECT)
   * Query params: gender, ageMin, ageMax, region, limit, page
   */
  app.get('/api/submissions', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const { gender, region, archetypeCode, limit = '20', page = '1' } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('test_submissions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (gender) {
        query = query.eq('gender', gender as string);
      }
      if (region) {
        query = query.eq('region', region as string);
      }
      if (archetypeCode) {
        query = query.eq('archetype_code', archetypeCode as string);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Supabase select error (test_submissions):', error);
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.json({
        success: true,
        data,
        pagination: {
          total: count || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((count || 0) / limitNum),
        },
      });
    } catch (err: any) {
      console.error('Server error on GET /api/submissions:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  /**
   * [GET] /api/submissions/:id
   * 특정 제출 단건 상세 조회 (SELECT)
   */
  app.get('/api/submissions/:id', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        res.status(404).json({ success: false, error: 'Submission not found' });
        return;
      }

      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------
  // 3. Consultation Requests APIs (INSERT & SELECT & UPDATE)
  // -------------------------------------------------------------------

  /**
   * [POST] /api/consultations
   * 1:1 상담 신청 데이터 추가 (INSERT)
   */
  app.post('/api/consultations', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const { submissionId, lead, managerPayload } = req.body;

      // Check required lead properties
      const name = lead?.name || req.body.name;
      const phone = lead?.phone || req.body.phone;
      const preferredTime = lead?.preferredTime || req.body.preferredTime || '상관없음';
      const consent = lead?.consent ?? req.body.consent ?? true;

      if (!name || !phone) {
        res.status(400).json({ success: false, error: 'Name and phone are required fields' });
        return;
      }

      const { data, error } = await supabase
        .from('consultations')
        .insert([
          {
            submission_id: submissionId || null,
            name,
            phone,
            preferred_time: preferredTime,
            consent,
            status: 'pending',
            manager_payload: managerPayload || null,
          },
        ])
        .select('id, created_at, status')
        .single();

      if (error) {
        console.error('Supabase insert error (consultations):', error);
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Consultation request created successfully',
        consultationId: data.id,
        createdAt: data.created_at,
      });
    } catch (err: any) {
      console.error('Server error on POST /api/consultations:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  /**
   * [GET] /api/consultations
   * 관리자용 상담 신청 목록 조회 (SELECT with filters)
   * Query params: status ('pending'|'contacted'|'completed'|'cancelled'), limit, page
   */
  app.get('/api/consultations', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const { status, limit = '20', page = '1' } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 20;
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('consultations')
        .select(
          `
          *,
          test_submissions (
            gender,
            age,
            region,
            height,
            occupation_group,
            archetype_title,
            rarity_percent
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limitNum - 1);

      if (status) {
        query = query.eq('status', status as string);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Supabase select error (consultations):', error);
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.json({
        success: true,
        data,
        pagination: {
          total: count || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((count || 0) / limitNum),
        },
      });
    } catch (err: any) {
      console.error('Server error on GET /api/consultations:', err);
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  /**
   * [PATCH] /api/consultations/:id
   * 관리자용 상담 상태 및 메모 업데이트 (UPDATE)
   */
  app.patch('/api/consultations/:id', async (req: Request, res: Response) => {
    const supabase = getSupabase(res);
    if (!supabase) return;

    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;

      const updateData: Record<string, any> = {};
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.admin_notes = adminNotes;

      const { data, error } = await supabase
        .from('consultations')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.json({ success: true, message: 'Consultation updated', data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error' });
    }
  });

  // -------------------------------------------------------------------
  // 4. Vite Middleware or Production Static Serve
  // -------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LOVE BALANCE 2 Express Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
