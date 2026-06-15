// js/api.js - Camada de comunicação com o backend
const API_BASE = "https://api-salas-sesi-completo.onrender.com/api";
// const API_BASE = "http://localhost:3000/api";

const api = {
  _token: null,

  setToken(t) { this._token = t; },

  async _req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this._token) headers['Authorization'] = `Bearer ${this._token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  get(path) { return this._req('GET', path); },
  post(path, body) { return this._req('POST', path, body); },
  put(path, body) { return this._req('PUT', path, body); },
  delete(path) { return this._req('DELETE', path); },

  // Auth
  login(email, senha) { return this.post('/auth/login', { email, senha }); },
  me() { return this.get('/auth/me'); },

  // Dashboard
  dashboard() { return this.get('/reservas/dashboard'); },

  // Salas
  getSalas(params = {}) { return this.get('/salas?' + new URLSearchParams(params)); },
  getSala(id) { return this.get('/salas/' + id); },
  criarSala(d) { return this.post('/salas', d); },
  atualizarSala(id, d) { return this.put('/salas/' + id, d); },
  excluirSala(id) { return this.delete('/salas/' + id); },
  disponibilidade(salaId, data) { return this.get(`/salas/disponibilidade?salaId=${salaId}&data=${data}`); },

  // Usuários
  getUsuarios(params = {}) { return this.get('/users?' + new URLSearchParams(params)); },
  getUsuario(id) { return this.get('/users/' + id); },
  criarUsuario(d) { return this.post('/users', d); },
  atualizarUsuario(id, d) { return this.put('/users/' + id, d); },
  excluirUsuario(id) { return this.delete('/users/' + id); },

  // Reservas
  getReservas(params = {}) { return this.get('/reservas?' + new URLSearchParams(params)); },
  getReserva(id) { return this.get('/reservas/' + id); },
  criarReserva(d) { return this.post('/reservas', d); },
  atualizarReserva(id, d) { return this.put('/reservas/' + id, d); },
  cancelarReserva(id) { return this.delete('/reservas/' + id); },

  // Calendário
  getCalendario(params = {}) { return this.get('/reservas/calendario?' + new URLSearchParams(params)); },
};