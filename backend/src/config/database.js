const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// إنشاء تجمع اتصالات
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'insurance_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// دالة لاختبار الاتصال
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
        return false;
    }
};

// دالة لتنفيذ استعلام
const query = async (sql, params) => {
    try {
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (error) {
        console.error('❌ خطأ في تنفيذ الاستعلام:', error);
        throw error;
    }
};

module.exports = {
    pool,
    testConnection,
    query
};