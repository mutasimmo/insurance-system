-- =============================================
-- قاعدة بيانات التأمين الطبي
-- =============================================

CREATE DATABASE IF NOT EXISTS insurance_db;
USE insurance_db;

-- =============================================
-- 1. جدول الكافلين (Sponsors)
-- =============================================
CREATE TABLE IF NOT EXISTS sponsors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(150) NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    subscription_start DATE NOT NULL,
    subscription_end DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_policy (policy_number),
    INDEX idx_national (national_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. جدول المكفولين (Dependents)
-- =============================================
CREATE TABLE IF NOT EXISTS dependents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sponsor_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    relationship ENUM('والد', 'والدة', 'زوج', 'زوجة', 'ابن', 'ابنة', 'أخ', 'أخت') NOT NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    joined_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE CASCADE,
    INDEX idx_sponsor (sponsor_id),
    INDEX idx_national_dep (national_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. دوال مساعدة
-- =============================================
DELIMITER //

DROP FUNCTION IF EXISTS calculate_age //
CREATE FUNCTION calculate_age(birth_date DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN TIMESTAMPDIFF(YEAR, birth_date, CURDATE());
END //

DROP FUNCTION IF EXISTS days_remaining //
CREATE FUNCTION days_remaining(end_date DATE) 
RETURNS INT
DETERMINISTIC
BEGIN
    RETURN DATEDIFF(end_date, CURDATE());
END //

DELIMITER ;

-- =============================================
-- 4. إدخال بيانات عائلة معتصم
-- =============================================
INSERT IGNORE INTO sponsors (
    full_name, 
    national_id, 
    date_of_birth, 
    phone, 
    email, 
    policy_number, 
    subscription_start, 
    subscription_end
) VALUES (
    'معتصم محمد عثمان ابراهيم',
    '29801012345678',
    '1985-03-15',
    '+966501234567',
    'motasem@example.com',
    'POL-2026-001',
    '2026-01-01',
    '2026-12-31'
);

INSERT IGNORE INTO dependents (
    sponsor_id, 
    full_name, 
    national_id, 
    date_of_birth, 
    relationship, 
    phone
) VALUES 
(1, 'محمد عثمان ابراهيم', '29801012345679', '1958-04-10', 'والد', '+966501234568'),
(1, 'لميس معتصم محمد', '29801012345680', '2005-07-22', 'ابنة', NULL),
(1, 'ملاك محمد احمد', '29801012345681', '1990-12-15', 'زوجة', '+966501234569'),
(1, 'كلتوم محمد علي', '29801012345682', '1960-09-03', 'والدة', '+966501234570');

-- =============================================
-- 5. استعلامات اختبار
-- =============================================
-- عرض جميع أفراد العائلة
SELECT 
    s.full_name AS الكافل,
    s.policy_number AS رقم_البوليصة,
    d.full_name AS اسم_المكفول,
    d.relationship AS الصلة,
    d.date_of_birth AS تاريخ_الميلاد,
    calculate_age(d.date_of_birth) AS العمر,
    d.is_active AS نشط
FROM sponsors s
JOIN dependents d ON s.id = d.sponsor_id
WHERE s.policy_number = 'POL-2026-001';

-- إحصائيات العائلة
SELECT 
    s.full_name AS الكافل,
    COUNT(d.id) AS عدد_المكفولين,
    SUM(CASE WHEN calculate_age(d.date_of_birth) < 18 THEN 1 ELSE 0 END) AS أطفال,
    SUM(CASE WHEN calculate_age(d.date_of_birth) BETWEEN 18 AND 60 THEN 1 ELSE 0 END) AS بالغين,
    SUM(CASE WHEN calculate_age(d.date_of_birth) > 60 THEN 1 ELSE 0 END) AS كبار_سن
FROM sponsors s
LEFT JOIN dependents d ON s.id = d.sponsor_id
WHERE s.policy_number = 'POL-2026-001'
GROUP BY s.id;