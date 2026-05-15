#!/usr/bin/env node

import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { execa } from "execa";
import sharp from "sharp";
import { Command } from "commander";

const SUPPORTED_EXTENSIONS = [
  ".mp4",
  ".mov",
  ".webm",
  ".gif",
];

const program = new Command();

program
  .argument("<input>", "Input video or gif file")
  .option("--width <number>", "Resize width")
  .option("--height <number>", "Resize height")
  .option("--mode <mode>", "fill or fit", "fill")
  .option("--fps <number>", "Frames per second", "5")
  .option("--starttime <time>", "Start time", "00:00:00")
  .option("--duration <seconds>", "Clip duration")
  .option("--output <dir>", "Output directory")
  .parse();

const input = program.args[0];
const options = program.opts();

if (!(await fs.pathExists(input))) {
  console.error(`Input file does not exist: ${input}`);
  process.exit(1);
}

const parsed = path.parse(input);
const extension = parsed.ext.toLowerCase();

if (!SUPPORTED_EXTENSIONS.includes(extension)) {
  console.error(
    `Unsupported file type: ${extension}\n` +
    `Supported: ${SUPPORTED_EXTENSIONS.join(", ")}`
  );

  process.exit(1);
}

const outputDir =
  options.output || path.join(process.cwd(), parsed.name);

await fs.ensureDir(outputDir);

const tempDir = await fs.mkdtemp(
  path.join(os.tmpdir(), "extract-frames-")
);

const rawFramesDir = path.join(tempDir, "raw");

await fs.ensureDir(rawFramesDir);

console.log("==> Extracting frames...");

const ffmpegArgs = [];

// GIF seeking can behave weirdly with pre-input -ss,
// so only use it for videos
if (extension !== ".gif") {
  ffmpegArgs.push("-ss", options.starttime);
}

ffmpegArgs.push("-i", input);

// GIFs already have timing baked in,
// but fps filter still works if requested
ffmpegArgs.push(
  "-vf",
  `fps=${options.fps}`
);

if (extension === ".gif") {
  ffmpegArgs.push("-ignore_loop", "0");
}

if (options.duration) {
  ffmpegArgs.push("-t", options.duration);
}

ffmpegArgs.push(
  path.join(rawFramesDir, "%d.png")
);

await execa("ffmpeg", ffmpegArgs, {
  stdio: "inherit",
});

const files = (await fs.readdir(rawFramesDir))
  .filter((f) => f.endsWith(".png"))
  .sort((a, b) => {
    const na = Number.parseInt(a);
    const nb = Number.parseInt(b);
    return na - nb;
  });

console.log(`==> Processing ${files.length} frame(s)...`);

for (let index = 0; index < files.length; index++) {
  const file = files[index];

  const src = path.join(rawFramesDir, file);
  const dst = path.join(outputDir, `${index}.png`);

  let pipeline = sharp(src);

  if (options.width && options.height) {
    pipeline = pipeline.resize({
      width: Number(options.width),
      height: Number(options.height),
      fit: options.mode === "fit"
        ? "contain"
        : "cover",
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
      position: "center",
    });
  }

  await pipeline
    .png()
    .toFile(dst);
}

await fs.remove(tempDir);

console.log("");
console.log("Done!");
console.log(`Frames written to: ${outputDir}`);