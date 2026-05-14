#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Resize all .png files in a folder to a fixed canvas without stretching.

Usage:
  ./dev/resize-ppng.sh <input_dir> <width> <height> [output_dir]

Arguments:
  input_dir   Folder to scan recursively for .png files.
  width       Target canvas width in pixels (positive integer).
  height      Target canvas height in pixels (positive integer).
  output_dir  Optional destination folder. If omitted, files are overwritten in place.

Notes:
- Aspect ratio is preserved via fit-inside resize.
- Output is centered on a transparent canvas of the target size.
- Requires ImageMagick (magick or convert).
EOF
}

is_positive_int() {
  [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 3 || $# -gt 4 ]]; then
  usage
  exit 1
fi

INPUT_DIR_RAW="$1"
TARGET_W="$2"
TARGET_H="$3"
OUTPUT_DIR_RAW="${4:-$1}"

if [[ ! -d "$INPUT_DIR_RAW" ]]; then
  echo "Error: input_dir does not exist: $INPUT_DIR_RAW" >&2
  exit 1
fi

if ! is_positive_int "$TARGET_W" || ! is_positive_int "$TARGET_H"; then
  echo "Error: width and height must be positive integers." >&2
  exit 1
fi

INPUT_DIR="$(cd "$INPUT_DIR_RAW" && pwd -P)"
mkdir -p "$OUTPUT_DIR_RAW"
OUTPUT_DIR="$(cd "$OUTPUT_DIR_RAW" && pwd -P)"

if command -v magick >/dev/null 2>&1; then
  MAGICK_CMD=(magick)
elif command -v convert >/dev/null 2>&1; then
  MAGICK_CMD=(convert)
else
  echo "Error: ImageMagick not found. Install it (e.g. brew install imagemagick)." >&2
  exit 1
fi

declare -a FIND_ARGS
if [[ "$OUTPUT_DIR" != "$INPUT_DIR" && "$OUTPUT_DIR" == "$INPUT_DIR"/* ]]; then
  FIND_ARGS=("$INPUT_DIR" -path "$OUTPUT_DIR" -prune -o -type f \( -iname '*.png' \) -print0)
else
  FIND_ARGS=("$INPUT_DIR" -type f \( -iname '*.png' \) -print0)
fi

processed=0
while IFS= read -r -d '' src_file; do
  rel_path="${src_file#"$INPUT_DIR"/}"
  dst_file="$OUTPUT_DIR/$rel_path"
  dst_dir="$(dirname "$dst_file")"

  mkdir -p "$dst_dir"

  tmp_file="$(mktemp "${TMPDIR:-/tmp}/resize-ppng.XXXXXX.png")"

  "${MAGICK_CMD[@]}" "$src_file" \
    -auto-orient \
    -resize "${TARGET_W}x${TARGET_H}" \
    -background none \
    -gravity center \
    -extent "${TARGET_W}x${TARGET_H}" \
    "png32:$tmp_file"

  mv "$tmp_file" "$dst_file"
  processed=$((processed + 1))

done < <(find "${FIND_ARGS[@]}")

if [[ $processed -eq 0 ]]; then
  echo "No .png files found in: $INPUT_DIR"
  exit 0
fi

echo "Processed $processed file(s)."
echo "Output folder: $OUTPUT_DIR"
