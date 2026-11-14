# Poké Arena

**Autor:** Pedro Pesántez
**Modalidad:** desarrollo individual
**Sitio desplegado:** https://pokearena-beta.vercel.app/
**Repositorio:** https://github.com/pedropesantez/Pokearena

## Propósito

Poké Arena es una aplicación web desarrollada con **Angular** que consume la **PokéAPI** para simular batallas entre dos Pokémon. El usuario elige dos Pokémon por su nombre, la aplicación consulta sus datos reales (estadísticas, tipos y movimientos) y el combate se resuelve con **reglas propias** programadas en el proyecto. PokéAPI solo entrega los datos; no ejecuta batallas.

## Funcionalidades principales

- **Búsqueda de Pokémon** por nombre, con tolerancia a mayúsculas y espacios.
- **Tarjetas de Pokémon** con imagen, número, tipos, barra de HP y las seis estadísticas base.
- **Simulador de combate por turnos** que se reproduce de forma progresiva, turno a turno.
- **Efectividad de tipos**: los movimientos son muy eficaces, poco eficaces o no afectan, según los tipos del defensor.
- **Registro de combate** que narra cada turno (golpes, fallos, inmunidades y ganador).
- **Estados de la interfaz**: mensajes de carga, errores de consulta (Pokémon inexistente o fallo de red) y botones deshabilitados mientras se espera una respuesta.
- **Botón de reinicio** para limpiar la arena y empezar de nuevo.
- Diseño **responsive**, con colores mate y sin animaciones innecesarias.

## Cómo funciona la aplicación

1. El usuario escribe el nombre de un Pokémon en cada buscador (por ejemplo `pikachu` y `charizard`) y pulsa **Buscar** o la tecla Enter.
2. Si el Pokémon existe, se muestra su tarjeta. Si no existe, o hay un problema de conexión, aparece un mensaje de error.
3. Cuando ambos Pokémon están cargados, se habilita el botón **¡Pelear!**.
4. Al pelear, la aplicación consulta en paralelo los **tipos** de ambos Pokémon y una selección de sus **movimientos**.
5. Con esos datos se simula el combate completo y luego se reproduce turno a turno, actualizando las barras de HP y el registro.
6. Al terminar, se muestra el ganador. Se puede pelear de nuevo o pulsar **Reiniciar**.

### Reglas de combate (implementadas por el estudiante)

1. **HP** de cada Pokémon = `hp base × 3`.
2. Ataca primero el Pokémon con mayor **velocidad** (`speed`).
3. En cada turno el atacante elige al azar uno de hasta **4 movimientos con poder**, tomados de una muestra aleatoria de 8 movimientos de su lista. Si ninguno tiene poder, usa un movimiento de respaldo (*tackle*).
4. **Precisión**: si el movimiento falla según su `accuracy`, no hay daño.
5. **Multiplicador de tipo**, obtenido de `damage_relations` del endpoint `/type`:
   - ×2 si el defensor recibe doble daño de ese tipo.
   - ×0.5 si recibe la mitad.
   - ×0 si es inmune.
   - Si el defensor tiene dos tipos, los multiplicadores se combinan.
6. **Daño** = `(ataque / defensa) × poder × 0.4 + 2`, multiplicado por la efectividad de tipo y por una variación aleatoria entre 85 % y 100 %.
7. Gana quien deje al rival en 0 HP. Como protección, el combate termina en un máximo de 60 turnos y gana quien tenga mayor porcentaje de HP restante.

## Endpoints de PokéAPI utilizados

Base: `https://pokeapi.co/api/v2`

| Endpoint | Para qué se usa |
|---|---|
| `GET /pokemon/{nombre}` | Obtiene el Pokémon: id, imagen (sprite), tipos, estadísticas base y lista de movimientos. |
| `GET /type/{tipo}` | Obtiene `damage_relations` de cada tipo del Pokémon para calcular el multiplicador de daño. |
| `GET /move/{nombre}` | Obtiene el poder, la precisión y el tipo de cada movimiento usado en el combate. |

Los tres recursos están relacionados entre sí: el Pokémon aporta sus tipos y movimientos, los tipos determinan la efectividad y los movimientos determinan el daño base.

## Tecnologías

- Angular (componentes standalone y *signals*)
- TypeScript
- RxJS (`forkJoin`, `timer`, `catchError`)
- `HttpClient` de Angular para consumir la API REST
- CSS puro
- GitHub (repositorio) y Vercel (despliegue)

## Estructura del proyecto

```
src/app/
├── components/
│   ├── battle/          # Buscadores, lógica del combate y botones
│   ├── pokemon-card/    # Tarjeta con datos y HP del Pokémon
│   └── battle-log/      # Registro de turnos
├── models/              # Interfaces: Pokemon, PokeType, Move, Battle
├── services/
│   └── poke-api.service.ts   # Peticiones HTTP a PokéAPI
└── utils/               # Colores de tipos y funciones de formato
```

## Instalación y ejecución local

**Requisitos:** Node.js (versión LTS) y npm.

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/poke-arena.git
cd poke-arena

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
ng serve
```

Abrir `http://localhost:4200` en el navegador.

Para generar la versión de producción:

```bash
ng build
```

> Si no tienes Angular CLI instalado: `npm install -g @angular/cli`.

## Despliegue

La aplicación está desplegada en **Vercel**, conectada al repositorio de GitHub. Cada `git push` a la rama `main` genera un nuevo despliegue automático. La aplicación no usa backend propio ni base de datos: todas las solicitudes se realizan directamente a PokéAPI desde el navegador.

## Créditos

- Datos: [PokéAPI](https://pokeapi.co/docs/v2)
- Framework: [Angular](https://angular.dev)
- Hosting: [Vercel](https://vercel.com)

Proyecto desarrollado por **Pedro Pesántez**.
