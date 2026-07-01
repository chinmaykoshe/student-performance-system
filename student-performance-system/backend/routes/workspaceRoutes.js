const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const controller = require('../controllers/workspaceController');

const router = express.Router();

// Only admin can access workspace routes
router.use(protect);
router.use(authorize('admin'));

const setupRoutes = (path, handlers) => {
  router.route(path)
    .get(handlers.getAll)
    .post(handlers.create);
  
  router.route(`${path}/:id`)
    .put(handlers.update)
    .delete(handlers.delete);
};

setupRoutes('/projects', controller.projects);
setupRoutes('/tasks', controller.tasks);
setupRoutes('/messages', controller.messages);
setupRoutes('/events', controller.events);
setupRoutes('/teams', controller.teams);

module.exports = router;
