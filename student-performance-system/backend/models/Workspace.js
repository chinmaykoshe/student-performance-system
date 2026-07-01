const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  owner: { type: String, required: true },
  status: { type: String, enum: ['In progress', 'Planned', 'Review'], default: 'Planned' },
  dueDate: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  due: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  content: { type: String, required: true },
  timeString: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TeamGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownership: { type: String, required: true },
  membersCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  Project: mongoose.model('Project', ProjectSchema),
  Task: mongoose.model('Task', TaskSchema),
  Message: mongoose.model('Message', MessageSchema),
  Event: mongoose.model('Event', EventSchema),
  TeamGroup: mongoose.model('TeamGroup', TeamGroupSchema)
};
