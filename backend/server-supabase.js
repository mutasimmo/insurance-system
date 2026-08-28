// backend/server-supabase.js
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// =============================================
// ✅ اتصال Supabase
// =============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// ✅ CORS المحسن للنشر
// =============================================
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://insurance-system-rho.vercel.app',
        'https://insurance-system-f2onumb13-mutasimmos-projects.vercel.app',
        'https://insurance-frontend.vercel.app'
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (process.env.NODE_ENV === 'production') {
            if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('onrender.com')) {
                callback(null, true);
            } else {
                console.log('❌ CORS blocked:', origin);
                callback(new Error('❌ غير مسموح بهذا النطاق'));
            }
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// 📊 مسار الصحة لـ Render
// =============================================
app.get('/health', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        res.status(200).json({
            status: 'ok',
            message: '🚀 نظام التأمين الطبي - الخادم يعمل بنجاح',
            database: 'Supabase',
            connected: true,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(200).json({
            status: 'ok',
            message: '🚀 نظام التأمين الطبي - الخادم يعمل بنجاح',
            database: 'Supabase',
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// =============================================
// 🏠 الصفحة الرئيسية
// =============================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 نظام التأمين الطبي - API (Supabase)',
        version: '1.0.0',
        status: '✅ يعمل بنجاح',
        database: 'Supabase',
        endpoints: {
            auth: {
                login: 'POST /api/auth/login',
                register: 'POST /api/auth/register',
                verify: 'GET /api/auth/verify'
            },
            sponsors: {
                list: 'GET /api/sponsors',
                get: 'GET /api/sponsors/:id',
                create: 'POST /api/sponsors',
                update: 'PUT /api/sponsors/:id',
                delete: 'DELETE /api/sponsors/:id'
            },
            dependents: {
                create: 'POST /api/dependents',
                update: 'PUT /api/dependents/:id',
                delete: 'DELETE /api/dependents/:id'
            },
            dashboard: 'GET /api/dashboard',
            health: 'GET /health'
        },
        timestamp: new Date().toISOString()
    });
});

// =============================================
// 📋 إنشاء الجداول (إذا لم تكن موجودة)
// =============================================
async function createTables() {
    const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;

    const createSponsorsSQL = `
        CREATE TABLE IF NOT EXISTS sponsors (
            id BIGSERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            date_of_birth DATE NOT NULL,
            subscription_start DATE NOT NULL,
            subscription_end DATE NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;

    const createDependentsSQL = `
        CREATE TABLE IF NOT EXISTS dependents (
            id BIGSERIAL PRIMARY KEY,
            sponsor_id BIGINT NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
            full_name TEXT NOT NULL,
            date_of_birth DATE NOT NULL,
            relationship TEXT NOT NULL CHECK (relationship IN ('أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة')),
            is_active BOOLEAN DEFAULT TRUE,
            joined_date DATE DEFAULT CURRENT_DATE
        );
    `;

    try {
        await supabase.rpc('exec_sql', { query: createUsersSQL });
        await supabase.rpc('exec_sql', { query: createSponsorsSQL });
        await supabase.rpc('exec_sql', { query: createDependentsSQL });
        console.log('✅ تم إنشاء الجداول بنجاح');
        await createDefaultAdmin();
    } catch (error) {
        console.error('❌ خطأ في إنشاء الجداول:', error.message);
        console.log('⚠️ تأكد من إنشاء الجداول يدوياً في Supabase');
    }
}

// =============================================
// 👤 إنشاء مستخدم مدير افتراضي
// =============================================
async function createDefaultAdmin() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', 'admin')
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            const hashedPassword = bcrypt.hashSync('Asmo@2026', 10);
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    username: 'admin',
                    password: hashedPassword,
                    full_name: 'المدير',
                    is_admin: true
                }]);

            if (insertError) throw insertError;

            console.log('✅ ========================================');
            console.log('✅ تم إنشاء مستخدم المدير الافتراضي');
            console.log('📝 اسم المستخدم: admin');
            console.log('📝 كلمة المرور: Asmo@2026');
            console.log('✅ ========================================');
        }
    } catch (error) {
        console.error('❌ خطأ في إنشاء المستخدم الافتراضي:', error.message);
    }
}

// =============================================
// 🛠️ دوال مساعدة
// =============================================
function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age < 0 ? 0 : age;
}

function calculateEndDate(startDate) {
    const date = new Date(startDate);
    date.setFullYear(date.getFullYear() + 1);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

function getFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(' ');
    return parts[0] || fullName;
}

// =============================================
// 🔐 Middleware: التحقق من التوكن
// =============================================
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'غير مصرح: يجب تسجيل الدخول'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.username = decoded.username;
        req.isAdmin = decoded.isAdmin || false;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'جلسة غير صالحة، الرجاء تسجيل الدخول مجدداً'
        });
    }
};

// =============================================
// 📌 API: تسجيل الدخول
// =============================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
        });
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error) throw error;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            });
        }

        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'اسم المستخدم أو كلمة المرور غير صحيحة'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                isAdmin: user.is_admin
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: '✅ تم تسجيل الدخول بنجاح',
            token,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: تسجيل حساب جديد
// =============================================
app.post('/api/auth/register', async (req, res) => {
    const { username, password, full_name, email } = req.body;

    if (!username || !password || !full_name) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء ملء جميع الحقول المطلوبة'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        });
    }

    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم موجود مسبقاً'
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword,
                full_name,
                email: email || null
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: '✅ تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن'
        });
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: التحقق من صلاحية التوكن
// =============================================
app.get('/api/auth/verify', authenticate, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, full_name, is_admin')
            .eq('id', req.userId)
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'جلسة غير صالحة'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                isAdmin: user.is_admin
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: جلب جميع الكافلين
// =============================================
app.get('/api/sponsors', authenticate, async (req, res) => {
    try {
        // 1. جلب الكافلين بدون dependents_count
        const { data: sponsors, error } = await supabase
            .from('sponsors')
            .select(`
                id,
                full_name,
                date_of_birth,
                subscription_start,
                subscription_end,
                is_active
            `)
            .eq('user_id', req.userId)
            .eq('is_active', true)
            .order('id', { ascending: false });

        if (error) throw error;

        // 2. جلب عدد المكفولين لكل كافل بشكل منفصل
        const sponsorsWithCount = await Promise.all((sponsors || []).map(async (sponsor) => {
            const { count, error: countError } = await supabase
                .from('dependents')
                .select('id', { count: 'exact', head: true })
                .eq('sponsor_id', sponsor.id)
                .eq('is_active', true);

            return {
                ...sponsor,
                dependents_count: countError ? 0 : count || 0  // ✅ رقم وليس كائن
            };
        }));

        res.json({
            success: true,
            sponsors: sponsorsWithCount || [],
            total: sponsors ? sponsors.length : 0
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الكافلين:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: جلب كافل واحد مع مكفوليه
// =============================================
app.get('/api/sponsors/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const { data: sponsor, error } = await supabase
            .from('sponsors')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.userId)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !sponsor) {
            return res.status(404).json({
                success: false,
                message: 'الكافل غير موجود'
            });
        }

        const today = new Date();
        const endDate = new Date(sponsor.subscription_end);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        const { data: dependents, error: depError } = await supabase
            .from('dependents')
            .select('*')
            .eq('sponsor_id', id)
            .eq('is_active', true);

        if (depError) throw depError;

        const dependentsWithAge = (dependents || []).map(d => ({
            ...d,
            age: calculateAge(d.date_of_birth)
        }));

        res.json({
            success: true,
            sponsor: {
                ...sponsor,
                days_remaining: daysRemaining > 0 ? daysRemaining : 0
            },
            dependents: dependentsWithAge,
            statistics: {
                total: dependentsWithAge.length,
                children: dependentsWithAge.filter(d => d.age < 18).length,
                adults: dependentsWithAge.filter(d => d.age >= 18 && d.age <= 60).length,
                seniors: dependentsWithAge.filter(d => d.age > 60).length
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب تفاصيل الكافل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: إضافة كافل جديد
// =============================================
app.post('/api/sponsors', authenticate, async (req, res) => {
    const { full_name, date_of_birth, subscription_start } = req.body;

    if (!full_name || !date_of_birth || !subscription_start) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء ملء جميع الحقول المطلوبة'
        });
    }

    const subscription_end = calculateEndDate(subscription_start);

    try {
        const { data, error } = await supabase
            .from('sponsors')
            .insert([{
                user_id: req.userId,
                full_name,
                date_of_birth,
                subscription_start,
                subscription_end
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: '✅ تم إضافة الكافل بنجاح',
            data: data[0]
        });
    } catch (error) {
        console.error('❌ خطأ في إضافة الكافل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: تحديث كافل
// =============================================
app.put('/api/sponsors/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { full_name, date_of_birth, subscription_start, is_active } = req.body;

    try {
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
        if (is_active !== undefined) updates.is_active = is_active;
        
        if (subscription_start !== undefined) {
            updates.subscription_start = subscription_start;
            updates.subscription_end = calculateEndDate(subscription_start);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        const { data, error } = await supabase
            .from('sponsors')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.userId)
            .select();

        if (error || !data || data.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الكافل غير موجود'
            });
        }

        res.json({
            success: true,
            message: '✅ تم تحديث بيانات الكافل بنجاح',
            data: data[0]
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الكافل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: حذف كافل
// =============================================
app.delete('/api/sponsors/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('sponsors')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', req.userId)
            .eq('is_active', true);

        if (error) throw error;

        res.json({
            success: true,
            message: '✅ تم حذف الكافل وجميع المكفولين التابعين له بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في حذف الكافل:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: إضافة مكفول
// =============================================
app.post('/api/dependents', authenticate, async (req, res) => {
    const { sponsor_id, full_name, date_of_birth, relationship } = req.body;

    const allowedRelationships = ['أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة'];
    if (!allowedRelationships.includes(relationship)) {
        return res.status(400).json({
            success: false,
            message: 'العلاقة غير مسموحة'
        });
    }

    try {
        const { data: sponsor, error: sponsorError } = await supabase
            .from('sponsors')
            .select('id, full_name')
            .eq('id', sponsor_id)
            .eq('user_id', req.userId)
            .eq('is_active', true)
            .maybeSingle();

        if (sponsorError || !sponsor) {
            return res.status(404).json({
                success: false,
                message: 'الكافل غير موجود'
            });
        }

        let finalName = full_name;
        const isChild = ['ابن', 'ابنة'].includes(relationship);
        
        if (isChild && full_name) {
            const fatherFirstName = getFirstName(sponsor.full_name);
            if (!full_name.includes(fatherFirstName) && !full_name.includes(sponsor.full_name)) {
                finalName = `${full_name} ${fatherFirstName}`;
            }
        }

        const { data, error } = await supabase
            .from('dependents')
            .insert([{
                sponsor_id,
                full_name: finalName,
                date_of_birth,
                relationship
            }])
            .select();

        if (error) throw error;

        let responseMessage = '✅ تم إضافة المكفول بنجاح';
        if (isChild) {
            responseMessage = `✅ تم إضافة ${relationship} "${full_name}" تلقائياً باسم "${finalName}"`;
        }

        res.status(201).json({
            success: true,
            message: responseMessage,
            id: data[0].id,
            data: data[0],
            completed_name: isChild ? finalName : null
        });
    } catch (error) {
        console.error('❌ خطأ في إضافة المكفول:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: تحديث مكفول
// =============================================
app.put('/api/dependents/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { full_name, date_of_birth, relationship, is_active } = req.body;

    const allowedRelationships = ['أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة'];
    if (relationship && !allowedRelationships.includes(relationship)) {
        return res.status(400).json({
            success: false,
            message: 'العلاقة غير مسموحة'
        });
    }

    try {
        const { data: dependent, error: checkError } = await supabase
            .from('dependents')
            .select('id')
            .eq('id', id)
            .eq('sponsors.user_id', req.userId)
            .maybeSingle();

        if (checkError || !dependent) {
            return res.status(404).json({
                success: false,
                message: 'المكفول غير موجود'
            });
        }

        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth;
        if (relationship !== undefined) updates.relationship = relationship;
        if (is_active !== undefined) updates.is_active = is_active;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        const { error } = await supabase
            .from('dependents')
            .update(updates)
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: '✅ تم تحديث المكفول بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المكفول:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: حذف مكفول
// =============================================
app.delete('/api/dependents/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('dependents')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true,
            message: '✅ تم حذف المكفول بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في حذف المكفول:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 📌 API: لوحة التحكم
// =============================================
app.get('/api/dashboard', authenticate, async (req, res) => {
    try {
        const stats = {
            total_sponsors: 0,
            total_dependents: 0,
            children: 0,
            adults: 0,
            seniors: 0,
            expiring_soon: 0
        };

        const { count: sponsorsCount, error: sError } = await supabase
            .from('sponsors')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', req.userId)
            .eq('is_active', true);

        if (!sError) stats.total_sponsors = sponsorsCount || 0;

        const { count: dependentsCount, error: dError } = await supabase
            .from('dependents')
            .select('id', { count: 'exact', head: true })
            .eq('sponsors.user_id', req.userId)
            .eq('is_active', true);

        if (!dError) stats.total_dependents = dependentsCount || 0;

        const { data: dependentsData, error: ageError } = await supabase
            .from('dependents')
            .select('date_of_birth')
            .eq('sponsors.user_id', req.userId)
            .eq('is_active', true);

        if (!ageError && dependentsData) {
            dependentsData.forEach(row => {
                const age = calculateAge(row.date_of_birth);
                if (age < 18) stats.children++;
                else if (age >= 18 && age <= 60) stats.adults++;
                else if (age > 60) stats.seniors++;
            });
        }

        const today = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);

        const { data: expiringData, error: expError } = await supabase
            .from('sponsors')
            .select('subscription_end')
            .eq('user_id', req.userId)
            .eq('is_active', true)
            .gte('subscription_end', today.toISOString().split('T')[0])
            .lte('subscription_end', thirtyDaysLater.toISOString().split('T')[0]);

        if (!expError) stats.expiring_soon = expiringData ? expiringData.length : 0;

        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ خطأ في لوحة التحكم:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// 🚀 تشغيل الخادم
// =============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('\n🚀 =========================================');
    console.log(`🚀  نظام التأمين الطبي - الخادم يعمل (Supabase)`);
    console.log(`🚀  المنفذ: ${PORT}`);
    console.log(`🚀  البيئة: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀  الرابط: http://localhost:${PORT}`);
    console.log(`🚀  حالة الصحة: http://localhost:${PORT}/health`);
    console.log('🚀 =========================================\n');
    console.log('📋 API Endpoints:');
    console.log('   POST   /api/auth/login                 - تسجيل الدخول');
    console.log('   POST   /api/auth/register              - تسجيل حساب جديد');
    console.log('   GET    /api/auth/verify                - التحقق من التوكن');
    console.log('   GET    /api/sponsors                   - جلب الكافلين');
    console.log('   POST   /api/sponsors                   - إضافة كافل');
    console.log('   PUT    /api/sponsors/:id               - تحديث كافل');
    console.log('   DELETE /api/sponsors/:id               - حذف كافل');
    console.log('   POST   /api/dependents                 - إضافة مكفول');
    console.log('   PUT    /api/dependents/:id             - تحديث مكفول');
    console.log('   DELETE /api/dependents/:id             - حذف مكفول');
    console.log('   GET    /api/dashboard                  - لوحة التحكم');
    console.log('   GET    /health                         - حالة الخادم\n');
    console.log('👤 المستخدم الافتراضي:');
    console.log('   📝 اسم المستخدم: admin');
    console.log('   📝 كلمة المرور: Asmo@2026\n');
});

module.exports = app;