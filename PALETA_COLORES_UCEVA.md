# 🎨 Paleta de Colores UCEVA

## Colores Primarios

| Color | Código Hex | Uso | Ejemplo |
|-------|-----------|-----|---------|
| Verde Oscuro | `#005c00` | Gradientes, hover states | Botones activos, sombras |
| Verde Principal | `#006600` | Botones, links, elementos activos | Login, componentes interactivos |
| Verde Luz | `#007000` | Estados disabled, fondos | Botones inactivos |
| Verde Acento | `#007b00` | Outlines, focus, énfasis | Focus-visible, bordes |

## Colores Aplicados

### Variables CSS
```css
--uceva-primary-dark: #005c00;
--uceva-primary: #006600;
--uceva-primary-light: #007000;
--uceva-accent: #007b00;
```

### Componentes Actualizados

#### 1. **Global Styles** (`src/styles.css`)
- Focus-visible outline: `#007b00`
- CSS Variables para toda la aplicación

#### 2. **Login Component** (`src/app/features/login/login.component.css`)
- Gradiente de fondo: `#005c00 → #007b00`
- Botón: `#006600` (con hover `#005c00`)
- Focus border: `#006600`

#### 3. **Layout Component** (`src/app/shared/layout/layout.component.ts`)
- Sidebar gradiente: `#005c00 → #007b00`
- Box-shadow: `rgba(0, 92, 0, 0.15)`

#### 4. **Dashboard Component** (`src/app/features/dashboard/dashboard.component.ts`)
- Header gradiente: `#005c00 → #007b00`
- Botón primario texto: `#006600`
- Box-shadow: `rgba(0, 92, 0, 0.2)`

## Uso en Nuevos Componentes

Para mantener consistencia, utiliza las variables CSS:

```css
/* Botones */
.btn {
  background: var(--uceva-primary);
}

.btn:hover {
  background: var(--uceva-primary-dark);
}

/* Focus states */
input:focus {
  border-color: var(--uceva-accent);
  box-shadow: 0 0 0 3px rgba(0, 123, 0, 0.15);
}

/* Gradientes */
.header {
  background: linear-gradient(135deg, var(--uceva-primary-dark) 0%, var(--uceva-accent) 100%);
}
```

## Cambios Realizados - Resumen

✅ Reemplazado color morado `#667eea` por verde UCEVA `#006600`  
✅ Reemplazado color morado `#764ba2` por verde UCEVA `#007b00`  
✅ Actualizado gradiente de purple a green en todos los componentes
✅ Actualizado box-shadow con rgba verde  
✅ Creadas variables CSS globales para consistencia  
✅ Focus states con color `#007b00`

### Componentes Específicos Actualizados:

#### Programas
- **Lista de Programas** (`programa-list.component.ts`)
  - Botón principal: verde `#006600`
  - Badges de nivel: verde claro `#e8f5e9`
  - Badges de modalidad: verde oscuro `#007b00`
  - Iconos de acciones: verde

- **Detalle de Programa** (`programa-detail.component.ts`)
  - Header gradiente: `#005c00 → #007b00`
  - Botón "Exportar ZIP": verde
  - Botón "Editar": texto verde `#006600`
  - Condiciones: bordes izquierdos verdes
  - Spinner: verde `#007b00`

- **Formulario de Programa** (`programa-form.component.ts`)
  - Inputs focus: borde verde `#006600`
  - Botones primarios: verde `#006600`
  - Zona de carga: verde con hover `#005c00`

#### Lineamientos
- **Detalle de Lineamiento** (`lineamiento-detail.component.ts`)
  - Header gradiente: `#005c00 → #007b00`
  - Upload zone: verde claro `#f0f8f0`
  - Botones: verde `#006600`
  - Componentes: bordes verdes
  - Iconos: verde `#006600`

#### Dashboard
- **Dashboard** (`dashboard.component.ts`)
  - Círculo de progreso: gradiente `#005c00 → #007b00`
  - Porcentajes: verde `#006600`
  - Barras de progreso: gradiente verde
  - Iconos: verde `#006600`

#### Modelos
- **Lineamientos** (`lineamiento.model.ts`)
  - Lineamiento 1: cambio a `#006600`
  - Lineamiento 2: cambio a `#007b00`
  - Componentes A y B: cambios a verde UCEVA

---

**Última actualización:** 28 de Abril de 2026
