const express = require('express');
const router = express.Router();

// Billing status endpoint - 100% Free App
router.get('/', (req, res) => {
  res.json({
    status: 'free',
    unlimited: true,
    message: 'Glitch Broadcast Web App is 100% free with unlimited feature access.'
  });
});

router.post('/initialize', (req, res) => {
  res.json({
    status: 'success',
    message: 'Payment is not required. All features are 100% free and unlocked.'
  });
});

router.post('/webhook', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
