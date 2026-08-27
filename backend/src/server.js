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
app.use(cors()); // السماح بالاتصال من الواجهة الأمامية
app.use(express.json()); // معالجة JSON
app.use(express.urlencoded({ extended: true })); // معالجة البيانات المرسلة من النماذج

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

// اختبار الاتصال بقاعدة البيانات
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
// API: جلب عائلة كاملة برقم البوليصة
// =============================================
app.get('/api/family/:policyNumber', async (req, res) => {
    try {
        const { policyNumber } = req.params;

        // 1. جلب بيانات الكافل
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

        // 2. جلب بيانات المكفولين
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
             ORDER BY 
                FIELD(relationship, 'زوج', 'زوجة', 'والد', 'والدة', 'ابن', 'ابنة', 'أخ', 'أخت')`,
            [sponsor.id]
        );

        // 3. حساب الأيام المتبقية
        const [days] = await pool.execute(
            'SELECT days_remaining(?) as days_remaining',
            [sponsor.subscription_end]
        );

        // 4. إحصائيات
        const statistics = {
            total: dependents.length,
            children: dependents.filter(d => d.age < 18).length,
            adults: dependents.filter(d => d.age >= 18 && d.age <= 60).length,
            seniors: dependents.filter(d => d.age > 60).length
        };

        // 5. إرسال الرد
        res.json({
            success: true,
            sponsor: {
                ...sponsor,
                days_remaining: days[0].days_remaining || 0
            },
            dependents,
            statistics
        });

    } catch (error) {
        console.error('❌ خطأ في جلب العائلة:', error);
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

        // 1. التحقق من وجود الكافل
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

        // 2. التحقق من عدم تكرار الرقم الوطني
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

        // 3. إضافة المكفول
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
        console.error('❌ خطأ في إضافة المكفول:', error);
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
        console.error('❌ خطأ في جلب الكافلين:', error);
        res.status(500).json({ 
            success: false, 
            message: 'حدث خطأ في الخادم' 
        });
    }
});

// =============================================
// API: لوحة التحكم - إحصائيات عامة
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

        // المكفولين حسب الفئات العمرية
        const [ageGroups] = await pool.execute(
            `SELECT 
                SUM(CASE WHEN calculate_age(date_of_birth) < 18 THEN 1 ELSE 0 END) as children,
                SUM(CASE WHEN calculate_age(date_of_birth) BETWEEN 18 AND 60 THEN 1 ELSE 0 END) as adults,
                SUM(CASE WHEN calculate_age(date_of_birth) > 60 THEN 1 ELSE 0 END) as seniors
             FROM dependents 
             WHERE is_active = TRUE`
        );

        // المكفولين حسب العلاقة
        const [relationshipStats] = await pool.execute(
            `SELECT 
                relationship, 
                COUNT(*) as count 
             FROM dependents 
             WHERE is_active = TRUE 
             GROUP BY relationship 
             ORDER BY count DESC`
        );

        // البوالص المنتهية قريباً (أقل من 30 يوم)
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
            relationship_stats: relationshipStats,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ خطأ في جلب الإحصائيات:', error);
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
    console.log(`\n🚀 =========================================`);
    console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
    console.log(`🚀 =========================================\n`);
    console.log(`📋 API Endpoints المتاحة:`);
    console.log(`   GET  /api/family/:policyNumber  - جلب عائلة`);
    console.log(`   POST /api/dependents             - إضافة مكفول`);
    console.log(`   GET  /api/sponsors               - جلب جميع الكافلين`);
    console.log(`   GET  /api/dashboard              - لوحة التحكم\n`);
});