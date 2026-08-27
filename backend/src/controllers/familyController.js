const { query } = require('../config/database');

// جلب عائلة كاملة
const getFamily = async (policyNumber) => {
    try {
        // جلب الكافل
        const sponsors = await query(
            `SELECT * FROM sponsors WHERE policy_number = ?`,
            [policyNumber]
        );

        if (sponsors.length === 0) {
            throw new Error('رقم البوليصة غير موجود');
        }

        const sponsor = sponsors[0];

        // جلب المكفولين
        const dependents = await query(
            `SELECT 
                *, 
                calculate_age(date_of_birth) as age 
             FROM dependents 
             WHERE sponsor_id = ? AND is_active = TRUE`,
            [sponsor.id]
        );

        // حساب الأيام المتبقية
        const days = await query(
            'SELECT days_remaining(?) as days_remaining',
            [sponsor.subscription_end]
        );

        return {
            sponsor: {
                ...sponsor,
                days_remaining: days[0]?.days_remaining || 0
            },
            dependents,
            statistics: {
                total: dependents.length,
                children: dependents.filter(d => d.age < 18).length,
                adults: dependents.filter(d => d.age >= 18 && d.age <= 60).length,
                seniors: dependents.filter(d => d.age > 60).length
            }
        };
    } catch (error) {
        throw error;
    }
};

// إضافة مكفول
const addDependent = async (data) => {
    try {
        const { sponsor_id, full_name, national_id, date_of_birth, relationship, phone } = data;

        // التحقق من وجود الكافل
        const sponsor = await query(
            'SELECT id FROM sponsors WHERE id = ? AND is_active = TRUE',
            [sponsor_id]
        );

        if (sponsor.length === 0) {
            throw new Error('الكافل غير موجود أو غير نشط');
        }

        // التحقق من عدم تكرار الرقم الوطني
        const existing = await query(
            'SELECT id FROM dependents WHERE national_id = ?',
            [national_id]
        );

        if (existing.length > 0) {
            throw new Error('الرقم الوطني موجود مسبقاً');
        }

        // إضافة المكفول
        const result = await query(
            `INSERT INTO dependents 
            (sponsor_id, full_name, national_id, date_of_birth, relationship, phone) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [sponsor_id, full_name, national_id, date_of_birth, relationship, phone || null]
        );

        return {
            id: result.insertId,
            full_name,
            national_id,
            date_of_birth,
            relationship,
            phone: phone || null
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getFamily,
    addDependent
};