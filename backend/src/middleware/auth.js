const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'غير مصرح: يجب تسجيل الدخول' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        req.userRole = decoded.role || 'user';
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'توكن غير صالح أو منتهي الصلاحية' 
        });
    }
};

// صلاحية المدير فقط
const adminOnly = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: 'غير مصرح: صلاحيات مدير مطلوبة' 
        });
    }
    next();
};

module.exports = {
    authenticate,
    adminOnly
};