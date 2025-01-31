const express = require('express');
const router = express.Router();
const { validateApplication } = require('../middlewares/validate.middleware');
const applicationService = require('../services/application.service');

// Create application
router.post('/', validateApplication, async (req, res, next) => {
  try {
    const application = await applicationService.createApplication(
      req.user.id,
      req.body.mentor_id,
      req.body.message
    );
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
});

// Update application status
router.patch('/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const application = await applicationService.updateApplicationStatus(
      req.params.id,
      req.user.id,
      status
    );
    res.json(application);
  } catch (error) {
    next(error);
  }
});

// Cancel application
router.delete('/:id', async (req, res, next) => {
  try {
    await applicationService.cancelApplication(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;