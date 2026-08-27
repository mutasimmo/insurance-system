const mysql = require('mysql2/promise');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',  // ← فارغة
            database: 'insurance_db'
        });
        
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        await connection.end();
        return true;
    } catch (error) {
        console.error('❌ فشل الاتصال:', error.message);
        return false;
    }
}

testConnection();