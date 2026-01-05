import fs from 'node:fs';
import path from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import dotenv from 'dotenv';

import { prisma } from '../lib/prisma.js';
import { getR2BucketName, getR2Client } from '../lib/r2.js';

dotenv.config();

const argsSchema = z.object({
  courseId: z.string().min(1),
  folder: z.string().min(1),
  startOrder: z.coerce.number().int().nonnegative().optional(),
  descriptionFile: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  priceInrPaise: z.coerce.number().int().min(0).optional(),
  assignEmailsFile: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  concurrency: z.coerce.number().int().min(1).max(8).default(2),
  prefix: z.string().min(1).optional(),
  dryRun: z.coerce.boolean().optional().default(false)
});

type Args = z.infer<typeof argsSchema>;

function parseArgs(argv: string[]): Args {
  const out: Record<string, string | boolean> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return argsSchema.parse(out);
}

function isVideoFile(name: string) {
  const ext = path.extname(name).toLowerCase();
  return ['.mp4', '.webm', '.mov', '.mkv'].includes(ext);
}

function contentTypeFor(name: string) {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.mov') return 'video/quicktime';
  // mkv often falls back
  return 'application/octet-stream';
}

function titleFromFilename(filename: string) {
  const base = path.basename(filename, path.extname(filename));
  return base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

async function uploadOne(localPath: string, key: string, providerId?: string) {
  const s3 = await getR2Client(providerId);
  const bucket = await getR2BucketName(providerId);

  const stat = await fs.promises.stat(localPath);
  const Body = fs.createReadStream(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body,
      ContentType: contentTypeFor(localPath),
      ContentLength: stat.size
    })
  );
}

async function main() {
  const args = parseArgs(process.argv);

  const course = await prisma.course.findUnique({ where: { id: args.courseId } });
  if (!course) {
    console.error('Course not found:', args.courseId);
    process.exit(1);
  }

  if (args.descriptionFile || args.title || args.priceInrPaise !== undefined) {
    const description = args.descriptionFile ? await fs.promises.readFile(args.descriptionFile, 'utf8') : undefined;
    if (!args.dryRun) {
      await prisma.course.update({
        where: { id: args.courseId },
        data: {
          title: args.title,
          description: description,
          priceInrPaise: args.priceInrPaise
        }
      });
    }
    console.log('Updated course metadata');
  }

  if (args.assignEmailsFile) {
    const text = await fs.promises.readFile(args.assignEmailsFile, 'utf8');
    const emails = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((e) => e.toLowerCase());

    let assigned = 0;
    let missing = 0;

    for (const email of emails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        missing++;
        continue;
      }
      if (!args.dryRun) {
        await prisma.courseAssignment.upsert({
          where: { userId_courseId: { userId: user.id, courseId: args.courseId } },
          update: {},
          create: { userId: user.id, courseId: args.courseId }
        });
      }
      assigned++;
    }

    console.log(`Assignments: assigned=${assigned} missing_users=${missing}`);
  }

  const folderAbs = path.resolve(args.folder);
  const entries = await fs.promises.readdir(folderAbs);
  const videos = entries.filter(isVideoFile).sort((a, b) => a.localeCompare(b));

  if (videos.length === 0) {
    console.log('No video files found in folder:', folderAbs);
    return;
  }

  const max = await prisma.lecture.aggregate({ where: { courseId: args.courseId }, _max: { orderIndex: true } });
  let order = args.startOrder ?? ((max._max.orderIndex ?? -1) + 1);

  const prefix = (args.prefix ?? `videos/${args.courseId}/`).replace(/^\/+/, '');

  console.log(
    `Uploading ${videos.length} video(s) to ${prefix} (concurrency=${args.concurrency}, dryRun=${args.dryRun}, providerId=${args.providerId ?? 'default'})`
  );

  const queue = videos.map((name, idx) => ({
    name,
    localPath: path.join(folderAbs, name),
    orderIndex: order + idx,
    key: `${prefix}${Date.now()}_${name}`
  }));

  let cursor = 0;
  async function worker(workerId: number) {
    while (cursor < queue.length) {
      const item = queue[cursor++];
      const lectureTitle = titleFromFilename(item.name);
      console.log(`[${workerId}] ${item.name} -> ${item.key} (orderIndex=${item.orderIndex})`);

      if (!args.dryRun) {
        await uploadOne(item.localPath, item.key, args.providerId);
        await prisma.lecture.create({
          data: {
            courseId: args.courseId,
            title: lectureTitle,
            description: lectureTitle,
            orderIndex: item.orderIndex,
            videoKey: item.key,
            storageProviderId: args.providerId ?? null
          }
        });
      }
    }
  }

  const workers = Array.from({ length: args.concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
