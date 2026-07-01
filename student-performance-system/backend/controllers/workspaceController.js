const { Project, Task, Message, Event, TeamGroup } = require('../models/Workspace');

const createHandlers = (Model) => ({
  getAll: async (req, res) => {
    try {
      const items = await Model.find({}).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: items });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
  create: async (req, res) => {
    try {
      const item = await Model.create(req.body);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },
  update: async (req, res) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.status(200).json({ success: true, data: item });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  },
  delete: async (req, res) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.status(200).json({ success: true, data: {} });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

module.exports = {
  projects: createHandlers(Project),
  tasks: createHandlers(Task),
  messages: createHandlers(Message),
  events: createHandlers(Event),
  teams: createHandlers(TeamGroup)
};
