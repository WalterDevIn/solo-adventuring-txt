# Contratos de implementación

Los contratos viven en esta carpeta y sus informes en `reports/`.

Nombres normales:

```text
003-app-shell.md
004-design-foundation.md
```

Correcciones:

```text
003a-app-shell-fix.md
003b-app-shell-responsive-fix.md
```

Todo se implementa directamente sobre `master`.

Un contrato puede producir varios commits coherentes. No se exige squash ni un único commit.

Cada contrato debe incluir objetivo cerrado, archivos permitidos y prohibidos, fuera de alcance, criterios de aceptación, nivel de verificación y entrega esperada.

Niveles de verificación:

- Nivel 0: inspección.
- Nivel 1: comprobación técnica.
- Nivel 2: navegador breve y focalizado.
- Nivel 3: navegador completo solo cuando sea indispensable.

Chromium no se exige por defecto. Un timeout o bloqueo del entorno se registra una vez y no debe consumir intentos repetidos.
