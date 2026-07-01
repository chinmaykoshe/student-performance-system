import { api } from '../context/AuthContext';

const createCrudHooks = (endpoint) => {
  return {
    getAll: () => api.get(`/workspace/${endpoint}`),
    create: (data) => api.post(`/workspace/${endpoint}`, data),
    update: (id, data) => api.put(`/workspace/${endpoint}/${id}`, data),
    delete: (id) => api.delete(`/workspace/${endpoint}/${id}`)
  };
};

export const workspaceApi = {
  projects: createCrudHooks('projects'),
  tasks: createCrudHooks('tasks'),
  messages: createCrudHooks('messages'),
  events: createCrudHooks('events'),
  teams: createCrudHooks('teams')
};
