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
  .argument(
    "<input>",
    "Input video or gif file",
  )
  .option(
    "--width <number>",
    "Resize width",
  )
  .option(
    "--height <number>",
    "Resize height",
  )
  .option(
    "--mode <mode>",
    "fill or fit",
    "fill",
  )
  .option(
    "--fps <number>",
    "Frames per second",
    "5",
  )
  .option(
    "--starttime <time>",
    "Start time (HH:MM:SS)",
    "00:00:00",
  )
  .option(
    "--endtime <time>",
    "End time (HH:MM:SS)",
  )
  .option(
    "--output <dir>",
    "Output directory",
  )
  .option(
    "--position <position>",
    "Position for fill mode: top, bottom, left, right, center, top-left, top-right, bottom-left, bottom-right",
    "center",
  )
  .parse();

const input = program.args[0];
const options = program.opts();

function timeToSeconds(time) {
  const parts = time
    .split(":")
    .map(Number);

  if (parts.length !== 3) {
    throw new Error(
      `Invalid time format: ${time}`,
    );
  }

  const [hours, minutes, seconds] =
    parts;

  return (
    hours * 3600 +
    minutes * 60 +
    seconds
  );
}

if (!(await fs.pathExists(input))) {
  console.error(
    `Input file does not exist: ${input}`,
  );

  process.exit(1);
}

const parsed = path.parse(input);
const extension = parsed.ext.toLowerCase();

if (
  !SUPPORTED_EXTENSIONS.includes(
    extension,
  )
) {
  console.error(
    `Unsupported file type: ${extension}\n` +
      `Supported: ${SUPPORTED_EXTENSIONS.join(
        ", ",
      )}`,
  );

  process.exit(1);
}

if (
  options.mode !== "fill" &&
  options.mode !== "fit"
) {
  console.error(
    "--mode must be either 'fill' or 'fit'",
  );

  process.exit(1);
}

const outputDir =
  options.output ||
  path.join(
    process.cwd(),
    parsed.name,
  );

await fs.ensureDir(outputDir);

const tempDir = await fs.mkdtemp(
  path.join(
    os.tmpdir(),
    "extract-frames-",
  ),
);

const rawFramesDir = path.join(
  tempDir,
  "raw",
);

await fs.ensureDir(rawFramesDir);

console.log("==> Extracting frames...");

const ffmpegArgs = [];

// GIF seeking can behave weirdly with pre-input -ss,
// so only use it for videos.
if (extension !== ".gif") {
  ffmpegArgs.push(
    "-ss",
    options.starttime,
  );
}

ffmpegArgs.push(
  "-i",
  input,
);

// FPS extraction
ffmpegArgs.push(
  "-vf",
  `fps=${options.fps}`,
);

// End time support
if (options.endtime) {
  const startSeconds =
    timeToSeconds(
      options.starttime,
    );

  const endSeconds =
    timeToSeconds(
      options.endtime,
    );

  const duration =
    endSeconds - startSeconds;

  if (duration <= 0) {
    console.error(
      "--endtime must be greater than --starttime",
    );

    process.exit(1);
  }

  ffmpegArgs.push(
    "-t",
    duration.toString(),
  );
}

// PNG sequence output
ffmpegArgs.push(
  path.join(
    rawFramesDir,
    "%d.png",
  ),
);

try {
  await execa(
    "ffmpeg",
    ffmpegArgs,
    {
      stdio: "inherit",
    },
  );
} catch (error) {
  console.error("");
  console.error(
    "FFmpeg failed while extracting frames.",
  );

  console.error(
    "Command:",
    error.command,
  );

  await fs.remove(tempDir);

  process.exit(1);
}

const files = (
  await fs.readdir(rawFramesDir)
)
  .filter((f) =>
    f.endsWith(".png"),
  )
  .sort((a, b) => {
    const na =
      Number.parseInt(a);
    const nb =
      Number.parseInt(b);

    return na - nb;
  });

console.log(
  `==> Processing ${files.length} frame(s)...`,
);

for (
  let index = 0;
  index < files.length;
  index++
) {
  const file = files[index];

  const src = path.join(
    rawFramesDir,
    file,
  );

  const dst = path.join(
    outputDir,
    `${index}.png`,
  );

  let pipeline = sharp(src);

  if (
    options.width &&
    options.height
  ) {
    pipeline = pipeline.resize({
      width: Number(
        options.width,
      ),
      height: Number(
        options.height,
      ),
      fit:
        options.mode === "fit"
          ? "contain"
          : "cover",
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
      },
      position: options.position,
    });
  }

  await pipeline
    .png()
    .toFile(dst);
}

await fs.remove(tempDir);

console.log("");
console.log("Done!");
console.log(
  `Frames written to: ${outputDir}`,
);