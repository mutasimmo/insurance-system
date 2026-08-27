const express = require('express');
const router = express.Router();
const { getFamily, addDependent } = require('../controllers/familyController');

// جلب عائلة برقم البوليصة
router.get('/family/:policyNumber', async (req, res) => {
    try {
        const data = await getFamily(req.params.policyNumber);
        res.json({ success: true, ...data });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

// إضافة مكفول جديد
router.post('/dependents', async (req, res) => {
    try {
        const data = await addDependent(req.body);
        res.status(201).json({ 
            success: true, 
            message: '✅ تم إضافة المكفول بنجاح',
            data 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;