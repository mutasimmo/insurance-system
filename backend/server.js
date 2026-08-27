const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// تحميل متغيرات البيئة
dotenv.config();

const app = express();

// =============================================
// Middleware
// =============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// اتصال قاعدة البيانات
// =============================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insurance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// اختبار الاتصال
pool.getConnection()
    .then(conn => {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        conn.release();
    })
    .catch(err => {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
        console.log('⚠️ تأكد من تشغيل MySQL وضبط كلمة المرور في ملف .env');
    });

// =============================================
// API: جلب عائلة برقم البوليصة
// =============================================
app.get('/api/family/:policyNumber', async (req, res) => {
    try {
        const { policyNumber } = req.params;

        // جلب الكافل
        const [sponsors] = await pool.execute(
            `SELECT 
                id, 
                full_name, 
                national_id, 
                date_of_birth, 
                phone, 
                email, 
                policy_number, 
                subscription_start, 
                subscription_end, 
                is_active 
             FROM sponsors 
             WHERE policy_number = ?`,
            [policyNumber]
        );

        if (sponsors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'رقم البوليصة غير موجود'
            });
        }

        const sponsor = sponsors[0];

        // جلب المكفولين
        const [dependents] = await pool.execute(
            `SELECT 
                id, 
                full_name, 
                national_id, 
                date_of_birth, 
                relationship, 
                phone, 
                is_active, 
                joined_date,
                calculate_age(date_of_birth) as age
             FROM dependents 
             WHERE sponsor_id = ? AND is_active = TRUE
             ORDER BY relationship`,
            [sponsor.id]
        );

        // حساب الأيام المتبقية
        const [days] = await pool.execute(
            'SELECT days_remaining(?) as days_remaining',
            [sponsor.subscription_end]
        );

        // إحصائيات
        const statistics = {
            total: dependents.length,
            children: dependents.filter(d => d.age < 18).length,
            adults: dependents.filter(d => d.age >= 18 && d.age <= 60).length,
            seniors: dependents.filter(d => d.age > 60).length
        };

        res.json({
            success: true,
            sponsor: {
                ...sponsor,
                days_remaining: days[0]?.days_remaining || 0
            },
            dependents,
            statistics
        });

    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// =============================================
// API: إضافة مكفول جديد
// =============================================
app.post('/api/dependents', async (req, res) => {
    try {
        const {
            sponsor_id,
            full_name,
            national_id,
            date_of_birth,
            relationship,
            phone
        } = req.body;

        // التحقق من وجود الكافل
        const [sponsor] = await pool.execute(
            'SELECT id FROM sponsors WHERE id = ? AND is_active = TRUE',
            [sponsor_id]
        );

        if (sponsor.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الكافل غير موجود أو غير نشط'
            });
        }

        // التحقق من عدم تكرار الرقم الوطني
        const [existing] = await pool.execute(
            'SELECT id FROM dependents WHERE national_id = ?',
            [national_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'الرقم الوطني موجود مسبقاً'
            });
        }

        // إضافة المكفول
        const [result] = await pool.execute(
            `INSERT INTO dependents 
            (sponsor_id, full_name, national_id, date_of_birth, relationship, phone) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [sponsor_id, full_name, national_id, date_of_birth, relationship, phone || null]
        );

        res.status(201).json({
            success: true,
            message: '✅ تم إضافة المكفول بنجاح',
            id: result.insertId,
            data: {
                id: result.insertId,
                full_name,
                national_id,
                date_of_birth,
                relationship,
                phone: phone || null
            }
        });

    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم',
            error: error.message
        });
    }
});

// =============================================
// API: جلب جميع الكافلين
// =============================================
app.get('/api/sponsors', async (req, res) => {
    try {
        const [sponsors] = await pool.execute(
            `SELECT 
                id, 
                full_name, 
                national_id, 
                policy_number, 
                subscription_end,
                is_active,
                (SELECT COUNT(*) FROM dependents WHERE sponsor_id = sponsors.id AND is_active = TRUE) as dependents_count
             FROM sponsors 
             WHERE is_active = TRUE
             ORDER BY full_name`
        );

        res.json({
            success: true,
            sponsors,
            total: sponsors.length
        });

    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// API: لوحة التحكم
// =============================================
app.get('/api/dashboard', async (req, res) => {
    try {
        // إجمالي الكافلين
        const [totalSponsors] = await pool.execute(
            'SELECT COUNT(*) as count FROM sponsors WHERE is_active = TRUE'
        );

        // إجمالي المكفولين
        const [totalDependents] = await pool.execute(
            'SELECT COUNT(*) as count FROM dependents WHERE is_active = TRUE'
        );

        // الفئات العمرية
        const [ageGroups] = await pool.execute(
            `SELECT 
                SUM(CASE WHEN calculate_age(date_of_birth) < 18 THEN 1 ELSE 0 END) as children,
                SUM(CASE WHEN calculate_age(date_of_birth) BETWEEN 18 AND 60 THEN 1 ELSE 0 END) as adults,
                SUM(CASE WHEN calculate_age(date_of_birth) > 60 THEN 1 ELSE 0 END) as seniors
             FROM dependents 
             WHERE is_active = TRUE`
        );

        // البوالص المنتهية قريباً
        const [expiringSoon] = await pool.execute(
            `SELECT 
                COUNT(*) as count 
             FROM sponsors 
             WHERE is_active = TRUE 
             AND days_remaining(subscription_end) BETWEEN 0 AND 30`
        );

        res.json({
            success: true,
            stats: {
                total_sponsors: totalSponsors[0].count || 0,
                total_dependents: totalDependents[0].count || 0,
                children: ageGroups[0].children || 0,
                adults: ageGroups[0].adults || 0,
                seniors: ageGroups[0].seniors || 0,
                expiring_soon: expiringSoon[0].count || 0
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ خطأ:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في الخادم'
        });
    }
});

// =============================================
// تشغيل الخادم
// =============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('\n🚀 =========================================');
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
    console.log('🚀 =========================================\n');
    console.log('📋 API Endpoints المتاحة:');
    console.log('   GET  /api/family/:policyNumber  - جلب عائلة');
    console.log('   POST /api/dependents             - إضافة مكفول');
    console.log('   GET  /api/sponsors               - جلب جميع الكافلين');
    console.log('   GET  /api/dashboard              - لوحة التحكم\n');
});