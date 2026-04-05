export interface UsuarioDTO {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  rol: string;
  activo?: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface CreateUsuarioDTO {
  username: string;
  email: string;
  password: string;
  nombreCompleto: string;
  rol: string;
}

export interface UpdateUsuarioDTO {
  email?: string;
  nombreCompleto?: string;
  rol?: string;
  activo?: boolean;
}
