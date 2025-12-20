import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['DATABASE_URL', 'DISCOURSE_SSO_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error('CRITICAL ERROR: Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Server cannot start. Please check your .env file or deployment configuration.');
    process.exit(1);
}

const app = express();
const { Pool, types } = pg;

// Disable auto-parsing of DATE type (OID 1082) to prevent timezone shifts
// This ensures we get the raw "YYYY-MM-DD" string from the database
types.setTypeParser(1082, (stringValue) => stringValue);

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// ============================================
// Discourse SSO Verification Middleware
// ============================================
function verifyDiscourseSSO(sso, sig) {
    const secret = process.env.DISCOURSE_SSO_SECRET;

    if (!secret) {
        console.error('DISCOURSE_SSO_SECRET is not defined');
        return null;
    }

    try {
        const computedSig = crypto
            .createHmac('sha256', secret)
            .update(sso)
            .digest('hex');

        if (sig !== computedSig) {
            return null;
        }

        const decoded = Buffer.from(sso, 'base64').toString('utf8');
        const params = new URLSearchParams(decoded);

        return {
            nonce: params.get('nonce'),
            discourse_user_id: parseInt(params.get('external_id')),
            username: params.get('username'),
            email: params.get('email'),
            name: params.get('name')
        };
    } catch (err) {
        console.error('Error verifying Discourse SSO:', err);
        return null;
    }
}

// Auth middleware - extracts user from SSO headers or URL-passed payload
async function authMiddleware(req, res, next) {
    try {
        // Check for SSO payload in header (passed from frontend)
        const sso = req.headers['x-discourse-sso'];
        const sig = req.headers['x-discourse-sig'];

        // For development, also accept a simple user_id header
        const devUserId = req.headers['x-dev-user-id'];

        if (devUserId && process.env.NODE_ENV === 'development') {
            req.user = { id: parseInt(devUserId), discourse_user_id: parseInt(devUserId), username: 'dev_user' };
            return next();
        }

        if (!sso) {
            return res.status(401).json({ error: 'Missing SSO authentication' });
        }

        // For iframe-based approach from theme component, we trust the payload
        // since the iframe only loads for logged-in Discourse users
        // If sig is provided, verify it; otherwise trust the payload from our origin
        let userData;

        if (sig) {
            userData = verifyDiscourseSSO(sso, sig);
            if (!userData) {
                return res.status(401).json({ error: 'Invalid SSO signature' });
            }
        } else {
            // Trust unsigned payload (from theme component iframe)
            try {
                const decoded = Buffer.from(sso, 'base64').toString('utf8');
                const params = new URLSearchParams(decoded);
                userData = {
                    discourse_user_id: parseInt(params.get('external_id')),
                    username: params.get('username'),
                    email: params.get('email'),
                    name: params.get('name')
                };

                if (!userData.discourse_user_id || !userData.username) {
                    return res.status(401).json({ error: 'Invalid SSO payload' });
                }
            } catch (e) {
                console.error('Failed to decode SSO:', e);
                return res.status(401).json({ error: 'Invalid SSO format' });
            }
        }

        // Upsert user in database
        const result = await pool.query(`
            INSERT INTO users (discourse_user_id, username, email)
            VALUES ($1, $2, $3)
            ON CONFLICT (discourse_user_id)
            DO UPDATE SET username = $2, email = $3, updated_at = CURRENT_TIMESTAMP
            RETURNING id, discourse_user_id, username, email
        `, [userData.discourse_user_id, userData.username, userData.email]);

        req.user = result.rows[0];
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

// ============================================
// Calculator Settings Endpoints
// ============================================
app.get('/api/calculator', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM calculator_settings WHERE user_id = $1',
            [req.user.id]
        );
        res.json(result.rows[0] || {
            syringe_size: '1.0',
            peptide_amount: 5,
            water_amount: 2,
            desired_dose: 250,
            dose_unit: 'mcg'
        });
    } catch (err) {
        console.error('Error fetching calculator settings:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/calculator', authMiddleware, async (req, res) => {
    const { syringe_size, peptide_amount, water_amount, desired_dose, dose_unit } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO calculator_settings (user_id, syringe_size, peptide_amount, water_amount, desired_dose, dose_unit)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET
                syringe_size = $2,
                peptide_amount = $3,
                water_amount = $4,
                desired_dose = $5,
                dose_unit = $6,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [req.user.id, syringe_size, peptide_amount, water_amount, desired_dose, dose_unit]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error saving calculator settings:', err);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// ============================================
// Doses/Calendar Endpoints
// ============================================
app.get('/api/doses', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM doses WHERE user_id = $1 ORDER BY date ASC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching doses:', err);
        res.status(500).json({ error: 'Failed to fetch doses' });
    }
});

app.post('/api/doses', authMiddleware, async (req, res) => {
    const { peptide, dose, notes, date, group_id } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO doses (user_id, peptide, dose, notes, date, group_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [req.user.id, peptide, dose, notes, date, group_id]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating dose:', err);
        res.status(500).json({ error: 'Failed to create dose' });
    }
});

app.post('/api/doses/batch', authMiddleware, async (req, res) => {
    const { doses } = req.body; // Array of doses for recurring

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const d of doses) {
                const result = await client.query(`
                    INSERT INTO doses (user_id, peptide, dose, notes, date, group_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [req.user.id, d.peptide, d.dose, d.notes, d.date, d.group_id]);
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            res.json(results);
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error creating batch doses:', err);
        res.status(500).json({ error: 'Failed to create doses' });
    }
});

app.patch('/api/doses/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { completed, notes } = req.body;

    try {
        const result = await pool.query(`
            UPDATE doses
            SET completed = COALESCE($1, completed),
                notes = COALESCE($2, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3 AND user_id = $4
            RETURNING *
        `, [completed, notes, id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating dose:', err);
        res.status(500).json({ error: 'Failed to update dose' });
    }
});

app.delete('/api/doses/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM doses WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dose not found' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting dose:', err);
        res.status(500).json({ error: 'Failed to delete dose' });
    }
});

// ============================================
// Health Check
// ============================================
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Pepplanner API running on port ${PORT}`);
});
