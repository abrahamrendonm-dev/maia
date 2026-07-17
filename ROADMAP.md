# MAIA vs. LactApp — Roadmap completo (con integración de Mercado Pago)

## 0. Progreso (actualizado 2026-07-16)

Desarrollo en pausa a partir de esta fecha. Antes de retomar, esto es lo que
ya quedó implementado, commiteado y subido a `origin/master`, y lo que
sigue pendiente.

**Fase 1 — implementado:**
- ✅ Múltiples bebés por mamá (gemelos/hermanos)
- ✅ Panel de Asesora de Lactancia (B2B2C): vinculación por código, notas
  profesionales, modo solo lectura
- ✅ Extracción de leche conectada (inventario de leche)
- ✅ Crecimiento (peso/talla): registro desde la Bitácora + vista de la
  asesora
- ✅ Plan de Parto: formulario funcional + vista legible (no JSON crudo)
  para la asesora
- ✅ Citas Médicas: CRUD con separación prenatal / mamá / bebé
  (`migrations/004` a `006`), aviso visual de citas próximas en Home,
  vista de asesora con las 3 categorías

Todo lo anterior compila sin errores (`tsc --noEmit`). Crecimiento, Plan
de Parto y Citas Médicas no se probaron manualmente en navegador durante
esta sesión — hazlo antes de dar la Fase 1 por cerrada.

**Fase 1 — pendiente de retomar:**
- ⏸ Integración de pagos con Mercado Pago (ver sección 2.3 más abajo:
  backend en Vercel Functions, plan de suscripción, webhook, gating de
  funciones premium)
- ⏸ Conversión de la app a PWA

---

## 1. Matriz de paridad de funciones

| Función de LactApp | Estado en MAIA | Fase |
|---|---|---|
| Login email/contraseña | ✅ Ya funciona | — |
| Login con Google | ⚠️ Botón existe, falta configurar el proveedor OAuth en Supabase | **Fase 1** |
| Login con Apple/Facebook | ❌ No existe | Fase 2 |
| Perfil de mamá (nombre, fecha nacimiento, teléfono) | ✅ Ya funciona | — |
| Perfil de bebé (nombre, fecha nacimiento, peso/talla al nacer, sexo) | ✅ Ya funciona | — |
| **Múltiples bebés (gemelos, más de un hijo)** | ❌ **Bloqueado a nivel de base de datos** (`children` solo permite 1 bebé por mamá) | **Fase 1** (fix urgente de esquema) |
| Vinculación de pareja/red de apoyo | ✅ **MAIA ya lo tiene y LactApp NO** (su propio blog reconoce que "falta un apartado para la pareja") | — 🏆 Ventaja tuya |
| Registro de tomas (pecho) con cronómetro | ✅ Ya funciona | — |
| Registro de pañales | ✅ Ya funciona | — |
| Registro de sueño | ✅ Ya funciona (básico, sin cronómetro) | Fase 2 (agregar cronómetro de siesta) |
| Registro de extracción de leche | ❌ Botón decorativo | **Fase 1** |
| Peso y talla con gráfica de percentiles (OMS) | ❌ Botón decorativo, sin gráficas | **Fase 1** (registro) / Fase 2 (percentiles OMS) |
| Línea del tiempo / información por semana (embarazo y bebé) | ✅ Ya funciona (cálculo de semanas en Home) | Fase 2 (enriquecer contenido) |
| Plan de Parto | ❌ Botón decorativo | **Fase 1** (formulario básico) |
| Citas Médicas | ❌ Botón decorativo | **Fase 1** (formulario básico) |
| Biblioteca de artículos/videos educativos | ❌ No existe | Fase 2 |
| Tests interactivos (¿listo para sólidos? ¿duerme bien?) | ❌ No existe | Fase 2 |
| Casos especiales (prematuros, tándem, gemelos) | ❌ No existe | Fase 2 |
| Info. de medicamentos compatibles con lactancia | ❌ No existe | Fase 2 |
| Comunidad / foro | ⚠️ Tablas de base de datos ya existen (`forum_posts`, `forum_categories`), sin UI | Fase 2 |
| Notificaciones push | ❌ No existe | Fase 2 |
| **Suscripción de pago (Mercado Pago)** | ❌ No existe | **Fase 1** |
| Consultora virtual personalizada (chat con IA) | ❌ No existe — LactApp usa árbol de decisión fijo (76,000 rutas predefinidas) | Fase 3 🏆 diferenciador principal |
| Recomendaciones basadas en datos reales de tu bitácora | ❌ No existe | Fase 3 🏆 diferenciador |
| **Seguimiento profesional 1:1 con asesora de lactancia dentro de la app** | ❌ No existe — nuevo | **Fase 1** 🏆 Ventaja tuya, LactApp no lo ofrece |

---

## 2. Fase 1 — MVP de pago

Objetivo: que quien pague sienta que **todo lo que ve, funciona**. Nada decorativo.

### 2.1 Base de datos
- Quitar restricción `unique(parent_id)` en `children` para permitir gemelos/múltiples hijos
- Ajustar Home/Bitácora para elegir entre hijos cuando hay más de uno
- Agregar tabla `appointments` (citas médicas): `id, parent_id, child_id, fecha, tipo, doctor, notas`
- Usar tabla `birth_plans` ya existente para el Plan de Parto

### 2.2 Funcionalidad
- Login con Google (activar proveedor OAuth en Supabase — configuración, no código)
- Conectar Extracción de leche (mismo patrón que tomas/pañales, tabla `tracking_logs` o `milk_inventory`)
- Conectar Peso y Talla (formulario + guardado; gráfica de percentiles queda para Fase 2)
- Plan de Parto — formulario funcional
- Citas Médicas — CRUD simple

### 2.3 Pagos con Mercado Pago — plan técnico de integración

**Por qué necesitas un backend (no solo frontend):**
Tu app hoy es 100% frontend (React + Vite hablando directo con Supabase). Mercado Pago requiere que las llamadas a su API usen tu **Access Token secreto** — esto NUNCA debe vivir en el navegador. Como despliegas en Vercel, la solución natural es agregar **Vercel Functions** (carpeta `/api` en la raíz del proyecto) que actúan como tu backend ligero.

**Paso 1 — Cuenta y credenciales**
1. Crear cuenta de vendedor en Mercado Pago (mercadopago.com.mx) y una aplicación en el panel de desarrolladores
2. Obtener: `Access Token` (secreto, va en variables de entorno del backend) y `Public Key` (puede ir en frontend)
3. Crear también credenciales de **prueba** (test) para no cobrar de verdad mientras desarrollas — Mercado Pago da cuentas de prueba de comprador y vendedor

**Paso 2 — Crear el Plan de suscripción**
Se crea una sola vez (vía API o directo en el dashboard de Mercado Pago):
```
POST https://api.mercadopago.com/preapproval_plan
Authorization: Bearer ACCESS_TOKEN

{
  "reason": "Suscripción MAIA mensual",
  "auto_recurring": {
    "frequency": 1,
    "frequency_type": "months",
    "transaction_amount": 49,
    "currency_id": "MXN"
  },
  "back_url": "https://tu-dominio.vercel.app/suscripcion/confirmada"
}
```
Esto devuelve un `id` (el `preapproval_plan_id`) que guardas como constante en tu backend.

**Paso 3 — Backend en Vercel Functions**

`/api/crear-suscripcion.ts` — el usuario hace clic en "Suscribirme", el frontend llama este endpoint:
- Recibe el `user_id` de Supabase (usuario autenticado)
- Llama a `POST /preapproval` de Mercado Pago con `preapproval_plan_id`, `payer_email`, `external_reference: user_id` (así vinculas el pago con el usuario) y el `back_url`
- Devuelve al frontend el `init_point` (la URL del checkout hospedado por Mercado Pago)
- El frontend redirige al usuario a ese `init_point` — ahí Mercado Pago maneja el formulario de tarjeta de forma segura (tú nunca tocas datos de tarjeta, cero riesgo de cumplimiento PCI)

`/api/webhook-mercadopago.ts` — Mercado Pago notifica aquí cuando hay cambios:
- Recibe la notificación (`type: subscription_preapproval` o `subscription_authorized_payment`)
- Hace `GET /preapproval/{id}` para confirmar el estado real (nunca confíes solo en el payload del webhook)
- Actualiza en Supabase: `profiles.subscription_status`, `profiles.subscription_id`, `profiles.current_period_end`
- Debes registrar esta URL en el panel de Mercado Pago (Webhooks → suscripciones)

**Paso 4 — Base de datos**
```sql
alter table public.profiles
  add column subscription_status text default 'inactive',
  add column subscription_id text,
  add column current_period_end timestamptz;
```

**Paso 5 — Gating de funciones premium**
Un hook `useSubscription()` en el frontend que lee `profiles.subscription_status` y bloquea/muestra un paywall en las funciones premium si no está `'authorized'`.

**Paso 6 — Flujo de cancelación**
Mercado Pago permite cancelar desde su propio panel o vía `PUT /preapproval/{id}` con `status: "cancelled"`. Debes decidir: ¿cancelan desde MAIA (tú llamas la API) o los mandas al portal de Mercado Pago? Lo primero da mejor experiencia, requiere un botón "Cancelar suscripción" en el perfil que llame a otro endpoint de tu backend.

## 2.4 Panel de Asesora de Lactancia (B2B2C) — nuevo, Fase 1

Contexto de negocio: la esposa de Abraham es asesora de lactancia certificada (en formación como Lic. en Ciencias del Comportamiento Humano) y usará MAIA para dar seguimiento profesional a sus propias pacientes — que pagan la misma suscripción de $49 MXN/mes que cualquier otra usuaria. Esto es un diferenciador más frente a LactApp (que no ofrece seguimiento 1:1 con una asesora dentro de la misma app).

**Nota:** la columna `is_expert` ya existe en `profiles` sin usarse — es probable que se haya planeado algo similar antes.

### Modelo de datos
```sql
-- Nuevo rol
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role = any (array['mother','partner','support','consultant']));

alter table public.profiles add column if not exists consultant_code text unique;

-- Vínculo paciente-asesora (la paciente inicia el vínculo capturando el código)
create table public.consultant_patients (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references auth.users(id),
  patient_id uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active','revoked')),
  linked_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(consultant_id, patient_id)
);

-- Notas profesionales (visibles para la asesora Y la paciente, según decisión)
create table public.consultant_notes (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid not null references auth.users(id),
  patient_id uuid not null references auth.users(id),
  note text not null,
  created_at timestamptz not null default now()
);
```

### RLS (políticas adicionales, no reemplazan las existentes)
- Función auxiliar `is_active_consultant_of(patient_id uuid)`: verifica que exista un vínculo `active` entre `auth.uid()` (la asesora) y esa paciente
- `consultant_patients`: la paciente puede insertar su propio vínculo (capturando el código) y revocarlo; la asesora solo puede leer los suyos (no puede crear vínculos por su cuenta — el consentimiento siempre lo inicia la paciente)
- Agregar política de **SELECT adicional** (solo lectura) en `children`, `pregnancies`, `tracking_logs`, `milk_inventory`, `birth_plans`: `using (public.is_active_consultant_of(parent_id))`
- `consultant_notes`: SELECT si `patient_id = auth.uid() OR consultant_id = auth.uid()`; INSERT/UPDATE solo la asesora (`consultant_id = auth.uid()`)

### Flujo de vinculación
1. Al registrarse como asesora, se genera un `consultant_code` único (ej. `ASESORA-4F2A`)
2. La paciente, desde su perfil, entra a "Vincular con mi asesora de lactancia", captura el código
3. Se crea el vínculo con `status = 'active'` — consentimiento explícito de la paciente
4. La paciente puede revocar el acceso en cualquier momento desde "Mi Asesora" (requisito de privacidad, LFPDPPP en México al tratarse de datos de salud)

### UI nueva
- `ConsultantDashboard.tsx`: lista de pacientes vinculadas (nombre, bebé, última actividad) → detalle de cada paciente en modo solo lectura (bitácora, embarazo, crecimiento) + hilo de notas profesionales (que la paciente también puede leer)
- Pantalla "Mi Asesora" en el lado de la paciente: quién tiene acceso a sus datos + botón para revocarlo
- Routing: si `profiles.role === 'consultant'`, `App.tsx` debe mostrar `ConsultantDashboard` en vez de las vistas de mamá/pareja/apoyo

### Separación pacientes vs. público general
Se resuelve completamente a nivel de base de datos (RLS), no en la interfaz — una asesora nunca puede leer datos de alguien que no la haya vinculado explícitamente, sin importar qué tan bien conozca las URLs internas de la app.



1. Biblioteca de contenido (artículos + videos cortos) — define quién redacta/valida el contenido médico (LactApp usa IBCLCs certificadas)
2. Gráficas de percentiles OMS (peso/talla vs. tablas oficiales)
3. Tests interactivos (ej. "¿mi bebé duerme bien?", "¿está listo para sólidos?")
4. Soporte para casos especiales (prematuros, tándem, gemelos)
5. Notificaciones push (recordatorios de toma, hitos del bebé)
6. UI del foro/comunidad (ya tienes las tablas, falta la interfaz)
7. Login con Apple (obligatorio si publicas en iOS App Store)

---

## 4. Fase 3 — Diferenciadores para superar a LactApp

1. **Consultora con IA real** (API de Claude): conversación genuina con contexto del historial real del bebé, en vez del árbol fijo de LactApp
2. **Recomendaciones basadas en datos reales** de la bitácora (LactApp no cruza tracking con contenido)
3. **Experiencia familiar real**: pulir el modo papá/red de apoyo, tu ventaja ya confirmada
4. **Precio**: LactApp Plus ronda ~$50 USD/año en su plan anual — valida que $49 MXN/mes (~$29 USD/año) sea competitivo o ajusta tu estrategia de precios

---

## 5. Decisiones pendientes antes de programar

- **Citas médicas**: ¿qué campos exactos necesitas? (fecha, tipo de cita, doctor, notas, ¿recordatorio automático?)
- **Plan de Parto**: ¿qué secciones debe tener? (preferencias de parto, contactos de emergencia, plan de lactancia inmediata, etc.)
- **Cancelación de suscripción**: ¿la manejas tú dentro de MAIA o rediriges al portal de Mercado Pago?
- **Moneda/facturación**: ¿necesitas emitir factura fiscal (CFDI) además del cobro, dado que es México?