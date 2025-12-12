#!/bin/bash
# Script para revisar secretos detectados por detect-secrets
# Ejecutar: bash revisar_secretos.sh

echo "=== ANALISIS DE SECRETOS DETECTADOS ==="
echo ""

# Verificar que existe .secrets.baseline
if [ ! -f ".secrets.baseline" ]; then
    echo "Error: No se encontro .secrets.baseline"
    echo "Ejecuta primero: detect-secrets scan --all-files > .secrets.baseline"
    exit 1
fi

# Instalar jq si no esta disponible
if ! command -v jq &> /dev/null; then
    echo "Instalando jq..."
    sudo apt-get install -y jq
fi

# Contar total de secretos
TOTAL=$(jq '.results | to_entries | map(.value | length) | add // 0' .secrets.baseline)
echo "Total de secretos potenciales: $TOTAL"
echo ""

# Listar por archivo
echo "=== SECRETOS POR ARCHIVO ==="
jq -r '.results | to_entries[] | "\(.key): \(.value | length) secreto(s)"' .secrets.baseline
echo ""

# Detalle de cada secreto
echo "=== DETALLE DE SECRETOS ==="
echo ""

jq -r '.results | to_entries[] | 
  "Archivo: \(.key)",
  (.value[] | 
    "  - Linea \(.line_number): \(.type)",
    "    Hash: \(.hashed_secret[0:16])..."
  ),
  ""' .secrets.baseline

echo ""
echo "=== PROXIMOS PASOS ==="
echo ""
echo "Para cada secreto, debes determinar:"
echo "1. Es un secreto real?"
echo "   SI -> Removerlo del codigo y usar variables de entorno"
echo "   NO -> Es un falso positivo"
echo ""
echo "2. Si es falso positivo, agregarlo al baseline:"
echo "   - Ejecutar: detect-secrets scan --baseline .secrets.baseline"
echo "   - Revisar cada entrada con: detect-secrets audit .secrets.baseline"
echo "   - Marcar como falso positivo en la interfaz interactiva"
echo ""
echo "3. Tipos comunes de falsos positivos:"
echo "   - Base64 de imagenes (data:image/svg+xml;base64,...)"
echo "   - Hashes de ejemplo en comentarios"
echo "   - Claves de ejemplo (YOUR_KEY_HERE, example-key-123)"
echo "   - Salts/IVs de ejemplo en documentacion"
echo "   - UUIDs genericos (00000000-0000-0000-0000-000000000000)"
echo ""
echo "4. Revisar archivos especificos:"
for file in $(jq -r '.results | keys[]' .secrets.baseline); do
    echo "   vim +$(jq -r ".results[\"$file\"][0].line_number" .secrets.baseline) \"$file\""
done