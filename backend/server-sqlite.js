const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

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
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: '🚀 نظام التأمين الطبي - الخادم يعمل بنجاح',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// =============================================
// 🏠 الصفحة الرئيسية
// =============================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 نظام التأمين الطبي - API',
        version: '1.0.0',
        status: '✅ يعمل بنجاح',
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
// 🗄️ اتصال SQLite
// =============================================
const dbPath = path.join(__dirname, 'insurance.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    } else {
        console.log('✅ تم الاتصال بقاعدة البيانات SQLite بنجاح');
        createTables();
    }
});

// =============================================
// 📋 إنشاء الجداول
// =============================================
function createTables() {
    db.run('PRAGMA foreign_keys = ON;');

    // جدول المستخدمين
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            email TEXT,
            is_admin INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `, (err) => {
        if (err) {
            console.error('❌ خطأ في إنشاء جدول users:', err.message);
        } else {
            console.log('✅ جدول users جاهز');
        }
    });

    // جدول الكافلين
    db.run(`
        CREATE TABLE IF NOT EXISTS sponsors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            subscription_start TEXT NOT NULL,
            subscription_end TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('❌ خطأ في إنشاء جدول sponsors:', err.message);
        } else {
            console.log('✅ جدول sponsors جاهز');
        }
    });

    // جدول المكفولين
    db.run(`
        CREATE TABLE IF NOT EXISTS dependents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sponsor_id INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            date_of_birth TEXT NOT NULL,
            relationship TEXT NOT NULL CHECK(relationship IN ('أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة')),
            is_active INTEGER DEFAULT 1,
            joined_date TEXT DEFAULT (date('now')),
            FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (!err) {
            console.log('✅ تم إنشاء جميع الجداول بنجاح');
            createDefaultAdmin();
        } else {
            console.error('❌ خطأ في إنشاء جدول dependents:', err.message);
        }
    });
}

// =============================================
// 👤 إنشاء مستخدم مدير افتراضي
// =============================================
async function createDefaultAdmin() {
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (err) {
            console.error('❌ خطأ في التحقق من المستخدمين:', err.message);
            return;
        }
        if (row.count === 0) {
            // 🔐 كلمة المرور الجديدة
            const hashedPassword = bcrypt.hashSync('Asmo@2026', 10);
            db.run(`
                INSERT INTO users (username, password, full_name, is_admin)
                VALUES (?, ?, ?, ?)
            `, ['admin', hashedPassword, 'المدير', 1], (err) => {
                if (!err) {
                    console.log('✅ ========================================');
                    console.log('✅ تم إنشاء مستخدم المدير الافتراضي');
                    console.log('📝 اسم المستخدم: admin');
                    console.log('📝 كلمة المرور: Asmo@2026');
                    console.log('✅ ========================================');
                }
            });
        }
    });
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
const authenticate = (req, res, next) => {
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
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء إدخال اسم المستخدم وكلمة المرور'
        });
    }

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, user) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
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
        }
    );
});

// =============================================
// 📌 API: تسجيل حساب جديد
// =============================================
app.post('/api/auth/register', (req, res) => {
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

    db.get(
        'SELECT id FROM users WHERE username = ?',
        [username],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }
            if (row) {
                return res.status(400).json({
                    success: false,
                    message: 'اسم المستخدم موجود مسبقاً'
                });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);

            db.run(`
                INSERT INTO users (username, password, full_name, email)
                VALUES (?, ?, ?, ?)
            `, [username, hashedPassword, full_name, email || null],
            function(err) {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }

                res.status(201).json({
                    success: true,
                    message: '✅ تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن'
                });
            });
        }
    );
});

// =============================================
// 📌 API: التحقق من صلاحية التوكن
// =============================================
app.get('/api/auth/verify', authenticate, (req, res) => {
    db.get(
        'SELECT id, username, full_name, is_admin FROM users WHERE id = ?',
        [req.userId],
        (err, user) => {
            if (err || !user) {
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
        }
    );
});

// =============================================
// 📌 API: جلب جميع الكافلين
// =============================================
app.get('/api/sponsors', authenticate, (req, res) => {
    db.all(
        `SELECT 
            id, 
            full_name, 
            date_of_birth,
            subscription_start,
            subscription_end,
            is_active,
            (SELECT COUNT(*) FROM dependents WHERE sponsor_id = sponsors.id AND is_active = 1) as dependents_count
         FROM sponsors 
         WHERE user_id = ? AND is_active = 1
         ORDER BY id DESC`,
        [req.userId],
        (err, sponsors) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: err.message 
                });
            }
            res.json({
                success: true,
                sponsors: sponsors || [],
                total: sponsors ? sponsors.length : 0
            });
        }
    );
});

// =============================================
// 📌 API: جلب كافل واحد مع مكفوليه
// =============================================
app.get('/api/sponsors/:id', authenticate, (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT * FROM sponsors WHERE id = ? AND user_id = ? AND is_active = 1`,
        [id, req.userId],
        (err, sponsor) => {
            if (err || !sponsor) {
                return res.status(404).json({
                    success: false,
                    message: 'الكافل غير موجود'
                });
            }

            const today = new Date();
            const endDate = new Date(sponsor.subscription_end);
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

            db.all(
                `SELECT * FROM dependents WHERE sponsor_id = ? AND is_active = 1`,
                [sponsor.id],
                (err, dependents) => {
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
                }
            );
        }
    );
});

// =============================================
// 📌 API: إضافة كافل جديد
// =============================================
app.post('/api/sponsors', authenticate, (req, res) => {
    const { full_name, date_of_birth, subscription_start } = req.body;

    if (!full_name || !date_of_birth || !subscription_start) {
        return res.status(400).json({
            success: false,
            message: 'الرجاء ملء جميع الحقول المطلوبة'
        });
    }

    const subscription_end = calculateEndDate(subscription_start);

    db.run(`
        INSERT INTO sponsors (user_id, full_name, date_of_birth, subscription_start, subscription_end)
        VALUES (?, ?, ?, ?, ?)
    `, [req.userId, full_name, date_of_birth, subscription_start, subscription_end],
    function(err) {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        const newId = this.lastID;
        
        db.get(
            'SELECT * FROM sponsors WHERE id = ?',
            [newId],
            (err, sponsor) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }
                res.status(201).json({
                    success: true,
                    message: '✅ تم إضافة الكافل بنجاح',
                    data: sponsor
                });
            }
        );
    });
});

// =============================================
// 📌 API: تحديث كافل
// =============================================
app.put('/api/sponsors/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { full_name, date_of_birth, subscription_start, is_active } = req.body;

    db.get(
        'SELECT id FROM sponsors WHERE id = ? AND user_id = ?',
        [id, req.userId],
        (err, sponsor) => {
            if (err || !sponsor) {
                return res.status(404).json({
                    success: false,
                    message: 'الكافل غير موجود'
                });
            }

            let updates = [];
            let values = [];

            if (full_name !== undefined) {
                updates.push('full_name = ?');
                values.push(full_name);
            }
            if (date_of_birth !== undefined) {
                updates.push('date_of_birth = ?');
                values.push(date_of_birth);
            }
            if (subscription_start !== undefined) {
                updates.push('subscription_start = ?');
                values.push(subscription_start);
                const endDate = calculateEndDate(subscription_start);
                updates.push('subscription_end = ?');
                values.push(endDate);
            }
            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'لا توجد بيانات للتحديث'
                });
            }

            values.push(id);
            const query = `UPDATE sponsors SET ${updates.join(', ')} WHERE id = ?`;

            db.run(query, values, function(err) {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                
                db.get(
                    'SELECT * FROM sponsors WHERE id = ?',
                    [id],
                    (err, sponsor) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }
                        res.json({
                            success: true,
                            message: '✅ تم تحديث بيانات الكافل بنجاح',
                            data: sponsor
                        });
                    }
                );
            });
        }
    );
});

// =============================================
// 📌 API: حذف كافل
// =============================================
app.delete('/api/sponsors/:id', authenticate, (req, res) => {
    const { id } = req.params;

    db.get(
        'SELECT id FROM sponsors WHERE id = ? AND user_id = ? AND is_active = 1',
        [id, req.userId],
        (err, sponsor) => {
            if (err || !sponsor) {
                return res.status(404).json({
                    success: false,
                    message: 'الكافل غير موجود'
                });
            }

            db.run(
                `UPDATE sponsors SET is_active = 0 WHERE id = ?`,
                [id],
                function(err) {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            message: err.message
                        });
                    }
                    res.json({
                        success: true,
                        message: '✅ تم حذف الكافل وجميع المكفولين التابعين له بنجاح'
                    });
                }
            );
        }
    );
});

// =============================================
// 📌 API: إضافة مكفول
// =============================================
app.post('/api/dependents', authenticate, (req, res) => {
    const { sponsor_id, full_name, date_of_birth, relationship } = req.body;

    const allowedRelationships = ['أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة'];
    if (!allowedRelationships.includes(relationship)) {
        return res.status(400).json({
            success: false,
            message: 'العلاقة غير مسموحة'
        });
    }

    db.get(
        'SELECT id, full_name as sponsor_name FROM sponsors WHERE id = ? AND user_id = ? AND is_active = 1',
        [sponsor_id, req.userId],
        (err, sponsor) => {
            if (err || !sponsor) {
                return res.status(404).json({
                    success: false,
                    message: 'الكافل غير موجود'
                });
            }

            let finalName = full_name;
            const isChild = ['ابن', 'ابنة'].includes(relationship);
            
            if (isChild && full_name) {
                const fatherFirstName = getFirstName(sponsor.sponsor_name);
                if (!full_name.includes(fatherFirstName) && !full_name.includes(sponsor.sponsor_name)) {
                    finalName = `${full_name} ${fatherFirstName}`;
                }
            }

            db.run(
                `INSERT INTO dependents (sponsor_id, full_name, date_of_birth, relationship)
                 VALUES (?, ?, ?, ?)`,
                [sponsor_id, finalName, date_of_birth, relationship],
                function(err) {
                    if (err) {
                        return res.status(400).json({ 
                            success: false, 
                            message: err.message 
                        });
                    }
                    
                    db.get(
                        'SELECT * FROM dependents WHERE id = ?',
                        [this.lastID],
                        (err, dependent) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }
                            
                            let responseMessage = '✅ تم إضافة المكفول بنجاح';
                            if (isChild) {
                                responseMessage = `✅ تم إضافة ${relationship} "${full_name}" تلقائياً باسم "${finalName}"`;
                            }
                            
                            res.status(201).json({
                                success: true,
                                message: responseMessage,
                                id: this.lastID,
                                data: dependent,
                                completed_name: isChild ? finalName : null
                            });
                        }
                    );
                }
            );
        }
    );
});

// =============================================
// 📌 API: تحديث مكفول
// =============================================
app.put('/api/dependents/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const { full_name, date_of_birth, relationship, is_active } = req.body;

    db.get(
        `SELECT d.id FROM dependents d
         JOIN sponsors s ON d.sponsor_id = s.id
         WHERE d.id = ? AND s.user_id = ?`,
        [id, req.userId],
        (err, dependent) => {
            if (err || !dependent) {
                return res.status(404).json({
                    success: false,
                    message: 'المكفول غير موجود'
                });
            }

            const allowedRelationships = ['أم', 'أب', 'زوجة', 'زوج', 'ابن', 'ابنة'];
            if (relationship && !allowedRelationships.includes(relationship)) {
                return res.status(400).json({
                    success: false,
                    message: 'العلاقة غير مسموحة'
                });
            }

            let updates = [];
            let values = [];

            if (full_name !== undefined) {
                updates.push('full_name = ?');
                values.push(full_name);
            }
            if (date_of_birth !== undefined) {
                updates.push('date_of_birth = ?');
                values.push(date_of_birth);
            }
            if (relationship !== undefined) {
                updates.push('relationship = ?');
                values.push(relationship);
            }
            if (is_active !== undefined) {
                updates.push('is_active = ?');
                values.push(is_active);
            }

            if (updates.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'لا توجد بيانات للتحديث'
                });
            }

            values.push(id);
            const query = `UPDATE dependents SET ${updates.join(', ')} WHERE id = ?`;

            db.run(query, values, function(err) {
                if (err) {
                    return res.status(400).json({
                        success: false,
                        message: err.message
                    });
                }
                res.json({
                    success: true,
                    message: '✅ تم تحديث المكفول بنجاح'
                });
            });
        }
    );
});

// =============================================
// 📌 API: حذف مكفول
// =============================================
app.delete('/api/dependents/:id', authenticate, (req, res) => {
    const { id } = req.params;

    db.get(
        `SELECT d.id FROM dependents d
         JOIN sponsors s ON d.sponsor_id = s.id
         WHERE d.id = ? AND s.user_id = ?`,
        [id, req.userId],
        (err, dependent) => {
            if (err || !dependent) {
                return res.status(404).json({
                    success: false,
                    message: 'المكفول غير موجود'
                });
            }

            db.run(
                `UPDATE dependents SET is_active = 0 WHERE id = ?`,
                [id],
                function(err) {
                    if (err) {
                        return res.status(400).json({
                            success: false,
                            message: err.message
                        });
                    }
                    res.json({
                        success: true,
                        message: '✅ تم حذف المكفول بنجاح'
                    });
                }
            );
        }
    );
});

// =============================================
// 📌 API: لوحة التحكم
// =============================================
app.get('/api/dashboard', authenticate, (req, res) => {
    const stats = {
        total_sponsors: 0,
        total_dependents: 0,
        children: 0,
        adults: 0,
        seniors: 0,
        expiring_soon: 0
    };

    db.get(
        "SELECT COUNT(*) as count FROM sponsors WHERE user_id = ? AND is_active = 1",
        [req.userId],
        (err, row) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: err.message,
                    stats: stats
                });
            }
            stats.total_sponsors = row ? row.count : 0;
            
            db.get(
                "SELECT COUNT(*) as count FROM dependents d JOIN sponsors s ON d.sponsor_id = s.id WHERE s.user_id = ? AND d.is_active = 1",
                [req.userId],
                (err, row) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message,
                            stats: stats
                        });
                    }
                    stats.total_dependents = row ? row.count : 0;
                    
                    db.all(
                        `SELECT d.date_of_birth FROM dependents d 
                         JOIN sponsors s ON d.sponsor_id = s.id 
                         WHERE s.user_id = ? AND d.is_active = 1`,
                        [req.userId],
                        (err, rows) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: err.message,
                                    stats: stats
                                });
                            }
                            
                            if (rows && rows.length > 0) {
                                rows.forEach(row => {
                                    const age = calculateAge(row.date_of_birth);
                                    if (age < 18) stats.children++;
                                    else if (age >= 18 && age <= 60) stats.adults++;
                                    else if (age > 60) stats.seniors++;
                                });
                            }
                            
                            db.all(
                                `SELECT subscription_end FROM sponsors WHERE user_id = ? AND is_active = 1`,
                                [req.userId],
                                (err, rows) => {
                                    if (err) {
                                        return res.status(500).json({
                                            success: false,
                                            message: err.message,
                                            stats: stats
                                        });
                                    }
                                    
                                    const today = new Date();
                                    if (rows && rows.length > 0) {
                                        rows.forEach(row => {
                                            const endDate = new Date(row.subscription_end);
                                            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                                            if (daysRemaining >= 0 && daysRemaining <= 30) {
                                                stats.expiring_soon++;
                                            }
                                        });
                                    }
                                    
                                    res.json({
                                        success: true,
                                        stats: stats,
                                        timestamp: new Date().toISOString()
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

// =============================================
// 🚀 تشغيل الخادم
// =============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log('\n🚀 =========================================');
    console.log(`🚀  نظام التأمين الطبي - الخادم يعمل`);
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

// =============================================
// 🛑 إغلاق قاعدة البيانات عند إيقاف الخادم
// =============================================
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
        } else {
            console.log('🔒 تم إغلاق قاعدة البيانات بنجاح');
        }
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    db.close((err) => {
        if (err) {
            console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
        } else {
            console.log('🔒 تم إغلاق قاعدة البيانات بنجاح');
        }
        process.exit(0);
    });
});

module.exports = app;